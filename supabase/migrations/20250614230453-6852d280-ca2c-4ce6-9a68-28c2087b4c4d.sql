
-- Corrigir a função get_current_empresa_id para buscar a empresa do usuário logado
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
  
  -- CORREÇÃO PRINCIPAL: Tentar obter a empresa do entregador logado PRIMEIRO
  SELECT e.empresa_id INTO user_empresa
  FROM public.entregadores e
  WHERE e.user_id = auth.uid()
  AND e.status = 'aprovado';
  
  IF user_empresa IS NOT NULL THEN
    RETURN user_empresa;
  END IF;
  
  -- Tentar via user_roles se não encontrou via entregadores
  SELECT ur.empresa_id INTO user_empresa
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;
  
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

-- Remover políticas conflitantes na tabela configuracoes_empresa
DROP POLICY IF EXISTS "Admin empresa can manage their configs" ON public.configuracoes_empresa;
DROP POLICY IF EXISTS "Users can view their empresa configs" ON public.configuracoes_empresa;

-- Criar política RLS mais simples e direta para configuracoes_empresa
CREATE POLICY "Entregadores can view their empresa configs"
ON public.configuracoes_empresa
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.entregadores 
    WHERE user_id = auth.uid() 
    AND empresa_id = configuracoes_empresa.empresa_id
    AND status = 'aprovado'
  )
);

-- Política para admins gerenciarem configurações
CREATE POLICY "Admins can manage empresa configs"
ON public.configuracoes_empresa
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.entregadores 
    WHERE user_id = auth.uid() 
    AND empresa_id = configuracoes_empresa.empresa_id
    AND perfil = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND empresa_id = configuracoes_empresa.empresa_id
    AND role IN ('admin_empresa', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.entregadores 
    WHERE user_id = auth.uid() 
    AND empresa_id = configuracoes_empresa.empresa_id
    AND perfil = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND empresa_id = configuracoes_empresa.empresa_id
    AND role IN ('admin_empresa', 'super_admin')
  )
);
