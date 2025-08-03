-- =========================================
-- FUNÇÕES RPC FALTANTES PARA MASTERWEEB
-- =========================================

-- 1. Função get_user_empresas (usada pela aplicação)
CREATE OR REPLACE FUNCTION get_user_empresas()
RETURNS TABLE (
    id UUID,
    nome VARCHAR(255),
    cnpj VARCHAR(18),
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco TEXT,
    ativa BOOLEAN,
    max_entregadores INTEGER,
    max_agendas_mes INTEGER,
    plano_atual VARCHAR(50),
    data_expiracao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Se for super admin, retorna todas as empresas
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    ) THEN
        RETURN QUERY
        SELECT e.* FROM empresas e
        WHERE e.ativa = true
        ORDER BY e.nome ASC;
    ELSE
        -- Se for admin de empresa, retorna apenas suas empresas
        RETURN QUERY
        SELECT e.* FROM empresas e
        JOIN user_roles ur ON ur.empresa_id = e.id
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin_empresa', 'admin')
        AND e.ativa = true
        ORDER BY e.nome ASC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função para corrigir problema com coluna 'status' vs 'ativa'
-- A aplicação está buscando por 'status=ativo' mas a coluna é 'ativa=true'
CREATE OR REPLACE FUNCTION get_empresas_ativas()
RETURNS TABLE (
    id UUID,
    nome VARCHAR(255),
    cnpj VARCHAR(18),
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco TEXT,
    ativa BOOLEAN,
    max_entregadores INTEGER,
    max_agendas_mes INTEGER,
    plano_atual VARCHAR(50),
    data_expiracao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.* FROM empresas e
    WHERE e.ativa = true
    ORDER BY e.nome ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função para verificar se usuário tem acesso à empresa
CREATE OR REPLACE FUNCTION user_has_empresa_access(target_empresa_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Super admin tem acesso a tudo
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar se tem role na empresa
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND empresa_id = target_empresa_id
        AND role IN ('admin_empresa', 'admin')
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar se é entregador da empresa
    IF EXISTS (
        SELECT 1 FROM entregadores 
        WHERE user_id = auth.uid() 
        AND empresa_id = target_empresa_id
        AND status = 'aprovado'
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função para obter dados do entregador do usuário atual
CREATE OR REPLACE FUNCTION get_current_entregador()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    empresa_id UUID,
    nome VARCHAR(255),
    cpf VARCHAR(14),
    telefone VARCHAR(20),
    cidade_id UUID,
    veiculo VARCHAR(100),
    placa VARCHAR(10),
    perfil perfil_usuario,
    status status_entregador,
    ativo BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.* FROM entregadores e
    WHERE e.user_id = auth.uid()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Função para obter estatísticas do usuário
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
    is_super_admin BOOLEAN;
    entregador_data RECORD;
    empresa_count INTEGER;
BEGIN
    -- Verificar se é super admin
    SELECT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    ) INTO is_super_admin;
    
    -- Buscar dados do entregador
    SELECT * INTO entregador_data
    FROM entregadores 
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Contar empresas acessíveis
    IF is_super_admin THEN
        SELECT COUNT(*) INTO empresa_count FROM empresas WHERE ativa = true;
    ELSE
        SELECT COUNT(DISTINCT ur.empresa_id) INTO empresa_count
        FROM user_roles ur 
        WHERE ur.user_id = auth.uid();
    END IF;
    
    -- Montar resultado
    SELECT json_build_object(
        'is_super_admin', is_super_admin,
        'has_entregador', (entregador_data.id IS NOT NULL),
        'entregador_status', COALESCE(entregador_data.status::text, null),
        'empresa_count', empresa_count,
        'current_empresa_id', COALESCE(entregador_data.empresa_id, null)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Atualizar políticas RLS para permitir super admin acessar tudo
DROP POLICY IF EXISTS "Super admin bypass" ON empresas;
CREATE POLICY "Super admin bypass" ON empresas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

DROP POLICY IF EXISTS "Super admin bypass entregadores" ON entregadores;
CREATE POLICY "Super admin bypass entregadores" ON entregadores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- 7. Comentários das funções
COMMENT ON FUNCTION get_user_empresas() IS 'Retorna empresas acessíveis pelo usuário atual';
COMMENT ON FUNCTION get_empresas_ativas() IS 'Retorna todas as empresas ativas (para super admin)';
COMMENT ON FUNCTION user_has_empresa_access(UUID) IS 'Verifica se usuário tem acesso à empresa específica';
COMMENT ON FUNCTION get_current_entregador() IS 'Retorna dados do entregador do usuário atual';
COMMENT ON FUNCTION get_user_stats() IS 'Retorna estatísticas e informações do usuário';

-- =========================================
-- FINALIZAÇÃO
-- =========================================
-- Funções RPC criadas com sucesso!