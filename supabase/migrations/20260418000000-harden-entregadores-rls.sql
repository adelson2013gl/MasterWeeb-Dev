-- Fortalece RLS da tabela public.entregadores.
--
-- Estado anterior: uma única policy "allow_all_for_super_admin" com qual=true,
-- o que é funcionalmente equivalente a RLS desabilitada — qualquer usuário
-- authenticated podia SELECT/INSERT/UPDATE/DELETE qualquer registro de
-- qualquer empresa.
--
-- Novo desenho (policies PERMISSIVE combinadas por OR):
--   SELECT  : super_admin | admin_empresa da mesma empresa | próprio entregador (user_id = auth.uid())
--   INSERT  : super_admin | admin_empresa da mesma empresa
--   UPDATE  : super_admin | admin_empresa da mesma empresa
--   DELETE  : super_admin
--
-- Notas:
-- * Não há policy de auto-UPDATE para entregador — evita escalonamento de
--   privilégio via mudança de status/empresa_id/perfil. Caso no futuro o
--   entregador precise editar o próprio perfil (ex.: trocar telefone),
--   criar uma RPC SECURITY DEFINER dedicada restrita a campos seguros.
-- * Cadastro de entregador (INSERT) pelo fluxo público continua via
--   edge function `create-entregador` que usa service_role e bypassa RLS.

BEGIN;

DROP POLICY IF EXISTS allow_all_for_super_admin ON public.entregadores;

-- =====================================================================
-- SELECT
-- =====================================================================
CREATE POLICY entregadores_select_super_admin
  ON public.entregadores
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY entregadores_select_admin_empresa
  ON public.entregadores
  FOR SELECT
  TO authenticated
  USING (public.is_admin_empresa_for(empresa_id));

CREATE POLICY entregadores_select_self
  ON public.entregadores
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================================
-- INSERT
-- =====================================================================
CREATE POLICY entregadores_insert_super_admin
  ON public.entregadores
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY entregadores_insert_admin_empresa
  ON public.entregadores
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_empresa_for(empresa_id));

-- =====================================================================
-- UPDATE
-- =====================================================================
CREATE POLICY entregadores_update_super_admin
  ON public.entregadores
  FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY entregadores_update_admin_empresa
  ON public.entregadores
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_empresa_for(empresa_id))
  WITH CHECK (public.is_admin_empresa_for(empresa_id));

-- =====================================================================
-- DELETE
-- =====================================================================
CREATE POLICY entregadores_delete_super_admin
  ON public.entregadores
  FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

COMMIT;

-- =====================================================================
-- Rollback (executar manualmente se necessário):
-- =====================================================================
-- BEGIN;
-- DROP POLICY IF EXISTS entregadores_select_super_admin    ON public.entregadores;
-- DROP POLICY IF EXISTS entregadores_select_admin_empresa  ON public.entregadores;
-- DROP POLICY IF EXISTS entregadores_select_self           ON public.entregadores;
-- DROP POLICY IF EXISTS entregadores_insert_super_admin    ON public.entregadores;
-- DROP POLICY IF EXISTS entregadores_insert_admin_empresa  ON public.entregadores;
-- DROP POLICY IF EXISTS entregadores_update_super_admin    ON public.entregadores;
-- DROP POLICY IF EXISTS entregadores_update_admin_empresa  ON public.entregadores;
-- DROP POLICY IF EXISTS entregadores_delete_super_admin    ON public.entregadores;
-- CREATE POLICY allow_all_for_super_admin
--   ON public.entregadores
--   FOR ALL
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);
-- COMMIT;
