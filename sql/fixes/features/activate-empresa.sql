-- Ativar empresa teste e corrigir status
UPDATE empresas 
SET 
    ativa = true,
    plano_atual = 'empresarial',
    max_entregadores = 50,
    max_agendas_mes = 2000,
    data_expiracao = NOW() + INTERVAL '1 year'
WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Criar assinatura ativa para a empresa
INSERT INTO assinaturas (
    empresa_id,
    plano,
    status,
    valor_mensal,
    data_inicio,
    data_fim,
    gateway_type,
    limite_entregadores,
    limite_agendamentos_mes
) VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'empresarial',
    'ativa',
    99.90,
    NOW(),
    NOW() + INTERVAL '1 year',
    'abacatepay',
    50,
    2000
) ON CONFLICT DO NOTHING;