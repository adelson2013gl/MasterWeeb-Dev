
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Settings, History } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExpiryManagementProps {
  empresaId?: string;
  empresaNome?: string;
}

export function ExpiryManagement({ empresaId, empresaNome }: ExpiryManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [loading, setLoading] = useState(false);

  const extendExpiry = async (targetEmpresaId: string, months: number) => {
    if (!targetEmpresaId) return;

    setLoading(true);
    try {
      // Buscar data de expiração atual
      const { data: empresa, error: fetchError } = await supabase
        .from('empresas')
        .select('data_expiracao, nome')
        .eq('id', targetEmpresaId)
        .single();

      if (fetchError) throw fetchError;

      // Calcular nova data de expiração
      const currentExpiry = empresa.data_expiracao ? new Date(empresa.data_expiracao) : new Date();
      const newExpiryDate = addMonths(currentExpiry, months);

      // Atualizar empresa
      const { error: updateError } = await supabase
        .from('empresas')
        .update({ 
          data_expiracao: newExpiryDate.toISOString(),
          ativa: true, // Reativar se estava inativa
          updated_at: new Date().toISOString()
        })
        .eq('id', targetEmpresaId);

      if (updateError) throw updateError;

      toast.success(`Expiração da empresa "${empresa.nome}" estendida por ${months} mês(es)`, {
        description: `Nova data de expiração: ${format(newExpiryDate, 'dd/MM/yyyy', { locale: ptBR })}`
      });

      setIsOpen(false);
    } catch (error: any) {
      console.error('Erro ao estender expiração:', error);
      toast.error('Erro ao estender expiração', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const quickExtend = (months: number) => {
    if (!empresaId) return;
    extendExpiry(empresaId, months);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Gerenciar Expiração
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Settings className="h-5 w-5" />
            Gestão de Vencimento
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            {empresaNome ? `Gerenciar expiração da empresa: ${empresaNome}` : 'Estender prazo de expiração'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ações Rápidas */}
          {empresaId && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900 dark:text-white">Extensões Rápidas:</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => quickExtend(1)}
                  disabled={loading}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  +1 Mês
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => quickExtend(3)}
                  disabled={loading}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  +3 Meses
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => quickExtend(6)}
                  disabled={loading}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  +6 Meses
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => quickExtend(12)}
                  disabled={loading}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  +1 Ano
                </Button>
              </div>
            </div>
          )}

          {/* Extensão Customizada */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900 dark:text-white">Extensão Personalizada:</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  value={selectedMonths}
                  onChange={(e) => setSelectedMonths(parseInt(e.target.value) || 1)}
                  min={1}
                  max={24}
                  placeholder="Meses"
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <Button 
                onClick={() => empresaId && extendExpiry(empresaId, selectedMonths)}
                disabled={loading || !empresaId}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Processando...' : 'Estender'}
              </Button>
            </div>
          </div>

          {/* Status Atual */}
          {empresaId && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Status:</span>
                <Badge variant="outline" className="bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white">
                  <History className="h-3 w-3 mr-1" />
                  Em análise...
                </Badge>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
