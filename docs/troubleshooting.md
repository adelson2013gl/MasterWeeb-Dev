
# Guia de Troubleshooting - Sistema de Agendamento

## 🚨 Problemas Comuns e Soluções

### 1. Sistema de Horários Específicos Não Funcionando

**Sintomas:**
- Entregadores conseguem agendar em horários restritos
- Configurações de horário por estrelas são ignoradas
- Botões aparecem como disponíveis mas falham ao clicar

**Diagnóstico:**
```bash
# Verificar se as configurações estão sendo carregadas
console.log('Configs:', configs);
console.log('Horários específicos habilitado:', configs?.habilitarPriorizacaoHorarios);
```

**Soluções:**
1. **Verificar função get_current_empresa_id()** no banco
2. **Validar políticas RLS** na tabela configuracoes_empresa
3. **Checar autenticação** do usuário (auth.uid())

**Correção Aplicada (14/06/2025):**
- Reformulada função SQL para buscar empresa correta
- Corrigidas políticas RLS com SECURITY DEFINER
- Implementado retry automático no hook

### 2. Inconsistência Visual no Calendário

**Sintomas:**
- Datas aparecem como disponíveis (azuis) mas são bloqueadas ao clicar
- "HOJE" aparece como disponível mesmo fora do horário permitido
- Diferença entre Step 1 e Step 2 do AgendamentoCalendar

**Diagnóstico:**
```bash
# Logs para debug no calendário
console.log('Datas com agendas liberadas:', datasComAgendasLiberadas);
console.log('Validação horário:', isAgendamentoPermitido(data, hora));
```

**Solução Implementada:**
- Aplicada validação `isAgendamentoPermitido()` no Step 1
- Corrigida lógica de `datasComAgendasLiberadas`
- Sincronização entre visualização e funcionalidade

### 3. Configurações Não Carregam

**Sintomas:**
- Hook useConfiguracoesSistema retorna dados vazios
- Sistema usa configurações padrão sempre
- Errors relacionados a auth.uid()

**Debug Steps:**
1. Verificar se usuário está autenticado
2. Confirmar empresa_id do usuário
3. Validar políticas RLS
4. Checar network requests no DevTools

**Solução:**
- Implementado sistema de retry
- Melhorados logs de debug
- Corrigidas funções SQL

### 4. Problemas de Performance no useAgendasDisponiveis

**Sintomas:**
- Carregamento lento de agendas
- Timeout errors
- Múltiplas requests desnecessárias

**Otimizações Aplicadas:**
- Timeout de segurança reduzido para 1.5s
- Execução forçada quando necessário
- Logs detalhados para debug

## 🔧 Ferramentas de Debug

### Console Logs Padrão
Todos os hooks incluem logs categorizados:
```javascript
logger.info('Mensagem', { dados }, 'CATEGORIA');
logger.error('Erro', { error }, 'CATEGORIA');
logger.debug('Debug', { detalhes }, 'CATEGORIA');
```

### Categorias de Log Importantes:
- `DEBUG_ADELSON`: Logs específicos para sistema de horários
- `AGENDAS_FILTRO`: Filtros de agenda
- `CONFIGURACOES_SISTEMA`: Carregamento de configs

### Supabase Debug:
```sql
-- Verificar configurações da empresa
SELECT * FROM configuracoes_empresa WHERE empresa_id = 'ID_EMPRESA';

-- Verificar agendas disponíveis
SELECT * FROM agendas WHERE ativo = true AND data >= CURRENT_DATE;

-- Verificar entregador
SELECT * FROM entregadores WHERE user_id = 'ID_USER';
```

## 📱 Testes de Validação

### Teste do Sistema de Horários:
1. Login como entregador com diferentes níveis de estrelas
2. Verificar horários de liberação específicos
3. Tentar agendar antes/depois dos horários permitidos
4. Confirmar mensagens de bloqueio apropriadas

### Teste de Inconsistência Visual:
1. Acessar calendário antes do horário permitido
2. Verificar se botão "HOJE" está desabilitado
3. Aguardar horário de liberação
4. Confirmar que botão fica habilitado

### Teste de Performance:
1. Monitorar tempo de carregamento inicial
2. Verificar se timeout de 1.5s é respeitado
3. Confirmar que não há loops infinitos

## 🚨 Alertas Críticos

### Red Flags:
- Logs de `DEBUG_ADELSON` mostrando dados inconsistentes
- Timeout frequente no useAgendasDisponiveis
- Configurações sempre null/undefined
- Diferenças entre Step 1 e Step 2 do calendário

### Quando Escalar:
- Se correções de RLS não resolverem o problema
- Performance degradada após mudanças
- Inconsistências persistentes na interface

---
*Última atualização: 14/06/2025*
