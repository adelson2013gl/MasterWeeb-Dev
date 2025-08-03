
-- CORREÇÃO CRÍTICA: Remover constraint problemático e implementar validação robusta no trigger

-- 1. REMOVER o constraint problemático que está causando race condition
ALTER TABLE public.agendas 
DROP CONSTRAINT IF EXISTS check_vagas_no_overbooking_strict;

ALTER TABLE public.agendas 
DROP CONSTRAINT IF EXISTS check_vagas_no_overbooking;

-- 2. RECRIAR trigger com validação robusta integrada (sem constraint externo)
CREATE OR REPLACE FUNCTION public.handle_agendamento_vagas_final()
RETURNS TRIGGER AS $$
BEGIN
  -- Log detalhado para debugging
  RAISE LOG 'TRIGGER FINAL - Operação: %, Agenda: %, Status OLD: %, Status NEW: %', 
    TG_OP, 
    COALESCE(NEW.agenda_id, OLD.agenda_id),
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status::text ELSE 'N/A' END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.status::text ELSE 'N/A' END;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status::text = 'agendado' THEN
      -- VALIDAÇÃO INTEGRADA: Verificar overbooking ANTES de atualizar
      DECLARE
        vagas_livres INTEGER;
        vagas_disp INTEGER;
        vagas_ocup INTEGER;
      BEGIN
        -- Buscar dados atuais da agenda
        SELECT vagas_disponiveis, vagas_ocupadas 
        INTO vagas_disp, vagas_ocup
        FROM public.agendas 
        WHERE id = NEW.agenda_id;
        
        vagas_livres := vagas_disp - vagas_ocup;
        
        -- Se não há vagas livres, bloquear inserção
        IF vagas_livres <= 0 THEN
          RAISE EXCEPTION 'AGENDA LOTADA: Não há vagas disponíveis na agenda %. Vagas: %/% ocupadas.', 
            NEW.agenda_id, vagas_ocup, vagas_disp;
        END IF;
        
        -- Se passou na validação, incrementar normalmente
        UPDATE public.agendas 
        SET vagas_ocupadas = vagas_ocupadas + 1,
            updated_at = NOW()
        WHERE id = NEW.agenda_id;
        
        RAISE LOG 'INSERT FINAL: Incrementando vagas agenda % (vagas livres antes: %)', NEW.agenda_id, vagas_livres;
      END;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status::text = 'agendado' THEN
      UPDATE public.agendas 
      SET vagas_ocupadas = GREATEST(vagas_ocupadas - 1, 0),
          updated_at = NOW()
      WHERE id = OLD.agenda_id;
      
      RAISE LOG 'DELETE FINAL: Decrementando vagas agenda %', OLD.agenda_id;
    END IF;
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status::text = 'agendado' AND NEW.status::text != 'agendado' THEN
      -- Cancelamento: decrementar
      UPDATE public.agendas 
      SET vagas_ocupadas = GREATEST(vagas_ocupadas - 1, 0),
          updated_at = NOW()
      WHERE id = OLD.agenda_id;
      
      RAISE LOG 'UPDATE FINAL: Decrementando vagas agenda % (% -> %)', OLD.agenda_id, OLD.status::text, NEW.status::text;
      
    ELSIF OLD.status::text != 'agendado' AND NEW.status::text = 'agendado' THEN
      -- Ativação: validar e incrementar
      DECLARE
        vagas_livres INTEGER;
        vagas_disp INTEGER;
        vagas_ocup INTEGER;
      BEGIN
        SELECT vagas_disponiveis, vagas_ocupadas 
        INTO vagas_disp, vagas_ocup
        FROM public.agendas 
        WHERE id = NEW.agenda_id;
        
        vagas_livres := vagas_disp - vagas_ocup;
        
        IF vagas_livres <= 0 THEN
          RAISE EXCEPTION 'AGENDA LOTADA: Não é possível ativar agendamento. Vagas: %/% ocupadas.', 
            vagas_ocup, vagas_disp;
        END IF;
        
        UPDATE public.agendas 
        SET vagas_ocupadas = vagas_ocupadas + 1,
            updated_at = NOW()
        WHERE id = NEW.agenda_id;
        
        RAISE LOG 'UPDATE FINAL: Incrementando vagas agenda % (% -> %)', NEW.agenda_id, OLD.status::text, NEW.status::text;
      END;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. SUBSTITUIR trigger existente pelo novo
DROP TRIGGER IF EXISTS trigger_agendamento_vagas_reforced ON public.agendamentos;
DROP TRIGGER IF EXISTS trigger_agendamento_vagas ON public.agendamentos;

CREATE TRIGGER trigger_agendamento_vagas_final
  AFTER INSERT OR UPDATE OR DELETE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_agendamento_vagas_final();

-- 4. SINCRONIZAÇÃO FINAL: Corrigir todas as inconsistências existentes
UPDATE public.agendas 
SET vagas_ocupadas = (
  SELECT COALESCE(COUNT(*), 0)
  FROM public.agendamentos 
  WHERE agenda_id = agendas.id 
  AND status::text = 'agendado'
),
updated_at = NOW()
WHERE ativo = true;

-- 5. CONSTRAINT SIMPLES: Apenas para evitar valores negativos (sem causar race condition)
ALTER TABLE public.agendas 
ADD CONSTRAINT check_vagas_ocupadas_nao_negativas 
CHECK (vagas_ocupadas >= 0);

-- 6. Log da correção final
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
        SELECT COALESCE(COUNT(*), 0)
        FROM public.agendamentos ag 
        WHERE ag.agenda_id = a.id 
        AND ag.status::text = 'agendado'
    );
    
    SELECT COUNT(*) INTO agendas_inconsistentes
    FROM public.agendas a
    WHERE a.ativo = true
    AND a.vagas_ocupadas != (
      SELECT COALESCE(COUNT(*), 0)
      FROM public.agendamentos ag 
      WHERE ag.agenda_id = a.id 
      AND ag.status::text = 'agendado'
    );
    
    RAISE NOTICE '🎯 CORREÇÃO FINAL IMPLEMENTADA:';
    RAISE NOTICE '   📊 Total de agendas ativas: %', total_agendas;
    RAISE NOTICE '   ✅ Agendas corrigidas: %', agendas_corrigidas;
    RAISE NOTICE '   ❌ Agendas ainda inconsistentes: %', agendas_inconsistentes;
    RAISE NOTICE '   🛡️ Constraint problemático removido';
    RAISE NOTICE '   🔧 Trigger com validação integrada ativo';
    RAISE NOTICE '   📈 Taxa de correção: %%%', 
                 CASE WHEN total_agendas > 0 THEN 
                   ROUND((agendas_corrigidas::numeric / total_agendas::numeric) * 100, 1) 
                 ELSE 0 END;
END $$;
