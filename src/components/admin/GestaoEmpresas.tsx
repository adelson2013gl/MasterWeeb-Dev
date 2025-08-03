
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { URLAcessoEmpresa } from "./URLAcessoEmpresa";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { logger } from "@/lib/logger";

import { EmpresaCard } from "./gestao-empresas/EmpresaCard";
import { FormEmpresaModal } from "./gestao-empresas/FormEmpresaModal";
import { Empresa } from "./gestao-empresas/types";

export function GestaoEmpresas() {
  const { isSuperAdmin, isAdminEmpresa, userRole } = useEmpresaUnificado();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null);
  const { toast } = useToast();

  // CORREÇÃO PRINCIPAL: Super admin pode criar empresas sempre
  const canCreateEmpresa = isSuperAdmin;

  // Log das permissões para auditoria
  logger.debug('Permissões do usuário em GestaoEmpresas', {
    isSuperAdmin,
    isAdminEmpresa,
    userRole: userRole?.role,
    canCreateEmpresa
  }, 'ADMIN');

  const carregarEmpresas = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando carregamento de empresas', {}, 'ADMIN');
      
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        logger.error('Erro ao carregar empresas', { error: error.message }, 'ADMIN');
        toast({
          title: "Erro ao carregar empresas",
          description: error.message,
          variant: "destructive",
        });
      } else {
        const empresasFormatted: Empresa[] = data?.map(empresa => ({
          id: empresa.id,
          nome: empresa.nome,
          email: empresa.email,
          cnpj: empresa.cnpj,
          telefone: empresa.telefone,
          endereco: empresa.endereco,
          plano_atual: empresa.plano_atual,
          ativa: empresa.ativa,
          data_expiracao: empresa.data_expiracao,
          max_entregadores: empresa.max_entregadores,
          max_agendas_mes: empresa.max_agendas_mes,
          admin_user_id: empresa.admin_user_id,
          created_at: empresa.created_at,
          updated_at: empresa.updated_at,
        })) || [];

        const duration = Date.now() - startTime;
        logger.performance('empresas_carregadas', duration, {
          totalEmpresas: empresasFormatted.length
        });

        logger.info('Empresas carregadas com sucesso', { 
          totalEmpresas: empresasFormatted.length 
        }, 'ADMIN');

        setEmpresas(empresasFormatted);
      }
    } catch (error: any) {
      logger.error('Erro inesperado ao carregar empresas', { 
        error: error.message 
      }, 'ADMIN');
      toast({
        title: "Erro inesperado",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const alterarStatusEmpresa = async (
    id: string,
    ativa: boolean
  ) => {
    try {
      logger.info('Alterando status da empresa', { 
        empresaId: id, 
        novoStatus: ativa ? 'ativa' : 'inativa',
        usuarioId: userRole?.id 
      }, 'ADMIN');
      
      const { data, error } = await supabase
        .from("empresas")
        .update({ ativa: ativa })
        .eq("id", id)
        .select();

      if (error) {
        logger.error('Erro ao alterar status da empresa', { 
          empresaId: id, 
          novoStatus: ativa ? 'ativa' : 'inativa', 
          error: error.message 
        }, 'ADMIN');
        toast({
          title: "Erro ao alterar status da empresa",
          description: error.message,
          variant: "destructive",
        });
      } else {
        logger.info('Status da empresa alterado com sucesso', { 
          empresaId: id, 
          novoStatus: ativa ? 'ativa' : 'inativa' 
        }, 'ADMIN');
        toast({
          title: "Status da empresa alterado com sucesso!",
        });
        carregarEmpresas();
      }
    } catch (error: any) {
      logger.error('Erro inesperado ao alterar status', { 
        empresaId: id, 
        novoStatus: ativa ? 'ativa' : 'inativa', 
        error: error.message 
      }, 'ADMIN');
      toast({
        title: "Erro inesperado",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditarEmpresa = (empresa: Empresa) => {
    logger.info('Iniciando edição de empresa', { 
      empresaId: empresa.id, 
      empresaNome: empresa.nome 
    }, 'ADMIN');
    setEmpresaEditando(empresa);
    setShowModal(true);
  };

  const handleNovaEmpresa = () => {
    logger.info('Tentativa de criar nova empresa', { 
      isSuperAdmin, 
      canCreate: canCreateEmpresa,
      userRole: userRole?.role
    }, 'ADMIN');
    
    if (!canCreateEmpresa) {
      logger.warn('Acesso negado para criação de empresa', {
        userRole: userRole?.role,
        isSuperAdmin
      }, 'ADMIN');
      toast({
        title: "Acesso Negado",
        description: "Apenas Super Administradores podem criar novas empresas",
        variant: "destructive",
      });
      return;
    }
    
    setEmpresaEditando(null);
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    logger.info('Modal de empresa fechado com sucesso', {}, 'ADMIN');
    carregarEmpresas();
    setShowModal(false);
    setEmpresaEditando(null);
  };

  useEffect(() => {
    carregarEmpresas();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestão de Empresas
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie todas as empresas cadastradas no sistema
          </p>
          {/* DEBUG: Mostrar informações de permissão */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs bg-slate-800 text-white font-medium px-2 py-1 rounded mt-2">
              Super Admin: {isSuperAdmin ? 'Sim' : 'Não'} | 
              Role: {userRole?.role} | 
              Pode Criar: {canCreateEmpresa ? 'Sim' : 'Não'}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {/* CORREÇÃO: Mostrar botões sempre para super admin */}
          {canCreateEmpresa && (
            <>
              <Button 
                variant="outline" 
                onClick={() => window.open('/admin/cadastro-empresa', '_blank')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar Admin
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
              <Button onClick={handleNovaEmpresa}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </Button>
            </>
          )}
          {/* Mostrar aviso se não é super admin */}
          {!isSuperAdmin && (
            <div className="text-sm text-gray-500 italic">
              Apenas Super Administradores podem criar empresas
            </div>
          )}
        </div>
      </div>

      {/* Lista de Empresas */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {empresas.map((empresa) => (
              <EmpresaCard
                key={empresa.id}
                empresa={empresa}
                onEdit={handleEditarEmpresa}
                onAlterarStatus={alterarStatusEmpresa}
              />
            ))}
          </div>

          {/* Seção de URL de Acesso - mostrar apenas se há empresa selecionada */}
          {empresas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                URLs de Acesso das Empresas
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {empresas.filter(e => e.ativa === true).map((empresa) => (
                  <URLAcessoEmpresa key={empresa.id} nomeEmpresa={empresa.nome} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Criação/Edição de Empresa - PARA SUPER ADMIN */}
      {canCreateEmpresa && (
        <FormEmpresaModal
          open={showModal}
          onOpenChange={setShowModal}
          empresa={empresaEditando}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
