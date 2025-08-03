/**
 * EmpresaUnificadoContext refatorado - Versão modular e otimizada
 * Usa hooks separados para melhor manutenibilidade e performance
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useEmpresaUnificado } from '@/hooks/useEmpresaUnificado';
import { Database } from '@/integrations/supabase/types';
import { Entregador } from '@/components/admin/gestao-entregadores/types';

// Função utilitária mantida para compatibilidade
export function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '')    // Remove caracteres especiais
    .replace(/\s+/g, '-')            // Espaços para hífens
    .replace(/-+/g, '-')              // Remove hífens duplos
    .trim();
}

type Empresa = Database['public']['Tables']['empresas']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];

interface EmpresaComRole extends Empresa {
  role: string;
}

// Interface do contexto - mantida para compatibilidade
interface EmpresaUnificadoContextType {
  empresa: Empresa | null;
  entregador: Entregador | null;
  userRole: UserRole | null;
  isSuperAdmin: boolean;
  isAdminEmpresa: boolean;
  isAdmin: boolean;
  loading: boolean;
  empresasDisponiveis: EmpresaComRole[];
  empresasLoading: boolean;
  trocarEmpresa: (empresaId: string) => Promise<void>;
  criarEmpresa: (dadosEmpresa: Partial<Empresa>) => Promise<{ success: boolean; empresaId?: string }>;
  atualizarEmpresa: (empresaId: string, dados: Partial<Empresa>) => Promise<boolean>;
  refetch: () => Promise<void>;
  debugAuth: () => Promise<void>;
}

const EmpresaUnificadoContext = createContext<EmpresaUnificadoContextType | undefined>(undefined);

// Provider refatorado - muito mais limpo
export function RefactoredEmpresaUnificadoProvider({ children }: { children: ReactNode }) {
  // Usar o hook central que coordena tudo
  const empresaUnificado = useEmpresaUnificado();

  // Adaptar interface para compatibilidade
  const contextValue: EmpresaUnificadoContextType = {
    empresa: empresaUnificado.empresa,
    entregador: empresaUnificado.entregador,
    userRole: empresaUnificado.userRole,
    isSuperAdmin: empresaUnificado.isSuperAdmin,
    isAdminEmpresa: empresaUnificado.isAdminEmpresa,
    isAdmin: empresaUnificado.isAdmin,
    loading: empresaUnificado.loading,
    empresasDisponiveis: empresaUnificado.empresasDisponiveis,
    empresasLoading: empresaUnificado.empresasLoading,
    trocarEmpresa: empresaUnificado.trocarEmpresa,
    criarEmpresa: empresaUnificado.criarEmpresa,
    atualizarEmpresa: empresaUnificado.atualizarEmpresa,
    refetch: empresaUnificado.refetch,
    debugAuth: empresaUnificado.debugAuth,
  };

  return (
    <EmpresaUnificadoContext.Provider value={contextValue}>
      {children}
    </EmpresaUnificadoContext.Provider>
  );
}

// Hook para usar o contexto - mantido para compatibilidade
export function useRefactoredEmpresaUnificado() {
  const context = useContext(EmpresaUnificadoContext);
  if (context === undefined) {
    throw new Error('useRefactoredEmpresaUnificado must be used within a RefactoredEmpresaUnificadoProvider');
  }
  return context;
}

// Para facilitar migração gradual
export const RefactoredEmpresaUnificadoContext = EmpresaUnificadoContext;