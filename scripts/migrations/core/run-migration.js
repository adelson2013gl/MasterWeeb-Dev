import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações do Supabase
const SUPABASE_URL = 'https://nfwdgkjrkmrjsfnbmsrd.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5md2Rna2pya21yanNmbmJtc3JkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA0NDAxOCwiZXhwIjoyMDY0NjIwMDE4fQ.Ej3qjQOQzjJhVJGGnGJQOQzjJhVJGGnGJQOQzjJhVJGGnGJQOQzjJhVJGGnGJQOQzjJhVJGGnGJQ';

// Criar cliente Supabase com service role
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Iniciando execução da migração de correção de vagas...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250614000000-fix-vagas-sync.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Arquivo de migração carregado com sucesso');
    
    // Executar a migração
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      // Se a função exec_sql não existir, tentar executar diretamente
      console.log('⚠️  Função exec_sql não encontrada, tentando execução direta...');
      
      // Dividir o SQL em comandos individuais
      const commands = migrationSQL
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
      
      console.log(`📝 Executando ${commands.length} comandos SQL...`);
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        if (command.trim()) {
          console.log(`   ${i + 1}/${commands.length}: Executando comando...`);
          
          try {
            const { error: cmdError } = await supabase
              .from('_temp_migration')
              .select('*')
              .limit(0); // Isso vai falhar, mas nos dá acesso ao cliente SQL
            
            // Como não temos acesso direto ao SQL, vamos usar uma abordagem diferente
            console.log('❌ Não é possível executar SQL arbitrário via cliente Supabase');
            console.log('📋 Por favor, execute manualmente no painel do Supabase:');
            console.log('\n' + migrationSQL);
            return;
          } catch (err) {
            console.log(`❌ Erro no comando ${i + 1}: ${err.message}`);
          }
        }
      }
    } else {
      console.log('✅ Migração executada com sucesso!');
      console.log('📊 Resultado:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    console.log('\n📋 SQL da migração para execução manual:');
    console.log('\n' + fs.readFileSync(path.join(__dirname, 'supabase', 'migrations', '20250614000000-fix-vagas-sync.sql'), 'utf8'));
  }
}

// Executar a migração
runMigration().then(() => {
  console.log('\n🏁 Processo finalizado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});