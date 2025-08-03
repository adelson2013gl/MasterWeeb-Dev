import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = 'https://nfwdgkjrkmrjsfnbmsrd.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5md2Rna2pya21yanNmbmJtc3JkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA0NDAxOCwiZXhwIjoyMDY0NjIwMDE4fQ.e7yiJnjoZ0AhgdLBbGFsGNZwmbz54-N22iy9L6Fn6mw';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function criarAdminEmpresa(nome, email, senha, empresa_id) {
  try {
    console.log(`🚀 Criando admin para empresa ${empresa_id}...`);
    
    // 1. Criar usuário no Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário Auth:', authError);
      return { success: false, error: authError };
    }

    console.log(`✅ Usuário Auth criado: ${authUser.user.id}`);

    // 2. Gerar valores únicos para telefone e CPF
    const timestamp = Date.now().toString().slice(-10);
    const uniqueSuffix = Math.random().toString().slice(2, 7);
    const telefone = `000${timestamp}`.slice(-11);
    const cpf = `000${uniqueSuffix}${timestamp.slice(-6)}`.slice(-11);

    // 3. Buscar cidade padrão
    const { data: cidade } = await supabase
      .from('cidades')
      .select('id')
      .eq('ativo', true)
      .limit(1)
      .single();

    const cidade_id = cidade?.id || '00000000-0000-4000-a000-000000000000';

    // 4. Inserir na tabela entregadores
    const now = new Date();
    const dataCadastro = now.toISOString().split('T')[0];

    const { data: entregador, error: entregadorError } = await supabase
      .from('entregadores')
      .insert({
        user_id: authUser.user.id,
        nome,
        email,
        telefone,
        cpf,
        cidade_id,
        perfil: 'admin',
        status: 'aprovado',
        data_cadastro: dataCadastro,
        data_aprovacao: dataCadastro,
        empresa_id,
      })
      .select()
      .single();

    if (entregadorError) {
      console.error('❌ Erro ao inserir entregador:', entregadorError);
      return { success: false, error: entregadorError };
    }

    console.log(`✅ Entregador criado: ${entregador.id}`);

    // 5. Inserir role de admin_empresa
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        empresa_id,
        role: 'admin_empresa',
      });

    if (roleError) {
      console.warn('⚠️ Erro ao inserir role (não crítico):', roleError);
    } else {
      console.log('✅ Role admin_empresa atribuída');
    }

    return {
      success: true,
      user: authUser.user,
      entregador,
    };
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
    return { success: false, error };
  }
}

// Exemplo de uso
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.log('Uso: node createAdminUser.js "Nome Admin" email@empresa.com senha123 empresa_id');
    return;
  }

  const [nome, email, senha, empresa_id] = args;
  const result = await criarAdminEmpresa(nome, email, senha, empresa_id);
  
  if (result.success) {
    console.log('🎉 Admin criado com sucesso!');
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.error('❌ Falha ao criar admin:', result.error);
  }
}

main();