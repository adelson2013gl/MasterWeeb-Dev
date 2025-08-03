-- Migração para adicionar campos de segurança na tabela mercadopago_webhooks
-- Criada em: 2025-01-25
-- Objetivo: Melhorar segurança e auditoria dos webhooks

-- Verificar se a tabela existe, se não, criar
CREATE TABLE IF NOT EXISTS mercadopago_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_id TEXT NOT NULL,
    tipo TEXT NOT NULL,
    acao TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE,
    live_mode BOOLEAN DEFAULT false,
    user_id TEXT,
    api_version TEXT,
    payload JSONB,
    processado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar novos campos para segurança e auditoria
ALTER TABLE mercadopago_webhooks 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed', 'invalid')),
ADD COLUMN IF NOT EXISTS request_id TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS client_ip TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS signature_validated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP WITH TIME ZONE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_mercadopago_webhooks_webhook_id ON mercadopago_webhooks(webhook_id);
CREATE INDEX IF NOT EXISTS idx_mercadopago_webhooks_status ON mercadopago_webhooks(status);
CREATE INDEX IF NOT EXISTS idx_mercadopago_webhooks_tipo ON mercadopago_webhooks(tipo);
CREATE INDEX IF NOT EXISTS idx_mercadopago_webhooks_created_at ON mercadopago_webhooks(created_at);
CREATE INDEX IF NOT EXISTS idx_mercadopago_webhooks_request_id ON mercadopago_webhooks(request_id);
CREATE INDEX IF NOT EXISTS idx_mercadopago_webhooks_processado ON mercadopago_webhooks(processado);

-- Criar índice composto para verificação de idempotência
CREATE UNIQUE INDEX IF NOT EXISTS idx_mercadopago_webhooks_idempotency 
ON mercadopago_webhooks(webhook_id, status) 
WHERE status = 'processed';

-- Comentários para documentação
COMMENT ON TABLE mercadopago_webhooks IS 'Tabela para armazenar webhooks do Mercado Pago com campos de segurança e auditoria';
COMMENT ON COLUMN mercadopago_webhooks.status IS 'Status do processamento: received, processing, processed, failed, invalid';
COMMENT ON COLUMN mercadopago_webhooks.request_id IS 'ID único da requisição para rastreamento';
COMMENT ON COLUMN mercadopago_webhooks.error_message IS 'Mensagem de erro caso o processamento falhe';
COMMENT ON COLUMN mercadopago_webhooks.signature_validated IS 'Indica se a assinatura do webhook foi validada';
COMMENT ON COLUMN mercadopago_webhooks.retry_count IS 'Número de tentativas de reprocessamento';

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_mercadopago_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_mercadopago_webhooks_updated_at_trigger ON mercadopago_webhooks;
CREATE TRIGGER update_mercadopago_webhooks_updated_at_trigger
    BEFORE UPDATE ON mercadopago_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_mercadopago_webhooks_updated_at();

-- Criar view para relatórios de webhooks
CREATE OR REPLACE VIEW vw_mercadopago_webhooks_stats AS
SELECT 
    DATE(created_at) as data,
    tipo,
    status,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'processed') as processados,
    COUNT(*) FILTER (WHERE status = 'failed') as falhados,
    COUNT(*) FILTER (WHERE status = 'invalid') as invalidos,
    AVG(processing_time_ms) as tempo_medio_ms,
    MAX(processing_time_ms) as tempo_maximo_ms
FROM mercadopago_webhooks 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), tipo, status
ORDER BY data DESC, tipo, status;

COMMENT ON VIEW vw_mercadopago_webhooks_stats IS 'Estatísticas dos webhooks dos últimos 30 dias';

-- Política de RLS (Row Level Security) se necessário
-- ALTER TABLE mercadopago_webhooks ENABLE ROW LEVEL SECURITY; 