-- =========================================
-- VERIFICAÇÃO ESPECÍFICA DAS COLUNAS
-- =========================================

-- 1. ESTRUTURA DA TABELA AGENDAMENTOS
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'agendamentos' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. ESTRUTURA DA TABELA AGENDAS  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'agendas' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. ESTRUTURA DA TABELA ENTREGADORES
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'entregadores' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. ESTRUTURA DA TABELA TURNOS
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'turnos' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. ESTRUTURA DA TABELA REGIOES
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'regioes' AND table_schema = 'public'
ORDER BY ordinal_position;