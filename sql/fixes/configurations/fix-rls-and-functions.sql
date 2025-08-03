-- =========================================
-- CORREÇÃO FINAL - RLS E FUNÇÕES
-- =========================================

-- 1. REMOVER TODAS AS POLÍTICAS CONFLITANTES E CRIAR POLÍTICAS SIMPLES

-- Empresas - permitir super admin ver tudo
DROP POLICY IF EXISTS "Super admin bypass" ON empresas;
DROP POLICY IF EXISTS "Public read empresas" ON empresas;
DROP POLICY IF EXISTS "Admin empresa can view their empresa" ON empresas;
DROP POLICY IF EXISTS "Super admins can manage all empresas" ON empresas;

CREATE POLICY "super_admin_full_access" ON empresas
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "empresa_admin_access" ON empresas
    FOR ALL USING (
        admin_user_id = auth.uid() OR
        id IN (SELECT empresa_id FROM user_roles WHERE user_id = auth.uid())
    );

-- Entregadores - permitir super admin ver tudo
DROP POLICY IF EXISTS "Super admin bypass entregadores" ON entregadores;
DROP POLICY IF EXISTS "Public insert entregadores" ON entregadores;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio registro" ON entregadores;
DROP POLICY IF EXISTS "Entregadores podem ver seus próprios dados" ON entregadores;
DROP POLICY IF EXISTS "Entregadores podem atualizar seus próprios dados" ON entregadores;
DROP POLICY IF EXISTS "Admins podem ver todos os entregadores" ON entregadores;
DROP POLICY IF EXISTS "Admins podem atualizar qualquer entregador" ON entregadores;
DROP POLICY IF EXISTS "entregadores_empresa_isolation" ON entregadores;

CREATE POLICY "super_admin_entregadores" ON entregadores
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
    );

CREATE POLICY "entregador_own_data" ON entregadores
    FOR ALL USING (user_id = auth.uid());

-- 2. CORRIGIR A FUNÇÃO get_user_empresas (problema de tipo)
DROP FUNCTION IF EXISTS get_user_empresas();

CREATE OR REPLACE FUNCTION get_user_empresas()
RETURNS TABLE (
    id UUID,
    nome VARCHAR(255),
    cnpj VARCHAR(18),
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco TEXT,
    admin_user_id UUID,
    ativa BOOLEAN,
    max_entregadores INTEGER,
    max_agendas_mes INTEGER,
    plano_atual VARCHAR(50),
    data_expiracao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Se for super admin, retorna todas as empresas
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    ) THEN
        RETURN QUERY
        SELECT 
            e.id, e.nome, e.cnpj, e.email, e.telefone, e.endereco,
            e.admin_user_id, e.ativa, e.max_entregadores, e.max_agendas_mes,
            e.plano_atual, e.data_expiracao, e.created_at, e.updated_at
        FROM empresas e
        WHERE e.ativa = true
        ORDER BY e.nome ASC;
    ELSE
        -- Se for admin de empresa, retorna apenas suas empresas
        RETURN QUERY
        SELECT 
            e.id, e.nome, e.cnpj, e.email, e.telefone, e.endereco,
            e.admin_user_id, e.ativa, e.max_entregadores, e.max_agendas_mes,
            e.plano_atual, e.data_expiracao, e.created_at, e.updated_at
        FROM empresas e
        JOIN user_roles ur ON ur.empresa_id = e.id
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin_empresa', 'admin')
        AND e.ativa = true
        ORDER BY e.nome ASC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CRIAR EMPRESA PADRÃO PARA TESTES
INSERT INTO empresas (
    id,
    nome,
    cnpj,
    email,
    telefone,
    endereco,
    admin_user_id,
    ativa,
    max_entregadores,
    max_agendas_mes,
    plano_atual
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Empresa Teste MasterWeeb',
    '12.345.678/0001-90',
    'admin@masterweeb.com',
    '(11) 99999-9999',
    'Rua Teste, 123 - São Paulo/SP',
    '5b9db12a-62a5-4504-8eaf-6233bbec87c4',
    true,
    10,
    500,
    'profissional'
) ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    admin_user_id = EXCLUDED.admin_user_id,
    ativa = EXCLUDED.ativa;

-- 4. ASSOCIAR SUPER ADMIN À EMPRESA TESTE
INSERT INTO user_roles (
    user_id,
    role,
    empresa_id,
    ativo
) VALUES (
    '5b9db12a-62a5-4504-8eaf-6233bbec87c4',
    'admin_empresa',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    true
) ON CONFLICT (user_id, role, empresa_id) DO NOTHING;

-- 5. CRIAR VIEW PARA FACILITAR CONSULTAS
CREATE OR REPLACE VIEW view_empresas_ativas AS
SELECT 
    id, nome, cnpj, email, telefone, endereco,
    admin_user_id, ativa, max_entregadores, max_agendas_mes,
    plano_atual, data_expiracao, created_at, updated_at
FROM empresas 
WHERE ativa = true
ORDER BY nome ASC;

-- 6. GRANT PERMISSÕES
GRANT SELECT ON view_empresas_ativas TO authenticated;
GRANT SELECT ON view_empresas_ativas TO anon;

-- =========================================
-- FINALIZAÇÃO
-- =========================================
-- Correções aplicadas com sucesso!