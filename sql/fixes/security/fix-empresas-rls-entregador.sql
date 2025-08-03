-- =====================================================
-- FIX CRÍTICO: ERRO 406 - ENTREGADOR NÃO CONSEGUE VER SUA EMPRESA
-- Ajustar políticas RLS da tabela empresas para entregadores
-- =====================================================

-- PROBLEMA: Entregador dd8ff9ec-fb37-44be-9b45-4e45b8cf3eff
-- não consegue acessar empresa fa6d1635-6b7a-4bd9-8b06-0b8abb33862a
-- Erro: 406 "JSON object requested, multiple (or no) rows returned"

-- 1. VERIFICAR POLÍTICAS RLS ATUAIS DA TABELA EMPRESAS
SELECT 
    'POLITICAS_EMPRESAS_ATUAIS' as verificacao,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'empresas'
ORDER BY policyname;

-- 2. VERIFICAR SE RLS ESTÁ HABILITADO EM EMPRESAS
SELECT 
    'RLS_STATUS_EMPRESAS' as verificacao,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE tablename = 'empresas'
  AND schemaname = 'public';

-- 3. TESTAR CONSULTA PROBLEMÁTICA (como entregador veria)
-- Esta query deve simular o que o entregador está tentando fazer
SELECT 
    'TESTE_CONSULTA_EMPRESA' as verificacao,
    COUNT(*) as total_empresas_visiveis,
    array_agg(id) as empresas_ids
FROM empresas 
WHERE id = 'fa6d1635-6b7a-4bd9-8b06-0b8abb33862a';

-- 4. VERIFICAR RELACIONAMENTO ENTREGADOR -> EMPRESA
SELECT 
    'VERIFICAR_ENTREGADOR_EMPRESA' as verificacao,
    e.id as entregador_id,
    e.nome as entregador_nome,
    e.empresa_id,
    emp.nome as empresa_nome,
    emp.ativa as empresa_ativa
FROM entregadores e
LEFT JOIN empresas emp ON e.empresa_id = emp.id
WHERE e.user_id = 'dd8ff9ec-fb37-44be-9b45-4e45b8cf3eff';

-- 5. CRIAR/ATUALIZAR POLÍTICA RLS PARA EMPRESAS
-- Permitir que entregadores vejam dados básicos da sua empresa

-- Primeiro, remover política existente se houver conflito
DROP POLICY IF EXISTS "Entregadores podem ver sua empresa" ON empresas;
DROP POLICY IF EXISTS "Usuarios podem ver apenas dados da sua empresa" ON empresas;

-- Criar nova política inclusiva para entregadores
CREATE POLICY "Entregadores podem acessar dados da sua empresa" ON empresas
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

-- 6. POLÍTICA PARA INSERÇÃO/ATUALIZAÇÃO (apenas admins)
-- Primeiro remover se existir
DROP POLICY IF EXISTS "Apenas admins podem modificar empresas" ON empresas;

-- Criar política para modificações
CREATE POLICY "Apenas admins podem modificar empresas" ON empresas
    FOR ALL
    USING (
        -- Apenas usuários com role admin ou super_admin
        EXISTS (
            SELECT 1 
            FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
              AND ur.role IN ('admin_empresa', 'super_admin')
              AND ur.empresa_id = empresas.id
        )
    );

-- 7. VERIFICAR POLÍTICAS CRIADAS
SELECT 
    'POLITICAS_EMPRESAS_CORRIGIDAS' as verificacao,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'empresas'
ORDER BY policyname;

-- 8. TESTE FINAL - SIMULAR CONSULTA DO ENTREGADOR
-- Esta consulta deve agora retornar 1 empresa
SELECT 
    'TESTE_FINAL_ENTREGADOR' as verificacao,
    COUNT(*) as empresas_acessiveis,
    array_agg(nome) as nomes_empresas
FROM empresas 
WHERE id = 'fa6d1635-6b7a-4bd9-8b06-0b8abb33862a';

-- 9. AUDITORIA - VERIFICAR ACESSO POR TIPO DE USUÁRIO
SELECT 
    'AUDITORIA_ACESSO_EMPRESAS' as tipo,
    'Via user_roles' as metodo,
    COUNT(*) as total_acessivel
FROM empresas e
WHERE e.id = (
    SELECT empresa_id 
    FROM user_roles 
    WHERE user_id = 'dd8ff9ec-fb37-44be-9b45-4e45b8cf3eff'
);

SELECT 
    'AUDITORIA_ACESSO_EMPRESAS' as tipo,
    'Via entregadores' as metodo,
    COUNT(*) as total_acessivel
FROM empresas e
WHERE e.id = (
    SELECT empresa_id 
    FROM entregadores 
    WHERE user_id = 'dd8ff9ec-fb37-44be-9b45-4e45b8cf3eff'
);

-- 10. COMMIT DAS MUDANÇAS
COMMIT;

-- =====================================================
-- INSTRUÇÕES PÓS-EXECUÇÃO:
-- 1. Testar login do entregador jao@gmail.com
-- 2. Verificar se erro 406 foi resolvido
-- 3. Confirmar que entregador vê apenas sua empresa
-- 4. Verificar se admin ainda tem acesso completo
-- =====================================================