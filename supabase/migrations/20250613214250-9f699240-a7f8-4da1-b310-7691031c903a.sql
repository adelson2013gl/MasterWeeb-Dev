
-- Adicionar campos para horários específicos de liberação por estrela na tabela configuracoes_empresa
ALTER TABLE public.configuracoes_empresa 
ADD COLUMN IF NOT EXISTS horario_liberacao_5_estrelas TIME DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS horario_liberacao_4_estrelas TIME DEFAULT '08:45',
ADD COLUMN IF NOT EXISTS horario_liberacao_3_estrelas TIME DEFAULT '09:20',
ADD COLUMN IF NOT EXISTS horario_liberacao_2_estrelas TIME DEFAULT '10:00',
ADD COLUMN IF NOT EXISTS horario_liberacao_1_estrela TIME DEFAULT '10:30';

-- Criar índices para otimizar consultas por empresa_id (performance)
CREATE INDEX IF NOT EXISTS idx_configuracoes_empresa_empresa_id 
ON public.configuracoes_empresa(empresa_id);

-- Atualizar registros existentes com valores padrão se necessário
UPDATE public.configuracoes_empresa 
SET 
  horario_liberacao_5_estrelas = '08:00'::TIME,
  horario_liberacao_4_estrelas = '08:45'::TIME,
  horario_liberacao_3_estrelas = '09:20'::TIME,
  horario_liberacao_2_estrelas = '10:00'::TIME,
  horario_liberacao_1_estrela = '10:30'::TIME
WHERE 
  horario_liberacao_5_estrelas IS NULL 
  OR horario_liberacao_4_estrelas IS NULL 
  OR horario_liberacao_3_estrelas IS NULL 
  OR horario_liberacao_2_estrelas IS NULL 
  OR horario_liberacao_1_estrela IS NULL;

-- Comentário explicativo sobre a mudança
COMMENT ON COLUMN public.configuracoes_empresa.horario_liberacao_5_estrelas IS 'Horário específico de liberação das agendas para entregadores 5 estrelas (formato HH:MM)';
COMMENT ON COLUMN public.configuracoes_empresa.horario_liberacao_4_estrelas IS 'Horário específico de liberação das agendas para entregadores 4 estrelas (formato HH:MM)';
COMMENT ON COLUMN public.configuracoes_empresa.horario_liberacao_3_estrelas IS 'Horário específico de liberação das agendas para entregadores 3 estrelas (formato HH:MM)';
COMMENT ON COLUMN public.configuracoes_empresa.horario_liberacao_2_estrelas IS 'Horário específico de liberação das agendas para entregadores 2 estrelas (formato HH:MM)';
COMMENT ON COLUMN public.configuracoes_empresa.horario_liberacao_1_estrela IS 'Horário específico de liberação das agendas para entregadores 1 estrela (formato HH:MM)';
