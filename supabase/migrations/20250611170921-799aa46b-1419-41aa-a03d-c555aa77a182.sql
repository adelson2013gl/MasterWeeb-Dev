
-- 1. Corrigir o perfil do Adelson Nascimento de 'admin' para 'entregador'
UPDATE public.entregadores 
SET perfil = 'entregador'
WHERE nome = 'Adelson Nascimento' 
AND perfil = 'admin';

-- 2. Atribuir uma cidade válida para o Adelson (vou usar a primeira cidade ativa da empresa)
UPDATE public.entregadores 
SET cidade_id = (
  SELECT c.id 
  FROM public.cidades c 
  WHERE c.empresa_id = entregadores.empresa_id 
  AND c.ativo = true 
  LIMIT 1
)
WHERE nome = 'Adelson Nascimento' 
AND cidade_id IS NULL;

-- 3. Adicionar constraints para evitar problemas futuros
-- Tornar cidade_id obrigatório para entregadores (não admins)
ALTER TABLE public.entregadores 
ADD CONSTRAINT check_entregador_cidade 
CHECK (
  (perfil = 'admin') OR 
  (perfil = 'entregador' AND cidade_id IS NOT NULL)
);

-- 4. Garantir consistência entre perfil e roles
-- Verificar se existem inconsistências atuais
DO $$
DECLARE
    inconsistency_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inconsistency_count
    FROM public.entregadores e
    LEFT JOIN public.user_roles ur ON e.user_id = ur.user_id
    WHERE (e.perfil = 'admin' AND ur.role != 'admin_empresa') 
       OR (e.perfil = 'entregador' AND ur.role IS NOT NULL);
    
    IF inconsistency_count > 0 THEN
        RAISE NOTICE 'Found % inconsistencies between perfil and roles', inconsistency_count;
    END IF;
END $$;
