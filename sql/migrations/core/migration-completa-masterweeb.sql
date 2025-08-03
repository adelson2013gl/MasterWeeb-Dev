-- =========================================
-- MIGRAÇÃO COMPLETA PARA MASTERWEEB
-- =========================================
-- Este arquivo cria toda a estrutura necessária do zero

-- 1. ENABLE NECESSARY EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CRIAR TIPOS ENUMERADOS (ENUMs)
DO $$ BEGIN
    CREATE TYPE status_entregador AS ENUM ('pendente', 'aprovado', 'suspenso', 'inativo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE perfil_usuario AS ENUM ('entregador', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA DE CIDADES
CREATE TABLE IF NOT EXISTS cidades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE REGIÕES
CREATE TABLE IF NOT EXISTS regioes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cidade_id UUID NOT NULL REFERENCES cidades(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE TURNOS
CREATE TABLE IF NOT EXISTS turnos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE EMPRESAS
CREATE TABLE IF NOT EXISTS empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco TEXT,
    admin_user_id UUID,
    ativa BOOLEAN DEFAULT TRUE,
    max_entregadores INTEGER DEFAULT 5,
    max_agendas_mes INTEGER DEFAULT 100,
    plano_atual VARCHAR(50) DEFAULT 'basico',
    data_expiracao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE ROLES/FUNÇÕES
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin_empresa', 'admin', 'entregador')),
    empresa_id UUID REFERENCES empresas(id),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role, empresa_id)
);

-- 8. TABELA DE ENTREGADORES
CREATE TABLE IF NOT EXISTS entregadores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    telefone VARCHAR(20),
    cidade_id UUID REFERENCES cidades(id),
    veiculo VARCHAR(100),
    placa VARCHAR(10),
    perfil perfil_usuario DEFAULT 'entregador',
    status status_entregador DEFAULT 'pendente',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABELA DE AGENDAS
CREATE TABLE IF NOT EXISTS agendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    regiao_id UUID REFERENCES regioes(id),
    turno_id UUID REFERENCES turnos(id),
    data_agenda DATE NOT NULL,
    vagas_total INTEGER NOT NULL DEFAULT 10,
    vagas_ocupadas INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TABELA DE CONFIGURAÇÕES DA EMPRESA
CREATE TABLE IF NOT EXISTS configuracoes_empresa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    chave VARCHAR(255) NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo VARCHAR(50) DEFAULT 'string',
    editavel BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(empresa_id, chave)
);

-- 11. TABELA DE ADMIN TEMPORÁRIO
CREATE TABLE IF NOT EXISTS empresa_admin_temp (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    senha_temporaria VARCHAR(255) NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. TABELA DE AGENDAMENTOS
CREATE TABLE IF NOT EXISTS agendamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    entregador_id UUID REFERENCES entregadores(id),
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_telefone VARCHAR(20),
    endereco_coleta TEXT NOT NULL,
    endereco_entrega TEXT NOT NULL,
    data_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
    observacoes TEXT,
    valor DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. TABELA DE ASSINATURAS
CREATE TABLE IF NOT EXISTS assinaturas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    plano VARCHAR(50) NOT NULL CHECK (plano IN ('basico', 'profissional', 'empresarial')),
    status VARCHAR(20) NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'cancelada', 'suspensa', 'pendente')),
    valor_mensal DECIMAL(10,2) NOT NULL,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    data_fim TIMESTAMP WITH TIME ZONE,
    mercadopago_subscription_id VARCHAR(255),
    abacatepay_bill_id TEXT,
    gateway_type TEXT DEFAULT 'abacatepay',
    limite_entregadores INTEGER,
    limite_agendamentos_mes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. TABELA DE TRANSAÇÕES
CREATE TABLE IF NOT EXISTS transacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assinatura_id UUID REFERENCES assinaturas(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES empresas(id),
    mercadopago_payment_id VARCHAR(255),
    abacatepay_bill_id TEXT,
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'cancelado')),
    metodo_pagamento VARCHAR(50) DEFAULT 'PIX',
    data_vencimento TIMESTAMP WITH TIME ZONE,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. TABELAS DE IUGU
