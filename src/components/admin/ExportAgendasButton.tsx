
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, Calendar, AlertCircle } from "lucide-react";
import { useExportAgendamentos } from "@/hooks/useExportAgendamentos";
import { format, addDays, isAfter, isBefore } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ExportAgendasButton() {
  const [open, setOpen] = useState(false);
  const hoje = format(new Date(), 'yyyy-MM-dd');
  const [dataInicio, setDataInicio] = useState(hoje);
  const [dataFim, setDataFim] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [errors, setErrors] = useState<string[]>([]);
  const { exportarAgendamentos, loading } = useExportAgendamentos();

  const validateDates = (): boolean => {
    const newErrors: string[] = [];
    
    if (!dataInicio || !dataFim) {
      newErrors.push('Ambas as datas são obrigatórias');
    }
    
    if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      
      if (isAfter(inicio, fim)) {
        newErrors.push('Data de início deve ser anterior à data fim');
      }
      
      // Limite máximo de 1 ano
      const umAnoAtras = addDays(fim, -365);
      if (isBefore(inicio, umAnoAtras)) {
        newErrors.push('Período máximo permitido é de 1 ano');
      }
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleExport = async () => {
    if (!validateDates()) return;
    
    try {
      await exportarAgendamentos(dataInicio, dataFim);
      setOpen(false);
    } catch (error) {
      console.error('Erro na exportação:', error);
    }
  };

  const handleExportTodos = async () => {
    try {
      await exportarAgendamentos();
      setOpen(false);
    } catch (error) {
      console.error('Erro na exportação:', error);
    }
  };

  const handleDataChange = (field: 'inicio' | 'fim', value: string) => {
    if (field === 'inicio') {
      setDataInicio(value);
    } else {
      setDataFim(value);
    }
    // Limpar erros quando usuário modifica as datas
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar Agendamentos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportar Agendamentos Completos
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data Início
              </Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => handleDataChange('inicio', e.target.value)}
                min="2020-01-01"
                max={dataFim || undefined}
                className={errors.some(e => e.includes('início') || e.includes('obrigatórias')) ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data Fim
              </Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => handleDataChange('fim', e.target.value)}
                min={dataInicio || undefined}
                max={format(addDays(new Date(), 365), 'yyyy-MM-dd')}
                className={errors.some(e => e.includes('fim') || e.includes('obrigatórias')) ? 'border-red-500' : ''}
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="font-medium mb-3 text-blue-800 dark:text-blue-200">📊 Export Completo com 3 Abas:</p>
            
            <div className="space-y-3">
              <div className="border-l-2 border-green-400 pl-3">
                <p className="font-medium text-green-700 dark:text-green-300">🟢 Aba 1: Agendamentos Confirmados</p>
                <ul className="text-xs mt-1 space-y-1 text-green-600 dark:text-green-400">
                  <li>• Vagas confirmadas (status: agendado)</li>
                  <li>• Empresa, Data/Hora, Região, CPF, Nome</li>
                  <li>• Tipo: Vaga ou Reserva Confirmada</li>
                </ul>
              </div>
              
              <div className="border-l-2 border-orange-400 pl-3">
                <p className="font-medium text-orange-700 dark:text-orange-300">🟡 Aba 2: Lista de Reservas</p>
                <ul className="text-xs mt-1 space-y-1 text-orange-600 dark:text-orange-400">
                  <li>• Tecnicos na fila de espera</li>
                  <li>• Posição na fila por ordem de chegada</li>
                  <li>• Data da reserva e estrelas do tecnico</li>
                </ul>
              </div>
              
              <div className="border-l-2 border-blue-400 pl-3">
                <p className="font-medium text-blue-700 dark:text-blue-300">📈 Aba 3: Resumo Executivo</p>
                <ul className="text-xs mt-1 space-y-1 text-blue-600 dark:text-blue-400">
                  <li>• Total confirmados vs. reservas</li>
                  <li>• Taxa de conversão</li>
                  <li>• Métricas de demanda</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleExport} 
              disabled={loading || errors.length > 0 || !dataInicio || !dataFim}
              className="flex-1"
            >
              {loading ? (
                "Exportando..."
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Período
                </>
              )}
            </Button>
            <Button 
              onClick={handleExportTodos} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? (
                "Exportando..."
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar Todos
                </>
              )}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Período máximo: 1 ano</p>
            <p>• Exportar Todos: inclui todos os agendamentos sem filtro de data</p>
            <p>• Exportar Período: filtra agendamentos no intervalo selecionado</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
