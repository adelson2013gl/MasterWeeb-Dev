-- Adicionar campo email à tabela empresas
ALTER TABLE empresas 
ADD COLUMN email VARCHAR(255);

-- Adicionar constraint de email válido
ALTER TABLE empresas 
ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Adicionar índice para melhor performance em consultas por email
CREATE INDEX idx_empresas_email ON empresas(email);

-- Popular campo email para empresas existentes com um email padrão
-- (você pode atualizar manualmente depois)
UPDATE empresas 
SET email = CONCAT(LOWER(REPLACE(nome, ' ', '')), '@empresa.com')
WHERE email IS NULL;

-- Comentário para documentação
COMMENT ON COLUMN empresas.email IS 'Email de contato da empresa para comunicações e faturamento';