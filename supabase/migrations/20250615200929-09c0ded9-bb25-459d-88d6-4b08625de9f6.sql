
-- CORREÇÃO CRÍTICA 1: Adicionar cast explícito nos triggers para evitar erro de enum
-- O erro "operator does not exist: status_agendamento = text" indica problema de cast

-- Atualizar função de validação para fazer cast explícito dos valores
CREATE OR REPLACE FUNCTION public.validar_enum_agendamento()
RETURNS trigger AS $$
BEGIN
  -- Cast explícito para evitar erro de operador
  -- Verifica se status é inválido - converter para text antes da comparação
  IF NEW.status IS NULL OR NOT (NEW.status::text = ANY (ARRAY['agendado', 'cancelado', 'concluido', 'pendente', 'confirmada'])) THEN
    RAISE EXCEPTION 'Valor inválido para status_agendamento: "%". Possível origem: inserção frontend/backend legada.', COALESCE(NEW.status::text, 'NULL');
  END IF;

  -- Verifica se tipo é inválido - converter para text antes da comparação
  IF NEW.tipo IS NULL OR NOT (NEW.tipo::text = ANY (ARRAY['vaga', 'reserva'])) THEN
    RAISE EXCEPTION 'Valor inválido para tipo_agendamento: "%".', COALESCE(NEW.tipo::text, 'NULL');
  END IF;

  -- Se tudo válido, segue o fluxo normalmente
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CORREÇÃO CRÍTICA 2: Corrigir função de trigger de vagas para usar cast explícito
CREATE OR REPLACE FUNCTION public.handle_agendamento_vagas()
RETURNS TRIGGER AS $$
BEGIN
  -- Log detalhado para debugging
  RAISE LOG 'Trigger handle_agendamento_vagas executado: operação=%, agenda_id=%, status_old=%, status_new=%', 
    TG_OP, 
    COALESCE(NEW.agenda_id, OLD.agenda_id),
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status::text ELSE 'N/A' END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.status::text ELSE 'N/A' END;

  IF TG_OP = 'INSERT' THEN
    -- Incrementar vagas ocupadas apenas para agendamentos ativos (cast explícito)
    IF NEW.status::text = 'agendado' THEN
      UPDATE public.agendas 
      SET vagas_ocupadas = vagas_ocupadas + 1,
          updated_at = NOW()
      WHERE id = NEW.agenda_id;
      
      RAISE LOG 'INSERT: Incrementando vagas para agenda_id=%, novo status=%', NEW.agenda_id, NEW.status::text;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar vagas ocupadas apenas se o agendamento estava ativo
    IF OLD.status::text = 'agendado' THEN
      UPDATE public.agendas 
      SET vagas_ocupadas = GREATEST(vagas_ocupadas - 1, 0),
          updated_at = NOW()
      WHERE id = OLD.agenda_id;
      
      RAISE LOG 'DELETE: Decrementando vagas para agenda_id=%, status era=%', OLD.agenda_id, OLD.status::text;
    END IF;
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Lidar com mudanças de status (cast explícito)
    IF OLD.status::text = 'agendado' AND NEW.status::text != 'agendado' THEN
      -- Status mudou de agendado para outro -> decrementar
      UPDATE public.agendas 
      SET vagas_ocupadas = GREATEST(vagas_ocupadas - 1, 0),
          updated_at = NOW()
      WHERE id = OLD.agenda_id;
      
      RAISE LOG 'UPDATE: Decrementando vagas para agenda_id=%, status: % -> %', OLD.agenda_id, OLD.status::text, NEW.status::text;
      
    ELSIF OLD.status::text != 'agendado' AND NEW.status::text = 'agendado' THEN
      -- Status mudou para agendado -> incrementar
      UPDATE public.agendas 
      SET vagas_ocupadas = vagas_ocupadas + 1,
          updated_at = NOW()
      WHERE id = NEW.agenda_id;
      
      RAISE LOG 'UPDATE: Incrementando vagas para agenda_id=%, status: % -> %', NEW.agenda_id, OLD.status::text, NEW.status::text;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- CORREÇÃO CRÍTICA 3: Criar função para inserir user_roles automaticamente para entregadores aprovados
CREATE OR REPLACE FUNCTION public.sync_entregador_user_roles()
RETURNS void AS $$
BEGIN
  -- Inserir roles em user_roles para entregadores aprovados que não têm
  INSERT INTO public.user_roles (user_id, empresa_id, role)
  SELECT 
    e.user_id,
    e.empresa_id,
    CASE 
      WHEN e.perfil::text = 'admin' THEN 'admin_empresa'
      ELSE 'entregador'
    END
  FROM public.entregadores e
  WHERE e.status::text = 'aprovado'
  AND e.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = e.user_id 
    AND ur.empresa_id = e.empresa_id
  );
  
  RAISE NOTICE 'Sincronização de user_roles concluída para entregadores aprovados';
END;
$$ LANGUAGE plpgsql;

-- Executar a sincronização imediatamente
SELECT public.sync_entregador_user_roles();

-- Log da correção executada
DO $$
DECLARE
    total_entregadores INTEGER;
    entregadores_com_roles INTEGER;
    entregadores_sem_roles INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_entregadores 
    FROM public.entregadores 
    WHERE status::text = 'aprovado' AND user_id IS NOT NULL;
    
    SELECT COUNT(*) INTO entregadores_com_roles
    FROM public.entregadores e
    INNER JOIN public.user_roles ur ON e.user_id = ur.user_id AND e.empresa_id = ur.empresa_id
    WHERE e.status::text = 'aprovado' AND e.user_id IS NOT NULL;
    
    entregadores_sem_roles := total_entregadores - entregadores_com_roles;
    
    RAISE NOTICE '🔥 CORREÇÃO DE ENUMS E USER_ROLES EXECUTADA:';
    RAISE NOTICE '   📊 Total de entregadores aprovados: %', total_entregadores;
    RAISE NOTICE '   ✅ Entregadores com roles: %', entregadores_com_roles;
    RAISE NOTICE '   ❌ Entregadores sem roles: %', entregadores_sem_roles;
    RAISE NOTICE '   📈 Taxa de correção: %%%', 
                 CASE WHEN total_entregadores > 0 THEN 
                   ROUND((entregadores_com_roles::numeric / total_entregadores::numeric) * 100, 1) 
                 ELSE 0 END;
END $$;
