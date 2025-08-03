-- Migração para corrigir inconsistência de vagas
-- Fase 1: Implementar trigger handle_agendamento_vagas e sincronizar dados

-- 1. Criar função para gerenciar vagas automaticamente
CREATE OR REPLACE FUNCTION public.handle_agendamento_vagas()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar vagas ocupadas apenas para agendamentos ativos
    IF NEW.status = 'agendado' THEN
      UPDATE public.agendas 
      SET vagas_ocupadas = vagas_ocupadas + 1 
      WHERE id = NEW.agenda_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar vagas ocupadas apenas se o agendamento estava ativo
    IF OLD.status = 'agendado' THEN
      UPDATE public.agendas 
      SET vagas_ocupadas = vagas_ocupadas - 1 
      WHERE id = OLD.agenda_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Lidar com mudanças de status
    IF OLD.status = 'agendado' AND NEW.status = 'cancelado' THEN
      UPDATE public.agendas 
      SET vagas_ocupadas = vagas_ocupadas - 1 
      WHERE id = OLD.agenda_id;
    ELSIF OLD.status = 'cancelado' AND NEW.status = 'agendado' THEN
      UPDATE public.agendas 
      SET vagas_ocupadas = vagas_ocupadas + 1 
      WHERE id = NEW.agenda_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger para executar a função
DROP TRIGGER IF EXISTS trigger_agendamento_vagas ON public.agendamentos;
CREATE TRIGGER trigger_agendamento_vagas
  AFTER INSERT OR UPDATE OR DELETE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_agendamento_vagas();

-- 3. Sincronizar dados existentes - recalcular vagas_ocupadas baseado na contagem real
UPDATE public.agendas 
SET vagas_ocupadas = (
  SELECT COUNT(*) 
  FROM public.agendamentos 
  WHERE agenda_id = agendas.id 
  AND status = 'agendado'
)
WHERE id IN (
  SELECT DISTINCT agenda_id 
  FROM public.agendamentos
);

-- 4. Garantir que agendas sem agendamentos tenham vagas_ocupadas = 0
UPDATE public.agendas 
SET vagas_ocupadas = 0 
WHERE id NOT IN (
  SELECT DISTINCT agenda_id 
  FROM public.agendamentos 
  WHERE status = 'agendado'
) AND vagas_ocupadas > 0;

-- 5. Adicionar constraint para evitar vagas_ocupadas negativas
ALTER TABLE public.agendas 
ADD CONSTRAINT check_vagas_ocupadas_positive 
CHECK (vagas_ocupadas >= 0);

-- 6. Adicionar constraint para evitar overbooking
ALTER TABLE public.agendas 
ADD CONSTRAINT check_vagas_overbooking 
CHECK (vagas_ocupadas <= vagas_disponiveis);

-- 7. Log da correção
DO $$
DECLARE
    total_agendas INTEGER;
    agendas_corrigidas INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_agendas FROM public.agendas;
    
    SELECT COUNT(*) INTO agendas_corrigidas 
    FROM public.agendas a
    WHERE a.vagas_ocupadas = (
        SELECT COUNT(*) 
        FROM public.agendamentos ag 
        WHERE ag.agenda_id = a.id 
        AND ag.status = 'agendado'
    );
    
    RAISE NOTICE 'Sincronização de vagas concluída: % agendas processadas, % já estavam corretas', 
                 total_agendas, agendas_corrigidas;
END $$;