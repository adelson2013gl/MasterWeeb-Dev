-- Migração para integração com Iugu
-- Adiciona suporte completo para pagamentos recorrentes via Iugu

-- ============================================================================
-- 1. ADICIONAR COLUNAS NA TABELA ASSINATURAS PARA SUPORTAR IUGU
-- ============================================================================

-- Adicionar colunas para IDs da Iugu na tabela assinaturas existente
ALTER TABLE assinaturas 
ADD COLUMN IF NOT EXISTS iugu_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS iugu_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS iugu_plan_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS gateway VARCHAR(20) DEFAULT 'mercadopago' CHECK (gateway IN ('mercadopago', 'iugu')),
ADD COLUMN IF NOT EXISTS ambiente VARCHAR(20) DEFAULT 'production' CHECK (ambiente IN ('sandbox', 'production'));

-- ============================================================================
-- 2. CRIAR TABELA PARA WEBHOOKS DA IUGU
-- ============================================================================

-- Tabela para logs de webhooks da Iugu (similar ao mercadopago_webhooks)
CREATE TABLE IF NOT EXISTS iugu_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evento_tipo VARCHAR(100) NOT NULL,
    recurso_id VARCHAR(255),
    iugu_id VARCHAR(255),
    payload JSONB NOT NULL,
    processado BOOLEAN DEFAULT FALSE,
    data_recebimento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_processamento TIMESTAMP WITH TIME ZONE,
    erro TEXT,
    tentativas INTEGER DEFAULT 0
);

-- ============================================================================
-- 3. CRIAR TABELA PARA CLIENTES IUGU
-- ============================================================================

-- Tabela para sincronização de clientes com a Iugu
CREATE TABLE IF NOT EXISTS iugu_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    iugu_customer_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20),
    telefone VARCHAR(20),
    notas TEXT,
    variaveis_customizadas JSONB,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. CRIAR TABELA PARA PLANOS IUGU
-- ============================================================================

-- Tabela para sincronização de planos com a Iugu
CREATE TABLE IF NOT EXISTS iugu_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    iugu_plan_id VARCHAR(255) NOT NULL UNIQUE,
    identificador VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    intervalo VARCHAR(20) NOT NULL CHECK (intervalo IN ('weekly', 'monthly', 'annually')),
    tipo_intervalo INTEGER DEFAULT 1,
    valor_centavos INTEGER NOT NULL,
    moeda VARCHAR(10) DEFAULT 'BRL',
    recursos TEXT[],
    metadata JSONB,
    ativo BOOLEAN DEFAULT TRUE,
    sincronizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. CRIAR TABELA PARA FATURAS IUGU
-- ============================================================================

-- Tabela para sincronização de faturas com a Iugu
CREATE TABLE IF NOT EXISTS iugu_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    assinatura_id UUID REFERENCES assinaturas(id) ON DELETE SET NULL,
    iugu_invoice_id VARCHAR(255) NOT NULL UNIQUE,
    iugu_subscription_id VARCHAR(255),
    iugu_customer_id VARCHAR(255),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'paid', 'canceled', 'expired', 'refunded')),
    valor_centavos INTEGER NOT NULL,
    valor_pago_centavos INTEGER DEFAULT 0,
    moeda VARCHAR(10) DEFAULT 'BRL',
    data_vencimento TIMESTAMP WITH TIME ZONE,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    url_fatura VARCHAR(500),
    url_pdf VARCHAR(500),
    metodo_pagamento VARCHAR(50),
    pix_qrcode TEXT,
    pix_qrcode_text TEXT,
    boleto_linha_digitavel VARCHAR(500),
    boleto_codigo_barras VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. ADICIONAR CONFIGURAÇÕES DA IUGU NO SISTEMA
-- ============================================================================

-- Inserir configurações da Iugu na tabela configuracoes_sistema
INSERT INTO configuracoes_sistema (chave, valor, tipo, categoria, descricao, sensivel, ambiente) VALUES
-- Configurações de API
('iugu_api_key_test', '', 'string', 'iugu', 'API Key de teste da Iugu', true, 'test'),
('iugu_api_key_prod', '', 'string', 'iugu', 'API Key de produção da Iugu', true, 'production'),
('iugu_account_id_test', '', 'string', 'iugu', 'Account ID de teste da Iugu', false, 'test'),
('iugu_account_id_prod', '', 'string', 'iugu', 'Account ID de produção da Iugu', false, 'production'),
('iugu_environment', 'sandbox', 'string', 'iugu', 'Ambiente ativo da Iugu (sandbox/production)', false, 'production'),

-- Configurações de Webhook
('iugu_webhook_url', '', 'string', 'iugu', 'URL do webhook da Iugu', false, 'production'),
('iugu_webhook_token', '', 'string', 'iugu', 'Token de segurança do webhook da Iugu', true, 'production'),

-- Configurações de Funcionalidades
('iugu_enabled', 'false', 'boolean', 'iugu', 'Habilitar integração com Iugu', false, 'production'),
('iugu_auto_create_customers', 'true', 'boolean', 'iugu', 'Criar clientes automaticamente na Iugu', false, 'production'),
('iugu_auto_suspend_overdue', 'false', 'boolean', 'iugu', 'Suspender automaticamente assinaturas em atraso', false, 'production'),
('iugu_overdue_days_limit', '7', 'number', 'iugu', 'Dias para suspensão automática por atraso', false, 'production'),
('iugu_test_mode', 'true', 'boolean', 'iugu', 'Modo de teste para dashboard', false, 'production'),

-- Configurações de Moeda
('iugu_default_currency', 'BRL', 'string', 'iugu', 'Moeda padrão da Iugu', false, 'production'),

