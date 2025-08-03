-- =========================================
-- FIX: Missing expiry functions and logs table
-- =========================================

-- Create logs_sistema table if it doesn't exist
CREATE TABLE IF NOT EXISTS logs_sistema (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evento VARCHAR(255) NOT NULL,
    detalhes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para verificar e suspender empresas vencidas (CORRIGIDA)
CREATE OR REPLACE FUNCTION check_empresa_expiry()
RETURNS void AS $$
DECLARE
  empresa_record RECORD;
  affected_count INTEGER := 0;
BEGIN
  -- Buscar empresas ativas que estão vencidas
  FOR empresa_record IN 
    SELECT id, nome, data_expiracao 
    FROM empresas 
    WHERE data_expiracao < CURRENT_DATE 
      AND ativa = true
  LOOP
    -- Suspender empresa
    UPDATE empresas 
    SET 
      ativa = false,
      updated_at = NOW()
    WHERE id = empresa_record.id;
    
    affected_count := affected_count + 1;
    
    -- Log da suspensão
    BEGIN
      INSERT INTO logs_sistema (evento, detalhes, created_at)
      VALUES (
        'empresa_suspensa_vencimento',
        json_build_object(
          'empresa_id', empresa_record.id, 
          'empresa_nome', empresa_record.nome, 
          'data_expiracao', empresa_record.data_expiracao,
          'data_suspensao', NOW()
        ),
        NOW()
      );
    EXCEPTION
      WHEN undefined_table THEN
        -- Se tabela logs_sistema não existir, apenas continuar
        NULL;
    END;
  END LOOP;
  
  -- Log do processo
  RAISE NOTICE 'check_empresa_expiry: % empresas suspensas por vencimento', affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de vencimento (CORRIGIDA)
CREATE OR REPLACE FUNCTION get_expiry_stats()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_empresas', (SELECT COUNT(*) FROM empresas),
    'empresas_ativas', (SELECT COUNT(*) FROM empresas WHERE ativa = true),
    'empresas_inativas', (SELECT COUNT(*) FROM empresas WHERE ativa = false),
    'empresas_vencidas', (
      SELECT COUNT(*) 
      FROM empresas 
      WHERE data_expiracao < CURRENT_DATE 
        AND ativa = true
    ),
    'empresas_vencem_30_dias', (
      SELECT COUNT(*) 
      FROM empresas 
      WHERE data_expiracao BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
        AND ativa = true
    ),
    'empresas_sem_vencimento', (
      SELECT COUNT(*) 
      FROM empresas 
      WHERE data_expiracao IS NULL 
        AND ativa = true
    ),
    'ultima_verificacao', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log de criação das funções
INSERT INTO logs_sistema (evento, detalhes, created_at)
VALUES (
  'check_empresa_expiry_function_created',
  json_build_object(
    'action', 'create_functions',
    'functions', ARRAY['check_empresa_expiry', 'get_expiry_stats'],
    'corrected_field_names', json_build_object(
      'data_vencimento_to', 'data_expiracao',
      'status_to', 'ativa'
    )
  ),
  NOW()
);

-- Comentários
COMMENT ON FUNCTION check_empresa_expiry() IS 'Verifica e suspende empresas com vencimento expirado';
COMMENT ON FUNCTION get_expiry_stats() IS 'Retorna estatísticas de vencimento das empresas';
COMMENT ON TABLE logs_sistema IS 'Tabela de logs do sistema de vencimento';