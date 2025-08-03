#!/usr/bin/env node

/**
 * Script de Bootstrap para criar o primeiro Super Admin
 * 
 * Este script resolve o problema crítico de não ter como criar
 * o primeiro super admin em um banco novo.
 * 
 * Uso:
 *   node bootstrap-super-admin.js
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

console.log('🚀 Iniciando Bootstrap do Super Admin...');
console.log('==========================================');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Credenciais padrão do primeiro super admin
const SUPER_ADMIN_EMAIL = 'admin@masterweeb.com';
const SUPER_ADMIN_PASSWORD = 'SuperAdmin123!';

async function checkExistingSuperAdmin() {
  try {
    console.log('🔍 Verificando se já existe super admin...');
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('id, user_id')
      .eq('role', 'super_admin')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao verificar super admin:', error.message);
      return false;
    }

    if (data && data.length > 0) {
      console.log('✅ Super admin já existe no sistema');
      console.log(`📋 User ID: ${data[0].user_id}`);
      return true;
    }

    console.log('📝 Nenhum super admin encontrado - prosseguindo com criação');
    return false;
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
    return false;
  }
}

async function createSuperAdminUser() {
  try {
    console.log('👤 Criando usuário super admin...');
    
    // Criar usuário via Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        tipo_usuario: 'super_admin',
        nome: 'Super Administrator'
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError.message);
      return null;
    }

    console.log('✅ Usuário criado com sucesso');
    console.log(`📧 Email: ${authData.user.email}`);
    console.log(`🆔 ID: ${authData.user.id}`);

    return authData.user;
  } catch (error) {
    console.error('❌ Erro na criação do usuário:', error.message);
    return null;
  }
}

async function createSuperAdminRole(userId) {
  try {
    console.log('🔐 Criando role de super admin...');
    
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'super_admin',
        empresa_id: null,
        ativo: true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar role:', error.message);
      return false;
    }

    console.log('✅ Role de super admin criada com sucesso');
    console.log(`📋 Role ID: ${data.id}`);
    return true;
  } catch (error) {
    console.error('❌ Erro na criação da role:', error.message);
    return false;
  }
}

async function createBootstrapData() {
  try {
    console.log('📊 Criando dados iniciais do sistema...');
    
    // Criar algumas cidades iniciais
    const { error: cidadesError } = await supabase
      .from('cidades')
      .upsert([
        { nome: 'São Paulo', estado: 'SP' },
        { nome: 'Rio de Janeiro', estado: 'RJ' },
        { nome: 'Belo Horizonte', estado: 'MG' }
      ], { onConflict: 'nome,estado' });

    if (cidadesError) {
      console.log('⚠️ Aviso ao criar cidades:', cidadesError.message);
    } else {
      console.log('✅ Cidades iniciais criadas');
    }

    // Criar turnos iniciais
    const { error: turnosError } = await supabase
      .from('turnos')
      .upsert([
        { nome: 'Manhã', hora_inicio: '08:00', hora_fim: '12:00' },
        { nome: 'Tarde', hora_inicio: '13:00', hora_fim: '17:00' },
        { nome: 'Noite', hora_inicio: '18:00', hora_fim: '22:00' }
      ], { onConflict: 'nome' });

    if (turnosError) {
      console.log('⚠️ Aviso ao criar turnos:', turnosError.message);
    } else {
      console.log('✅ Turnos iniciais criados');
    }

    console.log('✅ Dados iniciais configurados');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar dados iniciais:', error.message);
    return false;
  }
}

async function main() {
  try {
    // Verificar se já existe super admin
    const hasSuperAdmin = await checkExistingSuperAdmin();
    
    if (hasSuperAdmin) {
      console.log('🎉 Sistema já configurado com super admin!');
      console.log('==========================================');
      console.log('💡 Você pode fazer login com as credenciais existentes');
      return;
    }

    // Criar usuário super admin
    const user = await createSuperAdminUser();
    if (!user) {
      console.error('❌ Falha ao criar usuário - abortando');
      process.exit(1);
    }

    // Criar role de super admin
    const roleCreated = await createSuperAdminRole(user.id);
    if (!roleCreated) {
      console.error('❌ Falha ao criar role - abortando');
      process.exit(1);
    }

    // Criar dados iniciais
    await createBootstrapData();

    console.log('==========================================');
    console.log('🎉 Bootstrap concluído com sucesso!');
    console.log('');
    console.log('📋 Credenciais do Super Admin:');
    console.log(`📧 Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`🔑 Senha: ${SUPER_ADMIN_PASSWORD}`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    console.log('');
    console.log('🚀 Agora você pode acessar o sistema como super admin');
    
  } catch (error) {
    console.error('❌ Erro fatal no bootstrap:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
main().catch((error) => {
  console.error('❌ Erro fatal:', error.message);
  process.exit(1);
});

export { main as bootstrap };