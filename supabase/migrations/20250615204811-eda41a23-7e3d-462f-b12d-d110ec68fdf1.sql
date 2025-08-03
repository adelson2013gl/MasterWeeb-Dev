
-- CORREÇÃO CRÍTICA: Sincronização de vagas e proteções contra inconsistências
-- Corrige o problema onde vagas_ocupadas está desatualizado causando erros de agendamento

-- 1. Sincronizar TODAS as vagas_ocupadas com a contagem real de agendamentos
UPDATE public.agendas 
SET vagas_ocupadas = (
  SELECT COUNT(*) 
  FROM public.agendamentos 
  WHERE agenda_id = agendas.id 
  AND status::text = 'agendado'
),
updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT agenda_id 
  FROM public.agendamentos
  WHERE agenda_id IS NOT NULL
);

-- 2. Zerar vagas ocupadas para agendas sem agendamentos ativos
UPDATE public.agendas 
SET vagas_ocupadas = 0,
    updated_at = NOW()
WHERE id NOT IN (
  SELECT DISTINCT agenda_id 
  FROM public.agendamentos 
  WHERE status::text = 'agendado' AND agenda_id IS NOT NULL
) AND vagas_ocupadas > 0;

-- 3. Adicionar constraint para prevenir overbooking no nível do banco
ALTER TABLE public.agendas 
DROP CONSTRAINT IF EXISTS check_vagas_no_overbooking_strict;

ALTER TABLE public.agendas 
ADD CONSTRAINT check_vagas_no_overbooking_strict 
CHECK (vagas_ocupadas <= vagas_disponiveis);

-- 4. Reforçar trigger para sincronização automática com logs detalhados
CREATE OR REPLACE FUNCTION public.handle_agendamento_vagas_reforced()
RETURNS TRIGGER AS $$
BEGIN
  -- Log detalhado para debugging de inconsistências
  RAISE LOG 'TRIGGER REFORÇADO - Operação: %, Agenda: %, Status OLD: %, Status NEW: %', 
    TG_OP, 
    COALESCE(NEW.agenda_id, OLD.agenda_id),
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status::text ELSE 'N/A' END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.status::text ELSE 'N/A' END;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status::text = 'agendado' THEN
      -- Verificar se não vai causar overbooking
      IF (SELECT vagas_ocupadas FROM public.agendas WHERE id = NEW.agenda_id) >= 
         (SELECT vagas_disponiveis FROM public.agendas WHERE id = NEW.agenda_id) THEN
        RAISE EXCEPTION 'BLOQUEIO DE OVERBOOKING: Agenda % já está lotada', NEW.agenda_id;
      END IF;
      
      UPDATE public.agendas 
      SET vagas_ocupadas = vagas_ocupadas + 1,
          updated_at = NOW()
      WHERE id = NEW.agenda_id;
      
      RAISE LOG 'INSERT REFORÇADO: Incrementando vagas agenda %', NEW.agenda_id;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status::text = 'agendado' THEN
      UPDATE public.agendas 
      SET vagas_ocupadas = GREATEST(vagas_ocupadas - 1, 0),
          updated_at = NOW()
      WHERE id = OLD.agenda_id;
      
      RAISE LOG 'DELETE REFORÇADO: Decrementando vagas agenda %', OLD.agenda_id;
    END IF;
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status::text = 'agendado' AND NEW.status::text != 'agendado' THEN
      -- Cancelamento ou mudança de status
      UPDATE public.agendas 
      SET vagas_ocupadas = GREATEST(vagas_ocupadas - 1, 0),
          updated_at = NOW()
      WHERE id = OLD.agenda_id;
      
      RAISE LOG 'UPDATE REFORÇADO: Decrementando vagas agenda % (% -> %)', OLD.agenda_id, OLD.status::text, NEW.status::text;
      
    ELSIF OLD.status::text != 'agendado' AND NEW.status::text = 'agendado' THEN
      -- Verificar se não vai causar overbooking
      IF (SELECT vagas_ocupadas FROM public.agendas WHERE id = NEW.agenda_id) >= 
         (SELECT vagas_disponiveis FROM public.agendas WHERE id = NEW.agenda_id) THEN
        RAISE EXCEPTION 'BLOQUEIO DE OVERBOOKING: Agenda % já está lotada', NEW.agenda_id;
      END IF;
      
      -- Reativação de agendamento
      UPDATE public.agendas 
      SET vagas_ocupadas = vagas_ocupadas + 1,
          updated_at = NOW()
      WHERE id = NEW.agenda_id;
      
      RAISE LOG 'UPDATE REFORÇADO: Incrementando vagas agenda % (% -> %)', NEW.agenda_id, OLD.status::text, NEW.status::text;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. Substituir trigger existente pelo reforçado
DROP TRIGGER IF EXISTS trigger_agendamento_vagas ON public.agendamentos;
DROP TRIGGER IF EXISTS trigger_agendamento_vagas_reforced ON public.agendamentos;

CREATE TRIGGER trigger_agendamento_vagas_reforced
  AFTER INSERT OR UPDATE OR DELETE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_agendamento_vagas_reforced();

-- 6. Log da correção executada
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
        AND ag.status::text = 'agendado'
    );
    
    SELECT COUNT(*) INTO agendas_inconsistentes
    FROM public.agendas a
    WHERE a.ativo = true
    AND (
      a.vagas_ocupadas != (
        SELECT COUNT(*) 
        FROM public.agendamentos ag 
        WHERE ag.agenda_id = a.id 
        AND ag.status::text = 'agendado'
      )
      OR a.vagas_ocupadas > a.vagas_disponiveis
    );
    
    RAISE NOTICE '🔥 CORREÇÃO CRÍTICA DE INCONSISTÊNCIAS EXECUTADA:';
    RAISE NOTICE '   📊 Total de agendas ativas: %', total_agendas;
    RAISE NOTICE '   ✅ Agendas sincronizadas: %', agendas_corrigidas;
    RAISE NOTICE '   ❌ Agendas ainda inconsistentes: %', agendas_inconsistentes;
    RAISE NOTICE '   📈 Taxa de correção: %%%', 
                 CASE WHEN total_agendas > 0 THEN 
                   ROUND((agendas_corrigidas::numeric / total_agendas::numeric) * 100, 1) 
                 ELSE 0 END;
    RAISE NOTICE '   🛡️ Proteções anti-overbooking ativadas';
END $$;
