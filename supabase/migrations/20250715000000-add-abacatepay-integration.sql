-- Migration para integração AbacatePay
-- Adicionar colunas para AbacatePay nas tabelas existentes

-- Atualizar tabela assinaturas para AbacatePay
ALTER TABLE assinaturas 
ADD COLUMN IF NOT EXISTS abacatepay_bill_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_type TEXT DEFAULT 'abacatepay';

-- Atualizar tabela transacoes para AbacatePay
ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS abacatepay_bill_id TEXT,
ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT DEFAULT 'PIX';

-- Criar tabela para webhooks AbacatePay (se não existir)
CREATE TABLE IF NOT EXISTS abacatepay_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento TEXT NOT NULL,
  bill_id TEXT NOT NULL,
  empresa_id UUID REFERENCES empresas(id),
  payload JSONB NOT NULL,
  processado BOOLEAN DEFAULT FALSE,
  erro TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_assinaturas_abacatepay_bill_id ON assinaturas(abacatepay_bill_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_abacatepay_bill_id ON transacoes(abacatepay_bill_id);
CREATE INDEX IF NOT EXISTS idx_abacatepay_webhooks_bill_id ON abacatepay_webhooks(bill_id);
CREATE INDEX IF NOT EXISTS idx_abacatepay_webhooks_empresa_id ON abacatepay_webhooks(empresa_id);
CREATE INDEX IF NOT EXISTS idx_abacatepay_webhooks_evento ON abacatepay_webhooks(evento);

-- Comentários para documentação
COMMENT ON COLUMN assinaturas.abacatepay_bill_id IS 'ID da cobrança no AbacatePay';
COMMENT ON COLUMN transacoes.abacatepay_bill_id IS 'ID da cobrança no AbacatePay';
COMMENT ON COLUMN transacoes.metodo_pagamento IS 'Método de pagamento (PIX, CARTAO, etc)';
COMMENT ON TABLE abacatepay_webhooks IS 'Log de webhooks recebidos do AbacatePay';

-- RLS (Row Level Security) para webhooks
ALTER TABLE abacatepay_webhooks ENABLE ROW LEVEL SECURITY;

-- Política para visualizar webhooks (apenas super admins)
CREATE POLICY "Webhooks viewable by super admins" ON abacatepay_webhooks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Política para inserir webhooks (sistema pode inserir)
CREATE POLICY "System can insert webhooks" ON abacatepay_webhooks
  FOR INSERT WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_abacatepay_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_abacatepay_webhooks_updated_at
  BEFORE UPDATE ON abacatepay_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_abacatepay_webhooks_updated_at();