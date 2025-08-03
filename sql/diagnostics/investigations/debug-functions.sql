-- Script para debugar funções Supabase e verificar se existe mercadopago-subscription
-- Execute no SQL Editor do Supabase

-- 1. Listar todas as funções do banco
SELECT 
    schemaname,
    functionname,
    definition
FROM pg_functions 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY schemaname, functionname;

-- 2. Verificar se existe alguma função com nome mercadopago
SELECT 
    schemaname,
    functionname,
    definition
FROM pg_functions 
WHERE functionname LIKE '%mercado%' OR functionname LIKE '%subscription%'
ORDER BY schemaname, functionname;

-- 3. Verificar configurações do sistema que podem conter URLs
SELECT 
    chave,
    valor,
    descricao
FROM configuracoes_sistema
WHERE valor LIKE '%mercado%' OR valor LIKE '%subscription%' OR valor LIKE '%your_production%';

-- 4. Verificar se há dados na tabela de configurações que podem estar causando o problema
SELECT 
    id,
    created_at,
    updated_at
FROM configuracoes_sistema
ORDER BY updated_at DESC
LIMIT 10;