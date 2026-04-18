import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🚨 CORREÇÃO CRÍTICA DE SEGURANÇA: Isolamento de cidades por empresa')

    // SQL Commands para execução manual via SQL Editor
    const sqlCommands = [
      // 1. Adicionar campo empresa_id na tabela cidades
      `-- 1. Adicionar campo empresa_id
ALTER TABLE cidades ADD COLUMN IF NOT EXISTS empresa_id UUID;`,
      
      // 2. Adicionar foreign key
      `-- 2. Adicionar foreign key
ALTER TABLE cidades ADD CONSTRAINT IF NOT EXISTS fk_cidades_empresa 
FOREIGN KEY (empresa_id) REFERENCES empresas(id);`,
      
      // 3. Atualizar cidades existentes
      `-- 3. Atualizar cidades existentes
UPDATE cidades 
SET empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' 
WHERE empresa_id IS NULL;`,
      
      // 4. Tornar empresa_id obrigatório
      `-- 4. Tornar empresa_id obrigatório
ALTER TABLE cidades ALTER COLUMN empresa_id SET NOT NULL;`,
      
      // 5. Criar índice
      `-- 5. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_cidades_empresa_id ON cidades(empresa_id);`,
      
      // 6. Habilitar RLS
      `-- 6. Habilitar Row Level Security
ALTER TABLE cidades ENABLE ROW LEVEL SECURITY;`,
      
      // 7-9. Remover políticas antigas
      `-- 7. Remover políticas antigas
DROP POLICY IF EXISTS "cidades_policy" ON cidades;
DROP POLICY IF EXISTS "tecnicos_can_view_their_empresa_cidades" ON cidades;
DROP POLICY IF EXISTS "admins_can_manage_their_empresa_cidades" ON cidades;`,
      
      // 10. Criar política para tecnicos
      `-- 8. Política para tecnicos
CREATE POLICY "tecnicos_can_view_their_empresa_cidades" ON cidades
FOR SELECT 
USING (
  empresa_id IN (
    SELECT e.empresa_id 
    FROM tecnicos e 
    WHERE e.user_id = auth.uid()
  )
);`,
       
      // 11. Criar política para admins
      `-- 9. Política para admins
CREATE POLICY "admins_can_manage_their_empresa_cidades" ON cidades
FOR ALL
USING (
  empresa_id IN (
    SELECT ur.empresa_id 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin_empresa', 'super_admin')
  )
);`
    ]

    // Verificar estrutura atual da tabela cidades
    console.log('🔍 Verificando estrutura atual da tabela cidades...')
    
    const { data: cidadeAtual, error: cidadeError } = await supabaseClient
      .from('cidades')
      .select('*')
      .limit(1)
    
    if (cidadeError) {
      console.error('❌ Erro ao verificar cidades:', cidadeError)
    } else {
      console.log('📋 Estrutura atual da cidade:', cidadeAtual?.[0] ? Object.keys(cidadeAtual[0]) : 'Nenhuma cidade encontrada')
    }

    // Retornar SQL para execução manual
    const sqlToExecute = sqlCommands.join('\n\n')
    
    console.log('📝 SQL gerado para execução manual no Dashboard do Supabase:')
    console.log(sqlToExecute)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SQL gerado para execução manual',
        sql: sqlToExecute,
        instructions: [
          '1. Acesse o Supabase Dashboard',
          '2. Vá para SQL Editor',
          '3. Cole e execute o SQL retornado',
          '4. Verifique se a tabela cidades agora tem o campo empresa_id',
          '5. Teste se o isolamento entre empresas está funcionando'
        ],
        currentCityStructure: cidadeAtual?.[0] ? Object.keys(cidadeAtual[0]) : 'No cities found'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('💥 Erro na geração do SQL de segurança:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Erro ao gerar SQL de correção de segurança'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})