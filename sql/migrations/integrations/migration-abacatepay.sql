-- Migration AbacatePay para execução no Supabase Dashboard
-- Execute este script no SQL Editor do Supabase

-- 1. Atualizar tabela assinaturas para AbacatePay
ALTER TABLE assinaturas 
ADD COLUMN IF NOT EXISTS abacatepay_bill_id TEXT,
ADD COLUMN IF NOT EXISTS gateway_type TEXT DEFAULT 'abacatepay';

-- 2. Atualizar tabela transacoes para AbacatePay  
ALTER TABLE transacoes 
ADD COLUMN IF NOT EXISTS abacatepay_bill_id TEXT,
ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT DEFAULT 'PIX';

-- 3. Criar tabela para webhooks AbacatePay
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

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_assinaturas_abacatepay_bill_id ON assinaturas(abacatepay_bill_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_abacatepay_bill_id ON transacoes(abacatepay_bill_id);
CREATE INDEX IF NOT EXISTS idx_abacatepay_webhooks_bill_id ON abacatepay_webhooks(bill_id);
CREATE INDEX IF NOT EXISTS idx_abacatepay_webhooks_empresa_id ON abacatepay_webhooks(empresa_id);

-- 5. Habilitar RLS
ALTER TABLE abacatepay_webhooks ENABLE ROW LEVEL SECURITY;

-- 6. Política para inserir webhooks (sistema pode inserir)
CREATE POLICY "System can insert webhooks" ON abacatepay_webhooks
  FOR INSERT WITH CHECK (true);

-- 7. Política para visualizar webhooks (apenas super admins)
CREATE POLICY "Webhooks viewable by super admins" ON abacatepay_webhooks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- 8. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_abacatepay_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para updated_at
DROP TRIGGER IF EXISTS update_abacatepay_webhooks_updated_at ON abacatepay_webhooks;
CREATE TRIGGER update_abacatepay_webhooks_updated_at
  BEFORE UPDATE ON abacatepay_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_abacatepay_webhooks_updated_at();

-- 10. Verificar se tudo foi criado corretamente
SELECT 
  'assinaturas' as tabela,
  COUNT(*) as count_registros,
  'Coluna abacatepay_bill_id: ' || 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assinaturas' 
    AND column_name = 'abacatepay_bill_id'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status_coluna
FROM assinaturas

UNION ALL

SELECT 
  'abacatepay_webhooks' as tabela,
  COUNT(*) as count_registros,
  'Tabela: ' || 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'abacatepay_webhooks'
  ) THEN 'EXISTS' ELSE 'MISSING' END as status_coluna
FROM abacatepay_webhooks;