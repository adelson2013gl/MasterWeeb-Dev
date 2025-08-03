
# Sistema de Enum Safety - Documentação Técnica

## 🎯 Visão Geral

O Sistema de Enum Safety garante que os valores de enum do banco de dados sejam utilizados de forma segura no frontend, prevenindo erros em runtime e garantindo consistência entre banco e aplicação.

## 🔧 Implementação

### Enums do Banco de Dados
```sql
-- status_agendamento
CREATE TYPE status_agendamento AS ENUM ('agendado', 'cancelado', 'concluido', 'pendente', 'confirmada');

-- tipo_agendamento  
CREATE TYPE tipo_agendamento AS ENUM ('vaga', 'reserva');

-- status_entregador
CREATE TYPE status_entregador AS ENUM ('pendente', 'aprovado', 'rejeitado');

-- perfil_usuario
CREATE TYPE perfil_usuario AS ENUM ('admin', 'entregador');
```

### Funções de Validação
```typescript
// src/lib/enumSafety.ts

export const safeStatus = (status: string): string => {
  const validStatuses = ['agendado', 'cancelado', 'concluido', 'pendente', 'confirmada'];
  
  if (!validStatuses.includes(status)) {
    console.error(`Status inválido: ${status}. Usando 'pendente' como fallback.`);
    return 'pendente';
  }
  
  return status;
};

export const safeTipo = (tipo: string): string => {
  const validTipos = ['vaga', 'reserva'];
  
  if (!validTipos.includes(tipo)) {
    console.error(`Tipo inválido: ${tipo}. Usando 'vaga' como fallback.`);
    return 'vaga';
  }
  
  return tipo;
};
```

## 📊 Uso em Componentes

### Hooks de Agendamento
```typescript
// useAgendamento.tsx
import { safeStatus, safeTipo } from '@/lib/enumSafety';

const tipoValidado = safeTipo(tipo);
const statusCalculado = tipoValidado === 'vaga' ? 'agendado' : 'pendente';
const statusValidado = safeStatus(statusCalculado);

const payload = {
  tipo: tipoValidado,
  status: statusValidado,
  // ... outros campos
};
```

### Consultas Supabase
```typescript
// Sempre usar enums validados em queries
const { data } = await supabase
  .from('agendamentos')
  .select('*')
  .eq('status', safeStatus('agendado'))
  .eq('tipo', safeTipo('vaga'));
```

## 🛡️ Validação no Banco

### Triggers de Validação
```sql
-- Trigger para validar enums
CREATE OR REPLACE FUNCTION validar_enum_agendamento()
RETURNS trigger AS $$
BEGIN
  -- Verifica status
  IF NEW.status IS NULL OR NOT (NEW.status::text = ANY (ARRAY['agendado', 'cancelado', 'concluido', 'pendente', 'confirmada'])) THEN
    RAISE EXCEPTION 'Valor inválido para status_agendamento: "%"', COALESCE(NEW.status::text, 'NULL');
  END IF;

  -- Verifica tipo
  IF NEW.tipo IS NULL OR NOT (NEW.tipo::text = ANY (ARRAY['vaga', 'reserva'])) THEN
    RAISE EXCEPTION 'Valor inválido para tipo_agendamento: "%"', COALESCE(NEW.tipo::text, 'NULL');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 🔍 Debugging e Logs

### Logs de Validação
```typescript
export const safeStatus = (status: string): string => {
  const validStatuses = ['agendado', 'cancelado', 'concluido', 'pendente', 'confirmada'];
  
  if (!validStatuses.includes(status)) {
    logger.error('❌ ENUM SAFETY: Status inválido detectado', {
      statusRecebido: status,
      statusValidos: validStatuses,
      fallback: 'pendente'
    }, 'ENUM_SAFETY');
    
    return 'pendente';
  }
  
  logger.debug('✅ ENUM SAFETY: Status validado com sucesso', {
    status
  }, 'ENUM_SAFETY');
  
  return status;
};
```

### Métricas de Validação
- Contagem de valores inválidos interceptados
- Tipos de erro mais frequentes
- Componentes que mais geram erros
- Performance da validação

## 🧪 Testes

### Casos de Teste
```typescript
describe('enumSafety', () => {
  describe('safeStatus', () => {
    it('deve retornar status válido inalterado', () => {
      expect(safeStatus('agendado')).toBe('agendado');
    });
    
    it('deve retornar fallback para status inválido', () => {
      expect(safeStatus('invalid')).toBe('pendente');
    });
    
    it('deve logar erro para status inválido', () => {
      const spy = jest.spyOn(console, 'error');
      safeStatus('invalid');
      expect(spy).toHaveBeenCalled();
    });
  });
});
```

## ⚠️ Considerações

### Performance
- Validação O(1) com Set lookup
- Cache de valores válidos
- Lazy loading de definições

### Evolução de Enums
```typescript
// Processo para adicionar novos valores
1. Adicionar no banco: ALTER TYPE status_agendamento ADD VALUE 'novo_status';
2. Atualizar enumSafety.ts
3. Atualizar testes
4. Deploy coordenado
```

### Fallbacks Seguros
```typescript
// Estratégias de fallback por contexto
const fallbackStrategies = {
  status: 'pendente',     // Estado mais seguro
  tipo: 'vaga',          // Comportamento padrão  
  perfil: 'entregador',  // Menor privilégio
  prioridade: 'baixa'    // Menor impacto
};
```

## 📈 Benefícios

### Segurança
- Prevenção de SQL injection via enum
- Valores sempre válidos no banco
- Consistência entre frontend/backend

### Desenvolvimento
- Erros detectados em development
- Autocompletion melhorado
- Refactoring mais seguro

### Manutenção
- Mudanças de enum centralizadas
- Logs detalhados para debugging
- Migração de dados mais segura

---
*Documentação técnica - Última atualização: 16/06/2025*
