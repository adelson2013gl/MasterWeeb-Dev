import { AdminDashboard } from "@/components/AdminDashboard";
import { EntregadorDashboard } from "@/components/EntregadorDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useEmpresaValidation } from "@/hooks/useEmpresaValidation";
import { Button } from "@/components/ui/button";
import { LogOut, RefreshCw, AlertTriangle, Calendar } from "lucide-react";
import { useState } from "react";
import { logger } from "@/lib/logger";

export function AuthenticatedApp() {
  const { signOut, loading: authLoading } = useAuth();
  const { 
    empresa, 
    entregador, 
    userRole, 
    isAdminEmpresa, 
    loading: empresaLoading, 
    refetch 
  } = useEmpresaUnificado();
  const { permissions, loading: permissionsLoading, refetch: refetchPermissions } = useUserPermissions();
  const { isExpired, canAccess, warningMessage, expiryDate } = useEmpresaValidation();
  const [isRefetching, setIsRefetching] = useState(false);

  // Wrapper function para corrigir tipo do onClick
  const handleSignOut = () => {
    signOut();
  };

  const handleRefresh = async () => {
    setIsRefetching(true);
    try {
      await Promise.all([refetch(), refetchPermissions()]);
      logger.info('🔄 Refresh completo executado', {
        hasEmpresa: !!empresa,
        hasEntregador: !!entregador,
        hasPermissions: permissions.canAccessSystem
      });
    } finally {
      setIsRefetching(false);
    }
  };

  // Loading enquanto auth, empresa ou permissões estão carregando
  const isLoading = authLoading || empresaLoading || permissionsLoading;

  logger.info('🔍 AuthenticatedApp: Estado estrutural atual', {
    authLoading,
    empresaLoading,
    permissionsLoading,
    isLoading,
    hasEntregador: !!entregador,
    hasEmpresa: !!empresa,
    entregadorStatus: entregador?.status,
    empresaStatus: empresa?.status,
    isExpired,
    canAccess,
    permissions: {
      hasValidRole: permissions.hasValidRole,
      canAccessSystem: permissions.canAccessSystem,
      isAdminEmpresa: permissions.isAdminEmpresa,
      roleType: permissions.roleType,
      empresaId: permissions.empresaId
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-4">Carregando sistema...</h2>
          <p className="text-gray-600 mb-6">Aguarde enquanto validamos suas permissões e carregamos seus dados.</p>
          <div className="space-x-4">
            <Button onClick={handleRefresh} variant="outline" disabled={isRefetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Tentar Novamente
            </Button>
            <Button onClick={() => handleSignOut()} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // NOVA VALIDAÇÃO: Verificar vencimento da empresa
  if (isExpired && empresa && expiryDate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Pattern de fundo sutil */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dc2626' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          
          {/* Card principal */}
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-red-200 p-8 text-center">
            {/* Ícone com animação */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse" />
              <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center shadow-lg">
                <Calendar className="h-10 w-10 text-white drop-shadow-sm" />
              </div>
            </div>

            {/* Título */}
            <h1 className="text-3xl font-bold bg-gradient-to-br from-red-900 to-red-700 bg-clip-text text-transparent mb-3">
              Assinatura Vencida
            </h1>
            
            {/* Subtítulo */}
            <p className="text-lg text-red-700 mb-2 font-medium">
              Acesso Bloqueado Automaticamente
            </p>
            
            {/* Descrição principal */}
            <p className="text-gray-600 mb-4 leading-relaxed">
              A assinatura da empresa <strong>{empresa.nome}</strong> venceu em{' '}
              <strong>{expiryDate.toLocaleDateString('pt-BR')}</strong>.
            </p>
            
            {/* Detalhes do vencimento */}
            <div className="bg-red-50/80 rounded-xl p-4 mb-6 border border-red-100">
              <p className="text-sm text-red-700 font-medium mb-1">Status da Empresa:</p>
              <p className="text-xs text-red-600 font-mono bg-white/60 rounded-lg px-3 py-2 border">
                {warningMessage}
              </p>
            </div>
            
            {/* Mensagem de contato */}
            <div className="bg-blue-50/80 rounded-xl p-4 mb-6 border border-blue-100">
              <p className="text-sm text-blue-700">
                <strong>Para reativar sua conta:</strong><br />
                Entre em contato com o suporte para renovar sua assinatura e reativar o acesso completo ao sistema.
              </p>
            </div>
            
            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={handleRefresh} 
                variant="default"
                disabled={isRefetching}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1 sm:flex-none"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                {isRefetching ? 'Verificando...' : 'Verificar Renovação'}
              </Button>
              
              <Button 
                onClick={() => handleSignOut()} 
                variant="outline"
                className="border-red-300 hover:bg-red-50 hover:border-red-400 transition-all duration-200 flex-1 sm:flex-none"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair do Sistema
              </Button>
            </div>
            
            {/* Rodapé com informação adicional */}
            <div className="mt-6 pt-4 border-t border-red-100">
              <p className="text-xs text-red-400">
                Sistema de validação automática ativo • Empresa ID: {empresa.id.slice(0, 8)}...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verificar permissões estruturais primeiro
  if (!permissions.canAccessSystem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Pattern de fundo sutil */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          
          {/* Card principal */}
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
            {/* Ícone com animação */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse" />
              <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-10 w-10 text-white drop-shadow-sm" />
              </div>
            </div>

            {/* Título */}
            <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
              Acesso Negado
            </h1>
            
            {/* Subtítulo */}
            <p className="text-lg text-gray-600 mb-2 font-medium">
              Permissões insuficientes
            </p>
            
            {/* Descrição principal */}
            <p className="text-gray-500 mb-4 leading-relaxed">
              Não foi possível validar suas permissões de acesso ao sistema. 
              Verifique com o administrador se seu cadastro foi aprovado.
            </p>
            
            {/* Detalhes técnicos */}
            <div className="bg-gray-50/80 rounded-xl p-4 mb-6 border border-gray-100">
              <p className="text-sm text-gray-600 font-medium mb-1">Detalhes do erro:</p>
              <p className="text-xs text-gray-500 font-mono bg-white/60 rounded-lg px-3 py-2 border">
                {!permissions.hasValidRole ? 'Role não encontrada no sistema' : 'Permissões insuficientes para acesso'}
              </p>
            </div>
            
            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={handleRefresh} 
                variant="default"
                disabled={isRefetching}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-1 sm:flex-none"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                {isRefetching ? 'Verificando...' : 'Verificar Novamente'}
              </Button>
              
              <Button 
                onClick={() => handleSignOut()} 
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex-1 sm:flex-none"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair do Sistema
              </Button>
            </div>
            
            {/* Rodapé com informação adicional */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Se o problema persistir, entre em contato com o suporte técnico
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!entregador) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Perfil não encontrado</h2>
          <p className="text-gray-600 mb-6">
            Não foi possível carregar seus dados de entregador. 
            Verifique se seu cadastro foi realizado corretamente.
          </p>
          <div className="space-x-4">
            <Button onClick={handleRefresh} variant="outline" disabled={isRefetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Tentar Novamente
            </Button>
            <Button onClick={() => handleSignOut()} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Empresa não encontrada</h2>
          <p className="text-gray-600 mb-6">
            Não foi possível carregar os dados da empresa. Entre em contato com o suporte.
          </p>
          <div className="space-x-4">
            <Button onClick={handleRefresh} variant="outline" disabled={isRefetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Tentar Novamente
            </Button>
            <Button onClick={() => signOut()} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Verificar se empresa está ativa
  if (!empresa.ativa) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Empresa Inativa</h2>
          <p className="text-gray-600 mb-6">
            A empresa está cancelada. Entre em contato com o suporte.
          </p>
          <Button onClick={() => handleSignOut()} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  // Verificar status do entregador
  if (entregador.status === 'pendente') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Cadastro em Análise</h2>
          <p className="text-gray-600 mb-4">
            Olá <strong>{entregador.nome}</strong>! Seu cadastro na empresa <strong>{empresa.nome}</strong> está sendo analisado.
          </p>
          <p className="text-gray-600 mb-6">
            Você receberá um email quando for aprovado.
          </p>
          <Button onClick={() => handleSignOut()} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  if (entregador.status === 'rejeitado') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Cadastro Rejeitado</h2>
          <p className="text-gray-600 mb-4">
            Infelizmente seu cadastro na empresa <strong>{empresa.nome}</strong> foi rejeitado.
          </p>
          {entregador.motivo_rejeicao && (
            <p className="text-sm text-gray-500 mb-6">
              Motivo: {entregador.motivo_rejeicao}
            </p>
          )}
          <Button onClick={() => handleSignOut()} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  if (entregador.status === 'suspenso') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Conta Suspensa</h2>
          <p className="text-gray-600 mb-6">
            Sua conta na empresa <strong>{empresa.nome}</strong> foi temporariamente suspensa. 
            Entre em contato com o administrador.
          </p>
          <Button onClick={() => handleSignOut()} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  // Usuário aprovado - usar permissões estruturadas para determinar dashboard
  logger.info('✅ AuthenticatedApp: Usuário aprovado, determinando dashboard', {
    entregadorStatus: entregador.status,
    permissionsIsAdmin: permissions.isAdminEmpresa,
    legacyIsAdmin: isAdminEmpresa,
    roleType: permissions.roleType,
    empresaValidation: { isExpired, canAccess }
  });
  
  return permissions.isAdminEmpresa ? <AdminDashboard /> : <EntregadorDashboard />;
}
