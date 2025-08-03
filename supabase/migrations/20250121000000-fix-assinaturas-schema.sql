-- Migration to fix assinaturas table schema
-- Adding missing fields: valor_mensal, data_proximo_pagamento, metadata

-- Add missing columns to assinaturas table
ALTER TABLE assinaturas 
ADD COLUMN IF NOT EXISTS valor_mensal DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS data_proximo_pagamento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN assinaturas.valor_mensal IS 'Valor mensal da assinatura em reais';
COMMENT ON COLUMN assinaturas.data_proximo_pagamento IS 'Data do próximo pagamento da assinatura';
COMMENT ON COLUMN assinaturas.metadata IS 'Metadados adicionais da assinatura em formato JSON';

-- Create index for performance on data_proximo_pagamento
CREATE INDEX IF NOT EXISTS idx_assinaturas_data_proximo_pagamento 
ON assinaturas(data_proximo_pagamento) 
WHERE data_proximo_pagamento IS NOT NULL;

-- Update RLS policies if needed (they should inherit from existing policies)
-- No additional RLS changes needed as the existing policies cover these new columns