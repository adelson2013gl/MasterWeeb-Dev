import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EstatisticasProps {
  totalAgendas: number;
  totalVagas: number;
  vagasOcupadas: number;
  taxaOcupacao: number;
}

export function CardsEstatisticas({ 
  totalAgendas, 
  totalVagas, 
  vagasOcupadas, 
  taxaOcupacao 
}: EstatisticasProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Agendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAgendas}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Vagas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVagas}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Vagas Ocupadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{vagasOcupadas}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taxa de Ocupação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{taxaOcupacao.toFixed(1)}%</div>
        </CardContent>
      </Card>
    </div>
  );
}