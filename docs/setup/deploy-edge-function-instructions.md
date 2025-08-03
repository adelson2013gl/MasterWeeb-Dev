# Instruções para Deploy da Edge Function

## Edge Function: cadastro-admin-empresa

**Local do arquivo:** `/supabase/functions/cadastro-admin-empresa/index.ts`

### Deploy Manual via Supabase Dashboard:

1. **Acesse o Supabase Dashboard** → https://supabase.com/dashboard
2. **Vá para seu projeto** → MasterWeeb
3. **Navegue para "Functions"** no menu lateral
4. **Clique em "Create a new function"**
5. **Nome da função:** `cadastro-admin-empresa`
6. **Copie e cole o código** do arquivo `supabase/functions/cadastro-admin-empresa/index.ts`

### Configurações necessárias:

**Secrets/Environment Variables:**
```
SUPABASE_URL=sua_url_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_key_aqui
```

### Teste após deploy:

1. Acesse a interface de cadastro de administrador
2. Preencha os dados e tente criar um administrador
3. Verifique os logs da Edge Function no Dashboard do Supabase

### Motivo do uso da Edge Function:

A Edge Function resolve o problema `email_address_invalid` porque:
- Usa `supabase.auth.admin.createUser()` com privilégios administrativos
- Não tem as mesmas restrições de validação que `auth.signUp()`
- Pode criar usuários em qualquer domínio de email
- Tem acesso completo ao Service Role Key

Esta abordagem é mais robusta para criação de administradores pelo sistema.