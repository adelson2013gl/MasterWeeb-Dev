# ⚠️ VERIFICAR FUNÇÕES SUPABASE EDGE FUNCTIONS

## Problema Identificado
O erro `mercadopago-subscription 405` indica que pode existir uma **Edge Function** no Supabase que precisa ser removida.

## ✅ PASSOS PARA VERIFICAR E CORRIGIR:

### 1. Acessar Supabase Dashboard
```
https://supabase.com/dashboard/project/nfwdgkjrkmrjsfnbmsrd
```

### 2. Verificar Edge Functions
- Ir para: **Edge Functions** (no menu lateral)
- Procurar função chamada: `mercadopago-subscription`
- **Se existir**: Deletar ou desabilitar

### 3. Verificar RPC Functions 
- Ir para: **Database** > **Functions**
- Procurar qualquer função relacionada a `mercadopago`
- **Se existir**: Deletar

### 4. Verificar Configurações
- Ir para: **Database** > **SQL Editor**
- Executar o arquivo: `debug-functions.sql`
- Verificar se retorna alguma função relacionada ao MercadoPago

## 🔄 DEPOIS DE VERIFICAR:

### 5. Fazer Redeploy na Vercel
1. Acessar: https://vercel.com/dashboard
2. Encontrar projeto: `slotmaster-21dev`
3. Ir para: **Deployments**
4. Clicar: **Redeploy** (para forçar rebuild)

### 6. Testar Endpoints
Após redeploy, testar:
- ✅ `https://slotmaster-21dev.vercel.app/api/test-env`
- ✅ `https://slotmaster-21dev.vercel.app/api/webhook`
- ✅ Sistema: `https://slotmaster-21dev.vercel.app/`

## 🎯 RESULTADO ESPERADO
Após essas correções, o botão "Assinar Agora" deve:
- ✅ Chamar API AbacatePay corretamente
- ✅ Redirecionar para pagamento PIX
- ❌ NÃO mais tentar acessar `mercadopago-subscription`

---
**Timestamp**: ${new Date().toISOString()}