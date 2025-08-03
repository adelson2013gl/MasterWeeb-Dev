-- Migração simplificada que converte ENUM para VARCHAR para evitar problemas de transação

-- Adicionar campos faltantes
ALTER TABLE configuracoes_sistema
ADD COLUMN IF NOT EXISTS sensivel BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ambiente VARCHAR(20) DEFAULT 'production';

-- Adicionar constraint para ambiente
ALTER TABLE configuracoes_sistema
DROP CONSTRAINT IF EXISTS check_ambiente;
ALTER TABLE configuracoes_sistema
ADD CONSTRAINT check_ambiente CHECK (ambiente IN ('test', 'production'));

-- Converter coluna tipo de ENUM para VARCHAR para maior flexibilidade
ALTER TABLE configuracoes_sistema 
ALTER COLUMN tipo TYPE VARCHAR(20);

-- Converter 'integer' para 'number'
UPDATE configuracoes_sistema
SET tipo = 'number'
WHERE tipo = 'integer';

-- Adicionar constraint CHECK para validar valores permitidos
ALTER TABLE configuracoes_sistema
ADD CONSTRAINT check_tipo_configuracao CHECK (tipo IN ('string', 'number', 'boolean', 'json'));

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_configuracoes_sistema_chave ON configuracoes_sistema(chave);
CREATE INDEX IF NOT EXISTS idx_configuracoes_sistema_ambiente ON configuracoes_sistema(ambiente);
CREATE INDEX IF NOT EXISTS idx_configuracoes_sistema_sensivel ON configuracoes_sistema(sensivel);

-- Atualizar registros existentes com valores padrão
UPDATE configuracoes_sistema 
SET 
    sensivel = FALSE,
    ambiente = 'production'
WHERE sensivel IS NULL OR ambiente IS NULL;