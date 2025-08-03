
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-scheduler-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ExpiryResult {
  success: boolean;
  message: string;
  stats?: any;
  companiesSuspended?: number;
  errors?: string[];
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validar token de segurança
    const authHeader = req.headers.get('x-scheduler-token')
    const validToken = Deno.env.get('SCHEDULER_TOKEN')
    
    if (!authHeader || !validToken || authHeader !== validToken) {
      console.error('Token de autenticação inválido ou ausente')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔍 Iniciando verificação de vencimento de empresas...')

    const result: ExpiryResult = {
      success: true,
      message: 'Verificação de vencimento executada com sucesso',
      timestamp: new Date().toISOString(),
      errors: []
    }

    try {
      // 1. Obter estatísticas antes da verificação
      console.log('📊 Obtendo estatísticas pré-verificação...')
      const { data: preStats, error: preStatsError } = await supabase.rpc('get_expiry_stats')
      
      if (preStatsError) {
        console.error('Erro ao obter estatísticas iniciais:', preStatsError)
        result.errors!.push(`Erro nas estatísticas iniciais: ${preStatsError.message}`)
      } else {
        console.log('📊 Estatísticas pré-verificação:', preStats)
      }

      // 2. Executar verificação de vencimento
      console.log('⚡ Executando check_empresa_expiry...')
      const { data: checkResult, error: checkError } = await supabase.rpc('check_empresa_expiry')
      
      if (checkError) {
        console.error('Erro na verificação de vencimento:', checkError)
        result.errors!.push(`Erro na verificação: ${checkError.message}`)
        result.success = false
      } else {
        console.log('✅ Verificação de vencimento concluída:', checkResult)
      }

      // 3. Obter estatísticas após a verificação
      console.log('📊 Obtendo estatísticas pós-verificação...')
      const { data: postStats, error: postStatsError } = await supabase.rpc('get_expiry_stats')
      
      if (postStatsError) {
        console.error('Erro ao obter estatísticas finais:', postStatsError)
        result.errors!.push(`Erro nas estatísticas finais: ${postStatsError.message}`)
      } else {
        console.log('📊 Estatísticas pós-verificação:', postStats)
        result.stats = postStats
        
        // Calcular empresas suspensas (se tivermos ambas as estatísticas)
        if (preStats && postStats) {
          const suspendedCount = (preStats.total || 0) - (postStats.total || 0)
          result.companiesSuspended = Math.max(0, suspendedCount)
        }
      }

      // 4. Registrar execução no log (se a tabela existir)
      try {
        await supabase
          .from('logs_sistema')
          .insert({
            evento: 'scheduler_expiry_check',
            detalhes: {
              success: result.success,
              stats: result.stats,
              companiesSuspended: result.companiesSuspended,
              errors: result.errors,
              executedAt: result.timestamp
            }
          })
      } catch (logError) {
        console.warn('Não foi possível registrar no log_sistema:', logError)
      }

      // 5. Preparar mensagem de resultado
      if (result.success) {
        const suspendedText = result.companiesSuspended 
          ? ` (${result.companiesSuspended} empresas suspensas)`
          : ''
        result.message = `Verificação concluída com sucesso${suspendedText}`
      } else {
        result.message = 'Verificação concluída com erros'
      }

    } catch (executionError: any) {
      console.error('Erro durante a execução:', executionError)
      result.success = false
      result.message = 'Erro durante a execução da verificação'
      result.errors!.push(`Erro de execução: ${executionError.message}`)
    }

    console.log('🏁 Resultado final:', result)

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Erro crítico na Edge Function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Erro crítico no servidor',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
