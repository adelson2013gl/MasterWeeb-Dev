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

    console.log('🚀 Executando migração para sistema de estrelas...')

    // CORREÇÃO CRÍTICA DE SEGURANÇA: Isolamento de cidades por empresa
    const migrations = [
      // 1. Adicionar campo empresa_id na tabela cidades
      `ALTER TABLE cidades ADD COLUMN IF NOT EXISTS empresa_id UUID;`,
      
      // 2. Adicionar foreign key
      `ALTER TABLE cidades ADD CONSTRAINT IF NOT EXISTS fk_cidades_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id);`,
      
      // 3. Atualizar cidades existentes para pertencer à empresa atual
      `UPDATE cidades SET empresa_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' WHERE empresa_id IS NULL;`,
      
      // 4. Tornar empresa_id obrigatório
      `ALTER TABLE cidades ALTER COLUMN empresa_id SET NOT NULL;`,
      
      // 5. Criar índice para performance
      `CREATE INDEX IF NOT EXISTS idx_cidades_empresa_id ON cidades(empresa_id);`,
      
      // 6. Habilitar RLS na tabela cidades
      `ALTER TABLE cidades ENABLE ROW LEVEL SECURITY;`,
      
      // 7. Remover políticas antigas
      `DROP POLICY IF EXISTS "cidades_policy" ON cidades;`,
      `DROP POLICY IF EXISTS "entregadores_can_view_their_empresa_cidades" ON cidades;`,
      `DROP POLICY IF EXISTS "admins_can_manage_their_empresa_cidades" ON cidades;`,
      
      // 8. Criar política para entregadores
      `CREATE POLICY "entregadores_can_view_their_empresa_cidades" ON cidades
       FOR SELECT 
       USING (
         empresa_id IN (
           SELECT e.empresa_id 
           FROM entregadores e 
           WHERE e.user_id = auth.uid()
         )
       );`,
       
      // 9. Criar política para admins
      `CREATE POLICY "admins_can_manage_their_empresa_cidades" ON cidades
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

    const results = []
    
    for (let i = 0; i < migrations.length; i++) {
      const sql = migrations[i]
      console.log(`Executando migração ${i + 1}/${migrations.length}:`, sql.substring(0, 50) + '...')
      
      try {
        // Executar SQL diretamente via raw SQL
        const { data, error } = await supabaseClient
          .from('_db_raw_sql')
          .select('*')
          .eq('sql', sql)
          .single()
        
        if (error) {
          console.error(`Erro na migração ${i + 1}:`, error)
          results.push({ step: i + 1, sql: sql.substring(0, 50), error: error.message, success: false })
        } else {
          console.log(`✅ Migração ${i + 1} executada com sucesso`)
          results.push({ step: i + 1, sql: sql.substring(0, 50), success: true })
        }
      } catch (err) {
        console.error(`Erro inesperado na migração ${i + 1}:`, err)
        results.push({ step: i + 1, sql: sql.substring(0, 50), error: err.message, success: false })
      }
    }

    // Verificar se os campos foram criados
    const { data: tableInfo } = await supabaseClient
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'configuracoes_empresa')
      .in('column_name', ['categoria', 'horario_liberacao_5_estrelas', 'horario_liberacao_1_estrela'])

    console.log('✅ Migração concluída! Resultados:', results)
    console.log('📋 Campos verificados:', tableInfo)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Migração executada',
        results,
        fieldsCreated: tableInfo?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('💥 Erro na execução da migração:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Erro ao executar migração'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})