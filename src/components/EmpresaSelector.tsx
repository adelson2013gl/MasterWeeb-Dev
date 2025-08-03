
import { useState } from 'react';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus } from 'lucide-react';
import { Database } from '@/types/database';

type Empresa = Database['public']['Tables']['empresas']['Row'];

export function EmpresaSelector() {
  const { 
    empresa, 
    isSuperAdmin, 
    isAdminEmpresa,
    userRole,
    empresasDisponiveis, 
    empresasLoading, 
    trocarEmpresa, 
    criarEmpresa 
  } = useEmpresaUnificado();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [novaEmpresa, setNovaEmpresa] = useState<{
    nome: string;
    cnpj: string;
    dominio: string;
    plano: 'basico' | 'pro' | 'enterprise';
  }>({
    nome: '',
    cnpj: '',
    dominio: '',
    plano: 'basico'
  });

  // CORREÇÃO PRINCIPAL: Super admin pode criar empresas sempre
  const canCreateEmpresa = isSuperAdmin;

  // DEBUG: Log detalhado para diagnóstico
  console.log('🔍 DEBUG EmpresaSelector:', {
    isSuperAdmin,
    isAdminEmpresa,
    userRole: userRole?.role,
    canCreateEmpresa,
    empresasCount: empresasDisponiveis.length,
    empresaAtual: empresa?.nome
  });

  const handleTrocarEmpresa = async (empresaId: string) => {
    if (empresaId !== empresa?.id) {
      console.log('🔄 Trocando empresa para:', empresaId);
      await trocarEmpresa(empresaId);
      console.log('✅ Empresa trocada com sucesso');
    }
  };

  const handleCriarEmpresa = async () => {
    console.log('🔒 SEGURANÇA: Tentativa de criar empresa:', { 
      isSuperAdmin, 
      canCreate: canCreateEmpresa,
      userRole: userRole?.role
    });

    if (!canCreateEmpresa) {
      console.warn('🚨 SEGURANÇA: Acesso negado no EmpresaSelector');
      return;
    }

    if (!novaEmpresa.nome.trim()) {
      return;
    }

    const result = await criarEmpresa(novaEmpresa);
    if (result.success) {
      setShowCreateDialog(false);
      setNovaEmpresa({ nome: '', cnpj: '', dominio: '', plano: 'basico' });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin_empresa':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin_empresa':
        return 'Admin';
      case 'entregador':
        return 'Entregador';
      default:
        return role;
    }
  };

  if (empresasLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Building2 className="h-4 w-4" />
        <span>Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-gray-500" />
      
      {/* DEBUG: Mostrar informações de permissão */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs bg-slate-800 text-white font-medium px-2 py-1 rounded">
          Role: {userRole?.role} | Super: {isSuperAdmin ? 'Sim' : 'Não'}
        </div>
      )}
      
      <Select 
        value={empresa?.id || ''} 
        onValueChange={handleTrocarEmpresa}
        disabled={empresasDisponiveis.length <= 1 && !isSuperAdmin}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Selecione uma empresa">
            {empresa ? (
              <div className="flex items-center gap-2">
                <span className="truncate">{empresa.nome}</span>
                {empresa.status !== 'ativo' && (
                  <Badge variant="outline" className="text-xs">
                    {empresa.status}
                  </Badge>
                )}
              </div>
            ) : (
              'Nenhuma empresa'
            )}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent>
          {empresasDisponiveis.map((emp) => (
            <SelectItem key={emp.id} value={emp.id}>
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <span className="font-medium">{emp.nome}</span>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getRoleBadgeColor(emp.role)}`}
                    >
                      {getRoleLabel(emp.role)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {emp.plano}
                    </Badge>
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* CORREÇÃO: Mostrar botão para super admin sempre */}
      {canCreateEmpresa && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Empresa</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Empresa</Label>
                <Input
                  id="nome"
                  value={novaEmpresa.nome}
                  onChange={(e) => setNovaEmpresa(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Digite o nome da empresa"
                />
              </div>
              
              <div>
                <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                <Input
                  id="cnpj"
                  value={novaEmpresa.cnpj}
                  onChange={(e) => setNovaEmpresa(prev => ({ ...prev, cnpj: e.target.value }))}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              
              <div>
                <Label htmlFor="dominio">Domínio (opcional)</Label>
                <Input
                  id="dominio"
                  value={novaEmpresa.dominio}
                  onChange={(e) => setNovaEmpresa(prev => ({ ...prev, dominio: e.target.value }))}
                  placeholder="empresa.localhost:5173"
                />
              </div>
              
              <div>
                <Label htmlFor="plano">Plano</Label>
                <Select 
                  value={novaEmpresa.plano} 
                  onValueChange={(value: 'basico' | 'pro' | 'enterprise') => 
                    setNovaEmpresa(prev => ({ ...prev, plano: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCriarEmpresa}>
                  Criar Empresa
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
