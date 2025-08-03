/**
 * EDGE FUNCTION: VERIFICAÇÃO REAL DE STATUS PIX
 * 
 * Esta edge function garante que a verificação de pagamento PIX seja feita
 * de forma segura através da API real da AbacatePay.
 * 
 * SEGURANÇA:
 * - Executa no servidor (não expõe API keys)
 * - Requer autenticação JWT
 * - Consulta API real da AbacatePay
 * - Retorna apenas status real, sem bypass
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Extrair pixId da URL ou do body
    const url = new URL(req.url)
    let pixId = url.searchParams.get('id')
    
    // Se não veio como query param, tentar extrair do body
    if (!pixId && req.method === 'POST') {
      const body = await req.json()
      pixId = body.id
    }
    
    if (!pixId) {
      throw new Error('PIX ID is required')
    }

    console.log('🔍 Verificando status PIX:', pixId.substring(0, 10) + '...')

    // Obter API key do AbacatePay
    const abacatePayApiKey = Deno.env.get('ABACATEPAY_API_KEY_DEV') || Deno.env.get('ABACATEPAY_API_KEY_PROD')
    if (!abacatePayApiKey) {
      throw new Error('AbacatePay API key not configured')
    }

    // Fazer chamada para AbacatePay
    const abacatePayResponse = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${pixId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${abacatePayApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    const responseData = await abacatePayResponse.json()
    
    console.log('📊 Status PIX:', {
      pixId: pixId.substring(0, 10) + '...',
      status: abacatePayResponse.status,
      success: abacatePayResponse.ok,
      pixStatus: responseData.data?.status || 'UNKNOWN'
    })

    if (!abacatePayResponse.ok) {
      console.error('❌ Erro ao verificar status PIX:', responseData)
      return new Response(
        JSON.stringify({
          error: {
            message: responseData.error?.message || responseData.message || 'Erro ao verificar status PIX',
            code: responseData.error?.code || abacatePayResponse.status.toString()
          }
        }),
        {
          status: abacatePayResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log do resultado
    if (responseData.data) {
      console.log(`${responseData.data.status === 'PAID' ? '✅' : '⏳'} PIX Status:`, {
        id: pixId.substring(0, 10) + '...',
        status: responseData.data.status,
        expiresAt: responseData.data.expiresAt
      })
    }

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('💥 Erro na Edge Function check PIX:', error)
    
    return new Response(
      JSON.stringify({
        error: {
          message: error.message || 'Erro interno do servidor',
          code: 'INTERNAL_ERROR'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})