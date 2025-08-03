-- =====================================================
-- FIX CRÍTICO: ERRO 406 - ENTREGADOR NÃO CONSEGUE VER SUA EMPRESA
-- Versão v3 - Sintaxe PostgreSQL corrigida
-- =====================================================

-- PROBLEMA: Entregador não consegue acessar empresa
-- Erro: 406 "JSON object requested, multiple (or no) rows returned"

-- 1. VERIFICAR POLÍTICAS RLS ATUAIS DA TABELA EMPRESAS
SELECT 
    'POLITICAS_EMPRESAS_ATUAIS' as verificacao,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'empresas'
ORDER BY policyname;

-- 2. VERIFICAR SE RLS ESTÁ HABILITADO EM EMPRESAS
SELECT 
    'RLS_STATUS_EMPRESAS' as verificacao,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'empresas'
  AND schemaname = 'public';

-- 3. REMOVER POLÍTICAS CONFLITANTES EXISTENTES
DROP POLICY IF EXISTS "Entregadores podem ver sua empresa" ON empresas;
DROP POLICY IF EXISTS "Usuarios podem ver apenas dados da sua empresa" ON empresas;
DROP POLICY IF EXISTS "Apenas admins podem modificar empresas" ON empresas;
DROP POLICY IF EXISTS "Entregadores e admins podem ver sua empresa" ON empresas;
DROP POLICY IF EXISTS "Admins podem modificar empresas" ON empresas;

-- 4. CRIAR POLÍTICA PARA SELECT (entregadores + admins)
CREATE POLICY "Empresa_SELECT_Policy" ON empresas
    FOR SELECT
    USING (
        -- Admins/Super Admins podem ver suas empresas via user_roles
        id = (
            SELECT empresa_id 
            FROM user_roles 
            WHERE user_id = auth.uid()
        )
        OR
        -- Entregadores podem ver dados da empresa onde trabalham
        id = (
            SELECT empresa_id 
            FROM entregadores 
            WHERE user_id = auth.uid()
        )
    );

-- 5. CRIAR POLÍTICA PARA INSERT (apenas admins)
CREATE POLICY "Empresa_INSERT_Policy" ON empresas
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
              AND ur.role IN ('admin_empresa', 'super_admin')
        )
    );

-- 6. CRIAR POLÍTICA PARA UPDATE (apenas admins)
CREATE POLICY "Empresa_UPDATE_Policy" ON empresas
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 
            FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
              AND ur.role IN ('admin_empresa', 'super_admin')
              AND ur.empresa_id = empresas.id
        )
    );

-- 7. CRIAR POLÍTICA PARA DELETE (apenas super admins)
CREATE POLICY "Empresa_DELETE_Policy" ON empresas
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 
            FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
              AND ur.role = 'super_admin'
        )
    );

-- 8. VERIFICAR POLÍTICAS CRIADAS
SELECT 
    'POLITICAS_EMPRESAS_CORRIGIDAS' as verificacao,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'empresas'
ORDER BY policyname;

-- 9. TESTE CONSULTA ESPECÍFICA DO PROBLEMA
-- Esta query deve retornar dados da empresa para o entregador
SELECT 
    'TESTE_CONSULTA_EMPRESA' as verificacao,
    COUNT(*) as total_empresas_encontradas
FROM empresas 
WHERE id = 'fa6d1635-6b7a-4bd9-8b06-0b8abb33862a';

-- 10. VERIFICAR DADOS DO ENTREGADOR
SELECT 
    'DADOS_ENTREGADOR' as verificacao,
    e.nome as entregador_nome,
    e.empresa_id,
    e.user_id,
    emp.nome as empresa_nome
FROM entregadores e
LEFT JOIN empresas emp ON e.empresa_id = emp.id
WHERE e.user_id = 'dd8ff9ec-fb37-44be-9b45-4e45b8cf3eff';

-- 11. COMMIT DAS MUDANÇAS
COMMIT;

-- =====================================================
-- INSTRUÇÕES PÓS-EXECUÇÃO:
-- 1. Testar login do entregador jao@gmail.com
-- 2. Verificar se erro 406 foi resolvido
-- 3. Confirmar que sistema funciona sem erros
-- =====================================================