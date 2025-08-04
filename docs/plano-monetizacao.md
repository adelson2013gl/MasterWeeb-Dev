# Plano de Monetização - Master Web

## Visão Geral

Este documento apresenta o plano de implementação do modelo de monetização por assinatura para o Master Web, um sistema de gestão de agendamentos para empresas de entrega.

## Análise da Estrutura Atual

### ✅ Estruturas Existentes (80% Pronto)

- **Sistema Multi-tenant**: Estrutura de empresas já implementada
- **Sistema de Permissões**: Roles definidos (super_admin, admin_empresa, entregador)
- **Configurações por Empresa**: Tabela `configuracoes_empresa` existente
- **Campos de Limite**: `max_entregadores` e `max_agendas_mes` já definidos
- **Campo de Plano**: Interface `Empresa` já possui campo `plano`
- **Data de Vencimento**: Campo `data_vencimento` já existe

### 🔧 Implementações Necessárias (20% Restante)

- Sistema de billing e cobrança
- Middleware de validação de limites
- Dashboard de billing
- Integração com gateway de pagamento

## Modelo de Planos Sugerido

### Plano Básico - R$ 49/mês
- Até 5 entregadores
- Até 100 agendamentos/mês
- Suporte por email
- Relatórios básicos

### Plano Pro - R$ 99/mês
- Até 15 entregadores
- Até 500 agendamentos/mês
- Suporte prioritário
- Relatórios avançados
- Integração com WhatsApp

### Plano Enterprise - R$ 199/mês
- Entregadores ilimitados
- Agendamentos ilimitados
- Suporte dedicado
- Relatórios personalizados
- API personalizada
- White label

## Plano de Implementação

### Fase 1: Preparação e Configuração (1-2 semanas)

#### Configurar Ambiente de Desenvolvimento/Staging
- [ ] Criar um ambiente separado para testes de monetização
- [ ] Configurar o Supabase para o novo ambiente

#### Integração com Gateway de Pagamento
- [ ] Escolher um gateway de pagamento (Stripe, Mercado Pago, Asaas, etc.)
- [ ] Configurar as chaves de API e webhooks no Supabase e no backend
- [ ] Implementar a lógica inicial de comunicação com o gateway (criação de clientes, assinaturas)

#### Atualizar Estrutura do Banco de Dados (se necessário)
- [ ] Revisar a tabela `empresas` e `user_roles` para garantir que suportam os planos e status de assinatura
- [ ] Adicionar tabelas para gerenciar assinaturas, transações e histórico de pagamentos
- [ ] Criar ou atualizar políticas RLS para as novas tabelas

### Fase 2: Desenvolvimento do Backend (2-3 semanas)

#### Serviços de Assinatura
- [ ] Criar serviços no backend para gerenciar assinaturas (criação, cancelamento, atualização)
- [ ] Implementar a lógica de webhook para processar eventos do gateway de pagamento (pagamento bem-sucedido, falha, cancelamento)

#### Middleware de Validação de Limites
- [ ] Desenvolver middleware para verificar os limites de uso (entregadores, agendamentos) com base no plano da empresa
- [ ] Integrar o middleware nos endpoints relevantes (criação de entregador, criação de agendamento)

#### Endpoints de API
- [ ] Criar endpoints para o frontend interagir com o sistema de billing (obter status da assinatura, histórico de pagamentos)

### Fase 3: Desenvolvimento do Frontend (2-3 semanas)

#### Dashboard de Billing
- [ ] Criar uma nova seção no dashboard do administrador para gerenciar a assinatura da empresa
- [ ] Exibir informações do plano atual, status, data de vencimento e histórico de pagamentos
- [ ] Implementar a interface para upgrade/downgrade de planos e cancelamento

#### Componentes de Limite
- [ ] Desenvolver componentes visuais para exibir o uso atual e os limites do plano (ex: "X de Y entregadores utilizados")
- [ ] Implementar feedback visual quando os limites estiverem próximos ou excedidos

#### Fluxo de Checkout
- [ ] Criar o fluxo de checkout para novas assinaturas e upgrades de plano
- [ ] Integrar com o gateway de pagamento para processar pagamentos

### Fase 4: Testes e Implantação (1 semana)

#### Testes Unitários e de Integração
- [ ] Escrever testes para os serviços de assinatura, middleware e endpoints de API
- [ ] Testar a integração com o gateway de pagamento

#### Testes de End-to-End
- [ ] Realizar testes completos do fluxo de assinatura, upgrade, downgrade e cancelamento
- [ ] Testar a validação de limites em diferentes cenários

#### Implantação
- [ ] Implantar as mudanças no ambiente de produção
- [ ] Monitorar o sistema após a implantação

## Estrutura de Dados Necessária

### Tabela: `assinaturas`
```sql
CREATE TABLE assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id),
  plano VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- active, canceled, past_due, etc.
  gateway_subscription_id VARCHAR(255),
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_vencimento TIMESTAMP WITH TIME ZONE,
  valor DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela: `transacoes`
```sql
CREATE TABLE transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id UUID REFERENCES assinaturas(id),
  gateway_transaction_id VARCHAR(255),
  valor DECIMAL(10,2),
  status VARCHAR(20), -- pending, completed, failed, etc.
  data_transacao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Métricas de Sucesso (KPIs)

### Métricas de Conversão
- Taxa de conversão de trial para pago: > 15%
- Taxa de upgrade de plano: > 10%
- Churn rate mensal: < 5%

### Métricas Financeiras
- MRR (Monthly Recurring Revenue): Meta de R$ 10.000 em 6 meses
- ARPU (Average Revenue Per User): R$ 80-120
- LTV (Lifetime Value): > R$ 1.000

### Métricas de Produto
- Tempo médio para primeiro agendamento: < 24h
- Utilização de limites: 70-80% dos usuários próximos aos limites
- NPS (Net Promoter Score): > 50

## Riscos e Mitigações

### Riscos Técnicos
- **Falhas na integração de pagamento**: Implementar fallbacks e monitoramento
- **Performance com validações**: Otimizar queries e usar cache
- **Sincronização de dados**: Implementar retry logic e logs detalhados

### Riscos de Negócio
- **Resistência ao modelo pago**: Período de trial gratuito de 30 dias
- **Concorrência**: Foco em diferenciação e qualidade do produto
- **Sazonalidade**: Planos flexíveis e descontos estratégicos

## Timeline Resumido

- **Mês 1**: Desenvolvimento e testes
- **Mês 2**: Implementação e ajustes
- **Mês 3**: Lançamento e primeiros clientes pagantes
- **Meta**: 10 clientes pagantes até o final do 3º mês

## Próximos Passos

1. **Validação da Equipe**: Revisar e validar cada fase do plano
2. **Escolha do Gateway**: Definir entre Stripe, Mercado Pago ou Asaas
3. **Priorização**: Definir ordem de implementação das funcionalidades
4. **Recursos**: Alocar desenvolvedores para cada fase
5. **Timeline**: Ajustar cronograma conforme capacidade da equipe

## Observações

- Este plano será validado gradualmente pela equipe
- As fases podem ser ajustadas conforme necessidades específicas
- O foco inicial deve ser na validação de limites e integração de pagamento
- A documentação será atualizada conforme o progresso da implementação

---

**Documento criado em**: Janeiro 2025  
**Última atualização**: Janeiro 2025  
**Status**: Em validação pela equipe