CREATE TABLE IF NOT EXISTS iugu_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    iugu_customer_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iugu_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    iugu_plan_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    price_cents INTEGER NOT NULL,
    interval VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iugu_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    iugu_invoice_id VARCHAR(255) UNIQUE NOT NULL,
    iugu_customer_id VARCHAR(255) REFERENCES iugu_customers(iugu_customer_id),
    status VARCHAR(50),
    total_cents INTEGER,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iugu_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. TABELA DE WEBHOOKS ASAAS
CREATE TABLE IF NOT EXISTS asaas_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. TABELAS DE VALIDAÇÃO DE TRANSFERÊNCIA
CREATE TABLE IF NOT EXISTS transfer_validations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    validation_key VARCHAR(255) UNIQUE NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transfer_validation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    validation_key VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABELA DE WEBHOOKS MERCADO PAGO
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

-- 10. TABELA DE WEBHOOKS ABACATEPAY
CREATE TABLE IF NOT EXISTS abacatepay_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evento TEXT NOT NULL,
    bill_id TEXT NOT NULL,
    empresa_id UUID REFERENCES empresas(id),
    payload JSONB NOT NULL,
    processado BOOLEAN DEFAULT FALSE,
    erro TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TABELA DE CONFIGURAÇÕES DO SISTEMA
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chave VARCHAR(255) UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    tipo VARCHAR(50) DEFAULT 'string',
    categoria VARCHAR(100),
    editavel BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- ÍNDICES PARA PERFORMANCE
-- =========================================

