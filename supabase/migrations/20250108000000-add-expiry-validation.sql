
-- Função para verificar e suspender empresas vencidas
CREATE OR REPLACE FUNCTION check_empresa_expiry()
RETURNS void AS $$
DECLARE
  empresa_record RECORD;
  affected_count INTEGER := 0;
BEGIN
  -- Buscar empresas ativas que estão vencidas
  FOR empresa_record IN 
    SELECT id, nome, data_vencimento 
    FROM empresas 
    WHERE data_vencimento < CURRENT_DATE 
      AND status = 'ativo'
  LOOP
    -- Suspender empresa
    UPDATE empresas 
    SET 
      status = 'suspenso',
      updated_at = NOW()
    WHERE id = empresa_record.id;
    
    affected_count := affected_count + 1;
    
    -- Log da suspensão (se a tabela existir)
    BEGIN
      INSERT INTO logs_sistema (evento, detalhes, created_at)
      VALUES (
        'empresa_suspensa_vencimento',
        json_build_object(
          'empresa_id', empresa_record.id, 
          'empresa_nome', empresa_record.nome, 
          'data_vencimento', empresa_record.data_vencimento,
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
  
  -- Log do processo (apenas para debug)
  RAISE NOTICE 'check_empresa_expiry: % empresas suspensas por vencimento', affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de vencimento
CREATE OR REPLACE FUNCTION get_expiry_stats()
RETURNS json AS $$
DECLARE
  result json;
  expired_count INTEGER;
  expiring7_count INTEGER;
  expiring30_count INTEGER;
  total_active INTEGER;
BEGIN
  -- Contar empresas vencidas
  SELECT COUNT(*) INTO expired_count
  FROM empresas 
  WHERE data_vencimento < CURRENT_DATE;
  
  -- Contar empresas que vencem em 7 dias
  SELECT COUNT(*) INTO expiring7_count
  FROM empresas 
  WHERE data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';
  
  -- Contar empresas que vencem em 30 dias
  SELECT COUNT(*) INTO expiring30_count
  FROM empresas 
  WHERE data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';
  
  -- Contar total de empresas ativas
  SELECT COUNT(*) INTO total_active
  FROM empresas 
  WHERE status = 'ativo';
  
  -- Montar resultado
  SELECT json_build_object(
    'expired', expired_count,
    'expiring7Days', expiring7_count,
    'expiring30Days', expiring30_count,
    'total', total_active,
    'updated_at', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configurar CRON Job para execução diária às 00:00 (agora que pg_cron está habilitado)
DO $$
BEGIN
  -- Primeiro, remover job existente se houver
  PERFORM cron.unschedule('check-expiry-daily');
EXCEPTION
  WHEN OTHERS THEN
    -- Se der erro (job não existe), apenas continuar
    NULL;
END $$;

-- Agendar nova execução diária às 00:00
SELECT cron.schedule(
  'check-expiry-daily',           -- Nome do job
  '0 0 * * *',                   -- Todo dia às 00:00
  'SELECT check_empresa_expiry();' -- Comando a executar
);

-- Comentários informativos
COMMENT ON FUNCTION check_empresa_expiry() IS 'Verifica e suspende empresas com vencimento em atraso - Executado diariamente via CRON';
COMMENT ON FUNCTION get_expiry_stats() IS 'Retorna estatísticas de vencimento das empresas';

-- Log da configuração do CRON
DO $$
BEGIN
  INSERT INTO logs_sistema (evento, detalhes, created_at)
  VALUES (
    'cron_expiry_configured',
    json_build_object(
      'job_name', 'check-expiry-daily',
      'schedule', '0 0 * * *',
      'function', 'check_empresa_expiry',
      'configured_at', NOW()
    ),
    NOW()
  );
EXCEPTION
  WHEN undefined_table THEN
    -- Se tabela logs_sistema não existir, apenas mostrar mensagem
    RAISE NOTICE 'CRON job "check-expiry-daily" configurado com sucesso para execução diária às 00:00';
END $$;
