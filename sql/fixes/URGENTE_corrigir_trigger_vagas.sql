-- =====================================================
-- CORREÇÃO URGENTE: ATIVAR TRIGGER DE CONTROLE DE VAGAS
-- PROBLEMA: Trigger existe mas não está ativa na tabela
-- =====================================================

-- 1. VERIFICAR TRIGGERS ATUAIS NA TABELA AGENDAMENTOS
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'agendamentos'
  AND trigger_schema = 'public';

-- 2. CRIAR TRIGGER ATIVA PARA CONTROLE DE VAGAS
-- Baseado na função que já existe: handle_agendamento_vagas_final
DROP TRIGGER IF EXISTS trigger_agendamento_vagas_controle ON public.agendamentos;

CREATE TRIGGER trigger_agendamento_vagas_controle
    AFTER INSERT OR UPDATE OR DELETE ON public.agendamentos
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_agendamento_vagas_final();

-- 3. RECRIAR FUNÇÃO COM CONTROLE REAL DE VAGAS
CREATE OR REPLACE FUNCTION public.handle_agendamento_vagas_final()
RETURNS TRIGGER AS $$
DECLARE
    vagas_livres INTEGER;
    vagas_disp INTEGER;
    vagas_ocup INTEGER;
BEGIN
    -- Log para debugging
    RAISE LOG 'TRIGGER VAGAS - Operação: %, Agenda: %, Status: %', 
        TG_OP, 
        COALESCE(NEW.agenda_id, OLD.agenda_id),
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.status ELSE OLD.status END;

    -- INSERÇÃO DE NOVO AGENDAMENTO
    IF TG_OP = 'INSERT' THEN
        -- Só processar se status for 'agendado'
        IF NEW.status = 'agendado' THEN
            -- Buscar dados atuais da agenda
            SELECT vagas_disponiveis, vagas_ocupadas 
            INTO vagas_disp, vagas_ocup
            FROM public.agendas 
            WHERE id = NEW.agenda_id;
            
            vagas_livres := vagas_disp - vagas_ocup;
            
            -- VALIDAÇÃO CRÍTICA: Verificar se há vagas disponíveis
            IF vagas_livres <= 0 THEN
                RAISE EXCEPTION 'AGENDA LOTADA: Não há vagas disponíveis na agenda %. Vagas: %/% ocupadas.', 
                    NEW.agenda_id, vagas_ocup, vagas_disp;
            END IF;
            
            -- Se passou na validação, incrementar vagas ocupadas
            UPDATE public.agendas 
            SET vagas_ocupadas = vagas_ocupadas + 1,
                updated_at = NOW()
            WHERE id = NEW.agenda_id;
            
            RAISE LOG 'VAGAS: Incrementada agenda % (vagas livres antes: %)', NEW.agenda_id, vagas_livres;
        END IF;
        RETURN NEW;
        
    -- EXCLUSÃO DE AGENDAMENTO
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'agendado' THEN
            UPDATE public.agendas 
            SET vagas_ocupadas = GREATEST(vagas_ocupadas - 1, 0),
                updated_at = NOW()
            WHERE id = OLD.agenda_id;
            
            RAISE LOG 'VAGAS: Decrementada agenda %', OLD.agenda_id;
        END IF;
        RETURN OLD;
        
    -- ATUALIZAÇÃO DE AGENDAMENTO
    ELSIF TG_OP = 'UPDATE' THEN
        -- Se mudou o status para 'agendado'
        IF OLD.status != 'agendado' AND NEW.status = 'agendado' THEN
            -- Verificar vagas disponíveis
            SELECT vagas_disponiveis, vagas_ocupadas 
            INTO vagas_disp, vagas_ocup
            FROM public.agendas 
            WHERE id = NEW.agenda_id;
            
            vagas_livres := vagas_disp - vagas_ocup;
            
            IF vagas_livres <= 0 THEN
                RAISE EXCEPTION 'AGENDA LOTADA: Não há vagas disponíveis na agenda %. Vagas: %/% ocupadas.', 
                    NEW.agenda_id, vagas_ocup, vagas_disp;
            END IF;
            
            UPDATE public.agendas 
            SET vagas_ocupadas = vagas_ocupadas + 1,
                updated_at = NOW()
            WHERE id = NEW.agenda_id;
            
        -- Se mudou o status de 'agendado' para outro
        ELSIF OLD.status = 'agendado' AND NEW.status != 'agendado' THEN
            UPDATE public.agendas 
            SET vagas_ocupadas = GREATEST(vagas_ocupadas - 1, 0),
                updated_at = NOW()
            WHERE id = OLD.agenda_id;
            
        -- Se mudou de agenda (mantendo status 'agendado')
        ELSIF OLD.status = 'agendado' AND NEW.status = 'agendado' AND OLD.agenda_id != NEW.agenda_id THEN
            -- Decrementar da agenda antiga
            UPDATE public.agendas 
            SET vagas_ocupadas = GREATEST(vagas_ocupadas - 1, 0),
                updated_at = NOW()
            WHERE id = OLD.agenda_id;
            
            -- Verificar e incrementar na agenda nova
            SELECT vagas_disponiveis, vagas_ocupadas 
            INTO vagas_disp, vagas_ocup
            FROM public.agendas 
            WHERE id = NEW.agenda_id;
            
            vagas_livres := vagas_disp - vagas_ocup;
            
            IF vagas_livres <= 0 THEN
                RAISE EXCEPTION 'AGENDA LOTADA: Não há vagas disponíveis na agenda de destino %. Vagas: %/% ocupadas.', 
                    NEW.agenda_id, vagas_ocup, vagas_disp;
            END IF;
            
            UPDATE public.agendas 
            SET vagas_ocupadas = vagas_ocupadas + 1,
                updated_at = NOW()
            WHERE id = NEW.agenda_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. SINCRONIZAR DADOS EXISTENTES
-- Corrigir vagas_ocupadas baseado nos agendamentos reais
UPDATE public.agendas 
SET vagas_ocupadas = (
    SELECT COALESCE(COUNT(*), 0)
    FROM public.agendamentos 
    WHERE agenda_id = agendas.id 
    AND status = 'agendado'
),
updated_at = NOW()
WHERE ativo = true;

-- 5. VERIFICAÇÃO FINAL
SELECT 
    'VERIFICAÇÃO FINAL' as status,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'agendamentos'
  AND trigger_schema = 'public'
  AND trigger_name LIKE '%vagas%';

-- 6. RELATÓRIO DE SINCRONIZAÇÃO
SELECT 
    'RELATÓRIO SINCRONIZAÇÃO' as tipo,
    COUNT(*) as total_agendas,
    SUM(vagas_ocupadas) as total_vagas_ocupadas,
    SUM(vagas_disponiveis) as total_vagas_disponiveis
FROM agendas 
WHERE ativo = true;

-- 7. MENSAGENS DE CONFIRMAÇÃO
DO $$
BEGIN
    RAISE NOTICE '🎯 TRIGGER DE CONTROLE DE VAGAS ATIVADA!';
    RAISE NOTICE '✅ Sistema agora tem controle em tempo real!';
    RAISE NOTICE '🔒 Overbooking bloqueado automaticamente!';
END $$;