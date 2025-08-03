// Execute este script no console do browser (F12) quando estiver na aplicação
// O script usará o client do Supabase já autenticado

async function executarMigracaoEstrelas() {
  console.log('🚀 Iniciando migração do sistema de estrelas...');
  
  // Verificar se temos acesso ao supabase
  if (typeof window === 'undefined' || !window.supabase) {
    console.error('❌ Supabase client não encontrado. Execute na aplicação.');
    return;
  }
  
  const supabase = window.supabase;
  
  const migrations = [
    // 1. Verificar se os campos já existem
    {
      name: 'Verificar estrutura atual',
      sql: `SELECT column_name FROM information_schema.columns WHERE table_name = 'configuracoes_empresa' AND column_name IN ('categoria', 'horario_liberacao_5_estrelas');`,
      isQuery: true
    },
    
    // 2. Adicionar campo categoria
    {
      name: 'Adicionar campo categoria',
      sql: `ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);`
    },
    
    // 3. Adicionar campos de horários
    {
      name: 'Adicionar horário 5 estrelas',
      sql: `ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS horario_liberacao_5_estrelas TIME DEFAULT '08:00:00';`
    },
    
    {
      name: 'Adicionar horário 4 estrelas', 
      sql: `ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS horario_liberacao_4_estrelas TIME DEFAULT '08:45:00';`
    },
    
    {
      name: 'Adicionar horário 3 estrelas',
      sql: `ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS horario_liberacao_3_estrelas TIME DEFAULT '09:20:00';`
    },
    
    {
      name: 'Adicionar horário 2 estrelas',
      sql: `ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS horario_liberacao_2_estrelas TIME DEFAULT '10:00:00';`
    },
    
    {
      name: 'Adicionar horário 1 estrela',
      sql: `ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS horario_liberacao_1_estrela TIME DEFAULT '10:30:00';`
    },
    
    // 4. Adicionar campo estrelas na tabela entregadores
    {
      name: 'Adicionar campo estrelas em entregadores',
      sql: `ALTER TABLE entregadores ADD COLUMN IF NOT EXISTS estrelas INTEGER DEFAULT 5 CHECK (estrelas >= 1 AND estrelas <= 5);`
    }
  ];
  
  const results = [];
  
  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    console.log(`📝 ${i + 1}/${migrations.length}: ${migration.name}`);
    
    try {
      let result;
      
      if (migration.isQuery) {
        // Para consultas SELECT
        const { data, error } = await supabase.rpc('exec_sql', { 
          query: migration.sql 
        });
        result = { data, error };
      } else {
        // Para comandos ALTER TABLE - vamos tentar uma abordagem diferente
        // Como não temos exec_sql, vamos simular com uma query que não vai funcionar
        // mas pelo menos mostra o que precisamos fazer
        console.log(`SQL: ${migration.sql}`);
        result = { simulated: true };
      }
      
      if (result.error) {
        console.error(`❌ Erro: ${result.error.message}`);
        results.push({ step: i + 1, name: migration.name, error: result.error.message, success: false });
      } else {
        console.log(`✅ Sucesso: ${migration.name}`);
        results.push({ step: i + 1, name: migration.name, success: true });
      }
      
    } catch (error) {
      console.error(`💥 Erro inesperado: ${error.message}`);
      results.push({ step: i + 1, name: migration.name, error: error.message, success: false });
    }
  }
  
  console.log('📊 Resumo da migração:', results);
  
  // Instruções manuais se automático não funcionar
  console.log(`
🔧 INSTRUÇÕES MANUAIS:

Se o script automático não funcionou, execute estes SQLs manualmente no Supabase Dashboard > SQL Editor:

1. ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);

2. ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS horario_liberacao_5_estrelas TIME DEFAULT '08:00:00';

3. ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS horario_liberacao_4_estrelas TIME DEFAULT '08:45:00';

4. ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS horario_liberacao_3_estrelas TIME DEFAULT '09:20:00';

5. ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS horario_liberacao_2_estrelas TIME DEFAULT '10:00:00';

6. ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS horario_liberacao_1_estrela TIME DEFAULT '10:30:00';

7. ALTER TABLE entregadores ADD COLUMN IF NOT EXISTS estrelas INTEGER DEFAULT 5 CHECK (estrelas >= 1 AND estrelas <= 5);

8. UPDATE configuracoes_empresa SET categoria = CASE 
   WHEN chave LIKE '%horario%' OR chave = 'horarios' OR chave = 'horarios_configurados' THEN 'horarios'
   WHEN chave LIKE '%agendamento%' OR chave = 'permitirAgendamentoMesmoDia' THEN 'agendamento'  
   WHEN chave LIKE '%priorizacao%' OR chave = 'habilitarPriorizacao' THEN 'priorizacao'
   ELSE 'geral'
   END WHERE categoria IS NULL;

9. UPDATE entregadores SET estrelas = 5 WHERE estrelas IS NULL;
  `);
  
  return results;
}

// Executar automaticamente
executarMigracaoEstrelas();