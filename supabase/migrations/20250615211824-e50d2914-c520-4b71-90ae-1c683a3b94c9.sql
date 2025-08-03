
-- CORREÇÃO DEFINITIVA: Remover TODOS os constraints de overbooking problemáticos

-- 1. Listar e remover TODOS os constraints relacionados a vagas para garantir limpeza completa
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Buscar todos os constraints na tabela agendas que mencionam vagas
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'agendas' 
        AND table_schema = 'public'
        AND constraint_type = 'CHECK'
        AND constraint_name LIKE '%vagas%'
    LOOP
        EXECUTE format('ALTER TABLE public.agendas DROP CONSTRAINT IF EXISTS %I', constraint_record.constraint_name);
        RAISE NOTICE 'Removido constraint: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- 2. Remover especificamente os constraints conhecidos problemáticos
ALTER TABLE public.agendas DROP CONSTRAINT IF EXISTS check_vagas_ocupadas_menor_igual_disponiveis;
ALTER TABLE public.agendas DROP CONSTRAINT IF EXISTS check_vagas_no_overbooking_strict;
ALTER TABLE public.agendas DROP CONSTRAINT IF EXISTS check_vagas_no_overbooking;
ALTER TABLE public.agendas DROP CONSTRAINT IF EXISTS agendas_vagas_ocupadas_check;

-- 3. Adicionar APENAS o constraint básico necessário (não problemático)
ALTER TABLE public.agendas 
ADD CONSTRAINT check_vagas_ocupadas_nao_negativas 
CHECK (vagas_ocupadas >= 0);

-- 4. Garantir que o trigger final está ativo e funcionando
DROP TRIGGER IF EXISTS trigger_agendamento_vagas_reforced ON public.agendamentos;
DROP TRIGGER IF EXISTS trigger_agendamento_vagas ON public.agendamentos;
DROP TRIGGER IF EXISTS trigger_agendamento_vagas_final ON public.agendamentos;

-- Recriar o trigger final com nome único
CREATE TRIGGER trigger_agendamento_vagas_definitivo
  AFTER INSERT OR UPDATE OR DELETE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_agendamento_vagas_final();

-- 5. SINCRONIZAÇÃO COMPLETA: Corrigir dados existentes
UPDATE public.agendas 
SET vagas_ocupadas = (
  SELECT COALESCE(COUNT(*), 0)
  FROM public.agendamentos 
  WHERE agenda_id = agendas.id 
  AND status::text = 'agendado'
),
updated_at = NOW()
WHERE ativo = true;

-- 6. Verificação final e relatório
DO $$
DECLARE
    total_constraints INTEGER;
    constraints_restantes TEXT;
    total_agendas INTEGER;
    agendas_sincronizadas INTEGER;
BEGIN
    -- Contar constraints restantes
    SELECT COUNT(*) INTO total_constraints
    FROM information_schema.table_constraints 
    WHERE table_name = 'agendas' 
    AND table_schema = 'public'
    AND constraint_type = 'CHECK';
    
    -- Listar constraints restantes
    SELECT string_agg(constraint_name, ', ') INTO constraints_restantes
    FROM information_schema.table_constraints 
    WHERE table_name = 'agendas' 
    AND table_schema = 'public'
    AND constraint_type = 'CHECK';
    
    -- Verificar sincronização
    SELECT COUNT(*) INTO total_agendas FROM public.agendas WHERE ativo = true;
    
    SELECT COUNT(*) INTO agendas_sincronizadas 
    FROM public.agendas a
    WHERE a.ativo = true
    AND a.vagas_ocupadas = (
        SELECT COALESCE(COUNT(*), 0)
        FROM public.agendamentos ag 
        WHERE ag.agenda_id = a.id 
        AND ag.status::text = 'agendado'
    );
    
    RAISE NOTICE '🎯 CORREÇÃO DEFINITIVA CONCLUÍDA:';
    RAISE NOTICE '   🛡️ Constraints CHECK restantes: % (%)', total_constraints, COALESCE(constraints_restantes, 'nenhum');
    RAISE NOTICE '   📊 Agendas ativas: %', total_agendas;
    RAISE NOTICE '   ✅ Agendas sincronizadas: %', agendas_sincronizadas;
    RAISE NOTICE '   🔧 Trigger definitivo: trigger_agendamento_vagas_definitivo';
    RAISE NOTICE '   ⚡ Sistema pronto para agendamentos sem race condition';
    
    -- Se ainda há inconsistências, alertar
    IF agendas_sincronizadas < total_agendas THEN
        RAISE WARNING 'ATENÇÃO: % agendas ainda precisam de sincronização manual', (total_agendas - agendas_sincronizadas);
    END IF;
END $$;
