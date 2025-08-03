-- =====================================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA: Isolamento por Empresa
-- Executar no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. ADICIONAR CAMPO empresa_id NA TABELA regioes
ALTER TABLE regioes 
ADD COLUMN IF NOT EXISTS empresa_id UUID;

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

-- 4. TORNAR empresa_id OBRIGATÓRIO
ALTER TABLE regioes 
ALTER COLUMN empresa_id SET NOT NULL;

-- 5. CRIAR TABELA assinaturas (que está faltando)
CREATE TABLE IF NOT EXISTS assinaturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    plano VARCHAR(50) NOT NULL DEFAULT 'basico',
    status VARCHAR(20) NOT NULL DEFAULT 'ativa',
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim DATE,
    valor DECIMAL(10,2),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CRIAR ÍNDICES para performance
CREATE INDEX IF NOT EXISTS idx_regioes_empresa_id ON regioes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_empresa_id ON assinaturas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);

-- 7. CRIAR ASSINATURA PADRÃO PARA EMPRESAS EXISTENTES
INSERT INTO assinaturas (empresa_id, plano, status, data_inicio)
SELECT 
    id as empresa_id,
    COALESCE(plano_atual, 'basico') as plano,
    CASE 
        WHEN ativa = true THEN 'ativa'
        ELSE 'inativa'
    END as status,
    COALESCE(created_at::date, CURRENT_DATE) as data_inicio
FROM empresas 
WHERE NOT EXISTS (
    SELECT 1 FROM assinaturas 
    WHERE assinaturas.empresa_id = empresas.id
);

-- 8. HABILITAR RLS (Row Level Security) nas tabelas
ALTER TABLE regioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;

-- 9. CRIAR POLICIES de RLS para regioes
DROP POLICY IF EXISTS "Usuarios podem ver regioes da sua empresa" ON regioes;
CREATE POLICY "Usuarios podem ver regioes da sua empresa" ON regioes
    FOR ALL USING (
        empresa_id IN (
            SELECT empresa_id FROM entregadores 
            WHERE user_id = auth.uid()
        )
    );

-- 10. CRIAR POLICIES de RLS para assinaturas
DROP POLICY IF EXISTS "Usuarios podem ver assinaturas da sua empresa" ON assinaturas;
CREATE POLICY "Usuarios podem ver assinaturas da sua empresa" ON assinaturas
    FOR ALL USING (
        empresa_id IN (
            SELECT empresa_id FROM entregadores 
            WHERE user_id = auth.uid()
        )
    );

-- 11. AUDITORIA: Verificar se há dados órfãos
SELECT 
    'regioes_sem_empresa' as tabela,
    COUNT(*) as registros_orfaos
FROM regioes 
WHERE empresa_id IS NULL

UNION ALL

SELECT 
    'cidades_dados_empresa' as tabela,
    COUNT(DISTINCT empresa_id) as empresas_com_cidades
FROM cidades 
WHERE empresa_id IS NOT NULL

UNION ALL

SELECT 
    'regioes_dados_empresa' as tabela,
    COUNT(DISTINCT empresa_id) as empresas_com_regioes
FROM regioes 
WHERE empresa_id IS NOT NULL;

-- 12. LOG de auditoria
INSERT INTO audit_logs (tabela, acao, descricao, timestamp)
VALUES 
    ('regioes', 'ALTER', 'Adicionado campo empresa_id para isolamento de dados', NOW()),
    ('assinaturas', 'CREATE', 'Criada tabela assinaturas com isolamento por empresa', NOW())
ON CONFLICT DO NOTHING;