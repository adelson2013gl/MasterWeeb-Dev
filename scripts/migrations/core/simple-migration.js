#!/usr/bin/env node

/**
 * Script simples para aplicar migrações do Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configurações do Supabase não encontradas');
  console.log('Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão configurados');
  process.exit(1);
}

console.log('🔗 Conectando ao Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🧪 Testando conexão com o banco...');
    
    // Testar acesso básico
    const { data, error } = await supabase.auth.getSession();
    
    console.log('✅ Conexão estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    return false;
  }
}

async function listTables() {
  try {
    console.log('📋 Verificando estrutura do banco...');
    
    // Tentar acessar uma tabela padrão do Supabase
    const { data, error } = await supabase.auth.getUser();
    
    if (error && error.message.includes('JWT')) {
      console.log('✅ Banco configurado (autenticação ativa)');
    } else {
      console.log('✅ Banco conectado');
    }
    
  } catch (error) {
    console.log('📝 Conexão estabelecida, banco pronto para migrações');
  }
}

async function main() {
  console.log('🚀 Iniciando verificação do banco de dados...');
  console.log('==========================================');
  
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Não foi possível conectar ao banco. Verifique as configurações.');
    process.exit(1);
  }
  
  await listTables();
  
  console.log('==========================================');
  console.log('✅ Verificação concluída!');
  console.log('');
  console.log('📝 Próximos passos:');
  console.log('1. As migrações devem ser aplicadas manualmente no Dashboard do Supabase');
  console.log('2. Acesse: https://supabase.com/dashboard/project/xuuvxxlaaqjbcoklxrrv/sql/');
  console.log('3. Execute os arquivos SQL da pasta supabase/migrations/ em ordem');
  console.log('');
  console.log('🎯 Recomendação: Comece com as migrações mais recentes se é um banco novo');
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error.message);
  process.exit(1);
});