-- =====================================================
-- FIX CRÍTICO: VAZAMENTO DE DADOS ENTRE EMPRESAS
-- Criar políticas RLS para tabelas cidades e turnos
-- =====================================================

-- PROBLEMA: Empresa fa6d1635-6b7a-4bd9-8b06-0b8abb33862a 
-- está vendo cidade de empresa f47ac10b-58cc-4372-a567-0e02b2c3d479

-- 1. HABILITAR RLS NA TABELA CIDADES
ALTER TABLE cidades ENABLE ROW LEVEL SECURITY;

-- 2. HABILITAR RLS NA TABELA TURNOS  
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICA RLS PARA CIDADES
-- Política: Usuários só podem ver cidades da sua empresa
CREATE POLICY "Usuarios podem ver apenas cidades da sua empresa" ON cidades
    FOR ALL
    USING (
        empresa_id = (
            SELECT empresa_id 
            FROM user_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 4. CRIAR POLÍTICA RLS PARA TURNOS
-- Política: Usuários só podem ver turnos da sua empresa
CREATE POLICY "Usuarios podem ver apenas turnos da sua empresa" ON turnos
    FOR ALL
    USING (
        empresa_id = (
            SELECT empresa_id 
            FROM user_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 5. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
SELECT 
    'POLITICAS_CRIADAS' as verificacao,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('cidades', 'turnos')
ORDER BY tablename, policyname;

-- 6. VERIFICAR SE RLS ESTÁ HABILITADO
SELECT 
    'RLS_STATUS' as verificacao,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename IN ('cidades', 'turnos')
  AND schemaname = 'public';

-- 7. TESTE DE ISOLAMENTO - VERIFICAR DADOS VISÍVEIS AGORA
-- Esta query deve retornar apenas dados da empresa do usuário logado
SELECT 
    'TESTE_ISOLAMENTO_CIDADES' as verificacao,
    COUNT(*) as total_cidades_visiveis,
    array_agg(DISTINCT empresa_id) as empresas_visiveis
FROM cidades;

SELECT 
    'TESTE_ISOLAMENTO_TURNOS' as verificacao,
    COUNT(*) as total_turnos_visiveis,
    array_agg(DISTINCT empresa_id) as empresas_visiveis
FROM turnos;

-- 8. AUDITORIA - LISTAR TODAS AS CIDADES E SUAS EMPRESAS
-- (Apenas para verificação - remover em produção)
SELECT 
    'AUDITORIA_CIDADES' as tipo,
    c.id,
    c.nome as cidade,
    c.empresa_id,
    e.nome as empresa_nome
FROM cidades c
LEFT JOIN empresas e ON c.empresa_id = e.id
ORDER BY c.empresa_id, c.nome;

-- 9. COMMIT DAS MUDANÇAS
COMMIT;

-- =====================================================
-- INSTRUÇÕES PÓS-EXECUÇÃO:
-- 1. Testar login com cada empresa
-- 2. Verificar se cada empresa vê apenas suas cidades/turnos
-- 3. Confirmar que Campo Grande não aparece mais para empresa fa6d1635...
-- =====================================================