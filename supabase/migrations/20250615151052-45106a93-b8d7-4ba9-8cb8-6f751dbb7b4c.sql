
-- CORREÇÃO CRÍTICA URGENTE: Fix do trigger de vagas e proteções contra overbooking

-- 1. Recriar a função trigger com correções críticas
CREATE OR REPLACE FUNCTION public.handle_agendamento_vagas()
RETURNS TRIGGER AS $$
BEGIN
  -- Log detalhado para debugging
  RAISE LOG 'Trigger handle_agendamento_vagas executado: operação=%, agenda_id=%, status_old=%, status_new=%', 
    TG_OP, 
    COALESCE(NEW.agenda_id, OLD.agenda_id),
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE 'N/A' END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.status ELSE 'N/A' END;

  IF TG_OP = 'INSERT' THEN
    -- Incrementar vagas ocupadas apenas para agendamentos ativos
    IF NEW.status = 'agendado' THEN
      UPDATE public.agendas 
      SET vagas_ocupadas = vagas_ocupadas + 1,
          updated_at = NOW()
      WHERE id = NEW.agenda_id;
      
      RAISE LOG 'INSERT: Incrementando vagas para agenda_id=%, novo status=%', NEW.agenda_id, NEW.status;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar vagas ocupadas apenas se o agendamento estava ativo
    IF OLD.status = 'agendado' THEN
      UPDATE public.agendas 
      SET vagas_ocupadas = GREATEST(vagas_ocupadas - 1, 0),
          updated_at = NOW()
      WHERE id = OLD.agenda_id;
      
      RAISE LOG 'DELETE: Decrementando vagas para agenda_id=%, status era=%', OLD.agenda_id, OLD.status;
    END IF;
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Lidar com mudanças de status
    IF OLD.status = 'agendado' AND NEW.status != 'agendado' THEN
      -- Status mudou de agendado para outro -> decrementar
      UPDATE public.agendas 
      SET vagas_ocupadas = GREATEST(vagas_ocupadas - 1, 0),
          updated_at = NOW()
      WHERE id = OLD.agenda_id;
      
      RAISE LOG 'UPDATE: Decrementando vagas para agenda_id=%, status: % -> %', OLD.agenda_id, OLD.status, NEW.status;
      
    ELSIF OLD.status != 'agendado' AND NEW.status = 'agendado' THEN
      -- Status mudou para agendado -> incrementar
      UPDATE public.agendas 
      SET vagas_ocupadas = vagas_ocupadas + 1,
          updated_at = NOW()
      WHERE id = NEW.agenda_id;
      
      RAISE LOG 'UPDATE: Incrementando vagas para agenda_id=%, status: % -> %', NEW.agenda_id, OLD.status, NEW.status;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Recriar o trigger
DROP TRIGGER IF EXISTS trigger_agendamento_vagas ON public.agendamentos;
CREATE TRIGGER trigger_agendamento_vagas
  AFTER INSERT OR UPDATE OR DELETE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_agendamento_vagas();

-- 3. SINCRONIZAÇÃO CRÍTICA: Recalcular todas as vagas ocupadas
UPDATE public.agendas 
SET vagas_ocupadas = (
  SELECT COUNT(*) 
  FROM public.agendamentos 
  WHERE agenda_id = agendas.id 
  AND status = 'agendado'
),
updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT agenda_id 
  FROM public.agendamentos
  WHERE agenda_id IS NOT NULL
);

-- 4. Zerar vagas ocupadas para agendas sem agendamentos ativos
UPDATE public.agendas 
SET vagas_ocupadas = 0,
    updated_at = NOW()
WHERE id NOT IN (
  SELECT DISTINCT agenda_id 
  FROM public.agendamentos 
  WHERE status = 'agendado' AND agenda_id IS NOT NULL
) AND vagas_ocupadas > 0;

-- 5. CONSTRAINT CRÍTICA: Prevenir overbooking no banco de dados
ALTER TABLE public.agendas 
DROP CONSTRAINT IF EXISTS check_vagas_no_overbooking;

ALTER TABLE public.agendas 
ADD CONSTRAINT check_vagas_no_overbooking 
CHECK (vagas_ocupadas <= vagas_disponiveis);

-- 6. CONSTRAINT: Garantir vagas ocupadas não negativas
ALTER TABLE public.agendas 
DROP CONSTRAINT IF EXISTS check_vagas_ocupadas_positive;

ALTER TABLE public.agendas 
ADD CONSTRAINT check_vagas_ocupadas_positive 
CHECK (vagas_ocupadas >= 0);

-- 7. Função para verificar inconsistências (monitoramento)
CREATE OR REPLACE FUNCTION public.check_agenda_consistency()
RETURNS TABLE(
  agenda_id uuid,
  data date,
  vagas_disponiveis integer,
  vagas_ocupadas integer,
  agendamentos_reais bigint,
  ocupacao_percentual numeric,
  inconsistente boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as agenda_id,
    a.data,
    a.vagas_disponiveis,
    a.vagas_ocupadas,
    COALESCE(ag_count.total, 0) as agendamentos_reais,
    CASE 
      WHEN a.vagas_disponiveis > 0 THEN 
        ROUND((a.vagas_ocupadas::numeric / a.vagas_disponiveis::numeric) * 100, 1)
      ELSE 0 
    END as ocupacao_percentual,
    (a.vagas_ocupadas != COALESCE(ag_count.total, 0) OR a.vagas_ocupadas > a.vagas_disponiveis) as inconsistente
  FROM public.agendas a
  LEFT JOIN (
    SELECT agenda_id, COUNT(*) as total
    FROM public.agendamentos 
    WHERE status = 'agendado'
    GROUP BY agenda_id
  ) ag_count ON a.id = ag_count.agenda_id
  WHERE a.ativo = true
  ORDER BY a.data DESC, inconsistente DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Log da correção executada
DO $$
DECLARE
    total_agendas INTEGER;
    agendas_corrigidas INTEGER;
    agendas_inconsistentes INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_agendas FROM public.agendas WHERE ativo = true;
    
    SELECT COUNT(*) INTO agendas_corrigidas 
    FROM public.agendas a
    WHERE a.ativo = true
    AND a.vagas_ocupadas = (
        SELECT COUNT(*) 
        FROM public.agendamentos ag 
        WHERE ag.agenda_id = a.id 
        AND ag.status = 'agendado'
    );
    
    SELECT COUNT(*) INTO agendas_inconsistentes
    FROM public.agendas a
    WHERE a.ativo = true
    AND (
      a.vagas_ocupadas != (
        SELECT COUNT(*) 
        FROM public.agendamentos ag 
        WHERE ag.agenda_id = a.id 
        AND ag.status = 'agendado'
      )
      OR a.vagas_ocupadas > a.vagas_disponiveis
    );
    
    RAISE NOTICE '🔥 CORREÇÃO CRÍTICA EXECUTADA:';
    RAISE NOTICE '   📊 Total de agendas ativas: %', total_agendas;
    RAISE NOTICE '   ✅ Agendas corrigidas e consistentes: %', agendas_corrigidas;
    RAISE NOTICE '   ❌ Agendas ainda inconsistentes: %', agendas_inconsistentes;
    RAISE NOTICE '   📈 Taxa de correção: %%%', 
                 CASE WHEN total_agendas > 0 THEN 
                   ROUND((agendas_corrigidas::numeric / total_agendas::numeric) * 100, 1) 
                 ELSE 0 END;
END $$;
