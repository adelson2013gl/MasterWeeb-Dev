
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { performanceMonitor } from '@/lib/performance';
import { analytics } from '@/lib/analytics';
import { DevSecurityMonitor } from './DevSecurityMonitor';

export function DevMetrics() {
  const [performanceReport, setPerformanceReport] = useState<any>({});
  const [sessionStats, setSessionStats] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  // Só mostrar em desenvolvimento
  if (import.meta.env.PROD || import.meta.env.VITE_NODE_ENV === 'production') {
    return null;
  }

  const updateMetrics = () => {
    setPerformanceReport(performanceMonitor.getPerformanceReport());
    setSessionStats(analytics.getSessionStats());
  };

  useEffect(() => {
    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Atualizar a cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <>
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setIsVisible(true)}
            variant="outline"
            size="sm"
            className="bg-black/80 text-white border-gray-600 hover:bg-black/90"
          >
            📊 Métricas
          </Button>
        </div>
        <DevSecurityMonitor />
      </>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-auto">
        <Card className="bg-black/90 text-white border-gray-600">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Métricas de Desenvolvimento</CardTitle>
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-700"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {/* Performance */}
            <div>
              <h4 className="font-semibold mb-1 text-yellow-400">Performance</h4>
              {Object.entries(performanceReport).map(([metric, data]: [string, any]) => (
                <div key={metric} className="text-gray-300">
                  <span className="font-medium">{metric}:</span> {data.average}ms (avg)
                </div>
              ))}
            </div>

            {/* Analytics */}
            <div>
              <h4 className="font-semibold mb-1 text-green-400">Analytics</h4>
              <div className="text-gray-300">
                <div>Eventos: {sessionStats.eventCount || 0}</div>
                <div>Session: {sessionStats.sessionId?.slice(-8) || 'N/A'}</div>
                {sessionStats.userId && (
                  <div>User: {sessionStats.userId.slice(-8)}</div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  performanceMonitor.clearMetrics();
                  updateMetrics();
                }}
                size="sm"
                variant="outline"
                className="text-xs bg-transparent border-gray-600 text-white hover:bg-gray-700"
              >
                Limpar Perf
              </Button>
              <Button
                onClick={() => {
                  analytics.clearData();
                  updateMetrics();
                }}
                size="sm"
                variant="outline"
                className="text-xs bg-transparent border-gray-600 text-white hover:bg-gray-700"
              >
                Limpar Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <DevSecurityMonitor />
    </>
  );
}
