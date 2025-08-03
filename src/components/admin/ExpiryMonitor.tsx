
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaUnificado } from '@/contexts/EmpresaUnificadoContext';

interface ExpiryStats {
  expired: number;
  expiring7Days: number;
  expiring30Days: number;
  total: number;
}

export function ExpiryMonitor() {
  const [stats, setStats] = useState<ExpiryStats>({
    expired: 0,
    expiring7Days: 0,
    expiring30Days: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin } = useEmpresaUnificado();

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Para super admin, buscar todas as empresas
      // Para admin normal, buscar apenas dados da própria empresa
      if (isSuperAdmin) {
        const { data: empresas, error } = await supabase
          .from('empresas')
          .select('data_expiracao, ativa');

        if (error) throw error;

        const today = new Date();
        const in7Days = new Date();
        in7Days.setDate(today.getDate() + 7);
        const in30Days = new Date();
        in30Days.setDate(today.getDate() + 30);

        const expired = empresas?.filter(e => 
          e.data_expiracao && new Date(e.data_expiracao) < today
        ).length || 0;

        const expiring7Days = empresas?.filter(e => 
          e.data_expiracao && 
          new Date(e.data_expiracao) >= today && 
          new Date(e.data_expiracao) <= in7Days
        ).length || 0;

        const expiring30Days = empresas?.filter(e => 
          e.data_expiracao && 
          new Date(e.data_expiracao) >= today && 
          new Date(e.data_expiracao) <= in30Days
        ).length || 0;

        const total = empresas?.filter(e => e.ativa === true).length || 0;

        setStats({ expired, expiring7Days, expiring30Days, total });
      } else {
        // Para admin normal, mostrar apenas status da própria empresa
        setStats({ expired: 0, expiring7Days: 0, expiring30Days: 0, total: 1 });
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de expiração:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [isSuperAdmin]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monitoramento de Expirações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {isSuperAdmin ? 'Monitoramento Global de Expirações' : 'Status da Empresa'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <div className="text-sm text-red-700">Expiradas</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{stats.expiring7Days}</div>
            <div className="text-sm text-orange-700">Expiram em 7 dias</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.expiring30Days}</div>
            <div className="text-sm text-yellow-700">Expiram em 30 dias</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.total}</div>
            <div className="text-sm text-green-700">Ativas</div>
          </div>
        </div>
        
        {isSuperAdmin && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Última atualização:</span>
              <Badge variant="outline">
                {new Date().toLocaleString('pt-BR')}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
