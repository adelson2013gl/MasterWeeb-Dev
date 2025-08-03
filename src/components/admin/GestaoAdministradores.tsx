import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Edit, Shield, Building, Mail, Calendar, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { adminManagementService, type AdminData, type AdminFilters } from '@/services/adminManagementService';
import { CadastroAdminForm } from './CadastroAdminForm';
import { EditAdminDialog } from './EditAdminDialog';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

const GestaoAdministradores: React.FC = () => {
  const { permissions, isLoading: permissionsLoading, error: permissionsError, canManageAdmin } = useAdminPermissions();
  const { toast } = useToast();
  
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminData | null>(null);
  const [empresas, setEmpresas] = useState<Array<{ id: string; nome: string }>>([]);

  // Carregar dados iniciais
  useEffect(() => {
    if (!permissionsLoading && permissions?.canViewAdmins && permissions?.allowedEmpresaIds?.length > 0) {
      loadAdmins();
      loadEmpresas();
    }
  }, [permissionsLoading, permissions?.canViewAdmins, permissions?.allowedEmpresaIds]);

  // Aplicar filtros
  useEffect(() => {
    // Só aplicar filtros se as permissões estão carregadas e há empresas permitidas
    if (permissionsLoading || !permissions?.canViewAdmins || !permissions?.allowedEmpresaIds?.length) {
      return;
    }

    const delayedFilter = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(delayedFilter);
  }, [searchTerm, selectedEmpresa, permissionsLoading, permissions?.canViewAdmins, permissions?.allowedEmpresaIds]);

  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validar se temos empresas permitidas antes de tentar carregar
      if (!permissions?.allowedEmpresaIds || permissions.allowedEmpresaIds.length === 0) {
        logger.warn('Tentativa de carregar administradores sem permissões válidas');
        setAdmins([]);
        return;
      }
      
      const data = await adminManagementService.listAdmins(
        permissions.allowedEmpresaIds,
        filters
      );
      
      setAdmins(data);
      logger.info('Administradores carregados', { count: data.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar administradores';
      setError(errorMessage);
      logger.error('Erro ao carregar administradores', { error: errorMessage });
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmpresas = async () => {
    try {
      // Validar se temos empresas permitidas antes de carregar
      if (!permissions?.allowedEmpresaIds || permissions.allowedEmpresaIds.length === 0) {
        logger.warn('Tentativa de carregar empresas sem permissões válidas');
        setEmpresas([]);
        return;
      }
      
      const data = await adminManagementService.getAvailableEmpresas(
        permissions.allowedEmpresaIds
      );
      setEmpresas(data);
    } catch (err) {
      logger.error('Erro ao carregar empresas', {
        error: err instanceof Error ? err.message : 'Erro desconhecido'
      });
    }
  };

  const applyFilters = async () => {
    const newFilters: AdminFilters = {
      search: searchTerm.trim() || undefined,
      empresa_id: selectedEmpresa === 'all' ? undefined : selectedEmpresa
    };

    setFilters(newFilters);
    
    // Validar se temos empresas permitidas antes de aplicar filtros
    if (!permissions?.allowedEmpresaIds || permissions.allowedEmpresaIds.length === 0) {
      logger.warn('Tentativa de filtrar administradores sem permissões válidas');
      setAdmins([]);
      return;
    }
    
    try {
      setIsLoading(true);
      const data = await adminManagementService.listAdmins(
        permissions.allowedEmpresaIds,
        newFilters
      );
      setAdmins(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao filtrar administradores';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminCreated = () => {
    setShowCreateDialog(false);
    loadAdmins();
    toast({
      title: 'Sucesso',
      description: 'Administrador criado com sucesso!'
    });
  };

  const handleEditAdmin = (admin: AdminData) => {
    setSelectedAdmin(admin);
    setShowEditDialog(true);
  };

  const handleAdminUpdated = () => {
    setShowEditDialog(false);
    setSelectedAdmin(null);
    loadAdmins();
    toast({
      title: 'Sucesso',
      description: 'Administrador atualizado com sucesso!'
    });
  };

  const handleDeleteAdmin = async (admin: AdminData) => {
    if (!window.confirm(`Tem certeza que deseja excluir o administrador ${admin.nome}?`)) {
      return;
    }

    try {
      await adminManagementService.deleteAdmin(
        admin.id,
        permissions?.allowedEmpresaIds
      );
      
      loadAdmins();
      toast({
        title: 'Sucesso',
        description: 'Administrador excluído com sucesso!'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir administrador';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleToggleApproval = async (admin: AdminData) => {
    try {
      await adminManagementService.updateAdmin(
        admin.id,
        { status: admin.status === 'aprovado' ? 'suspenso' : 'aprovado' },
        permissions?.allowedEmpresaIds
      );
      
      loadAdmins();
      toast({
        title: 'Sucesso',
        description: `Administrador ${admin.status === 'aprovado' ? 'suspenso' : 'aprovado'} com sucesso!`
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar administrador';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPerfilBadge = (perfil: string) => {
    const variants = {
      'admin': 'default',
      'entregador': 'secondary'
    } as const;
    
    const labels = {
      'admin': 'Administrador',
      'entregador': 'Entregador'
    };
    
    return (
      <Badge variant={variants[perfil as keyof typeof variants] || 'secondary'}>
        {labels[perfil as keyof typeof labels] || perfil}
      </Badge>
    );
  };

  // Verificações de segurança
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (permissionsError) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao verificar permissões: {permissionsError}
        </AlertDescription>
      </Alert>
    );
  }

  if (!permissions?.canViewAdmins) {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Você não tem permissão para acessar a gestão de administradores.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Administradores</h1>
          <p className="text-muted-foreground">
            {permissions?.isSuperAdmin 
              ? 'Gerencie administradores de todas as empresas'
              : 'Gerencie administradores da sua empresa'
            }
          </p>
        </div>
        
        {permissions?.canCreateAdmins && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Administrador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Administrador</DialogTitle>
                <DialogDescription>
                  Preencha os dados abaixo para cadastrar um novo administrador para a empresa selecionada.
                </DialogDescription>
              </DialogHeader>
              <CadastroAdminForm
                onSuccess={handleAdminCreated}
                allowedEmpresaIds={permissions?.allowedEmpresaIds}
                empresas={empresas}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {permissions?.isSuperAdmin && empresas.length > 1 && (
              <div className="w-full sm:w-64">
                <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as empresas</SelectItem>
                    {empresas.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Administradores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Administradores ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum administrador encontrado</p>
              {Object.keys(filters).length > 0 && (
                <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.nome}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {admin.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {admin.empresa_nome}
                        </div>
                      </TableCell>
                      <TableCell>{getPerfilBadge(admin.perfil)}</TableCell>
                      <TableCell>
                        <Badge variant={admin.status === 'aprovado' ? 'default' : 'secondary'}>
                  {admin.status === 'aprovado' ? (
                    <><CheckCircle className="h-3 w-3 mr-1" />Aprovado</>
                  ) : admin.status === 'pendente' ? (
                    <><XCircle className="h-3 w-3 mr-1" />Pendente</>
                  ) : admin.status === 'rejeitado' ? (
                    <><XCircle className="h-3 w-3 mr-1" />Rejeitado</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" />Suspenso</>
                  )}
                </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(admin.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {permissions?.canEditAdmins && canManageAdmin(admin.empresa_id) && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAdmin(admin)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleApproval(admin)}
                              >
                                {admin.status === 'aprovado' ? 'Suspender' : 'Aprovar'}
                              </Button>
                            </>
                          )}
                          {permissions?.canDeleteAdmins && canManageAdmin(admin.empresa_id) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAdmin(admin)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      {showEditDialog && selectedAdmin && (
        <EditAdminDialog
          admin={selectedAdmin}
          empresas={empresas}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onAdminUpdated={handleAdminUpdated}
        />
      )}
    </div>
  );
};

export default GestaoAdministradores;
