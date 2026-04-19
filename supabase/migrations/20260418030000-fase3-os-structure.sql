-- =====================================================================
-- Fase 3: Nova estrutura de Ordem de Servico (OS)
-- =====================================================================
-- Contexto: frigorifico (manutencao industrial interna)
-- Estrategia: Big Bang (sem usuarios ativos em producao)
-- Projeto alvo: MasterWeb (xuuvxxlaaqjbcoklxrrv)
--
-- Dados que serao perdidos:
--   agendamentos(1), agendas(3), turnos(4), regioes(2), cidades(2)
-- Dados preservados: empresas(2), tecnicos(7), user_roles, assinaturas
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 3.1 Novos enums
-- ---------------------------------------------------------------------
CREATE TYPE public.status_os AS ENUM (
  'aberta',
  'em_andamento',
  'finalizada',
  'cancelada'
);

CREATE TYPE public.prioridade_os AS ENUM (
  'baixa',
  'media',
  'alta',
  'urgente'
);

-- ---------------------------------------------------------------------
-- 3.2 Tabela setores (nova)
-- ---------------------------------------------------------------------
CREATE TABLE public.setores (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  descricao   text,
  ativo       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT setores_empresa_nome_uniq UNIQUE (empresa_id, nome)
);

CREATE INDEX idx_setores_empresa_id ON public.setores(empresa_id);
CREATE INDEX idx_setores_ativo ON public.setores(ativo) WHERE ativo = true;

CREATE TRIGGER update_setores_updated_at
  BEFORE UPDATE ON public.setores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "setores_select"
  ON public.setores
  FOR SELECT
  USING (public.user_has_empresa_access(empresa_id));

CREATE POLICY "setores_insert"
  ON public.setores
  FOR INSERT
  WITH CHECK (public.user_has_empresa_access(empresa_id));

CREATE POLICY "setores_update"
  ON public.setores
  FOR UPDATE
  USING (public.user_has_empresa_access(empresa_id))
  WITH CHECK (public.user_has_empresa_access(empresa_id));

CREATE POLICY "setores_delete"
  ON public.setores
  FOR DELETE
  USING (public.user_has_empresa_access(empresa_id));

-- ---------------------------------------------------------------------
-- 3.3 Limpeza: drop FK de tecnicos antes de dropar cidades
-- ---------------------------------------------------------------------
ALTER TABLE public.tecnicos DROP COLUMN IF EXISTS cidade_id;

-- ---------------------------------------------------------------------
-- 3.4 Dropar tabelas delivery obsoletas (CASCADE remove FKs e policies)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS public.agendamentos CASCADE;
DROP TABLE IF EXISTS public.agendas      CASCADE;
DROP TABLE IF EXISTS public.turnos       CASCADE;
DROP TABLE IF EXISTS public.regioes      CASCADE;
DROP TABLE IF EXISTS public.cidades      CASCADE;

-- ---------------------------------------------------------------------
-- 3.5 Dropar enums obsoletos
-- ---------------------------------------------------------------------
DROP TYPE IF EXISTS public.status_agendamento CASCADE;
DROP TYPE IF EXISTS public.tipo_agendamento   CASCADE;

-- ---------------------------------------------------------------------
-- 3.6 Tabela ordens_servico (nova)
-- ---------------------------------------------------------------------
CREATE SEQUENCE public.ordens_servico_numero_seq START 1;

CREATE TABLE public.ordens_servico (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_os             bigint NOT NULL DEFAULT nextval('public.ordens_servico_numero_seq'),
  empresa_id            uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  setor_id              uuid REFERENCES public.setores(id) ON DELETE SET NULL,
  tecnico_id            uuid REFERENCES public.tecnicos(id) ON DELETE SET NULL,
  titulo                text NOT NULL,
  descricao_problema    text NOT NULL,
  descricao_solucao     text,
  prioridade            public.prioridade_os NOT NULL DEFAULT 'media',
  status                public.status_os     NOT NULL DEFAULT 'aberta',
  equipamento           text,
  observacoes           text,
  data_abertura         timestamptz NOT NULL DEFAULT now(),
  data_inicio_execucao  timestamptz,
  data_conclusao        timestamptz,
  data_cancelamento     timestamptz,
  motivo_cancelamento   text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ordens_servico_numero_uniq UNIQUE (numero_os)
);

