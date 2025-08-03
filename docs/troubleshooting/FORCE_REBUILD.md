# Force Rebuild - AbacatePay Integration

Este arquivo força um rebuild completo para garantir que todas as mudanças do AbacatePay sejam aplicadas.

## Problema Identificado
- Arquivo compilado `index-CnItAxpE.js` ainda contém referências ao MercadoPago
- URL sendo chamada: `/your_production_supabase_url/functions/v1/mercadopago-subscription`

## Soluções Necessárias

### 1. Variáveis de Ambiente Vercel
Verificar se estas variáveis estão configuradas corretamente:
```
VITE_SUPABASE_URL=https://nfwdgkjrkmrjsfnbmsrd.supabase.co
VITE_SUPABASE_ANON_KEY=[sua_key]
SUPABASE_SERVICE_ROLE_KEY=[sua_service_key]
VITE_ABACATEPAY_API_KEY_DEV=abc_dev_G6XzWKeK0MMuHq1wexzTeTDh
```

### 2. Remover Função Supabase (se existir)
- Ir para Supabase Dashboard > Edge Functions
- Deletar função `mercadopago-subscription` se existir

### 3. Clear Build Cache
- Vercel Dashboard > Deployments > Redeploy

## Timestamp
Última atualização: ${new Date().toISOString()}