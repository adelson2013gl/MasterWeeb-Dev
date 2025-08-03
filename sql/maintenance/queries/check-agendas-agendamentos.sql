-- =========================================
-- VERIFICAÇÃO ESPECÍFICA: AGENDAS E AGENDAMENTOS
-- =========================================

-- TABELA AGENDAMENTOS
SELECT 'AGENDAMENTOS' as tabela, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'agendamentos' AND table_schema = 'public'
ORDER BY ordinal_position;

-- SEPARADOR
SELECT '---' as separador, '---' as separador2, '---' as separador3;

-- TABELA AGENDAS
SELECT 'AGENDAS' as tabela, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'agendas' AND table_schema = 'public'
ORDER BY ordinal_position;