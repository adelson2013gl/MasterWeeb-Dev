import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CadastroAdminRequest {
  empresa_id: string;
  nome: string;
  email: string;
  senha: string;
  codigo_acesso?: string;
  origem?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Edge Function: cadastro-admin-empresa iniciada')
    
    // Validar Content-Type
    const contentType = req.headers.get('content-type');
    console.log('📋 Content-Type recebido:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      console.warn('❌ Content-Type inválido:', contentType);
      throw new Error('Content-Type deve ser application/json');
    }

    const requestBody = await req.json();
    console.log('📋 Corpo da requisição recebido:', Object.keys(requestBody));
    
    const { 
      empresa_id, 
      nome, 
      email, 
      senha, 
      codigo_acesso,
      origem = 'interface_admin'
    }: CadastroAdminRequest = requestBody;

    // Log de auditoria
    console.log('📋 Dados recebidos:', { 
      empresa_id, 
      nome, 
      email: email?.toLowerCase(), 
      origem,
      has_codigo: !!codigo_acesso,
      senha_length: senha?.length
    })

    // Validações detalhadas com logs específicos
    console.log('🔍 Validando dados obrigatórios...');
    console.log('- empresa_id:', !!empresa_id, typeof empresa_id);
    console.log('- nome:', !!nome, typeof nome, nome?.length);
    console.log('- email:', !!email, typeof email, email?.includes('@'));
    console.log('- senha:', !!senha, typeof senha, senha?.length);

    // Validações básicas
    if (!empresa_id || !nome || !email || !senha) {
      const missing = [];
      if (!empresa_id) missing.push('empresa_id');
      if (!nome) missing.push('nome');
      if (!email) missing.push('email');
      if (!senha) missing.push('senha');
      
      console.error('❌ Dados obrigatórios faltando:', missing);
      throw new Error(`Dados obrigatórios faltando: ${missing.join(', ')}`);
    }

    console.log('✅ Dados obrigatórios validados');

    // Validação específica do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Formato de email inválido:', email);
      throw new Error('Formato de email inválido');
    }

    console.log('✅ Email validado');

    if (senha.length < 6) {
      console.error('❌ Senha muito curta:', senha.length);
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    console.log('✅ Senha validada');

    // Validação do código de acesso (segurança básica)
    if (origem === 'interface_publica') {
      if (!codigo_acesso) {
        console.warn('❌ Código de acesso obrigatório para interface pública')
        throw new Error('Código de acesso é obrigatório')
      }
      
      // Códigos de acesso válidos (podem ser gerados dinamicamente no futuro)
      const codigosValidos = ['ADMIN2024', 'SETUP123', 'EMPRESA2024', 'ADMIN123'];
      
      if (!codigosValidos.includes(codigo_acesso.toUpperCase())) {
        console.warn('❌ Código de acesso inválido:', codigo_acesso)
        throw new Error('Código de acesso inválido')
      }
      
      console.log('✅ Código de acesso validado')
    }

    // Inicializar Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔍 Verificando se empresa existe...')
    
    // Verificar se a empresa existe e está ativa
    const { data: empresa, error: empresaError } = await supabaseAdmin
      .from('empresas')
      .select('id, nome, ativa')
      .eq('id', empresa_id)
      .eq('ativa', true)
      .single()

    if (empresaError || !empresa) {
      console.error('❌ Empresa não encontrada ou inativa:', empresaError)
      throw new Error('Empresa não encontrada ou inativa')
    }

    console.log('✅ Empresa validada:', empresa.nome)

    // Verificar se já existe um usuário com este email
    console.log('🔍 Verificando se email já existe...')
    
    try {
      const { data: existingUser, error: userListError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (userListError) {
        console.error('❌ Erro ao listar usuários:', userListError);
        throw new Error(`Erro ao verificar usuários existentes: ${userListError.message}`);
      }
      
      console.log('📊 Total de usuários no sistema:', existingUser.users.length);
      
      const emailExists = existingUser.users.some(user => 
        user.email?.toLowerCase() === email.toLowerCase()
      )

      if (emailExists) {
        console.warn('❌ Email já cadastrado:', email)
        throw new Error('Já existe um usuário com este email')
      }

      console.log('✅ Email disponível')
    } catch (error) {
      console.error('💥 Erro na verificação de email:', error);
      throw error;
    }

    // Criar usuário no Auth
    console.log('👤 Criando usuário no Auth...')
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: senha,
      email_confirm: true,
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário Auth:', authError)
      console.error('❌ Detalhes do erro Auth:', {
        message: authError.message,
        status: authError.status,
        statusCode: authError.__isAuthError ? 'AuthError' : 'UnknownError'
      });
      throw new Error(`Erro ao criar usuário: ${authError?.message}`)
    }

    if (!authUser.user) {
      console.error('❌ Usuário Auth criado mas sem dados de usuário');
      throw new Error('Erro ao criar usuário: dados do usuário não retornados');
    }

    console.log('✅ Usuário Auth criado:', authUser.user.id)
    
    // Gerar dados únicos para o entregador
    const timestamp = Date.now().toString().slice(-10)
    const uniqueSuffix = Math.random().toString().slice(2, 5)
    const telefone = `11${timestamp}`.slice(-11)
    const cpf = `000${uniqueSuffix}${timestamp.slice(-6)}`.slice(-11)

    console.log('📝 Dados gerados para entregador:', {
      user_id: authUser.user.id,
      telefone,
      cpf: cpf.substring(0, 3) + '***' + cpf.substring(8) // Mascarar CPF no log
    });

    // Buscar cidade padrão da empresa ou criar uma cidade padrão
    console.log('🏙️ Buscando cidade padrão...')
    const { data: cidade, error: cidadeError } = await supabaseAdmin
      .from('cidades')
      .select('id, nome')
      .eq('empresa_id', empresa_id)
      .eq('ativo', true)
      .limit(1)
      .single()

    let cidade_id;

    if (cidadeError || !cidade) {
      console.warn('⚠️ Nenhuma cidade ativa encontrada para a empresa. Criando cidade padrão...', {
        cidadeError: cidadeError?.message,
        empresa_id
      });
      
      // Criar cidade padrão para a empresa
      const { data: novaCidade, error: criarCidadeError } = await supabaseAdmin
        .from('cidades')
        .insert({
          nome: 'Cidade Padrão',
          estado: 'SP', // Campo obrigatório
          empresa_id: empresa_id,
          ativo: true
        })
        .select('id, nome')
        .single();

      if (criarCidadeError || !novaCidade) {
        console.error('❌ Erro ao criar cidade padrão:', criarCidadeError);
        throw new Error(`Erro ao criar cidade padrão: ${criarCidadeError?.message}`);
      }

      cidade_id = novaCidade.id;
      console.log('✅ Cidade padrão criada:', {
        cidade_id,
        nome: novaCidade.nome,
        empresa_id
      });
    } else {
      cidade_id = cidade.id;
      console.log('✅ Cidade existente encontrada:', {
        cidade_id,
        nome: cidade.nome,
        empresa_id
      });
    }

    // Inserir na tabela entregadores
    console.log('📝 Criando registro de entregador...')

    const entregadorData = {
      user_id: authUser.user.id,
      nome: nome.trim(),
      email: email.toLowerCase(),
      telefone,
      cpf,
      cidade_id,
      perfil: 'admin',
      status: 'pendente',
      empresa_id,
    };

    console.log('📋 Dados do entregador a serem inseridos:', {
      ...entregadorData,
      cpf: cpf.substring(0, 3) + '***' + cpf.substring(8) // Mascarar CPF no log
    });

    const { data: entregador, error: entregadorError } = await supabaseAdmin
      .from('tecnicos')
      .insert(entregadorData)
      .select()
      .single()

    if (entregadorError) {
      console.error('❌ Erro ao criar entregador:', entregadorError)
      console.error('❌ Detalhes do erro entregador:', {
        message: entregadorError.message,
        code: entregadorError.code,
        details: entregadorError.details,
        hint: entregadorError.hint
      });
      
      // Tentar limpar usuário criado no Auth
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        console.log('🧹 Usuário Auth removido após erro')
      } catch (cleanupError) {
        console.error('⚠️ Erro ao limpar usuário Auth:', cleanupError)
      }
      throw new Error(`Erro ao criar entregador: ${entregadorError.message}`)
    }

    console.log('✅ Entregador criado:', entregador.id)
    
    // Inserir role de admin_empresa
    console.log('👑 Atribuindo role admin_empresa...')
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        empresa_id,
        role: 'admin_empresa',
      })

    if (roleError) {
      console.warn('⚠️ Erro ao inserir role (não crítico):', roleError)
    } else {
      console.log('✅ Role admin_empresa atribuída')
    }

    // Log de auditoria final
    console.log('🎉 Cadastro concluído com sucesso:', {
      user_id: authUser.user.id,
      tecnico_id: entregador.id,
      empresa: empresa.nome,
      origem
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Administrador criado com sucesso!',
        admin_id: entregador.id,
        data: {
          user_id: authUser.user.id,
          tecnico_id: entregador.id,
          empresa: empresa.nome
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
    
  } catch (error: any) {
    console.error('💥 Erro na Edge Function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
