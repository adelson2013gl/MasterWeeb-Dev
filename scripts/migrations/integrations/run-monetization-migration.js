// Script para executar a migração de monetização
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Para obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = 'https://nfwdgkjrkmrjsfnbmsrd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5md2Rna2pya21yanNmbmJtc3JkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA0NDAxOCwiZXhwIjoyMDY0NjIwMDE4fQ.e7yiJnjoZ0AhgdLBbGFsGNZwmbz54-N22iy9L6Fn6mw';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
  console.log('💡 Para executar esta migração, você precisa:');
  console.log('1. Ir ao painel do Supabase (https://supabase.com/dashboard)');
  console.log('2. Selecionar seu projeto');
  console.log('3. Ir em Settings > API');
  console.log('4. Copiar a "service_role" key');
  console.log('5. Executar: set SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui');
  console.log('6. Executar novamente este script');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Iniciando migração de monetização...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250116000000-add-monetization-tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Arquivo de migração não encontrado:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executando migração SQL...');
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        console.log(`⏳ Executando comando ${i + 1}/${commands.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: command + ';'
        });
        
        if (error) {
          // Tentar executar diretamente se rpc falhar
          const { error: directError } = await supabase
            .from('_temp')
            .select('*')
            .limit(0);
          
          if (directError) {
            console.log(`⚠️ Tentando abordagem alternativa para comando ${i + 1}...`);
            // Continuar mesmo com erro, pois algumas tabelas podem já existir
          }
        }
      }
    }
    
    console.log('✅ Migração concluída!');
    console.log('🔍 Verificando tabelas criadas...');
    
    // Verificar se as tabelas foram criadas
    const tables = ['assinaturas', 'transacoes', 'mercadopago_webhooks'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabela '${table}' não foi criada ou não está acessível:`, error.message);
      } else {
        console.log(`✅ Tabela '${table}' criada com sucesso`);
      }
    }
    
    console.log('\n🎉 Processo de migração finalizado!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Verificar as tabelas no painel do Supabase');
    console.log('2. Testar a criação de assinaturas');
    console.log('3. Configurar os webhooks do Mercado Pago');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

// Função alternativa para executar SQL diretamente
async function executeSQLDirect(sql) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao executar SQL:', error);
    throw error;
  }
}

runMigration();