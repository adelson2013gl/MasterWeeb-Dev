import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreatePixRequest {
  amount: number;
  description: string;
  expiresIn?: number;
  customer: {
    name: string;
    cellphone: string;
    email: string;
    taxId: string;
  };
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

    console.log('📋 Usuário autenticado:', user.email)

    // Parse do request body
    const requestBody: CreatePixRequest = await req.json()
    
    console.log('📤 Criando PIX na AbacatePay:', {
      amount: requestBody.amount,
      description: requestBody.description,
      customer: {
        name: requestBody.customer.name,
        email: requestBody.customer.email,
        cellphone: requestBody.customer.cellphone.substring(0, 5) + '***',
        taxId: '***' + requestBody.customer.taxId.slice(-3)
      }
    })

    // Obter API key do AbacatePay
    const abacatePayApiKey = Deno.env.get('ABACATEPAY_API_KEY_DEV') || Deno.env.get('ABACATEPAY_API_KEY_PROD')
    if (!abacatePayApiKey) {
      throw new Error('AbacatePay API key not configured')
    }

    // Fazer chamada para AbacatePay
    const abacatePayResponse = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${abacatePayApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const responseData = await abacatePayResponse.json()
    
    console.log('📥 Resposta AbacatePay:', {
      status: abacatePayResponse.status,
      success: abacatePayResponse.ok,
      hasData: !!responseData.data
    })

    if (!abacatePayResponse.ok) {
      console.error('❌ Erro da API AbacatePay:', responseData)
      return new Response(
        JSON.stringify({
          error: {
            message: responseData.error?.message || responseData.message || 'Erro na API AbacatePay',
            code: responseData.error?.code || abacatePayResponse.status.toString()
          }
        }),
        {
          status: abacatePayResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log do PIX criado (sem dados sensíveis)
    if (responseData.data) {
      console.log('✅ PIX criado com sucesso:', {
        id: responseData.data.id,
        amount: responseData.data.amount,
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
    console.error('💥 Erro na Edge Function:', error)
    
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