ALTER SEQUENCE public.ordens_servico_numero_seq OWNED BY public.ordens_servico.numero_os;

CREATE INDEX idx_ordens_servico_empresa_id  ON public.ordens_servico(empresa_id);
CREATE INDEX idx_ordens_servico_setor_id    ON public.ordens_servico(setor_id);
CREATE INDEX idx_ordens_servico_tecnico_id  ON public.ordens_servico(tecnico_id);
CREATE INDEX idx_ordens_servico_status      ON public.ordens_servico(status);
CREATE INDEX idx_ordens_servico_prioridade  ON public.ordens_servico(prioridade);

CREATE TRIGGER update_ordens_servico_updated_at
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ordens_servico_select"
  ON public.ordens_servico
  FOR SELECT
  USING (public.user_has_empresa_access(empresa_id));

CREATE POLICY "ordens_servico_insert"
  ON public.ordens_servico
  FOR INSERT
  WITH CHECK (public.user_has_empresa_access(empresa_id));

CREATE POLICY "ordens_servico_update"
  ON public.ordens_servico
  FOR UPDATE
  USING (public.user_has_empresa_access(empresa_id))
  WITH CHECK (public.user_has_empresa_access(empresa_id));

CREATE POLICY "ordens_servico_delete"
  ON public.ordens_servico
  FOR DELETE
  USING (public.user_has_empresa_access(empresa_id));

-- ---------------------------------------------------------------------
-- 3.7 Reescreve get_dashboard_stats para o novo schema de OS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(target_empresa_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
  v_total_tecnicos INTEGER;
  v_tecnicos_ativos INTEGER;
  v_total_setores INTEGER;
  v_setores_ativos INTEGER;
  v_total_os INTEGER;
  v_os_abertas INTEGER;
  v_os_em_andamento INTEGER;
  v_os_finalizadas INTEGER;
  v_os_canceladas INTEGER;
  v_os_hoje INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_tecnicos FROM tecnicos WHERE empresa_id = target_empresa_id;
  SELECT COUNT(*) INTO v_tecnicos_ativos FROM tecnicos WHERE empresa_id = target_empresa_id AND ativo = true AND status = 'aprovado';
  SELECT COUNT(*) INTO v_total_setores FROM setores WHERE empresa_id = target_empresa_id;
  SELECT COUNT(*) INTO v_setores_ativos FROM setores WHERE empresa_id = target_empresa_id AND ativo = true;
  SELECT COUNT(*) INTO v_total_os FROM ordens_servico WHERE empresa_id = target_empresa_id;
  SELECT COUNT(*) INTO v_os_abertas FROM ordens_servico WHERE empresa_id = target_empresa_id AND status = 'aberta';
  SELECT COUNT(*) INTO v_os_em_andamento FROM ordens_servico WHERE empresa_id = target_empresa_id AND status = 'em_andamento';
  SELECT COUNT(*) INTO v_os_finalizadas FROM ordens_servico WHERE empresa_id = target_empresa_id AND status = 'finalizada';
  SELECT COUNT(*) INTO v_os_canceladas FROM ordens_servico WHERE empresa_id = target_empresa_id AND status = 'cancelada';
  SELECT COUNT(*) INTO v_os_hoje FROM ordens_servico WHERE empresa_id = target_empresa_id AND DATE(data_abertura) = CURRENT_DATE;

  result := json_build_object(
    'tecnicos', json_build_object(
      'total', v_total_tecnicos,
      'ativos', v_tecnicos_ativos,
      'inativos', v_total_tecnicos - v_tecnicos_ativos
    ),
    'setores', json_build_object(
      'total', v_total_setores,
      'ativos', v_setores_ativos,
      'inativos', v_total_setores - v_setores_ativos
    ),
    'ordens_servico', json_build_object(
      'total', v_total_os,
      'abertas', v_os_abertas,
      'em_andamento', v_os_em_andamento,
      'finalizadas', v_os_finalizadas,
      'canceladas', v_os_canceladas,
      'hoje', v_os_hoje
    ),
    'resumo', json_build_object(
      'total_operacoes', v_total_os,
      'taxa_conclusao', CASE
        WHEN v_total_os > 0
        THEN ROUND((v_os_finalizadas::DECIMAL / v_total_os) * 100, 2)
        ELSE 0
      END
    )
  );

  RETURN result;
END;
$function$;

COMMIT;
