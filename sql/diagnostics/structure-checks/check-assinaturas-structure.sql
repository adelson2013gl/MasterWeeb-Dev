-- Verificar estrutura completa da tabela assinaturas
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'assinaturas' 
  AND table_schema = 'public'
ORDER BY ordinal_position;