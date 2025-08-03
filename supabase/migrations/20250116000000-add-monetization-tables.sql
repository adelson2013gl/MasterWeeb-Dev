-- Migração para implementar sistema de monetização
-- Criação das tabelas: assinaturas, transacoes, mercadopago_webhooks

-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  mercadopago_subscription_id TEXT UNIQUE,
  plano TEXT NOT NULL CHECK (plano IN ('basico', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'cancelled', 'expired')),
  valor_mensal DECIMAL(10,2) NOT NULL,
  data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_fim TIMESTAMP WITH TIME ZONE,
  data_proximo_pagamento TIMESTAMP WITH TIME ZONE,
  tentativas_cobranca INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assinatura_id UUID NOT NULL REFERENCES assinaturas(id) ON DELETE CASCADE,
  mercadopago_payment_id TEXT UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('subscription', 'upgrade', 'downgrade', 'refund')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),
  valor DECIMAL(10,2) NOT NULL,
  moeda TEXT DEFAULT 'BRL',
  metodo_pagamento TEXT,
  data_processamento TIMESTAMP WITH TIME ZONE,
  data_vencimento TIMESTAMP WITH TIME ZONE,
  descricao TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de webhooks do Mercado Pago
CREATE TABLE IF NOT EXISTS mercadopago_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id TEXT,
  tipo TEXT NOT NULL,
  acao TEXT NOT NULL,
  data_criacao TIMESTAMP WITH TIME ZONE,
  live_mode BOOLEAN DEFAULT FALSE,
  user_id TEXT,
  api_version TEXT,
  payload JSONB NOT NULL,
  processado BOOLEAN DEFAULT FALSE,
  erro TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_assinaturas_empresa_id ON assinaturas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);
CREATE INDEX IF NOT EXISTS idx_assinaturas_mercadopago_id ON assinaturas(mercadopago_subscription_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_assinatura_id ON transacoes(assinatura_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_mercadopago_id ON transacoes(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_processado ON mercadopago_webhooks(processado);
CREATE INDEX IF NOT EXISTS idx_webhooks_tipo ON mercadopago_webhooks(tipo);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assinaturas_updated_at BEFORE UPDATE ON assinaturas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transacoes_updated_at BEFORE UPDATE ON transacoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mercadopago_webhooks_updated_at BEFORE UPDATE ON mercadopago_webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercadopago_webhooks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para assinaturas
CREATE POLICY "Empresas podem ver suas próprias assinaturas" ON assinaturas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM empresas e
            WHERE e.id = assinaturas.empresa_id
            AND (
                -- Admin da empresa
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.empresa_id = e.id
                    AND p.role = 'admin'
                )
                OR
                -- Super admin
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role = 'super_admin'
                )
            )
        )
    );

-- Políticas RLS para transações
CREATE POLICY "Empresas podem ver suas próprias transações" ON transacoes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assinaturas a
            JOIN empresas e ON e.id = a.empresa_id
            WHERE a.id = transacoes.assinatura_id
            AND (
                -- Admin da empresa
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.empresa_id = e.id
                    AND p.role = 'admin'
                )
                OR
                -- Super admin
                EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role = 'super_admin'
                )
            )
        )
    );

-- Políticas RLS para webhooks (apenas super admins)
CREATE POLICY "Apenas super admins podem ver webhooks" ON mercadopago_webhooks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'super_admin'
        )
    );

-- Função para atualizar limites da empresa baseado no plano
CREATE OR REPLACE FUNCTION atualizar_limites_empresa()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar limites baseado no plano da assinatura ativa
    IF NEW.status = 'active' THEN
        UPDATE empresas SET
            max_entregadores = CASE NEW.plano
                WHEN 'basico' THEN 5
                WHEN 'pro' THEN 20
                WHEN 'enterprise' THEN 100
                ELSE 5
            END,
            max_agendas_mes = CASE NEW.plano
                WHEN 'basico' THEN 100
                WHEN 'pro' THEN 500
                WHEN 'enterprise' THEN 2000
                ELSE 100
            END,
            plano = NEW.plano,
            data_vencimento = NEW.data_proximo_pagamento
        WHERE id = NEW.empresa_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar limites automaticamente
CREATE TRIGGER trigger_atualizar_limites_empresa
    AFTER INSERT OR UPDATE ON assinaturas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_limites_empresa();

-- Comentários nas tabelas
COMMENT ON TABLE assinaturas IS 'Tabela para gerenciar assinaturas das empresas';
COMMENT ON TABLE transacoes IS 'Tabela para histórico de transações de pagamento';
COMMENT ON TABLE mercadopago_webhooks IS 'Tabela para logs de webhooks do Mercado Pago';