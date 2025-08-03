-- =========================================
-- CORREÇÃO DE FOREIGN KEYS E FUNÇÕES AUSENTES
-- =========================================

-- 1. VERIFICAR ESTRUTURA DAS TABELAS PRINCIPAIS
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('agendas', 'agendamentos', 'turnos', 'regioes', 'cidades', 'entregadores')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 2. CRIAR FOREIGN KEYS AUSENTES

-- Foreign key entre agendamentos e agendas
ALTER TABLE agendamentos 
DROP CONSTRAINT IF EXISTS agendamentos_agenda_id_fkey;

ALTER TABLE agendamentos 
ADD CONSTRAINT agendamentos_agenda_id_fkey 
FOREIGN KEY (agenda_id) REFERENCES agendas(id) ON DELETE CASCADE;

-- Foreign key entre agendamentos e entregadores
ALTER TABLE agendamentos 
DROP CONSTRAINT IF EXISTS agendamentos_entregador_id_fkey;

ALTER TABLE agendamentos 
ADD CONSTRAINT agendamentos_entregador_id_fkey 
FOREIGN KEY (entregador_id) REFERENCES entregadores(id) ON DELETE CASCADE;

-- Foreign key entre agendas e turnos
ALTER TABLE agendas 
DROP CONSTRAINT IF EXISTS agendas_turno_id_fkey;

ALTER TABLE agendas 
ADD CONSTRAINT agendas_turno_id_fkey 
FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE SET NULL;

-- Foreign key entre agendas e regioes
ALTER TABLE agendas 
DROP CONSTRAINT IF EXISTS agendas_regiao_id_fkey;

ALTER TABLE agendas 
ADD CONSTRAINT agendas_regiao_id_fkey 
FOREIGN KEY (regiao_id) REFERENCES regioes(id) ON DELETE SET NULL;

-- Foreign key entre regioes e cidades
ALTER TABLE regioes 
DROP CONSTRAINT IF EXISTS regioes_cidade_id_fkey;

ALTER TABLE regioes 
ADD CONSTRAINT regioes_cidade_id_fkey 
FOREIGN KEY (cidade_id) REFERENCES cidades(id) ON DELETE SET NULL;

-- 3. CRIAR FUNÇÃO get_dashboard_stats AUSENTE

CREATE OR REPLACE FUNCTION get_dashboard_stats(target_empresa_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    total_entregadores INTEGER;
    entregadores_ativos INTEGER;
    total_agendas INTEGER;
    agendas_ativas INTEGER;
    total_agendamentos INTEGER;
    agendamentos_pendentes INTEGER;
    agendamentos_confirmados INTEGER;
    agendamentos_hoje INTEGER;
BEGIN
    -- Estatísticas de entregadores
    SELECT COUNT(*) INTO total_entregadores 
    FROM entregadores 
    WHERE empresa_id = target_empresa_id;
    
    SELECT COUNT(*) INTO entregadores_ativos 
    FROM entregadores 
    WHERE empresa_id = target_empresa_id AND ativo = true AND status = 'aprovado';
    
    -- Estatísticas de agendas
    SELECT COUNT(*) INTO total_agendas 
    FROM agendas 
    WHERE empresa_id = target_empresa_id;
    
    SELECT COUNT(*) INTO agendas_ativas 
    FROM agendas 
    WHERE empresa_id = target_empresa_id AND ativo = true;
    
    -- Estatísticas de agendamentos
    SELECT COUNT(*) INTO total_agendamentos 
    FROM agendamentos ag
    JOIN agendas a ON a.id = ag.agenda_id
    WHERE a.empresa_id = target_empresa_id;
    
    SELECT COUNT(*) INTO agendamentos_pendentes 
    FROM agendamentos ag
    JOIN agendas a ON a.id = ag.agenda_id
    WHERE a.empresa_id = target_empresa_id AND ag.status = 'pendente';
    
    SELECT COUNT(*) INTO agendamentos_confirmados 
    FROM agendamentos ag
    JOIN agendas a ON a.id = ag.agenda_id
    WHERE a.empresa_id = target_empresa_id AND ag.status = 'confirmada';
    
    SELECT COUNT(*) INTO agendamentos_hoje 
    FROM agendamentos ag
    JOIN agendas a ON a.id = ag.agenda_id
    WHERE a.empresa_id = target_empresa_id 
    AND a.data = CURRENT_DATE;
    
    -- Construir JSON de resultado
    result := json_build_object(
        'entregadores', json_build_object(
            'total', total_entregadores,
            'ativos', entregadores_ativos,
            'inativos', total_entregadores - entregadores_ativos
        ),
        'agendas', json_build_object(
            'total', total_agendas,
            'ativas', agendas_ativas,
            'inativas', total_agendas - agendas_ativas
        ),
        'agendamentos', json_build_object(
            'total', total_agendamentos,
            'pendentes', agendamentos_pendentes,
            'confirmados', agendamentos_confirmados,
            'hoje', agendamentos_hoje
        ),
        'resumo', json_build_object(
            'total_operacoes', total_agendamentos,
            'taxa_aprovacao', CASE 
                WHEN total_agendamentos > 0 
                THEN ROUND((agendamentos_confirmados::DECIMAL / total_agendamentos) * 100, 2)
                ELSE 0 
            END
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CRIAR DADOS DE TESTE BÁSICOS PARA EVITAR ERROS

-- Inserir cidade padrão se não existir
INSERT INTO cidades (id, nome, estado, uf) 
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'São Paulo',
    'São Paulo',
    'SP'
) ON CONFLICT (id) DO NOTHING;

-- Inserir região padrão se não existir
INSERT INTO regioes (id, nome, cidade_id, empresa_id) 
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Centro',
    '11111111-1111-1111-1111-111111111111',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'
) ON CONFLICT (id) DO NOTHING;

-- Inserir turno padrão se não existir
INSERT INTO turnos (id, nome, hora_inicio, hora_fim, empresa_id) 
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Manhã',
    '08:00:00',
    '12:00:00',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479'
) ON CONFLICT (id) DO NOTHING;

-- 5. GRANT PERMISSÕES NECESSÁRIAS
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID) TO anon;

-- 6. VERIFICAR SE FOREIGN KEYS FORAM CRIADAS
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('agendas', 'agendamentos', 'regioes');

-- 7. TESTAR A FUNÇÃO get_dashboard_stats
SELECT get_dashboard_stats('f47ac10b-58cc-4372-a567-0e02b2c3d479');

-- =========================================
-- FINALIZAÇÃO
-- =========================================
-- Foreign keys e funções criadas com sucesso!