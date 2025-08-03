
-- Migration para adicionar colunas faltantes e corrigir tipos

-- Adicionar colunas faltantes na tabela cidades
ALTER TABLE cidades 
ADD COLUMN IF NOT EXISTS estado VARCHAR(2),
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Adicionar colunas faltantes na tabela regioes
ALTER TABLE regioes 
ADD COLUMN IF NOT EXISTS cidade_id UUID REFERENCES cidades(id),
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Adicionar colunas faltantes na tabela turnos
ALTER TABLE turnos 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS hora_inicio TIME,
ADD COLUMN IF NOT EXISTS hora_fim TIME;

-- Atualizar turnos existentes para usar as novas colunas de hora
UPDATE turnos 
SET 
  hora_inicio = inicio::TIME,
  hora_fim = fim::TIME
WHERE hora_inicio IS NULL OR hora_fim IS NULL;

-- Definir datas de vencimento padrão para empresas existentes
UPDATE empresas 
SET data_vencimento = CASE 
  WHEN plano = 'basico' THEN CURRENT_DATE + INTERVAL '30 days'
  WHEN plano = 'pro' THEN CURRENT_DATE + INTERVAL '365 days'
  WHEN plano = 'enterprise' THEN CURRENT_DATE + INTERVAL '365 days'
  ELSE CURRENT_DATE + INTERVAL '30 days'
END
WHERE data_vencimento IS NULL;

-- Adicionar constraint NOT NULL para data_vencimento (opcional, comentado por segurança)
-- ALTER TABLE empresas ALTER COLUMN data_vencimento SET NOT NULL;

-- Atualizar cidades para ter estados padrão (exemplo)
UPDATE cidades SET estado = 'SP' WHERE estado IS NULL AND nome ILIKE '%são paulo%';
UPDATE cidades SET estado = 'RJ' WHERE estado IS NULL AND nome ILIKE '%rio de janeiro%';
UPDATE cidades SET estado = 'MG' WHERE estado IS NULL AND nome ILIKE '%minas gerais%';
UPDATE cidades SET estado = 'PR' WHERE estado IS NULL AND nome ILIKE '%paraná%';
UPDATE cidades SET estado = 'SC' WHERE estado IS NULL AND nome ILIKE '%santa catarina%';
UPDATE cidades SET estado = 'RS' WHERE estado IS NULL AND nome ILIKE '%rio grande do sul%';
UPDATE cidades SET estado = 'ES' WHERE estado IS NULL AND nome ILIKE '%espírito santo%';
UPDATE cidades SET estado = 'BA' WHERE estado IS NULL AND nome ILIKE '%bahia%';
UPDATE cidades SET estado = 'PE' WHERE estado IS NULL AND nome ILIKE '%pernambuco%';
UPDATE cidades SET estado = 'CE' WHERE estado IS NULL AND nome ILIKE '%ceará%';
-- Definir estado padrão para cidades sem estado específico
UPDATE cidades SET estado = 'SP' WHERE estado IS NULL;

-- Log da migração
INSERT INTO logs_sistema (evento, detalhes, created_at)
VALUES (
  'migration_missing_columns',
  json_build_object(
    'colunas_adicionadas', json_build_array('cidades.estado', 'cidades.ativo', 'regioes.cidade_id', 'regioes.ativo', 'turnos.ativo', 'turnos.hora_inicio', 'turnos.hora_fim'),
    'empresas_vencimento_definido', (SELECT COUNT(*) FROM empresas WHERE data_vencimento IS NOT NULL),
    'migration_date', NOW()
  ),
  NOW()
);

COMMENT ON TABLE cidades IS 'Tabela de cidades com estado e status ativo';
COMMENT ON TABLE regioes IS 'Tabela de regiões vinculadas a cidades';
COMMENT ON TABLE turnos IS 'Tabela de turnos com horários específicos e status ativo';
