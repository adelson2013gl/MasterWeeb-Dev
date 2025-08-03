-- =========================================
-- CORREÇÃO COMPLETA DO STATUS DA EMPRESA
-- =========================================

-- 1. Atualizar empresa com todos os campos necessários
UPDATE empresas 
SET 
    ativa = true,
    plano_atual = 'empresarial',
    max_entregadores = 50,
    max_agendas_mes = 2000,
    data_expiracao = NOW() + INTERVAL '5 years'  -- 5 anos no futuro
WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- 2. Remover assinatura existente (se houver)
DELETE FROM assinaturas WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- 3. Criar nova assinatura ativa
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
    NOW() + INTERVAL '5 years',
    'abacatepay',
    50,
    2000
);

-- 4. Criar transação aprovada para mostrar pagamento em dia
INSERT INTO transacoes (
    assinatura_id,
    empresa_id,
    valor,
    status,
    metodo_pagamento,
    data_pagamento,
    descricao
) VALUES (
    (SELECT id FROM assinaturas WHERE empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' LIMIT 1),
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    99.90,
    'aprovado',
    'PIX',
    NOW(),
    'Pagamento inicial - Sistema MasterWeeb'
);

-- 5. Atualizar configurações da empresa para garantir que está ativa
INSERT INTO configuracoes_empresa (empresa_id, chave, valor, descricao)
VALUES 
    ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'plano_ativo', 'true', 'Plano está ativo'),
    ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'status_pagamento', 'em_dia', 'Pagamentos em dia'),
    ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'limite_vencido', 'false', 'Não está vencido')
ON CONFLICT (empresa_id, chave) 
DO UPDATE SET 
    valor = EXCLUDED.valor,
    updated_at = NOW();

-- 6. Verificar e mostrar status final
SELECT 
    e.id,
    e.nome,
    e.ativa as empresa_ativa,
    e.plano_atual,
    e.data_expiracao,
    a.status as status_assinatura,
    a.plano as plano_assinatura,
    t.status as status_transacao
FROM empresas e
LEFT JOIN assinaturas a ON a.empresa_id = e.id
LEFT JOIN transacoes t ON t.empresa_id = e.id
WHERE e.id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- =========================================
-- FINALIZAÇÃO
-- =========================================
-- Empresa totalmente ativada!