-- Empresas
CREATE INDEX IF NOT EXISTS idx_empresas_admin_user_id ON empresas(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_empresas_ativa ON empresas(ativa);

-- User Roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_empresa_id ON user_roles(empresa_id);

-- Entregadores
CREATE INDEX IF NOT EXISTS idx_entregadores_empresa_id ON entregadores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_entregadores_ativo ON entregadores(ativo);

-- Agendamentos
CREATE INDEX IF NOT EXISTS idx_agendamentos_empresa_id ON agendamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_entregador_id ON agendamentos(entregador_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_agendamento);

-- Assinaturas
CREATE INDEX IF NOT EXISTS idx_assinaturas_empresa_id ON assinaturas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);
CREATE INDEX IF NOT EXISTS idx_assinaturas_mercadopago_id ON assinaturas(mercadopago_subscription_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_abacatepay_bill_id ON assinaturas(abacatepay_bill_id);

-- Transações
CREATE INDEX IF NOT EXISTS idx_transacoes_assinatura_id ON transacoes(assinatura_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_mercadopago_id ON transacoes(mercadopago_payment_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_abacatepay_bill_id ON transacoes(abacatepay_bill_id);

-- Webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_processado ON mercadopago_webhooks(processado);
CREATE INDEX IF NOT EXISTS idx_webhooks_evento_tipo ON mercadopago_webhooks(evento_tipo);
CREATE INDEX IF NOT EXISTS idx_abacatepay_webhooks_bill_id ON abacatepay_webhooks(bill_id);
CREATE INDEX IF NOT EXISTS idx_abacatepay_webhooks_empresa_id ON abacatepay_webhooks(empresa_id);
CREATE INDEX IF NOT EXISTS idx_abacatepay_webhooks_evento ON abacatepay_webhooks(evento);

-- =========================================
-- FUNÇÕES AUXILIARES
-- =========================================

-- Função para verificar se é super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é admin (geral)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('super_admin', 'admin_empresa', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é admin de uma empresa específica
CREATE OR REPLACE FUNCTION is_admin_empresa_for(target_empresa_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND empresa_id = target_empresa_id
        AND role IN ('admin_empresa', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter empresa ID do usuário atual
CREATE OR REPLACE FUNCTION get_current_empresa_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT ur.empresa_id 
        FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin_empresa', 'admin')
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter entregador ID do usuário atual
CREATE OR REPLACE FUNCTION get_current_entregador_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT e.id 
        FROM entregadores e 
        WHERE e.user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- TRIGGERS E FUNÇÕES
-- =========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_empresas_updated_at
    BEFORE UPDATE ON empresas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_entregadores_updated_at
    BEFORE UPDATE ON entregadores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_agendamentos_updated_at
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_assinaturas_updated_at
    BEFORE UPDATE ON assinaturas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_transacoes_updated_at
    BEFORE UPDATE ON transacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para AbacatePay webhooks
CREATE OR REPLACE FUNCTION update_abacatepay_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_abacatepay_webhooks_updated_at
  BEFORE UPDATE ON abacatepay_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_abacatepay_webhooks_updated_at();

-- =========================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================

-- Habilitar RLS para todas as tabelas
ALTER TABLE cidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE regioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa_admin_temp ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercadopago_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE abacatepay_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE iugu_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE iugu_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE iugu_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE iugu_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE asaas_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_validation_logs ENABLE ROW LEVEL SECURITY;

-- =========================================
-- POLÍTICAS RLS - CIDADES
-- =========================================
CREATE POLICY "Apenas admins podem gerenciar cidades" ON cidades
    FOR ALL USING (is_admin());

CREATE POLICY "Qualquer um pode ver cidades ativas" ON cidades
    FOR SELECT USING (ativo = true);

-- =========================================
-- POLÍTICAS RLS - REGIÕES
-- =========================================
CREATE POLICY "Apenas admins podem gerenciar regiões" ON regioes
    FOR ALL USING (is_admin());

CREATE POLICY "Qualquer um pode ver regiões ativas" ON regioes
    FOR SELECT USING (ativo = true);

-- =========================================
-- POLÍTICAS RLS - TURNOS
-- =========================================
CREATE POLICY "Apenas admins podem gerenciar turnos" ON turnos
    FOR ALL USING (is_admin());

CREATE POLICY "Qualquer um pode ver turnos ativos" ON turnos
    FOR SELECT USING (ativo = true);

-- =========================================
-- POLÍTICAS RLS - EMPRESAS
-- =========================================
CREATE POLICY "Public read empresas" ON empresas
    FOR SELECT USING (true);

CREATE POLICY "Admin empresa can view their empresa" ON empresas
    FOR SELECT USING (id = get_current_empresa_id());

CREATE POLICY "Super admins can manage all empresas" ON empresas
    FOR ALL USING (is_super_admin());

-- =========================================
-- POLÍTICAS RLS - USER ROLES
-- =========================================
CREATE POLICY "Super admin can manage all roles" ON user_roles
    FOR ALL USING (is_super_admin());

CREATE POLICY "Users can view their roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

-- =========================================
-- POLÍTICAS RLS - ENTREGADORES
-- =========================================
CREATE POLICY "Public insert entregadores" ON entregadores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem inserir seu próprio registro" ON entregadores
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Entregadores podem ver seus próprios dados" ON entregadores
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Entregadores podem atualizar seus próprios dados" ON entregadores
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins podem ver todos os entregadores" ON entregadores
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins podem atualizar qualquer entregador" ON entregadores
    FOR UPDATE USING (is_admin());

CREATE POLICY "entregadores_empresa_isolation" ON entregadores
    FOR ALL USING (empresa_id = get_current_empresa_id());

-- =========================================
-- POLÍTICAS RLS - AGENDAS
-- =========================================
CREATE POLICY "Apenas admins podem gerenciar agendas" ON agendas
    FOR ALL USING (is_admin());

CREATE POLICY "Admins podem ver todas as agendas" ON agendas
    FOR SELECT USING (is_admin());

CREATE POLICY "Entregadores podem ver agendas da sua cidade" ON agendas
    FOR SELECT USING (
        ativo = true 
        AND regiao_id IN (
            SELECT r.id FROM regioes r
            JOIN entregadores e ON e.cidade_id = r.cidade_id
            WHERE e.user_id = auth.uid()
        )
    );

CREATE POLICY "Isolamento por empresa" ON agendas
    FOR ALL USING (
        empresa_id IN (
            SELECT user_roles.empresa_id FROM user_roles 
            WHERE user_roles.user_id = auth.uid()
        )
    );

-- =========================================
-- POLÍTICAS RLS - CONFIGURAÇÕES EMPRESA
-- =========================================
CREATE POLICY "Super admin can manage all configs" ON configuracoes_empresa
    FOR ALL USING (is_super_admin()) 
    WITH CHECK (is_super_admin());

CREATE POLICY "Admin empresa can manage configs" ON configuracoes_empresa
    FOR ALL USING (is_admin_empresa_for(empresa_id))
    WITH CHECK (is_admin_empresa_for(empresa_id));

CREATE POLICY "Admins can manage empresa configs" ON configuracoes_empresa
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM entregadores 
            WHERE entregadores.user_id = auth.uid() 
            AND entregadores.empresa_id = configuracoes_empresa.empresa_id 
            AND entregadores.perfil = 'admin'
        ) OR EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.empresa_id = configuracoes_empresa.empresa_id 
            AND user_roles.role = ANY(ARRAY['admin_empresa', 'super_admin'])
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM entregadores 
            WHERE entregadores.user_id = auth.uid() 
            AND entregadores.empresa_id = configuracoes_empresa.empresa_id 
            AND entregadores.perfil = 'admin'
        ) OR EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.empresa_id = configuracoes_empresa.empresa_id 
            AND user_roles.role = ANY(ARRAY['admin_empresa', 'super_admin'])
        )
    );

CREATE POLICY "Entregadores can view their empresa configs" ON configuracoes_empresa
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM entregadores 
            WHERE entregadores.user_id = auth.uid() 
            AND entregadores.empresa_id = configuracoes_empresa.empresa_id 
            AND entregadores.status = 'aprovado'
        )
    );

