const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0 && !line.startsWith('#')) {
    const key = line.substring(0, idx).trim();
    let value = line.substring(idx + 1).trim();
    value = value.replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_SERVICE_KEY || envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Check VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20260419050000_create_user_rpc.sql');
  
  console.log('📄 Reading migration file:', migrationFile);
  
  if (!fs.existsSync(migrationFile)) {
    console.error('❌ Migration file not found');
    process.exit(1);
  }
  
  const sql = fs.readFileSync(migrationFile, 'utf8');
  console.log('📋 SQL Content preview:');
  console.log(sql.substring(0, 200) + '...');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`\n🔧 Found ${statements.length} statements to execute\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    console.log(`\n[${i + 1}/${statements.length}] Executing...`);
    console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      
      if (error) {
        console.error(`❌ Error on statement ${i + 1}:`, error);
        // Continue with next statement
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.error(`❌ Exception on statement ${i + 1}:`, err.message);
    }
  }
  
  console.log('\n✅ Migration application completed!');
}

applyMigration().catch(console.error);
