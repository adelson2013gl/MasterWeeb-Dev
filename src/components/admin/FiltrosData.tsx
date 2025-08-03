
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface FiltrosDataProps {
  dataInicio: Date;
  dataFim: Date;
  onDataInicioChange: (date: Date) => void;
  onDataFimChange: (date: Date) => void;
  onProximos7Dias: () => void;
  onProximos30Dias: () => void;
  onResetarFiltros: () => void;
}

export function FiltrosData({ 
  dataInicio, 
  dataFim, 
  onDataInicioChange, 
  onDataFimChange,
  onProximos7Dias,
  onProximos30Dias,
  onResetarFiltros 
}: FiltrosDataProps) {
  return (
    <div className="flex items-end gap-4">
      <div className="grid gap-2">
        <Label>Data Início</Label>
        <DatePicker
          date={dataInicio}
          onDateChange={onDataInicioChange}
        />
      </div>
      
      <div className="grid gap-2">
        <Label>Data Fim</Label>
        <DatePicker
          date={dataFim}
          onDateChange={onDataFimChange}
        />
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={onProximos7Dias}>
          Próximos 7 dias
        </Button>
        <Button variant="outline" onClick={onProximos30Dias}>
          Próximos 30 dias
        </Button>
        <Button variant="outline" onClick={onResetarFiltros}>
          Resetar Filtros
        </Button>
      </div>
    </div>
  );
}
