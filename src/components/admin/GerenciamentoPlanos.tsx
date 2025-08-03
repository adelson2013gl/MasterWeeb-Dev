import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  DollarSign, 
  Calendar, 
  Users, 
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { iuguService } from '@/services/iuguService';
import { 
  IuguPlan, 
  IuguPlanCreateRequest, 
  IuguPlanInterval,
  formatIuguCurrency,
  IUGU_PLAN_INTERVALS 
} from '@/types/iugu';
import { logger } from '@/lib/logger';

interface LocalPlan {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  interval: IuguPlanInterval;
  max_users: number;
  features: string[];
  iugu_plan_id?: string;
  synced: boolean;
}

export function GerenciamentoPlanos() {
  const [iuguPlans, setIuguPlans] = useState<IuguPlan[]>([]);
  const [localPlans, setLocalPlans] = useState<LocalPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<IuguPlan | null>(null);
  const [formData, setFormData] = useState<IuguPlanCreateRequest>({
    name: '',
    identifier: '',
    interval: 'monthly',
    interval_type: 1,
    value_cents: 0,
    currency: 'BRL',
    features: [],
    metadata: {}
  });
  const [featuresText, setFeaturesText] = useState('');

  useEffect(() => {
    loadPlans();
    loadLocalPlans();
  }, []);

  // Carregar planos da Iugu
  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await iuguService.getPlans();
      setIuguPlans(response.items);
      logger.info('📋 Planos Iugu carregados', { count: response.items.length });
    } catch (error) {
      logger.error('Erro ao carregar planos Iugu', { error });
      toast.error('Erro ao carregar planos da Iugu');
    } finally {
      setLoading(false);
    }
  };

  // Carregar planos locais (simulado)
  const loadLocalPlans = () => {
    const savedPlans = localStorage.getItem('local_plans');
    if (savedPlans) {
      setLocalPlans(JSON.parse(savedPlans));
    } else {
      // Planos padrão do SlotMaster
      const defaultPlans: LocalPlan[] = [
        {
          id: '1',
          name: 'Básico',
          description: 'Ideal para pequenas empresas',
          price_cents: 4990,
          interval: 'monthly',
          max_users: 5,
          features: ['Até 5 entregadores', 'Dashboard básico', 'Suporte por email'],
          synced: false
        },
        {
          id: '2',
          name: 'Profissional',
          description: 'Para empresas em crescimento',
          price_cents: 9990,
          interval: 'monthly',
          max_users: 20,
          features: ['Até 20 entregadores', 'Dashboard avançado', 'Relatórios detalhados', 'Suporte prioritário'],
          synced: false
        },
        {
          id: '3',
          name: 'Enterprise',
          description: 'Para grandes operações',
          price_cents: 19990,
          interval: 'monthly',
          max_users: 100,
          features: ['Até 100 entregadores', 'Dashboard completo', 'Suporte 24/7', 'Gerente dedicado'],
          synced: false
        }
      ];
      setLocalPlans(defaultPlans);
      localStorage.setItem('local_plans', JSON.stringify(defaultPlans));
    }
  };

  // Sincronizar planos locais com Iugu
  const syncPlans = async () => {
    try {
      setSyncing(true);
      let created = 0;
      let updated = 0;

      for (const localPlan of localPlans) {
        if (!localPlan.synced) {
          const iuguPlanData: IuguPlanCreateRequest = {
            name: localPlan.name,
            identifier: `slotmaster_${localPlan.id}`,
            interval: localPlan.interval,
            interval_type: 1,
            value_cents: localPlan.price_cents,
            currency: 'BRL',
            features: localPlan.features,
            metadata: {
              local_id: localPlan.id,
              max_users: localPlan.max_users,
              description: localPlan.description
            }
          };

          try {
            const newPlan = await iuguService.createPlan(iuguPlanData);
            
            // Atualizar plano local com ID da Iugu
            const updatedLocalPlans = localPlans.map(plan => 
              plan.id === localPlan.id 
                ? { ...plan, iugu_plan_id: newPlan.id, synced: true }
                : plan
            );
            setLocalPlans(updatedLocalPlans);
            localStorage.setItem('local_plans', JSON.stringify(updatedLocalPlans));
            created++;

          } catch (error) {
            logger.error(`Erro ao sincronizar plano ${localPlan.name}`, { error });
          }
        }
      }

      await loadPlans(); // Recarregar planos da Iugu
      toast.success(`Sincronização concluída! ${created} planos criados, ${updated} atualizados`);
      
    } catch (error) {
      logger.error('Erro na sincronização de planos', { error });
      toast.error('Erro na sincronização');
    } finally {
      setSyncing(false);
    }
  };

  // Criar novo plano
  const createPlan = async () => {
    try {
      if (!formData.name || !formData.identifier || formData.value_cents <= 0) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const features = featuresText
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const planData: IuguPlanCreateRequest = {
        ...formData,
        features,
        identifier: formData.identifier.toLowerCase().replace(/[^a-z0-9_]/g, '_')
      };

      await iuguService.createPlan(planData);
      await loadPlans();
      
      setIsDialogOpen(false);
      resetForm();
      toast.success('Plano criado com sucesso!');
      
    } catch (error) {
      logger.error('Erro ao criar plano', { error });
      toast.error('Erro ao criar plano');
    }
  };

  // Editar plano existente
  const updatePlan = async () => {
    try {
      if (!editingPlan) return;

      const features = featuresText
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const planData = {
        ...formData,
        features
      };

      await iuguService.updatePlan(editingPlan.id, planData);
      await loadPlans();
      
      setIsDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      toast.success('Plano atualizado com sucesso!');
      
    } catch (error) {
      logger.error('Erro ao atualizar plano', { error });
      toast.error('Erro ao atualizar plano');
    }
  };

  // Deletar plano
  const deletePlan = async (planId: string, planName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o plano "${planName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await iuguService.deletePlan(planId);
      await loadPlans();
      toast.success('Plano deletado com sucesso!');
    } catch (error) {
      logger.error('Erro ao deletar plano', { error });
      toast.error('Erro ao deletar plano');
    }
  };

  // Funções auxiliares
  const resetForm = () => {
    setFormData({
      name: '',
      identifier: '',
      interval: 'monthly',
      interval_type: 1,
      value_cents: 0,
      currency: 'BRL',
      features: [],
      metadata: {}
    });
    setFeaturesText('');
  };

  const openEditDialog = (plan: IuguPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      identifier: plan.identifier,
      interval: plan.interval,
      interval_type: plan.interval_type,
      value_cents: plan.value_cents,
      currency: plan.currency,
      features: plan.features,
      metadata: plan.metadata
    });
    setFeaturesText(plan.features.join('\n'));
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingPlan(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const getIntervalLabel = (interval: IuguPlanInterval) => {
    return IUGU_PLAN_INTERVALS[interval]?.label || interval;
  };

  return (
    <div className="space-y-6" data-testid="iugu-plans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Gerenciamento de Planos
          </h2>
          <p className="text-muted-foreground">
            Gerencie os planos de assinatura da Iugu
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={syncPlans}
            disabled={syncing}
            variant="outline"
            className="flex items-center gap-2"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {syncing ? 'Sincronizando...' : 'Sincronizar com Locais'}
          </Button>
          
          <Button
            onClick={loadPlans}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Plano
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan 
                    ? 'Edite as informações do plano existente'
                    : 'Crie um novo plano de assinatura na Iugu'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Plano</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Plano Básico"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Identificador</Label>
                  <Input
                    value={formData.identifier}
                    onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                    placeholder="Ex: plano_basico"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Valor (centavos)</Label>
                  <Input
                    type="number"
                    value={formData.value_cents}
                    onChange={(e) => setFormData({...formData, value_cents: parseInt(e.target.value) || 0})}
                    placeholder="Ex: 4990 (R$ 49,90)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Intervalo</Label>
                  <Select
                    value={formData.interval}
                    onValueChange={(value: IuguPlanInterval) => setFormData({...formData, interval: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="annually">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2 space-y-2">
                  <Label>Recursos (um por linha)</Label>
                  <Textarea
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    placeholder="Até 5 entregadores&#10;Dashboard básico&#10;Suporte por email"
                    rows={4}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={editingPlan ? updatePlan : createPlan}
                >
                  {editingPlan ? 'Atualizar' : 'Criar'} Plano
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Planos Locais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Planos Locais (SlotMaster)
          </CardTitle>
          <CardDescription>
            Planos configurados localmente que podem ser sincronizados com a Iugu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {localPlans.map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.synced ? (
                      <Badge variant="default" className="bg-green-500 text-green-50">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Sincronizado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-400 border-orange-400">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Não Sincronizado
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {formatIuguCurrency(plan.price_cents)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /{getIntervalLabel(plan.interval)}
                      </span>
                    </div>
                    <ul className="text-sm space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Planos da Iugu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Planos na Iugu ({iuguPlans.length})
          </CardTitle>
          <CardDescription>
            Planos configurados na plataforma Iugu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Carregando planos...
            </div>
          ) : iuguPlans.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum plano encontrado na Iugu</p>
              <p className="text-sm">Crie um novo plano para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {iuguPlans.map((plan) => (
                <Card key={plan.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <Badge variant="outline">
                        <Calendar className="w-3 h-3 mr-1" />
                        {getIntervalLabel(plan.interval)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">ID: {plan.identifier}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-2xl font-bold">
                        {formatIuguCurrency(plan.value_cents)}
                      </div>
                      
                      {plan.features.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Recursos:</p>
                          <ul className="text-sm space-y-1">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(plan)}
                          className="flex-1"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePlan(plan.id, plan.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 