-- Verificar estrutura da tabela entregadores
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'entregadores' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se campos necessários existem
SELECT 
    CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status,
    'data_cadastro' as campo
FROM information_schema.columns 
WHERE table_name = 'entregadores' 
  AND table_schema = 'public'
  AND column_name = 'data_cadastro'

UNION ALL

SELECT 
    CASE WHEN column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status,
    'data_aprovacao' as campo
FROM information_schema.columns 
WHERE table_name = 'entregadores' 
  AND table_schema = 'public'
  AND column_name = 'data_aprovacao';