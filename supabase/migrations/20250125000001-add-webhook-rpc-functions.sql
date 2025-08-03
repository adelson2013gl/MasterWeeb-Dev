-- Funções RPC para consultar dados de webhooks
-- Criada em: 2025-01-25

-- Função para obter estatísticas de webhooks
CREATE OR REPLACE FUNCTION get_webhook_stats(days_back INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
    result JSON;
    data_inicio TIMESTAMP WITH TIME ZONE;
BEGIN
    data_inicio := NOW() - (days_back || ' days')::INTERVAL;
    
    -- Se a tabela não existir, retornar dados vazios
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mercadopago_webhooks') THEN
        RETURN json_build_object(
            'total', 0,
            'processados', 0,
            'falhados', 0,
            'invalidos', 0,
            'pendentes', 0,
            'tempoMedioMs', 0
        );
    END IF;
    
    SELECT json_build_object(
        'total', COUNT(*),
        'processados', COUNT(*) FILTER (WHERE status = 'processed'),
        'falhados', COUNT(*) FILTER (WHERE status = 'failed'),
        'invalidos', COUNT(*) FILTER (WHERE status = 'invalid'),
        'pendentes', COUNT(*) FILTER (WHERE status IN ('received', 'processing')),
        'tempoMedioMs', COALESCE(AVG(processing_time_ms), 0)::INTEGER
    )
    INTO result
    FROM mercadopago_webhooks
    WHERE created_at >= data_inicio;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, retornar dados vazios
        RETURN json_build_object(
            'total', 0,
            'processados', 0,
            'falhados', 0,
            'invalidos', 0,
            'pendentes', 0,
            'tempoMedioMs', 0
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter webhooks recentes
CREATE OR REPLACE FUNCTION get_recent_webhooks(limit_count INTEGER DEFAULT 10)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Se a tabela não existir, retornar array vazio
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mercadopago_webhooks') THEN
        RETURN '[]'::JSON;
    END IF;
    
    SELECT json_agg(
        json_build_object(
            'id', id,
            'webhook_id', webhook_id,
            'tipo', tipo,
            'status', status,
            'created_at', created_at,
            'error_message', error_message,
            'request_id', request_id
        )
        ORDER BY created_at DESC
    )
    INTO result
    FROM mercadopago_webhooks
    ORDER BY created_at DESC
    LIMIT limit_count;
    
    RETURN COALESCE(result, '[]'::JSON);
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, retornar array vazio
        RETURN '[]'::JSON;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar health dos webhooks
CREATE OR REPLACE FUNCTION get_webhook_health()
RETURNS JSON AS $$
DECLARE
    result JSON;
    stats JSON;
    health_score INTEGER;
    issues TEXT[] := '{}';
    recommendations TEXT[] := '{}';
BEGIN
    -- Obter estatísticas das últimas 24 horas
    stats := get_webhook_stats(1);
    
    -- Calcular health score
    IF (stats->>'total')::INTEGER = 0 THEN
        health_score := 100;
    ELSE
        health_score := 100 - 
            ((stats->>'falhados')::INTEGER * 100 / (stats->>'total')::INTEGER * 2) - 
            ((stats->>'invalidos')::INTEGER * 100 / (stats->>'total')::INTEGER * 1.5);
        health_score := GREATEST(0, health_score);
    END IF;
    
    -- Verificar problemas
    IF (stats->>'total')::INTEGER > 0 THEN
        -- Taxa de falha alta
        IF (stats->>'falhados')::INTEGER * 100 / (stats->>'total')::INTEGER > 10 THEN
            issues := array_append(issues, 'Taxa de falha alta: ' || 
                ((stats->>'falhados')::INTEGER * 100 / (stats->>'total')::INTEGER) || '%');
            recommendations := array_append(recommendations, 
                'Verificar logs de erro e corrigir problemas recorrentes');
        END IF;
        
        -- Taxa de webhooks inválidos alta
        IF (stats->>'invalidos')::INTEGER * 100 / (stats->>'total')::INTEGER > 5 THEN
            issues := array_append(issues, 'Taxa de webhooks inválidos alta: ' || 
                ((stats->>'invalidos')::INTEGER * 100 / (stats->>'total')::INTEGER) || '%');
            recommendations := array_append(recommendations, 
                'Verificar configuração do secret e validação de assinatura');
        END IF;
    END IF;
    
    -- Tempo de processamento alto
    IF (stats->>'tempoMedioMs')::INTEGER > 5000 THEN
        issues := array_append(issues, 'Tempo de processamento alto: ' || 
            (stats->>'tempoMedioMs') || 'ms');
        recommendations := array_append(recommendations, 
            'Otimizar processamento de webhooks');
    END IF;
    
    -- Muitos webhooks pendentes
    IF (stats->>'pendentes')::INTEGER > 10 THEN
        issues := array_append(issues, 'Muitos webhooks pendentes: ' || 
            (stats->>'pendentes'));
        recommendations := array_append(recommendations, 
            'Verificar se o processamento está funcionando corretamente');
    END IF;
    
    RETURN json_build_object(
        'isHealthy', array_length(issues, 1) IS NULL OR array_length(issues, 1) = 0,
        'healthScore', health_score,
        'issues', array_to_json(issues),
        'recommendations', array_to_json(recommendations),
        'stats', stats
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar webhooks antigos
CREATE OR REPLACE FUNCTION cleanup_old_webhooks(days_to_keep INTEGER DEFAULT 90)
RETURNS JSON AS $$
DECLARE
    deleted_count INTEGER;
    data_limite TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Se a tabela não existir, retornar 0
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mercadopago_webhooks') THEN
        RETURN json_build_object('deleted_count', 0, 'message', 'Tabela não existe');
    END IF;
    
    data_limite := NOW() - (days_to_keep || ' days')::INTERVAL;
    
    DELETE FROM mercadopago_webhooks 
    WHERE created_at < data_limite;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN json_build_object(
        'deleted_count', deleted_count,
        'cutoff_date', data_limite,
        'message', 'Limpeza concluída com sucesso'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'deleted_count', 0,
            'error', SQLERRM,
            'message', 'Erro durante a limpeza'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON FUNCTION get_webhook_stats(INTEGER) IS 'Retorna estatísticas dos webhooks do Mercado Pago para um período específico';
COMMENT ON FUNCTION get_recent_webhooks(INTEGER) IS 'Retorna os webhooks mais recentes do Mercado Pago';
COMMENT ON FUNCTION get_webhook_health() IS 'Verifica o health dos webhooks e retorna recomendações';
COMMENT ON FUNCTION cleanup_old_webhooks(INTEGER) IS 'Remove webhooks antigos para manutenção do banco'; 