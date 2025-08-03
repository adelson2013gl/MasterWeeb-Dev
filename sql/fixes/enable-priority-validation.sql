-- =========================================
-- FIX: Habilitar validação de priorização por horários
-- =========================================
-- Este script insere as configurações necessárias para que o sistema
-- aplique a validação de priorização baseada em estrelas/horários

-- 1. Inserir configuração para habilitar priorização de horários em todas as empresas ativas
INSERT INTO configuracoes_empresa (empresa_id, chave, valor, tipo, categoria, descricao)
SELECT 
    e.id as empresa_id,
    'habilitarPriorizacaoHorarios' as chave,
    'true' as valor,  -- ATIVANDO a priorização
    'boolean' as tipo,
    'priorizacao' as categoria,
    'Habilitar sistema de horários específicos por estrelas - bloqueia entregadores 1 estrela até 10:30' as descricao
FROM empresas e
WHERE e.ativa = true
  AND NOT EXISTS (
    SELECT 1 FROM configuracoes_empresa ce 
    WHERE ce.empresa_id = e.id 
    AND ce.chave = 'habilitarPriorizacaoHorarios'
  )
ON CONFLICT (empresa_id, chave) DO UPDATE SET
    valor = 'true',
    descricao = 'Habilitar sistema de horários específicos por estrelas - bloqueia entregadores 1 estrela até 10:30',
    updated_at = NOW();

-- 2. Atualizar empresas que já têm a configuração mas está desabilitada
UPDATE configuracoes_empresa 
SET 
    valor = 'true',
    descricao = 'Habilitar sistema de horários específicos por estrelas - bloqueia entregadores 1 estrela até 10:30',
    updated_at = NOW()
WHERE chave = 'habilitarPriorizacaoHorarios'
  AND valor = 'false';

-- 3. Inserir configuração de horários específicos (registro especial com horários)
INSERT INTO configuracoes_empresa (
    empresa_id, 
    chave, 
    valor, 
    tipo, 
    categoria, 
    descricao,
    horario_liberacao_5_estrelas,
    horario_liberacao_4_estrelas,
    horario_liberacao_3_estrelas,
    horario_liberacao_2_estrelas,
    horario_liberacao_1_estrela
)
SELECT 
    e.id as empresa_id,
    'horarios_configurados' as chave,
    'true' as valor,
    'boolean' as tipo,
    'horarios' as categoria,
    'Configuração de horários específicos por estrelas' as descricao,
    '08:00:00'::TIME as horario_liberacao_5_estrelas,
    '08:45:00'::TIME as horario_liberacao_4_estrelas,
    '09:20:00'::TIME as horario_liberacao_3_estrelas,
    '10:00:00'::TIME as horario_liberacao_2_estrelas,
    '10:30:00'::TIME as horario_liberacao_1_estrela
FROM empresas e
WHERE e.ativa = true
  AND NOT EXISTS (
    SELECT 1 FROM configuracoes_empresa ce 
    WHERE ce.empresa_id = e.id 
    AND ce.chave = 'horarios_configurados'
  )
ON CONFLICT (empresa_id, chave) DO UPDATE SET
    valor = 'true',
    horario_liberacao_5_estrelas = '08:00:00'::TIME,
    horario_liberacao_4_estrelas = '08:45:00'::TIME,
    horario_liberacao_3_estrelas = '09:20:00'::TIME,
    horario_liberacao_2_estrelas = '10:00:00'::TIME,
    horario_liberacao_1_estrela = '10:30:00'::TIME,
    updated_at = NOW();

-- 4. Verificar se as configurações foram aplicadas corretamente
SELECT 
    e.nome as empresa_nome,
    ce1.valor as habilitarPriorizacaoHorarios,
    ce2.horario_liberacao_1_estrela,
    ce2.horario_liberacao_2_estrelas,
    ce2.horario_liberacao_3_estrelas,
    ce2.horario_liberacao_4_estrelas,
    ce2.horario_liberacao_5_estrelas,
    'Entregadores 1★ só podem ver agendas após 10:30' as efeito_esperado
FROM empresas e
LEFT JOIN configuracoes_empresa ce1 ON ce1.empresa_id = e.id AND ce1.chave = 'habilitarPriorizacaoHorarios'
LEFT JOIN configuracoes_empresa ce2 ON ce2.empresa_id = e.id AND ce2.chave = 'horarios_configurados'
WHERE e.ativa = true
ORDER BY e.nome;

-- 5. Log de confirmação
SELECT 
    COUNT(CASE WHEN ce.chave = 'habilitarPriorizacaoHorarios' AND ce.valor = 'true' THEN 1 END) as empresas_com_priorizacao_ativa,
    COUNT(CASE WHEN ce.chave = 'horarios_configurados' THEN 1 END) as empresas_com_horarios_configurados,
    COUNT(DISTINCT ce.empresa_id) as total_empresas_configuradas
FROM configuracoes_empresa ce
WHERE ce.chave IN ('habilitarPriorizacaoHorarios', 'horarios_configurados');

-- 6. Verificar entregadores 1 estrela que serão afetados
SELECT 
    COUNT(*) as entregadores_1_estrela_afetados,
    'Estes entregadores agora só verão agendas após 10:30' as info
FROM entregadores ent
JOIN empresas e ON e.id = ent.empresa_id
JOIN configuracoes_empresa ce ON ce.empresa_id = e.id
WHERE ent.estrelas = 1 
  AND ent.ativo = true 
  AND e.ativa = true
  AND ce.chave = 'habilitarPriorizacaoHorarios'
  AND ce.valor = 'true';