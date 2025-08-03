-- Migração para adicionar sistema de configurações dinâmicas
-- Permite gerenciar configurações do Mercado Pago via interface administrativa

-- Tabela para configurações do sistema
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
    categoria VARCHAR(50) NOT NULL,
    descricao TEXT,
    sensivel BOOLEAN DEFAULT FALSE, -- Para dados sensíveis como tokens
    ambiente VARCHAR(20) DEFAULT 'production' CHECK (ambiente IN ('test', 'production')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão do Mercado Pago
INSERT INTO configuracoes_sistema (chave, valor, tipo, categoria, descricao, sensivel, ambiente) VALUES
('mercadopago_public_key_test', '', 'string', 'mercadopago', 'Chave pública de teste do Mercado Pago', false, 'test'),
('mercadopago_access_token_test', '', 'string', 'mercadopago', 'Token de acesso de teste do Mercado Pago', true, 'test'),
('mercadopago_public_key_prod', '', 'string', 'mercadopago', 'Chave pública de produção do Mercado Pago', false, 'production'),
('mercadopago_access_token_prod', '', 'string', 'mercadopago', 'Token de acesso de produção do Mercado Pago', true, 'production'),
('mercadopago_environment', 'test', 'string', 'mercadopago', 'Ambiente ativo (test/production)', false, 'production'),
('frontend_url', 'http://localhost:8080', 'string', 'sistema', 'URL do frontend da aplicação', false, 'production'),
('webhook_url', '', 'string', 'mercadopago', 'URL do webhook do Mercado Pago', false, 'production');

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_configuracoes_categoria ON configuracoes_sistema(categoria);
CREATE INDEX IF NOT EXISTS idx_configuracoes_ambiente ON configuracoes_sistema(ambiente);
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes_sistema(chave);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_configuracoes_sistema_updated_at
    BEFORE UPDATE ON configuracoes_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE configuracoes_sistema IS 'Tabela para armazenar configurações dinâmicas do sistema';
COMMENT ON COLUMN configuracoes_sistema.chave IS 'Chave única da configuração';
COMMENT ON COLUMN configuracoes_sistema.valor IS 'Valor da configuração (pode ser null)';
COMMENT ON COLUMN configuracoes_sistema.tipo IS 'Tipo do valor (string, number, boolean, json)';
COMMENT ON COLUMN configuracoes_sistema.categoria IS 'Categoria da configuração (mercadopago, sistema, etc.)';
COMMENT ON COLUMN configuracoes_sistema.sensivel IS 'Indica se é um dado sensível (tokens, senhas, etc.)';
COMMENT ON COLUMN configuracoes_sistema.ambiente IS 'Ambiente da configuração (test, production)';