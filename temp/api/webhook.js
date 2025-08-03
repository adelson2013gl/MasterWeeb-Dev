// API Route para receber webhooks do AbacatePay no Vercel

// Configuração para Vercel
export const config = {
  api: {
    bodyParser: {
      json: true,
    },
  },
};

// Processar webhook do AbacatePay (versão simplificada para Vercel)
async function processAbacatePayWebhook(webhookData) {
  console.log('🔄 Processando webhook AbacatePay:', {
    event: webhookData.event,
    billId: webhookData.data?.id,
    status: webhookData.data?.status
  });

  try {
    // Configurar Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Credenciais Supabase não configuradas');
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const billData = webhookData.data;

    // Processar baseado no tipo de evento
    switch (webhookData.event) {
      case 'bill.paid':
        await handleBillPaid(supabase, billData);
        break;
      
      case 'bill.cancelled':
        await handleBillCancelled(supabase, billData);
        break;
      
      case 'bill.expired':
        await handleBillExpired(supabase, billData);
        break;
      
      default:
        console.log('⚠️ Evento não tratado:', webhookData.event);
    }

    // Salvar webhook para auditoria
    await saveWebhookRecord(supabase, webhookData);

    console.log('✅ Webhook processado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    throw error;
  }
}

// Processar pagamento aprovado
async function handleBillPaid(supabase, billData) {
  console.log('💰 Processando pagamento aprovado:', billData.id);

  try {
    const empresaId = billData.metadata?.empresa_id;
    const plano = billData.metadata?.plano;

    if (!empresaId || !plano) {
      console.warn('⚠️ Metadata incompleto:', billData.metadata);
      return;
    }

    // Calcular próxima data de pagamento (30 dias)
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);

    // Atualizar assinatura
    const { error: upsertError } = await supabase
      .from('assinaturas')
      .upsert({
        empresa_id: empresaId,
        abacatepay_bill_id: billData.id,
        plano: plano,
        status: 'active',
        valor_mensal: billData.amount / 100,
        data_proximo_pagamento: nextDate.toISOString(),
        metadata: billData.metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'empresa_id'
      });

    if (upsertError) {
      throw upsertError;
    }

    // Criar transação
    await supabase
      .from('transacoes')
      .insert({
        assinatura_id: empresaId,
        abacatepay_bill_id: billData.id,
        status: 'approved',
        valor: billData.amount / 100,
        metodo_pagamento: 'PIX',
        created_at: billData.paidAt || new Date().toISOString()
      });

    console.log('✅ Assinatura ativada para empresa:', empresaId);
  } catch (error) {
    console.error('❌ Erro ao processar pagamento:', error);
    throw error;
  }
}

// Processar cancelamento
async function handleBillCancelled(supabase, billData) {
  console.log('❌ Processando cancelamento:', billData.id);

  const { error } = await supabase
    .from('assinaturas')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('abacatepay_bill_id', billData.id);

  if (error) throw error;
}

// Processar expiração
async function handleBillExpired(supabase, billData) {
  console.log('⏰ Processando expiração:', billData.id);

  const { error } = await supabase
    .from('assinaturas')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString()
    })
    .eq('abacatepay_bill_id', billData.id);

  if (error) throw error;
}

// Salvar webhook para auditoria
async function saveWebhookRecord(supabase, webhookData) {
  try {
    await supabase
      .from('abacatepay_webhooks')
      .insert({
        evento: webhookData.event,
        bill_id: webhookData.data?.id,
        empresa_id: webhookData.data?.metadata?.empresa_id,
        payload: webhookData,
        processado: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  } catch (error) {
    console.warn('⚠️ Erro ao salvar webhook (não crítico):', error.message);
  }
}

// Handler principal do Vercel
export default async function handler(req, res) {
  // Log da requisição
  console.log(`🌐 ${req.method} ${req.url} - ${new Date().toISOString()}`);

  // Apenas aceitar POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔔 Webhook AbacatePay recebido:', {
      headers: Object.keys(req.headers),
      query: req.query,
      hasBody: !!req.body
    });

    // Validar webhook secret
    const webhookSecret = req.query.webhookSecret;
    const expectedSecret = process.env.VITE_ABACATEPAY_API_KEY_DEV || process.env.VITE_ABACATEPAY_API_KEY_PROD;
    
    if (!webhookSecret || webhookSecret !== expectedSecret) {
      console.error('❌ Webhook secret inválido');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validar payload
    const webhookData = req.body;
    
    if (!webhookData || !webhookData.event || !webhookData.data) {
      console.error('❌ Payload inválido:', webhookData);
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Processar webhook
    await processAbacatePayWebhook({
      event: webhookData.event,
      data: webhookData.data,
      timestamp: new Date().toISOString()
    });

    console.log('✅ Webhook processado com sucesso');
    
    // Retornar sucesso
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}