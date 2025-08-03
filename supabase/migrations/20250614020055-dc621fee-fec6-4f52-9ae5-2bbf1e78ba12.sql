
-- Fase 1: Correção do Enum status_agendamento
-- Adicionar valores 'pendente' e 'confirmada' ao enum status_agendamento

-- Primeiro, vamos adicionar os novos valores ao enum
ALTER TYPE public.status_agendamento ADD VALUE 'pendente';
ALTER TYPE public.status_agendamento ADD VALUE 'confirmada';

-- Verificar os valores do enum após a alteração
-- Os valores disponíveis agora serão: 'agendado', 'cancelado', 'concluido', 'pendente', 'confirmada'

-- Opcional: Atualizar registros existentes se necessário
-- (No momento não há registros com status pendente/confirmada para migrar)

-- Log da correção
DO $$
BEGIN
    RAISE NOTICE 'Enum status_agendamento atualizado com sucesso. Valores disponíveis: agendado, cancelado, concluido, pendente, confirmada';
END $$;
