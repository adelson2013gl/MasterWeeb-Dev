// Script para testar o webhook AbacatePay localmente
const fetch = require('node-fetch');

// Dados de teste simulando webhook do AbacatePay
const webhookTestData = {
  event: 'bill.paid',
  data: {
    id: 'bill_test_123456789',
    url: 'https://abacatepay.com/pay/bill_test_123456789',
    amount: 4990, // R$ 49,90 em centavos
    status: 'PAID',
    methods: ['PIX'],
    frequency: 'ONE_TIME',
    description: 'Assinatura Profissional - Empresa Teste',
    customer: {
      id: 'cust_test_123',
      name: 'Empresa Teste Ltda',
      email: 'admin@empresateste.com'
    },
    metadata: {
      empresa_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      plano: 'pro',
      tipo: 'assinatura_mensal'
    },
    externalId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479-pro-1642684800000',
    createdAt: '2025-07-15T20:00:00.000Z',
    paidAt: '2025-07-15T20:30:00.000Z'
  },
  timestamp: '2025-07-15T20:30:00.000Z'
};

async function testWebhook() {
  const url = 'https://slotmaster-21dev.vercel.app/api/webhook?webhookSecret=abc_dev_G6XzWKeK0MMuHq1wexzTeTDh';
  
  console.log('🧪 Testando webhook AbacatePay...');
  console.log('URL:', url);
  console.log('Dados:', JSON.stringify(webhookTestData, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AbacatePay-Webhook/1.0'
      },
      body: JSON.stringify(webhookTestData)
    });

    const responseText = await response.text();
    
    console.log('\n📋 Resposta:');
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Body:', responseText);

    if (response.ok) {
      console.log('\n✅ Webhook testado com sucesso!');
    } else {
      console.log('\n❌ Erro no webhook:', response.status);
    }

  } catch (error) {
    console.error('\n❌ Erro ao testar webhook:', error.message);
  }
}

// Executar teste
testWebhook();

// Para uso manual:
console.log('\n📋 Para testar manualmente, use:');
console.log('curl -X POST \\');
console.log('  "https://slotmaster-21dev.vercel.app/api/webhook?webhookSecret=abc_dev_G6XzWKeK0MMuHq1wexzTeTDh" \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'' + JSON.stringify(webhookTestData) + '\'');