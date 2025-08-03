
-- 1. Corrigir a função get_current_empresa_id para aceitar parâmetro
CREATE OR REPLACE FUNCTION public.get_current_empresa_id(empresa_id_param uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  empresa_found uuid;
  user_empresa uuid;
BEGIN
  -- Se um parâmetro foi passado, usar ele
  IF empresa_id_param IS NOT NULL THEN
    -- Verificar se o usuário tem acesso a esta empresa
    SELECT e.id INTO empresa_found 
    FROM public.empresas e
    INNER JOIN public.user_roles ur ON e.id = ur.empresa_id
    WHERE e.id = empresa_id_param 
    AND ur.user_id = auth.uid()
    AND e.status = 'ativo';
    
    IF empresa_found IS NOT NULL THEN
      RETURN empresa_found;
    END IF;
  END IF;
  
  -- Tentar obter a empresa do entregador logado
  SELECT e.empresa_id INTO user_empresa
  FROM public.entregadores e
  WHERE e.user_id = auth.uid();
  
  IF user_empresa IS NOT NULL THEN
    RETURN user_empresa;
  END IF;
  
  -- Fallback para empresa padrão se o usuário tem acesso
  SELECT e.id INTO empresa_found 
  FROM public.empresas e
  INNER JOIN public.user_roles ur ON e.id = ur.empresa_id
  WHERE e.id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid
  AND ur.user_id = auth.uid()
  AND e.status = 'ativo';
  
  IF empresa_found IS NOT NULL THEN
    RETURN empresa_found;
  END IF;
  
  -- Se nada funcionou, retornar empresa padrão (pode causar erro RLS se sem permissão)
  RETURN 'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid;
END;
$$;

-- 2. Criar função helper para verificar se usuário é admin da empresa
CREATE OR REPLACE FUNCTION public.is_admin_empresa_for(target_empresa_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND empresa_id = target_empresa_id
    AND role IN ('admin_empresa', 'super_admin')
  ) OR EXISTS (
    SELECT 1 FROM public.entregadores 
    WHERE user_id = auth.uid() 
    AND empresa_id = target_empresa_id
    AND perfil = 'admin'
  );
$$;

-- 3. Habilitar RLS na tabela configuracoes_empresa se não estiver
ALTER TABLE public.configuracoes_empresa ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Admins can manage company configs" ON public.configuracoes_empresa;
DROP POLICY IF EXISTS "Admin empresa can manage configs" ON public.configuracoes_empresa;
DROP POLICY IF EXISTS "Super admin can manage all configs" ON public.configuracoes_empresa;

-- 5. Criar políticas RLS funcionais para configuracoes_empresa
CREATE POLICY "Admin empresa can manage configs"
ON public.configuracoes_empresa
FOR ALL
TO authenticated
USING (public.is_admin_empresa_for(empresa_id))
WITH CHECK (public.is_admin_empresa_for(empresa_id));

-- 6. Política para super admins
CREATE POLICY "Super admin can manage all configs"
ON public.configuracoes_empresa
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- 7. Função para debug de autenticação (temporária)
CREATE OR REPLACE FUNCTION public.debug_auth_context()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'auth_uid', auth.uid()::text,
    'current_user', current_user,
    'session_user', session_user,
    'has_entregador', EXISTS(SELECT 1 FROM public.entregadores WHERE user_id = auth.uid()),
    'has_roles', EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = auth.uid())
  );
$$;
