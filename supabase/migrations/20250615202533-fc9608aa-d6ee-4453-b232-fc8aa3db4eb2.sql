
-- CORREÇÃO CRÍTICA: Resolver ambiguidade de agenda_id na função check_agenda_consistency
-- O erro "column reference 'agenda_id' is ambiguous" está quebrando o Monitor de Overbooking

CREATE OR REPLACE FUNCTION public.check_agenda_consistency()
RETURNS TABLE(
  agenda_id uuid,
  data date,
  vagas_disponiveis integer,
  vagas_ocupadas integer,
  agendamentos_reais bigint,
  ocupacao_percentual numeric,
  inconsistente boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as agenda_id,
    a.data,
    a.vagas_disponiveis,
    a.vagas_ocupadas,
    COALESCE(ag_count.total, 0) as agendamentos_reais,
    CASE 
      WHEN a.vagas_disponiveis > 0 THEN 
        ROUND((a.vagas_ocupadas::numeric / a.vagas_disponiveis::numeric) * 100, 1)
      ELSE 0 
    END as ocupacao_percentual,
    (a.vagas_ocupadas != COALESCE(ag_count.total, 0) OR a.vagas_ocupadas > a.vagas_disponiveis) as inconsistente
  FROM public.agendas a
  LEFT JOIN (
    SELECT ag.agenda_id, COUNT(*) as total
    FROM public.agendamentos ag
    WHERE ag.status = 'agendado'
    GROUP BY ag.agenda_id
  ) ag_count ON a.id = ag_count.agenda_id
  WHERE a.ativo = true
  ORDER BY a.data DESC, inconsistente DESC;
END;
$$ LANGUAGE plpgsql;

-- Log da correção
DO $$
BEGIN
    RAISE NOTICE '🔧 CORREÇÃO DA FUNÇÃO check_agenda_consistency EXECUTADA:';
    RAISE NOTICE '   ✅ Resolvida ambiguidade de agenda_id';
    RAISE NOTICE '   ✅ Monitor de Overbooking deve funcionar corretamente agora';
    RAISE NOTICE '   📊 Testando função...';
    
    -- Testar se a função funciona sem erros
    PERFORM * FROM public.check_agenda_consistency() LIMIT 1;
    
    RAISE NOTICE '   ✅ Função testada com sucesso!';
END $$;
