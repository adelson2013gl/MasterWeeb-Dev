import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Save, Users, Calendar, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';
import { supabase } from '@/integrations/supabase/client';

interface CustomLimitsEditorProps {
  empresaId: string;
  empresaNome: string;
}

interface CustomLimits {
  // Nota: Os limites personalizados serão armazenados no campo metadata da assinatura
  limite_entregadores: number | null;
  limite_agendamentos_mes: number | null;
}

export function CustomLimitsEditor({ empresaId, empresaNome }: CustomLimitsEditorProps) {
  const { isSuperAdmin } = useEmpresaUnificado();
  const { toast } = useToast();
  const [limites, setLimites] = useState<CustomLimits>({
    limite_entregadores: null,
    limite_agendamentos_mes: null
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Verificação de segurança no componente
  if (!isSuperAdmin) {
    return (
      <div className="text-center p-8">
        <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-medium text-red-600 mb-2">Acesso Negado</h3>
        <p className="text-red-600">
          Apenas Super Administradores podem acessar esta funcionalidade.
        </p>
      </div>
    );
  }

  useEffect(() => {
    carregarLimitesAtuais();
  }, [empresaId]);

  const carregarLimitesAtuais = async () => {
    try {
      setCarregando(true);
      
      // Buscar assinatura ativa da empresa
      const { data: assinatura, error } = await supabase
        .from('assinaturas')
        .select('metadata')
        .eq('empresa_id', empresaId)
        .eq('status', 'ativa')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (assinatura && assinatura.metadata) {
        const metadata = assinatura.metadata as any;
        setLimites({
          limite_entregadores: metadata.limite_entregadores || null,
          limite_agendamentos_mes: metadata.limite_agendamentos_mes || null
        });
      }
    } catch (error) {
      console.error('Erro ao carregar limites:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os limites atuais.',
        variant: 'destructive'
      });
    } finally {
      setCarregando(false);
    }
  };

  const salvarLimites = async () => {
    try {
      setSalvando(true);

      // Validar valores
      if (limites.limite_entregadores !== null && limites.limite_entregadores < 0) {
        toast({
          title: 'Erro de Validação',
          description: 'O limite de entregadores deve ser um número positivo.',
          variant: 'destructive'
        });
        return;
      }

      if (limites.limite_agendamentos_mes !== null && limites.limite_agendamentos_mes < 0) {
        toast({
          title: 'Erro de Validação',
          description: 'O limite de agendamentos deve ser um número positivo.',
          variant: 'destructive'
        });
        return;
      }

      // Atualizar assinatura ativa
      // Buscar metadata atual
      const { data: assinaturaAtual } = await supabase
        .from('assinaturas')
        .select('metadata')
        .eq('empresa_id', empresaId)
        .eq('status', 'ativa')
        .single();

      const metadataAtual = (assinaturaAtual?.metadata as any) || {};
      const novaMetadata = {
        ...metadataAtual,
        limite_entregadores: limites.limite_entregadores,
        limite_agendamentos_mes: limites.limite_agendamentos_mes
      };

      const { error } = await supabase
        .from('assinaturas')
        .update({ metadata: novaMetadata })
        .eq('empresa_id', empresaId)
        .eq('status', 'ativa');

      if (error) {
        throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Limites personalizados salvos com sucesso!',
        variant: 'default'
      });
    } catch (error) {
      console.error('Erro ao salvar limites:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar os limites personalizados.',
        variant: 'destructive'
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleInputChange = (field: keyof CustomLimits, value: string) => {
    const numericValue = value === '' ? null : parseInt(value, 10);
    setLimites(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  if (carregando) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Carregando limites...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800">
          <Shield className="w-4 h-4" />
          <span className="font-medium">Configuração de Super Administrador</span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          Você está configurando limites personalizados para <strong>{empresaNome}</strong>.
          Deixe em branco para usar os limites padrão do plano.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Limites Personalizados</CardTitle>
          <CardDescription>
            Configure limites específicos que substituirão os limites padrão do plano
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="limite_entregadores" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Limite de Entregadores
              </Label>
              <Input
                id="limite_entregadores"
                type="number"
                min="0"
                placeholder="Ex: 10 (deixe vazio para usar padrão do plano)"
                value={limites.limite_entregadores || ''}
                onChange={(e) => handleInputChange('limite_entregadores', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Número máximo de entregadores ativos para esta empresa
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limite_agendamentos_mes" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Limite de Agendamentos/Mês
              </Label>
              <Input
                id="limite_agendamentos_mes"
                type="number"
                min="0"
                placeholder="Ex: 100 (deixe vazio para usar padrão do plano)"
                value={limites.limite_agendamentos_mes || ''}
                onChange={(e) => handleInputChange('limite_agendamentos_mes', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Número máximo de agendamentos por mês para esta empresa
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Importante</span>
            </div>
            <ul className="text-sm text-yellow-700 mt-1 space-y-1">
              <li>• Limites personalizados substituem os limites padrão do plano</li>
              <li>• Deixe em branco para usar os limites do plano atual</li>
              <li>• Valores devem ser números positivos</li>
              <li>• Alterações são aplicadas imediatamente</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={salvarLimites} 
              disabled={salvando}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {salvando ? 'Salvando...' : 'Salvar Limites'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CustomLimitsEditor;