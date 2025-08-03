
# Configuração do Sistema de Horários Específicos

## 🎯 Visão Geral

O sistema de horários específicos permite controlar quando entregadores com diferentes níveis de estrelas podem agendar turnos, baseado no horário atual do dia.

## ⭐ Como Funciona

### Níveis de Estrelas e Horários
O sistema usa a seguinte lógica:

```
5 estrelas: 08:00 (liberação mais cedo)
4 estrelas: 08:45
3 estrelas: 09:20  
2 estrelas: 10:00
1 estrela:  10:30 (liberação mais tarde)
```

### Exemplo Prático
Para um turno que inicia às **09:00**:
- ⭐⭐⭐⭐⭐ (5 estrelas): Pode agendar a partir das **08:00**
- ⭐⭐⭐⭐ (4 estrelas): Pode agendar a partir das **08:45**
- ⭐⭐⭐ (3 estrelas): Pode agendar a partir das **09:20** (20min depois)
- ⭐⭐ (2 estrelas): Pode agendar a partir das **10:00** (1h depois)
- ⭐ (1 estrela): Pode agendar a partir das **10:30** (1h30 depois)

## 🔧 Configurações Disponíveis

### Tabela configuracoes_empresa
```sql
CREATE TABLE configuracoes_empresa (
  id UUID PRIMARY KEY,
  empresa_id UUID NOT NULL,
  chave TEXT NOT NULL,
  valor TEXT NOT NULL,
  tipo config_tipo NOT NULL,
  horario_liberacao_5_estrelas TIME DEFAULT '08:00:00',
  horario_liberacao_4_estrelas TIME DEFAULT '08:45:00',
  horario_liberacao_3_estrelas TIME DEFAULT '09:20:00',
  horario_liberacao_2_estrelas TIME DEFAULT '10:00:00',
  horario_liberacao_1_estrela TIME DEFAULT '10:30:00'
);
```

### Configurações Principais

#### 1. Habilitar Sistema de Horários
```sql
INSERT INTO configuracoes_empresa (empresa_id, chave, valor, tipo)
VALUES ('empresa-id', 'habilitarPriorizacaoHorarios', 'true', 'boolean');
```

#### 2. Permitir Agendamento no Mesmo Dia
```sql
INSERT INTO configuracoes_empresa (empresa_id, chave, valor, tipo)
VALUES ('empresa-id', 'permitirAgendamentoMesmoDia', 'true', 'boolean');
```

#### 3. Personalizar Horários por Estrelas
```sql
UPDATE configuracoes_empresa SET
  horario_liberacao_5_estrelas = '07:30:00',
  horario_liberacao_4_estrelas = '08:15:00',
  horario_liberacao_3_estrelas = '09:00:00',
  horario_liberacao_2_estrelas = '09:45:00',
  horario_liberacao_1_estrela = '10:15:00'
WHERE empresa_id = 'empresa-id';
```

## 💡 Casos de Uso

### Caso 1: Empresa com Alta Demanda
**Problema**: Todos os entregadores tentam agendar ao mesmo tempo
**Solução**: Usar horários escalonados para distribuir a demanda

```sql
-- Configuração mais restritiva
UPDATE configuracoes_empresa SET
  horario_liberacao_5_estrelas = '06:00:00',
  horario_liberacao_4_estrelas = '07:00:00',
  horario_liberacao_3_estrelas = '08:00:00',
  horario_liberacao_2_estrelas = '09:00:00',
  horario_liberacao_1_estrela = '10:00:00'
WHERE empresa_id = 'empresa-id';
```

### Caso 2: Empresa Pequena
**Problema**: Poucos entregadores, não precisa de restrições rígidas
**Solução**: Horários mais próximos ou desabilitar sistema

```sql
-- Horários mais próximos
UPDATE configuracoes_empresa SET
  horario_liberacao_5_estrelas = '08:00:00',
  horario_liberacao_4_estrelas = '08:10:00',
  horario_liberacao_3_estrelas = '08:20:00',
  horario_liberacao_2_estrelas = '08:30:00',
  horario_liberacao_1_estrela = '08:40:00'
WHERE empresa_id = 'empresa-id';

-- Ou desabilitar completamente
UPDATE configuracoes_empresa SET valor = 'false'
WHERE chave = 'habilitarPriorizacaoHorarios';
```

### Caso 3: Horário Noturno Especial
**Problema**: Turnos noturnos têm regras diferentes
**Solução**: Sistema considera horário atual, não o horário do turno

```sql
-- Para turnos noturnos (ex: 23:00), liberação às:
-- 5 estrelas: 22:00 (1h antes)
-- 4 estrelas: 22:15 (45min antes)
-- etc.
```

## 🔍 Validação e Debug

### Hook Principal: useConfiguracoesSistema
```typescript
const { 
  configs, 
  loading, 
  hasError, 
  podeVerAgendaPorHorario,
  isAgendamentoPermitido 
} = useConfiguracoesSistema();
```

### Função de Validação
```typescript
const validacao = isAgendamentoPermitido(data, horaInicioTurno);
console.log(validacao.permitido); // true/false
console.log(validacao.motivo); // Motivo se bloqueado
```

### Logs de Debug
```javascript
// Verificar configurações carregadas
logger.info('Configs carregadas:', {
  habilitarPriorizacaoHorarios: configs?.habilitarPriorizacaoHorarios,
  horarios: {
    estrelas5: configs?.horario_liberacao_5_estrelas,
    estrelas4: configs?.horario_liberacao_4_estrelas,
    // ...
  }
});
```

## ⚠️ Considerações Importantes

### 1. Fuso Horário
- Sistema usa horário local do navegador
- Importante sincronizar com fuso da empresa

### 2. Performance
- Configurações são carregadas uma vez por sessão
- Cache automático no useConfiguracoesSistema

### 3. Fallback
- Se sistema falhar, usa horários padrão
- Nunca bloqueia completamente o acesso

### 4. Compatibilidade
- Sistema antigo por horas de antecedência ainda funciona
- Migração gradual recomendada

## 🚀 Implementação Recomendada

### Etapa 1: Teste em Ambiente Controlado
```sql
-- Habilitar apenas para uma empresa de teste
UPDATE configuracoes_empresa 
SET valor = 'true'
WHERE empresa_id = 'empresa-teste' 
AND chave = 'habilitarPriorizacaoHorarios';
```

### Etapa 2: Monitorar Comportamento
- Verificar logs do sistema
- Confirmar horários de liberação
- Testar diferentes níveis de estrelas

### Etapa 3: Expandir Gradualmente
- Aplicar para empresas maiores
- Ajustar horários conforme necessário
- Coletar feedback dos entregadores

---
*Última atualização: 14/06/2025*
