# 🚀 Migrações SQL - MasterWeeb

## 📋 Histórico de Migrações

### ✅ Migrações Aplicadas (Ordem Cronológica)

1. **Core Migration** - `migration-completa-masterweeb.sql`
   - **Data:** Julho 2025
   - **Tipo:** Migração inicial completa
   - **Status:** ✅ Aplicado com sucesso

2. **Security Fix v1** - `fix-security-critical-regioes-assinaturas.sql`
   - **Data:** Julho 2025
   - **Tipo:** Correção de segurança
   - **Status:** 📋 Substituído por v2

3. **Security Fix v2** - `fix-security-critical-regioes-assinaturas-v2.sql`
   - **Data:** Julho 2025
   - **Tipo:** Correção de segurança aprimorada
   - **Status:** ✅ Aplicado com sucesso

4. **Security Final** - `fix-security-regioes-final.sql`
   - **Data:** Julho 2025
   - **Tipo:** Finalização de segurança
   - **Status:** ✅ Aplicado com sucesso

5. **Policies Cleanup** - `remove-conflicting-policies.sql`
   - **Data:** Julho 2025
   - **Tipo:** Limpeza de políticas
   - **Status:** ✅ Aplicado com sucesso

6. **AbacatePay Integration** - `migration-abacatepay.sql`
   - **Data:** Julho 2025
   - **Tipo:** Integração de pagamento
   - **Status:** ✅ Aplicado com sucesso

---

## 🔄 Ordem de Execução para Novo Ambiente

### Obrigatórias (em ordem):
1. `core/migration-completa-masterweeb.sql`
2. `security/fix-security-critical-regioes-assinaturas-v2.sql`
3. `security/remove-conflicting-policies.sql`

### Opcionais (conforme necessidade):
4. `integrations/migration-abacatepay.sql` (se usar pagamentos)
5. `integrations/fix-missing-expiry-functions.sql` (manutenção)

---

## 📊 Dependências Entre Scripts

```
migration-completa-masterweeb.sql
    ↓
fix-security-critical-regioes-assinaturas-v2.sql
    ↓
remove-conflicting-policies.sql
    ↓
migration-abacatepay.sql (opcional)
```

---

## ⚠️ Alertas Importantes

- **NÃO** executar `fix-security-critical-regioes-assinaturas.sql` (v1)
- **SEMPRE** usar a versão v2 das correções de segurança
- **BACKUP** obrigatório antes de qualquer migração
- **TESTAR** em ambiente de desenvolvimento primeiro

---

## 🔍 Validação Pós-Migração

Após aplicar migrações, executar:
1. `../diagnostics/structure-checks/verify-table-structure.sql`
2. `../diagnostics/investigations/audit-data-leakage-fix.sql`
3. Testar login e funcionalidades críticas

---

**📅 Última atualização:** Julho 2025