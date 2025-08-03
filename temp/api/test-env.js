// Endpoint para testar variáveis de ambiente no Vercel

export default async function handler(req, res) {
  console.log('🔍 Testando variáveis de ambiente...');

  const envVars = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'SET (length: ' + (process.env.VITE_SUPABASE_ANON_KEY?.length || 0) + ')' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET (length: ' + (process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0) + ')' : 'MISSING',
    VITE_ABACATEPAY_API_KEY_DEV: process.env.VITE_ABACATEPAY_API_KEY_DEV ? 'SET (length: ' + (process.env.VITE_ABACATEPAY_API_KEY_DEV?.length || 0) + ')' : 'MISSING',
    VITE_ABACATEPAY_API_KEY_PROD: process.env.VITE_ABACATEPAY_API_KEY_PROD ? 'SET (length: ' + (process.env.VITE_ABACATEPAY_API_KEY_PROD?.length || 0) + ')' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV || 'undefined',
    VERCEL: process.env.VERCEL ? 'YES' : 'NO',
    VERCEL_ENV: process.env.VERCEL_ENV || 'undefined'
  };

  console.log('Environment variables:', envVars);

  // Testar conexão Supabase
  let supabaseStatus = 'NOT_TESTED';
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from('empresas').select('count').limit(1);
      
      if (error) {
        supabaseStatus = 'ERROR: ' + error.message;
      } else {
        supabaseStatus = 'CONNECTED';
      }
    } else {
      supabaseStatus = 'MISSING_CREDENTIALS';
    }
  } catch (error) {
    supabaseStatus = 'EXCEPTION: ' + error.message;
  }

  const response = {
    timestamp: new Date().toISOString(),
    environment: envVars,
    supabaseStatus,
    requestInfo: {
      method: req.method,
      url: req.url,
      headers: Object.keys(req.headers)
    }
  };

  console.log('🔍 Test response:', response);

  res.status(200).json(response);
}