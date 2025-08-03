// Script para executar SQL via Edge Function ou diretamente no Supabase
// Execute este script no console do navegador ou como edge function

const sql = `
-- Adicionar campo categoria
ALTER TABLE configuracoes_empresa ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);

-- Adicionar campos de horários por estrelas
ALTER TABLE configuracoes_empresa 
ADD COLUMN IF NOT EXISTS horario_liberacao_5_estrelas TIME DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS horario_liberacao_4_estrelas TIME DEFAULT '08:45:00',
ADD COLUMN IF NOT EXISTS horario_liberacao_3_estrelas TIME DEFAULT '09:20:00',
ADD COLUMN IF NOT EXISTS horario_liberacao_2_estrelas TIME DEFAULT '10:00:00',
ADD COLUMN IF NOT EXISTS horario_liberacao_1_estrela TIME DEFAULT '10:30:00';

-- Adicionar campo estrelas na tabela entregadores
ALTER TABLE entregadores ADD COLUMN IF NOT EXISTS estrelas INTEGER DEFAULT 5 CHECK (estrelas >= 1 AND estrelas <= 5);
`;

console.log('SQL para executar manualmente no Supabase SQL Editor:');
console.log(sql);

// Se você tiver acesso ao Supabase client, pode tentar executar diretamente:
/*
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xuuvxxlaaqjbcoklxrrv.supabase.co'
const supabaseServiceKey = 'SEU_SERVICE_ROLE_KEY_AQUI' // Use o service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executarSQL() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    if (error) throw error
    console.log('SQL executado com sucesso:', data)
  } catch (error) {
    console.error('Erro ao executar SQL:', error)
  }
}

executarSQL()
*/