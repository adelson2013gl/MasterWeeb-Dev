-- APENAS TABELA AGENDAMENTOS
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'agendamentos' AND table_schema = 'public'
ORDER BY ordinal_position;