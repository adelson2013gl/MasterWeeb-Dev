-- =====================================================================
-- Fase 2 / Task 2.1 — Rename semântico: entregadores → tecnicos
-- =====================================================================
-- Estratégia C (big bang): sistema em preparação, sem usuários ativos.
-- Single transaction: tudo ou nada.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Renomes estruturais
-- ---------------------------------------------------------------------

-- 1.1 Tabela
ALTER TABLE public.entregadores RENAME TO tecnicos;

-- 1.2 Coluna FK em agendamentos
ALTER TABLE public.agendamentos RENAME COLUMN entregador_id TO tecnico_id;

-- 1.3 Enum tipo
ALTER TYPE public.status_entregador RENAME TO status_tecnico;

-- 1.4 Enum valor (perfil_usuario)
ALTER TYPE public.perfil_usuario RENAME VALUE 'entregador' TO 'tecnico';

-- ---------------------------------------------------------------------
-- 2. Renames de constraints, índices e trigger (cosméticos mas importantes)
-- ---------------------------------------------------------------------

ALTER INDEX public.entregadores_pkey               RENAME TO tecnicos_pkey;
ALTER INDEX public.idx_entregadores_ativo          RENAME TO idx_tecnicos_ativo;
ALTER INDEX public.idx_entregadores_email_unique   RENAME TO idx_tecnicos_email_unique;
ALTER INDEX public.idx_entregadores_empresa_id     RENAME TO idx_tecnicos_empresa_id;

ALTER TABLE public.tecnicos RENAME CONSTRAINT entregadores_empresa_id_fkey TO tecnicos_empresa_id_fkey;
ALTER TABLE public.tecnicos RENAME CONSTRAINT entregadores_cidade_id_fkey  TO tecnicos_cidade_id_fkey;
ALTER TABLE public.agendamentos RENAME CONSTRAINT agendamentos_entregador_id_fkey TO agendamentos_tecnico_id_fkey;

ALTER TRIGGER trigger_entregadores_updated_at ON public.tecnicos RENAME TO trigger_tecnicos_updated_at;

-- ---------------------------------------------------------------------
-- 3. Recriar funções plpgsql (corpo é texto, não atualiza automaticamente)
-- ---------------------------------------------------------------------

-- 3.1 Renomeia a função (preserva OID → policies que a usam continuam válidas)
ALTER FUNCTION public.get_current_entregador_id() RENAME TO get_current_tecnico_id;

-- 3.2 Atualiza o corpo para consultar tecnicos
CREATE OR REPLACE FUNCTION public.get_current_tecnico_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN (
        SELECT t.id
        FROM public.tecnicos t
        WHERE t.user_id = auth.uid()
        LIMIT 1
    );
END;
$function$;

-- 3.3 Atualiza user_has_empresa_access (referencia tecnicos internamente)
CREATE OR REPLACE FUNCTION public.user_has_empresa_access(target_empresa_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Super admin tem acesso a tudo
    IF EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    ) THEN
        RETURN TRUE;
    END IF;

    -- Verificar se tem role na empresa
    IF EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND empresa_id = target_empresa_id
        AND role IN ('admin_empresa', 'admin')
    ) THEN
        RETURN TRUE;
    END IF;

    -- Verificar se é técnico aprovado da empresa
    IF EXISTS (
        SELECT 1 FROM public.tecnicos
        WHERE user_id = auth.uid()
        AND empresa_id = target_empresa_id
        AND status = 'aprovado'
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$function$;

-- ---------------------------------------------------------------------
-- 4. Renomear policies (cosmético: definições já seguem a tabela por OID)
-- ---------------------------------------------------------------------

-- 4.1 Policies na tabela tecnicos (as 8 criadas na Fase 1)
ALTER POLICY entregadores_select_super_admin   ON public.tecnicos RENAME TO tecnicos_select_super_admin;
ALTER POLICY entregadores_select_admin_empresa ON public.tecnicos RENAME TO tecnicos_select_admin_empresa;
ALTER POLICY entregadores_select_self          ON public.tecnicos RENAME TO tecnicos_select_self;
ALTER POLICY entregadores_insert_super_admin   ON public.tecnicos RENAME TO tecnicos_insert_super_admin;
ALTER POLICY entregadores_insert_admin_empresa ON public.tecnicos RENAME TO tecnicos_insert_admin_empresa;
ALTER POLICY entregadores_update_super_admin   ON public.tecnicos RENAME TO tecnicos_update_super_admin;
ALTER POLICY entregadores_update_admin_empresa ON public.tecnicos RENAME TO tecnicos_update_admin_empresa;
ALTER POLICY entregadores_delete_super_admin   ON public.tecnicos RENAME TO tecnicos_delete_super_admin;

-- 4.2 Policies em agendamentos (3) — usam get_current_tecnico_id() via OID, continuam válidas
ALTER POLICY "Entregadores podem atualizar seus próprios agendamentos" ON public.agendamentos
    RENAME TO "Tecnicos podem atualizar seus proprios agendamentos";
ALTER POLICY "Entregadores podem criar seus próprios agendamentos" ON public.agendamentos
    RENAME TO "Tecnicos podem criar seus proprios agendamentos";
ALTER POLICY "Entregadores podem ver seus próprios agendamentos" ON public.agendamentos
    RENAME TO "Tecnicos podem ver seus proprios agendamentos";

-- 4.3 Policies em outras tabelas com "entregador" no nome (cosmético)
ALTER POLICY "Entregadores podem ver agendas da sua cidade" ON public.agendas
    RENAME TO "Tecnicos podem ver agendas da sua cidade";
ALTER POLICY entregadores_can_view_their_empresa_cidades ON public.cidades
    RENAME TO tecnicos_can_view_their_empresa_cidades;
ALTER POLICY entregadores_can_view_their_empresa_turnos ON public.turnos
    RENAME TO tecnicos_can_view_their_empresa_turnos;
ALTER POLICY "Entregadores can view their empresa configs" ON public.configuracoes_empresa
    RENAME TO "Tecnicos can view their empresa configs";

-- ---------------------------------------------------------------------
-- FIM
-- ---------------------------------------------------------------------
COMMIT;

-- =====================================================================
-- VALIDAÇÃO PÓS-APLICAÇÃO (rodar separadamente)
-- =====================================================================
-- SELECT COUNT(*) FROM public.tecnicos;
-- SELECT tecnico_id FROM public.agendamentos LIMIT 1;
-- SELECT unnest(enum_range(NULL::public.perfil_usuario));   -- deve conter 'tecnico', não 'entregador'
-- SELECT unnest(enum_range(NULL::public.status_tecnico));   -- tipo deve existir
-- SELECT proname FROM pg_proc WHERE proname LIKE '%tecnico%';
-- SELECT policyname FROM pg_policies WHERE schemaname='public' AND policyname ILIKE '%entregador%'; -- deve vir vazio