-- Configurações de Notificação
('iugu_notification_emails', '[]', 'json', 'iugu', 'E-mails para notificações da Iugu', false, 'production')

ON CONFLICT (chave) DO NOTHING;

-- ============================================================================
-- 7. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices na tabela assinaturas (novos)
CREATE INDEX IF NOT EXISTS idx_assinaturas_iugu_subscription_id ON assinaturas(iugu_subscription_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_iugu_customer_id ON assinaturas(iugu_customer_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_gateway ON assinaturas(gateway);

-- Índices na tabela iugu_webhooks
CREATE INDEX IF NOT EXISTS idx_iugu_webhooks_evento_tipo ON iugu_webhooks(evento_tipo);
CREATE INDEX IF NOT EXISTS idx_iugu_webhooks_processado ON iugu_webhooks(processado);
CREATE INDEX IF NOT EXISTS idx_iugu_webhooks_recurso_id ON iugu_webhooks(recurso_id);
CREATE INDEX IF NOT EXISTS idx_iugu_webhooks_data_recebimento ON iugu_webhooks(data_recebimento);

-- Índices na tabela iugu_customers
CREATE INDEX IF NOT EXISTS idx_iugu_customers_empresa_id ON iugu_customers(empresa_id);
CREATE INDEX IF NOT EXISTS idx_iugu_customers_iugu_id ON iugu_customers(iugu_customer_id);
CREATE INDEX IF NOT EXISTS idx_iugu_customers_email ON iugu_customers(email);

-- Índices na tabela iugu_plans
CREATE INDEX IF NOT EXISTS idx_iugu_plans_iugu_id ON iugu_plans(iugu_plan_id);
CREATE INDEX IF NOT EXISTS idx_iugu_plans_identificador ON iugu_plans(identificador);
CREATE INDEX IF NOT EXISTS idx_iugu_plans_ativo ON iugu_plans(ativo);

-- Índices na tabela iugu_invoices
CREATE INDEX IF NOT EXISTS idx_iugu_invoices_empresa_id ON iugu_invoices(empresa_id);
CREATE INDEX IF NOT EXISTS idx_iugu_invoices_assinatura_id ON iugu_invoices(assinatura_id);
CREATE INDEX IF NOT EXISTS idx_iugu_invoices_iugu_id ON iugu_invoices(iugu_invoice_id);
CREATE INDEX IF NOT EXISTS idx_iugu_invoices_status ON iugu_invoices(status);
CREATE INDEX IF NOT EXISTS idx_iugu_invoices_data_vencimento ON iugu_invoices(data_vencimento);

-- ============================================================================
-- 8. TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER trigger_iugu_customers_updated_at
    BEFORE UPDATE ON iugu_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_iugu_plans_updated_at
    BEFORE UPDATE ON iugu_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_iugu_invoices_updated_at
    BEFORE UPDATE ON iugu_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. POLÍTICAS DE RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE iugu_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE iugu_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE iugu_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE iugu_invoices ENABLE ROW LEVEL SECURITY;

-- Políticas para iugu_customers
CREATE POLICY "Usuarios podem ver clientes de suas empresas" ON iugu_customers
    FOR ALL USING (
        empresa_id IN (
            SELECT ur.empresa_id FROM user_roles ur 
            WHERE ur.user_id = auth.uid()
        )
    );

-- Políticas para iugu_invoices
CREATE POLICY "Usuarios podem ver faturas de suas empresas" ON iugu_invoices
    FOR ALL USING (
        empresa_id IN (
            SELECT ur.empresa_id FROM user_roles ur 
            WHERE ur.user_id = auth.uid()
        )
    );

-- Políticas para iugu_plans (todos podem ver)
CREATE POLICY "Todos podem ver planos Iugu" ON iugu_plans
    FOR SELECT USING (true);

-- Políticas para iugu_webhooks (apenas super admins)
CREATE POLICY "Apenas super admins podem acessar webhooks Iugu" ON iugu_webhooks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'super_admin'
        )
    );

-- ============================================================================
-- 10. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE iugu_webhooks IS 'Logs de webhooks recebidos da Iugu';
COMMENT ON TABLE iugu_customers IS 'Sincronização de clientes com a Iugu';
COMMENT ON TABLE iugu_plans IS 'Sincronização de planos com a Iugu';
COMMENT ON TABLE iugu_invoices IS 'Sincronização de faturas com a Iugu';

COMMENT ON COLUMN assinaturas.iugu_subscription_id IS 'ID da assinatura na Iugu';
COMMENT ON COLUMN assinaturas.iugu_customer_id IS 'ID do cliente na Iugu';
COMMENT ON COLUMN assinaturas.iugu_plan_id IS 'ID do plano na Iugu';
COMMENT ON COLUMN assinaturas.gateway IS 'Gateway de pagamento usado (mercadopago ou iugu)';

-- ============================================================================
-- 11. FUNÇÃO PARA MIGRAR ASSINATURAS EXISTENTES
-- ============================================================================

-- Função para migrar assinaturas existentes para incluir o gateway
UPDATE assinaturas 
SET gateway = 'mercadopago' 
WHERE gateway IS NULL;

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================

-- Log da migração
DO $$
BEGIN
    RAISE NOTICE 'Migração Iugu aplicada com sucesso!';
    RAISE NOTICE 'Tabelas criadas: iugu_webhooks, iugu_customers, iugu_plans, iugu_invoices';
    RAISE NOTICE 'Colunas adicionadas na tabela assinaturas: iugu_subscription_id, iugu_customer_id, iugu_plan_id, gateway, ambiente';
    RAISE NOTICE '% configurações da Iugu adicionadas', (SELECT COUNT(*) FROM configuracoes_sistema WHERE categoria = 'iugu');
END$$; 