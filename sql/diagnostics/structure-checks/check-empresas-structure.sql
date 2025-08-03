-- Verificar estrutura da tabela empresas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'empresas' 
  AND table_schema = 'public'
ORDER BY ordinal_position;