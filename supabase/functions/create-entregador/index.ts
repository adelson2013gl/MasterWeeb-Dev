
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface CreateEntregadorRequest {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  cidade_id: string;
  empresa_id: string;
  senha: string;
}

interface CreateEntregadorResponse {
  success: boolean;
  message: string;
  data?: {
    tecnico_id: string;
    user_id: string;
    nome: string;
    email: string;
  };
  error?: string;
  details?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    console.log("🚀 EDGE_FUNCTION: create-entregador iniciada")
    
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("❌ EDGE_FUNCTION: Content-Type inválido:", contentType);
      throw new Error("Content-Type deve ser application/json");
    }

    console.log("✅ EDGE_FUNCTION: Content-Type validado");

    const requestBody = await req.json();
    console.log("📥 EDGE_FUNCTION: Body recebido:", {
      nome: requestBody.nome,
      email: requestBody.email,
      telefone: requestBody.telefone,
      cpf: requestBody.cpf ? `${requestBody.cpf.substring(0, 3)}***` : 'N/A',
      cidade_id: requestBody.cidade_id,
      empresa_id: requestBody.empresa_id,
      temSenha: !!requestBody.senha
    });

    const { nome, email, telefone, cpf, cidade_id, empresa_id, senha }: CreateEntregadorRequest = requestBody;

    // Validações detalhadas
    console.log("🔍 EDGE_FUNCTION: Iniciando validações...");
    
    const requiredFields = { nome, email, telefone, cpf, cidade_id, empresa_id, senha };
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value || (typeof value === "string" && value.trim() === ""))
      .map(([key, _]) => key);

    if (missingFields.length > 0) {
      console.error("❌ EDGE_FUNCTION: Campos faltando:", missingFields);
      throw new Error(`Campos obrigatorios faltando: ${missingFields.join(", ")}`);
    }

    console.log("✅ EDGE_FUNCTION: Campos obrigatórios validados");

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("❌ EDGE_FUNCTION: Email inválido:", email);
      throw new Error("Formato de email invalido");
    }

    console.log("✅ EDGE_FUNCTION: Email validado:", email);

    // Validar senha
    if (senha.length < 6) {
      console.error("❌ EDGE_FUNCTION: Senha muito curta");
      throw new Error("Senha deve ter pelo menos 6 caracteres");
    }

    console.log("✅ EDGE_FUNCTION: Senha validada");

    // Supabase Admin Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ EDGE_FUNCTION: Configuração do servidor incompleta");
      throw new Error("Configuracao do servidor incompleta");
    }

    console.log("✅ EDGE_FUNCTION: Configuração do Supabase validada");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verificar empresa
    console.log("🏢 EDGE_FUNCTION: Verificando empresa:", empresa_id);
    
    const { data: empresa, error: empresaError } = await supabaseAdmin
      .from("empresas")
      .select("id, nome, ativa")
      .eq("id", empresa_id)
      .eq("ativa", true)
      .single();

    if (empresaError || !empresa) {
      console.error("❌ EDGE_FUNCTION: Empresa não encontrada:", { empresaError, empresa_id });
      throw new Error("Empresa nao encontrada ou inativa");
    }

    console.log("✅ EDGE_FUNCTION: Empresa validada:", empresa.nome);

    // Verificar cidade
    console.log("🏙️ EDGE_FUNCTION: Verificando cidade:", cidade_id);
    
    const { data: cidade, error: cidadeError } = await supabaseAdmin
      .from("cidades")
      .select("id, nome, ativo")
      .eq("id", cidade_id)
      .eq("ativo", true)
      .single();

    if (cidadeError || !cidade) {
      console.error("❌ EDGE_FUNCTION: Cidade não encontrada:", { cidadeError, cidade_id });
      throw new Error("Cidade nao encontrada ou inativa");
    }

    console.log("✅ EDGE_FUNCTION: Cidade validada:", cidade.nome);

    // Verificar email duplicado na tabela entregadores
    console.log("📧 EDGE_FUNCTION: Verificando email duplicado:", email);
    
    const { data: existingEntregador, error: checkError } = await supabaseAdmin
      .from("tecnicos")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (checkError) {
      console.error("❌ EDGE_FUNCTION: Erro ao verificar email:", checkError);
      throw new Error("Erro ao verificar email existente");
    }

    if (existingEntregador) {
      console.error("❌ EDGE_FUNCTION: Email já existe:", email);
      throw new Error("Este email ja esta cadastrado como entregador");
    }

    console.log("✅ EDGE_FUNCTION: Email único confirmado");

    // Criar usuário de autenticação
    console.log("👤 EDGE_FUNCTION: Criando usuário de autenticação...");
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome: nome.trim(),
        tipo_usuario: "tecnico",
        empresa_id: empresa_id,
        created_via: "importacao_massa"
      }
    });

    if (authError) {
      console.error("❌ EDGE_FUNCTION: Erro ao criar usuário:", authError);
      throw new Error(`Erro ao criar usuario: ${authError.message}`);
    }

    if (!authUser.user) {
      console.error("❌ EDGE_FUNCTION: Falha ao criar usuário - sem user data");
      throw new Error("Falha ao criar usuario de autenticacao");
    }

    console.log("✅ EDGE_FUNCTION: Usuário criado:", {
      user_id: authUser.user.id,
      email: authUser.user.email
    });

    // Inserir entregador
    console.log("📝 EDGE_FUNCTION: Inserindo entregador na tabela...");
    
    const entregadorData = {
      user_id: authUser.user.id,
      nome: nome.trim(),
      email: email.toLowerCase().trim(),
      telefone: telefone.trim(),
      cpf: cpf.trim(),
      cidade_id: cidade_id,
      empresa_id: empresa_id,
      perfil: "tecnico",
      status: "aprovado", // Aprovado automaticamente
      estrelas: 5
    };

    console.log("📤 EDGE_FUNCTION: Dados para inserção:", {
      ...entregadorData,
      cpf: `${entregadorData.cpf.substring(0, 3)}***`
    });

    const { data: entregador, error: insertError } = await supabaseAdmin
      .from("tecnicos")
      .insert(entregadorData)
      .select("id, nome, email, user_id, status")
      .single();

    if (insertError) {
      console.error("❌ EDGE_FUNCTION: Erro ao inserir entregador:", insertError);
      
      // Cleanup: remover usuário se falhar
      try {
        console.log("🧹 EDGE_FUNCTION: Fazendo cleanup do usuário...");
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        console.log("✅ EDGE_FUNCTION: Cleanup realizado");
      } catch (cleanupError) {
        console.error("❌ EDGE_FUNCTION: Erro no cleanup:", cleanupError);
      }
      
      throw new Error(`Erro ao criar entregador: ${insertError.message}`);
    }

    console.log("✅ EDGE_FUNCTION: Entregador inserido com sucesso:", {
      id: entregador.id,
      nome: entregador.nome,
      email: entregador.email,
      status: entregador.status
    });

    const response: CreateEntregadorResponse = {
      success: true,
      message: "Entregador criado com sucesso! Podera fazer login com a senha fornecida.",
      data: {
        tecnico_id: entregador.id,
        user_id: entregador.user_id,
        nome: entregador.nome,
        email: entregador.email
      }
    };

    console.log("🎉 EDGE_FUNCTION: Sucesso completo!");

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("💥 EDGE_FUNCTION: Erro geral:", error);
    
    const response: CreateEntregadorResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido no servidor",
      details: error instanceof Error ? error.stack : undefined
    };
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