-- =========================================
-- POLÍTICAS RLS - EMPRESA ADMIN TEMP
-- =========================================
CREATE POLICY "Super admins can view all temp credentials" ON empresa_admin_temp
    FOR SELECT USING (is_super_admin());

CREATE POLICY "Super admins can insert temp credentials" ON empresa_admin_temp
    FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update temp credentials" ON empresa_admin_temp
    FOR UPDATE USING (is_super_admin());

-- =========================================
-- POLÍTICAS RLS - AGENDAMENTOS
-- =========================================
CREATE POLICY "Entregadores podem ver seus próprios agendamentos" ON agendamentos
    FOR SELECT USING (entregador_id = get_current_entregador_id());

CREATE POLICY "Entregadores podem criar seus próprios agendamentos" ON agendamentos
    FOR INSERT WITH CHECK (entregador_id = get_current_entregador_id());

CREATE POLICY "Entregadores podem atualizar seus próprios agendamentos" ON agendamentos
    FOR UPDATE USING (entregador_id = get_current_entregador_id());

CREATE POLICY "Admins podem ver todos os agendamentos" ON agendamentos
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins podem gerenciar todos os agendamentos" ON agendamentos
    FOR ALL USING (is_admin());

-- =========================================
-- POLÍTICAS RLS - ASSINATURAS
-- =========================================
CREATE POLICY "Usuários autenticados podem ver assinaturas de suas empresas" ON assinaturas
    FOR ALL USING (
        auth.uid() IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM empresas e 
            WHERE e.id = assinaturas.empresa_id
        )
    );

CREATE POLICY "Usuários podem ver suas assinaturas com Asaas" ON assinaturas
    FOR SELECT USING (
        auth.uid() IN (
            SELECT entregadores.user_id FROM entregadores 
            WHERE entregadores.empresa_id = assinaturas.empresa_id
        )
    );

-- =========================================
-- POLÍTICAS RLS - TRANSAÇÕES
-- =========================================
CREATE POLICY "Usuários podem ver transações de sua empresa" ON transacoes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'super_admin'
        ) OR EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.empresa_id = transacoes.empresa_id 
            AND ur.role = 'admin_empresa'
        ) OR assinatura_id IN (
            SELECT a.id FROM assinaturas a
            JOIN user_roles ur ON ur.empresa_id = a.empresa_id
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin_empresa'
        )
    );

-- Políticas específicas para PIX
CREATE POLICY "super_admin_transacoes_policy" ON transacoes
    FOR ALL USING (auth.uid() = '68ddaede-dd50-4388-9025-edc83666d88f'::uuid);

CREATE POLICY "inserir_pix_policy" ON transacoes
    FOR INSERT WITH CHECK (
        auth.uid() = '68ddaede-dd50-4388-9025-edc83666d88f'::uuid 
        OR (
            metodo_pagamento = 'pix' 
            AND EXISTS (
                SELECT 1 FROM entregadores e 
                WHERE e.user_id = auth.uid() 
                AND e.perfil = 'admin'
            )
        )
    );

CREATE POLICY "atualizar_pix_policy" ON transacoes
    FOR UPDATE USING (
        auth.uid() = '68ddaede-dd50-4388-9025-edc83666d88f'::uuid 
        OR (
            metodo_pagamento = 'pix' 
            AND EXISTS (
                SELECT 1 FROM entregadores e 
                WHERE e.user_id = auth.uid() 
                AND e.perfil = 'admin'
            )
        )
    );

