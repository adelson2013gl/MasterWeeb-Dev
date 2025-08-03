-- Adicionar campo categoria na tabela configuracoes_empresa
ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);

-- Atualizar registros existentes com categoria baseada na chave
UPDATE configuracoes_empresa 
SET categoria = CASE 
    WHEN chave LIKE '%horario%' OR chave = 'horarios' THEN 'horarios'
    WHEN chave LIKE '%agendamento%' OR chave = 'permitirAgendamentoMesmoDia' THEN 'agendamento'
    WHEN chave LIKE '%priorizacao%' OR chave = 'habilitarPriorizacao' THEN 'priorizacao'
    ELSE 'geral'
END
WHERE categoria IS NULL;

-- Verificar resultado
SELECT chave, categoria, COUNT(*) as total 
FROM configuracoes_empresa 
GROUP BY chave, categoria 
ORDER BY categoria, chave;