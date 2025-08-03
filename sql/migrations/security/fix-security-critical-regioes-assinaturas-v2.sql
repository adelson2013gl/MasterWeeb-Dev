-- =====================================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA: Isolamento por Empresa (VERSÃO 2)
-- Executar no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. VERIFICAR ESTRUTURA DA TABELA assinaturas EXISTENTE
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'assinaturas' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. ADICIONAR CAMPO empresa_id NA TABELA regioes (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'regioes' 
          AND column_name = 'empresa_id'
    ) THEN
        ALTER TABLE regioes ADD COLUMN empresa_id UUID;
        RAISE NOTICE 'Campo empresa_id adicionado na tabela regioes';
    ELSE
        RAISE NOTICE 'Campo empresa_id já existe na tabela regioes';
    END IF;
END $$;

-- 3. ADICIONAR FOREIGN KEY para empresas (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_regioes_empresa'
    ) THEN
        ALTER TABLE regioes 
        ADD CONSTRAINT fk_regioes_empresa 
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
        RAISE NOTICE 'Foreign key fk_regioes_empresa criada';
    ELSE
        RAISE NOTICE 'Foreign key fk_regioes_empresa já existe';
    END IF;
END $$;

-- 4. ATUALIZAR REGIÕES EXISTENTES COM empresa_id baseado na cidade
UPDATE regioes 
SET empresa_id = cidades.empresa_id
FROM cidades 
WHERE regioes.cidade_id = cidades.id 
  AND regioes.empresa_id IS NULL;

-- 5. VERIFICAR SE TODAS AS REGIÕES TEM empresa_id
SELECT 
    COUNT(*) as total_regioes,
    COUNT(empresa_id) as regioes_com_empresa_id,
    COUNT(*) - COUNT(empresa_id) as regioes_orfas
FROM regioes;

-- 6. TORNAR empresa_id OBRIGATÓRIO (apenas se não há registros órfãos)
DO $$
DECLARE
    orfaos INTEGER;
BEGIN
    SELECT COUNT(*) INTO orfaos FROM regioes WHERE empresa_id IS NULL;
    
    IF orfaos = 0 THEN
        ALTER TABLE regioes ALTER COLUMN empresa_id SET NOT NULL;
        RAISE NOTICE 'Campo empresa_id tornando obrigatório';
    ELSE
        RAISE NOTICE 'Ainda existem % regiões órfãs. Corrija antes de tornar obrigatório', orfaos;
    END IF;
END $$;

-- 7. CRIAR ASSINATURA PADRÃO PARA EMPRESAS SEM ASSINATURA
-- Incluindo todos os campos obrigatórios da tabela assinaturas
INSERT INTO assinaturas (
    empresa_id, 
    plano, 
    status, 
    data_inicio,
    valor_mensal,
    gateway_pagamento
)
SELECT 
    e.id as empresa_id,
    COALESCE(e.plano_atual, 'basico') as plano,
    CASE 
        WHEN e.ativa = true THEN 'ativa'
        ELSE 'inativa'
    END as status,
    COALESCE(e.created_at::date, CURRENT_DATE) as data_inicio,
    CASE 
        WHEN COALESCE(e.plano_atual, 'basico') = 'basico' THEN 29.90
        WHEN COALESCE(e.plano_atual, 'basico') = 'pro' THEN 59.90
        WHEN COALESCE(e.plano_atual, 'basico') = 'enterprise' THEN 149.90
        ELSE 29.90
    END as valor_mensal,
    'abacatepay' as gateway_pagamento
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM assinaturas a
    WHERE a.empresa_id = e.id
);

-- 8. CRIAR ÍNDICES para performance (se não existirem)
CREATE INDEX IF NOT EXISTS idx_regioes_empresa_id ON regioes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_empresa_id ON assinaturas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);

-- 9. HABILITAR RLS (Row Level Security) nas tabelas
ALTER TABLE regioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;

-- 10. CRIAR POLICIES de RLS para regioes (remover se já existe)
DROP POLICY IF EXISTS "Usuarios podem ver regioes da sua empresa" ON regioes;
CREATE POLICY "Usuarios podem ver regioes da sua empresa" ON regioes
    FOR ALL USING (
        empresa_id IN (
            SELECT empresa_id FROM entregadores 
            WHERE user_id = auth.uid()
        )
    );

-- 11. CRIAR POLICIES de RLS para assinaturas (remover se já existe)
DROP POLICY IF EXISTS "Usuarios podem ver assinaturas da sua empresa" ON assinaturas;
CREATE POLICY "Usuarios podem ver assinaturas da sua empresa" ON assinaturas
    FOR ALL USING (
        empresa_id IN (
            SELECT empresa_id FROM entregadores 
            WHERE user_id = auth.uid()
        )
    );

-- 12. VERIFICAR RESULTADOS
SELECT 
    'REGIOES' as tabela,
    COUNT(*) as total_registros,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(DISTINCT empresa_id) as empresas_distintas
FROM regioes

UNION ALL

SELECT 
    'ASSINATURAS' as tabela,
    COUNT(*) as total_registros,
    COUNT(empresa_id) as com_empresa_id,
    COUNT(DISTINCT empresa_id) as empresas_distintas
FROM assinaturas;

-- 13. AUDITORIA: Verificar se há dados órfãos
SELECT 
    'regioes_sem_empresa' as problema,
    COUNT(*) as quantidade
FROM regioes 
WHERE empresa_id IS NULL

UNION ALL

SELECT 
    'assinaturas_sem_empresa' as problema,
    COUNT(*) as quantidade
FROM assinaturas 
WHERE empresa_id IS NULL;

-- 14. RESUMO POR EMPRESA
SELECT 
    e.nome as empresa_nome,
    e.id as empresa_id,
    COUNT(DISTINCT c.id) as cidades,
    COUNT(DISTINCT r.id) as regioes,
    COUNT(DISTINCT t.id) as turnos,
    COUNT(DISTINCT a.id) as assinaturas
FROM empresas e
LEFT JOIN cidades c ON e.id = c.empresa_id
LEFT JOIN regioes r ON e.id = r.empresa_id  
LEFT JOIN turnos t ON e.id = t.empresa_id
LEFT JOIN assinaturas a ON e.id = a.empresa_id
GROUP BY e.id, e.nome
ORDER BY e.nome;