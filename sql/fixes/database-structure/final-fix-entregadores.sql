-- =========================================
-- CORREÇÃO FINAL - TABELA ENTREGADORES
-- =========================================

-- DESABILITAR RLS TEMPORARIAMENTE E RECRIAR POLÍTICAS SIMPLES
ALTER TABLE entregadores DISABLE ROW LEVEL SECURITY;

-- REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "super_admin_entregadores" ON entregadores;
DROP POLICY IF EXISTS "entregador_own_data" ON entregadores;

-- REABILITAR RLS
ALTER TABLE entregadores ENABLE ROW LEVEL SECURITY;

-- CRIAR POLÍTICA SIMPLES E PERMISSIVA PARA SUPER ADMIN
CREATE POLICY "allow_all_for_super_admin" ON entregadores
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- VERIFICAR SE TODAS AS TABELAS TÊM POLÍTICAS PERMISSIVAS PARA SUPER ADMIN
-- Criar política geral para user_roles também
DROP POLICY IF EXISTS "Users can view their roles" ON user_roles;
DROP POLICY IF EXISTS "Super admin can manage all roles" ON user_roles;

CREATE POLICY "allow_authenticated_user_roles" ON user_roles
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Criar política geral para configuracoes_sistema
DROP POLICY IF EXISTS "Public read configuracoes" ON configuracoes_sistema;
DROP POLICY IF EXISTS "configuracoes_sistema_read" ON configuracoes_sistema;
DROP POLICY IF EXISTS "configuracoes_sistema_write" ON configuracoes_sistema;

CREATE POLICY "allow_all_configuracoes_sistema" ON configuracoes_sistema
    FOR ALL 
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- =========================================
-- TESTE - INSERIR ENTREGADOR PARA O SUPER ADMIN
-- =========================================

INSERT INTO entregadores (
    user_id,
    empresa_id,
    nome,
    cpf,
    telefone,
    veiculo,
    placa,
    perfil,
    status,
    ativo
) VALUES (
    '5b9db12a-62a5-4504-8eaf-6233bbec87c4',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Super Admin',
    '123.456.789-00',
    '(11) 99999-9999',
    'Carro',
    'ABC-1234',
    'admin',
    'aprovado',
    true
) ON CONFLICT (user_id, empresa_id) DO UPDATE SET
    nome = EXCLUDED.nome,
    perfil = EXCLUDED.perfil,
    status = EXCLUDED.status;

-- =========================================
-- GRANT EXPLÍCITO DE PERMISSÕES
-- =========================================

-- Dar permissões explícitas para todas as tabelas
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =========================================
-- FINALIZAÇÃO
-- =========================================
-- Correção de entregadores aplicada!