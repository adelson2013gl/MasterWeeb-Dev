-- =====================================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA: Tabela REGIOES
-- Baseado na estrutura real das tabelas
-- =====================================================

-- 1. ADICIONAR CAMPO empresa_id NA TABELA regioes
ALTER TABLE regioes 
ADD COLUMN empresa_id UUID;

-- 2. ADICIONAR FOREIGN KEY para empresas
ALTER TABLE regioes 
ADD CONSTRAINT fk_regioes_empresa 
FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;

-- 3. ATUALIZAR REGIÕES EXISTENTES COM empresa_id baseado na cidade
UPDATE regioes 
SET empresa_id = cidades.empresa_id
FROM cidades 
WHERE regioes.cidade_id = cidades.id 
  AND regioes.empresa_id IS NULL;

-- 4. VERIFICAR SE TODAS AS REGIÕES TEM empresa_id AGORA
SELECT 
    'REGIOES_ATUALIZACAO' as verificacao,
    COUNT(*) as total_regioes,
    COUNT(empresa_id) as regioes_com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as regioes_ainda_orfas
FROM regioes;

-- 5. TORNAR empresa_id OBRIGATÓRIO
ALTER TABLE regioes 
ALTER COLUMN empresa_id SET NOT NULL;

-- 6. CRIAR ASSINATURA PADRÃO PARA EMPRESAS SEM ASSINATURA
-- Usando apenas os campos obrigatórios que realmente existem
INSERT INTO assinaturas (
    empresa_id, 
    plano, 
    valor_mensal
)
SELECT 
    e.id as empresa_id,
    COALESCE(e.plano_atual, 'basico') as plano,
    CASE 
        WHEN COALESCE(e.plano_atual, 'basico') = 'basico' THEN 29.90
        WHEN COALESCE(e.plano_atual, 'basico') = 'pro' THEN 59.90
        WHEN COALESCE(e.plano_atual, 'basico') = 'enterprise' THEN 149.90
        ELSE 29.90
    END as valor_mensal
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM assinaturas a
    WHERE a.empresa_id = e.id
);

-- 7. CRIAR ÍNDICES para performance
CREATE INDEX IF NOT EXISTS idx_regioes_empresa_id ON regioes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_regioes_ativo ON regioes(ativo);

-- 8. HABILITAR RLS (Row Level Security) na tabela regioes
ALTER TABLE regioes ENABLE ROW LEVEL SECURITY;

-- 9. CRIAR POLICY de RLS para regioes
DROP POLICY IF EXISTS "Usuarios podem ver regioes da sua empresa" ON regioes;
CREATE POLICY "Usuarios podem ver regioes da sua empresa" ON regioes
    FOR ALL USING (
        empresa_id IN (
            SELECT empresa_id FROM entregadores 
            WHERE user_id = auth.uid()
        )
    );

-- 10. VERIFICAR SE ASSINATURAS JÁ TEM RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'assinaturas';

-- 11. HABILITAR RLS para assinaturas se não estiver habilitado
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;

-- 12. CRIAR POLICY de RLS para assinaturas
DROP POLICY IF EXISTS "Usuarios podem ver assinaturas da sua empresa" ON assinaturas;
CREATE POLICY "Usuarios podem ver assinaturas da sua empresa" ON assinaturas
    FOR ALL USING (
        empresa_id IN (
            SELECT empresa_id FROM entregadores 
            WHERE user_id = auth.uid()
        )
    );

-- 13. VERIFICAR RESULTADOS FINAIS
SELECT 
    'AUDITORIA_FINAL' as tipo,
    'regioes' as tabela,
    COUNT(*) as total_registros,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(DISTINCT empresa_id) as empresas_distintas
FROM regioes

UNION ALL

SELECT 
    'AUDITORIA_FINAL' as tipo,
    'assinaturas' as tabela,
    COUNT(*) as total_registros,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(DISTINCT empresa_id) as empresas_distintas
FROM assinaturas;

-- 14. RESUMO DE SEGURANÇA POR EMPRESA
SELECT 
    e.nome as empresa_nome,
    e.ativa as empresa_ativa,
    COUNT(DISTINCT c.id) as cidades,
    COUNT(DISTINCT r.id) as regioes,
    COUNT(DISTINCT t.id) as turnos,
    COUNT(DISTINCT a.id) as assinaturas,
    STRING_AGG(DISTINCT a.status, ', ') as status_assinaturas
FROM empresas e
LEFT JOIN cidades c ON e.id = c.empresa_id AND c.ativo = true
LEFT JOIN regioes r ON e.id = r.empresa_id AND r.ativo = true  
LEFT JOIN turnos t ON e.id = t.empresa_id AND t.ativo = true
LEFT JOIN assinaturas a ON e.id = a.empresa_id
WHERE e.ativa = true
GROUP BY e.id, e.nome, e.ativa
ORDER BY e.nome;

-- 15. VERIFICAR POLICIES CRIADAS
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('regioes', 'assinaturas')
ORDER BY tablename, policyname;