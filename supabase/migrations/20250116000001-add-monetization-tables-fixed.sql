-- Migração para implementar sistema de monetização (versão corrigida)
-- Criação das tabelas: assinaturas, transacoes, mercadopago_webhooks
-- Versão sem dependência da tabela profiles

-- Tabela de assinaturas das empresas
CREATE TABLE IF NOT EXISTS assinaturas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    plano VARCHAR(50) NOT NULL CHECK (plano IN ('basico', 'profissional', 'empresarial')),
    status VARCHAR(20) NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'cancelada', 'suspensa', 'pendente')),
    valor_mensal DECIMAL(10,2) NOT NULL,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    data_fim TIMESTAMP WITH TIME ZONE,
    mercadopago_subscription_id VARCHAR(255),
    limite_entregadores INTEGER,
    limite_agendamentos_mes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações/pagamentos
CREATE TABLE IF NOT EXISTS transacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assinatura_id UUID NOT NULL REFERENCES assinaturas(id) ON DELETE CASCADE,
    mercadopago_payment_id VARCHAR(255),
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'cancelado')),
    metodo_pagamento VARCHAR(50),
    data_vencimento TIMESTAMP WITH TIME ZONE,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para logs de webhooks do Mercado Pago
CREATE TABLE IF NOT EXISTS mercadopago_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evento_tipo VARCHAR(100) NOT NULL,
    recurso_id VARCHAR(255),
    payload JSONB NOT NULL,
    processado BOOLEAN DEFAULT FALSE,
    data_recebimento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_processamento TIMESTAMP WITH TIME ZONE,
    erro TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_assinaturas_empresa_id ON assinaturas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);
CREATE INDEX IF NOT EXISTS idx_assinaturas_mercadopago_id ON assinaturas(mercadopago_subscription_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_assinatura_id ON transacoes(assinatura_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_mercadopago_id ON transacoes(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_processado ON mercadopago_webhooks(processado);
CREATE INDEX IF NOT EXISTS idx_webhooks_evento_tipo ON mercadopago_webhooks(evento_tipo);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assinaturas_updated_at
    BEFORE UPDATE ON assinaturas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_transacoes_updated_at
    BEFORE UPDATE ON transacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas de RLS (Row Level Security)
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercadopago_webhooks ENABLE ROW LEVEL SECURITY;

-- Política para assinaturas: usuários podem ver apenas assinaturas de suas empresas
CREATE POLICY "Usuários podem ver assinaturas de suas empresas" ON assinaturas
    FOR SELECT USING (
        empresa_id IN (
            SELECT e.id FROM empresas e 
            WHERE e.admin_user_id = auth.uid()
        )
    );

-- Política para permitir que admins de empresa atualizem suas assinaturas (exceto limites personalizados)
CREATE POLICY "Admins podem atualizar suas assinaturas" ON assinaturas
    FOR UPDATE USING (
        empresa_id IN (
            SELECT e.id FROM empresas e 
            WHERE e.admin_user_id = auth.uid()
        )
    );

-- Política para super admins: acesso total a todas as assinaturas
CREATE POLICY "Super admins podem gerenciar todas as assinaturas" ON assinaturas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'super_admin'
        )
    );

-- Política específica para limites personalizados: apenas super admins
CREATE POLICY "Apenas super admins podem modificar limites personalizados" ON assinaturas
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'super_admin'
        )
    );

-- Política para transações: usuários podem ver apenas transações de suas assinaturas
CREATE POLICY "Usuários podem ver transações de suas assinaturas" ON transacoes
    FOR ALL USING (
        assinatura_id IN (
            SELECT a.id FROM assinaturas a
            JOIN empresas e ON e.id = a.empresa_id
            WHERE e.admin_user_id = auth.uid()
        )
    );

-- Política para webhooks: apenas super admins podem acessar
CREATE POLICY "Apenas super admins podem acessar webhooks" ON mercadopago_webhooks
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Função para atualizar limites da empresa baseado no plano
CREATE OR REPLACE FUNCTION atualizar_limites_empresa()
RETURNS TRIGGER AS $$
DECLARE
    limite_entregadores_final INTEGER;
    limite_agendamentos_final INTEGER;
BEGIN
    -- Usar limites personalizados se definidos, senão usar padrões do plano
    CASE NEW.plano
        WHEN 'basico' THEN
            limite_entregadores_final := COALESCE(NEW.limite_entregadores, 5);
            limite_agendamentos_final := COALESCE(NEW.limite_agendamentos_mes, 100);
        WHEN 'profissional' THEN
            limite_entregadores_final := COALESCE(NEW.limite_entregadores, 15);
            limite_agendamentos_final := COALESCE(NEW.limite_agendamentos_mes, 500);
        WHEN 'empresarial' THEN
            limite_entregadores_final := COALESCE(NEW.limite_entregadores, 50);
            limite_agendamentos_final := COALESCE(NEW.limite_agendamentos_mes, 2000);
        ELSE
            limite_entregadores_final := COALESCE(NEW.limite_entregadores, 5);
            limite_agendamentos_final := COALESCE(NEW.limite_agendamentos_mes, 100);
    END CASE;
    
    -- Atualizar os limites na tabela empresas
    UPDATE empresas 
    SET 
        max_entregadores = limite_entregadores_final,
        max_agendas_mes = limite_agendamentos_final,
        updated_at = NOW()
    WHERE id = NEW.empresa_id;
    
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

-- Inserir planos padrão se não existirem (sem limites personalizados)
INSERT INTO assinaturas (empresa_id, plano, valor_mensal)
SELECT 
    e.id,
    'basico',
    29.90
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM assinaturas a WHERE a.empresa_id = e.id
);