CREATE POLICY "visualizar_transacoes_policy" ON transacoes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assinaturas a
            JOIN empresas e ON e.id = a.empresa_id
            JOIN entregadores ent ON ent.empresa_id = e.id
            WHERE a.id = transacoes.assinatura_id 
            AND ent.user_id = auth.uid()
        ) OR auth.uid() = '68ddaede-dd50-4388-9025-edc83666d88f'::uuid
    );

-- =========================================
-- POLÍTICAS RLS - WEBHOOKS
-- =========================================
CREATE POLICY "Usuários autenticados podem ver webhooks" ON mercadopago_webhooks
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Webhooks viewable by super admins" ON abacatepay_webhooks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

CREATE POLICY "System can insert webhooks" ON abacatepay_webhooks
    FOR INSERT WITH CHECK (true);

-- =========================================
-- POLÍTICAS RLS - CONFIGURAÇÕES SISTEMA
-- =========================================
CREATE POLICY "Public read configuracoes" ON configuracoes_sistema
    FOR SELECT USING (true);

CREATE POLICY "configuracoes_sistema_read" ON configuracoes_sistema
    FOR SELECT USING (true);

CREATE POLICY "configuracoes_sistema_write" ON configuracoes_sistema
    FOR ALL USING (
        COALESCE(auth.jwt() -> 'user_metadata' ->> 'tipo_usuario', '') = 'super_admin'
    ) WITH CHECK (
        COALESCE(auth.jwt() -> 'user_metadata' ->> 'tipo_usuario', '') = 'super_admin'
    );

-- =========================================
-- POLÍTICAS RLS - IUGU
-- =========================================
CREATE POLICY "Todos podem ver planos Iugu" ON iugu_plans
    FOR SELECT USING (true);

CREATE POLICY "Usuarios podem ver clientes de suas empresas" ON iugu_customers
    FOR ALL USING (
        empresa_id IN (
            SELECT ur.empresa_id FROM user_roles ur 
            WHERE ur.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios podem ver faturas de suas empresas" ON iugu_invoices
    FOR ALL USING (
        empresa_id IN (
            SELECT ur.empresa_id FROM user_roles ur 
            WHERE ur.user_id = auth.uid()
        )
    );

CREATE POLICY "Apenas super admins podem acessar webhooks Iugu" ON iugu_webhooks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'super_admin'
        )
    );

-- =========================================
-- POLÍTICAS RLS - ASAAS E TRANSFER VALIDATION
-- =========================================
CREATE POLICY "Service role pode gerenciar webhooks" ON asaas_webhooks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access validations" ON transfer_validations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access logs" ON transfer_validation_logs
    FOR ALL USING (auth.role() = 'service_role');

-- =========================================
-- DADOS INICIAIS
-- =========================================

-- Inserir configurações básicas do sistema
INSERT INTO configuracoes_sistema (chave, valor, descricao, categoria) VALUES
('sistema_ativo', 'true', 'Sistema está ativo', 'sistema'),
('plano_basico_preco', '29.90', 'Preço do plano básico', 'precos'),
('plano_profissional_preco', '59.90', 'Preço do plano profissional', 'precos'),
('plano_empresarial_preco', '99.90', 'Preço do plano empresarial', 'precos')
ON CONFLICT (chave) DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE empresas IS 'Tabela de empresas cadastradas no sistema';
COMMENT ON TABLE user_roles IS 'Tabela de roles/funções dos usuários';
COMMENT ON TABLE entregadores IS 'Tabela de entregadores das empresas';
COMMENT ON TABLE agendamentos IS 'Tabela de agendamentos de entregas';
COMMENT ON TABLE assinaturas IS 'Tabela para gerenciar assinaturas das empresas';
COMMENT ON TABLE transacoes IS 'Tabela para histórico de transações de pagamento';
COMMENT ON TABLE mercadopago_webhooks IS 'Tabela para logs de webhooks do Mercado Pago';
COMMENT ON TABLE abacatepay_webhooks IS 'Log de webhooks recebidos do AbacatePay';
COMMENT ON TABLE configuracoes_sistema IS 'Configurações globais do sistema';

-- =========================================
-- FINALIZAÇÃO
-- =========================================
-- Migração completa aplicada com sucesso!