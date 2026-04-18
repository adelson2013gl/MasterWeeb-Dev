import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Users, TrendingUp, Clock, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';
import { toast } from 'sonner';

interface EstatisticasEstrelas {
  total: number;
  porEstrela: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  mediaEstrelas: number;
  distribuicaoPercentual: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface TecnicoEstrelas {
  id: string;
  nome: string;
  estrelas: number;
  status: string;
  cidade: {
    nome: string;
  };
}

export function DashboardPrioridades() {
  const { isSuperAdmin, empresa } = useEmpresaUnificado();
  const [stats, setStats] = useState<EstatisticasEstrelas | null>(null);
  const [tecnicos, setTecnicos] = useState<TecnicoEstrelas[]>([]);
  const [loading, setLoading] = useState(true);

  // PROTEÇÃO: Verificar se é super admin
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Shield className="h-16 w-16 text-red-500" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Acesso Restrito</h2>
          <p className="text-gray-600 mt-2">
            Apenas Super Administradores podem acessar o Dashboard de Prioridades.
          </p>
        </div>
      </div>
    );
  }

  const fetchEstatisticas = async () => {
    if (!empresa?.id) return;

    try {
      const { data, error } = await supabase
        .from('tecnicos')
        .select(`
          id,
          nome,
          status,
          created_at
        `)
        .eq('empresa_id', empresa.id)
        .eq('status', 'aprovado');

      if (error) throw error;

      const tecnicosData = data?.map(e => ({
        ...e,
        estrelas: 5 // Valor padrão já que o campo não existe
      })) || [];

      setTecnicos(tecnicosData);

      // Calcular estatísticas simplificadas
      const total = tecnicosData.length;
      const porEstrela = { 1: 0, 2: 0, 3: 0, 4: 0, 5: total }; // Todos com 5 estrelas como padrão
      
      const mediaEstrelas = total > 0 ? 5 : 0;

      const distribuicaoPercentual = {
        1: total > 0 ? (porEstrela[1] / total) * 100 : 0,
        2: total > 0 ? (porEstrela[2] / total) * 100 : 0,
        3: total > 0 ? (porEstrela[3] / total) * 100 : 0,
        4: total > 0 ? (porEstrela[4] / total) * 100 : 0,
        5: total > 0 ? (porEstrela[5] / total) * 100 : 0,
      };

      setStats({
        total,
        porEstrela,
        mediaEstrelas,
        distribuicaoPercentual
      });

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas de prioridades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstatisticas();
  }, [empresa]);

  const getEstrelasIcon = (num: number) => {
    return '★'.repeat(num) + '☆'.repeat(5 - num);
  };

  const getCorEstrela = (estrelas: number) => {
    const cores = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-orange-100 text-orange-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-blue-100 text-blue-800',
      5: 'bg-green-100 text-green-800'
    };
    return cores[estrelas as keyof typeof cores] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard de Prioridades</h2>
        <p className="text-gray-600">Visualização da distribuição de estrelas dos tecnicos</p>
      </div>

      {/* Cards de Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tecnicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Tecnicos aprovados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Estrelas</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mediaEstrelas.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">{getEstrelasIcon(Math.round(stats.mediaEstrelas))}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prioridade Alta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.porEstrela[5] + stats.porEstrela[4]}</div>
            <p className="text-xs text-muted-foreground">4-5 estrelas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acesso Imediato</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.porEstrela[5]}</div>
            <p className="text-xs text-muted-foreground">5 estrelas</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Estrelas */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Estrelas</CardTitle>
          <CardDescription>Quantidade e percentual de tecnicos por nível de prioridade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map(estrela => (
              <div key={estrela} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge className={getCorEstrela(estrela)}>
                    {getEstrelasIcon(estrela)}
                  </Badge>
                  <div>
                    <p className="font-medium">{estrela} {estrela === 1 ? 'Estrela' : 'Estrelas'}</p>
                    <p className="text-sm text-gray-600">
                      Acesso após {estrela === 5 ? '0h' : estrela === 4 ? '24h' : estrela === 3 ? '48h' : estrela === 2 ? '72h' : '96h'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{stats.porEstrela[estrela as keyof typeof stats.porEstrela]}</p>
                  <p className="text-sm text-gray-600">
                    {stats.distribuicaoPercentual[estrela as keyof typeof stats.distribuicaoPercentual].toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tecnicos por Prioridade */}
      <Card>
        <CardHeader>
          <CardTitle>Tecnicos por Prioridade</CardTitle>
          <CardDescription>Lista completa ordenada por estrelas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tecnicos
              .sort((a, b) => b.estrelas - a.estrelas)
              .map(tecnico => (
                <div key={tecnico.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <Badge className={getCorEstrela(tecnico.estrelas)}>
                      {getEstrelasIcon(tecnico.estrelas)}
                    </Badge>
                    <div>
                      <p className="font-medium">{tecnico.nome}</p>
                      <p className="text-sm text-gray-600">{tecnico.cidade?.nome}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{tecnico.estrelas} estrelas</p>
                    <p className="text-xs text-gray-600">
                      Status: {tecnico.status}
                    </p>
                  </div>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
