
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect, MultiSelectItem } from "@/components/ui/multi-select";
import { useCriacaoAgendas } from "@/hooks/useCriacaoAgendas";

interface FormAgendaData {
  data: Date | undefined;
  cidade_id: string;
  regiao_id: string;
  turno_ids: string[];
  vagas_disponiveis: number;
  permite_reserva: boolean;
}

export function FormularioCriacaoAgenda() {
  const [formData, setFormData] = useState<FormAgendaData>({
    data: undefined,
    cidade_id: '',
    regiao_id: '',
    turno_ids: [],
    vagas_disponiveis: 1,
    permite_reserva: false,
  });

  const {
    cidades,
    regioes,
    turnos,
    cidadeSelecionada,
    loading,
    setCidadeSelecionada,
    criarAgenda,
  } = useCriacaoAgendas();

  const handleCidadeChange = (cidadeId: string) => {
    setFormData(prev => ({
      ...prev,
      cidade_id: cidadeId,
      regiao_id: '', // Reset região quando mudar cidade
    }));
    setCidadeSelecionada(cidadeId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.data || !formData.regiao_id || formData.turno_ids.length === 0) {
      return;
    }

    await criarAgenda({
      data: formData.data,
      regiao_id: formData.regiao_id,
      turno_ids: formData.turno_ids,
      vagas_disponiveis: formData.vagas_disponiveis,
      permite_reserva: formData.permite_reserva,
    });

    // Reset form
    setFormData({
      data: undefined,
      cidade_id: '',
      regiao_id: '',
      turno_ids: [],
      vagas_disponiveis: 1,
      permite_reserva: false,
    });
    setCidadeSelecionada('');
  };

  // Filtrar regiões da cidade selecionada
  const regioesDisponiveis = regioes.filter(regiao => 
    cidadeSelecionada ? regiao.cidade_id === cidadeSelecionada : true
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Criação de Agendas</CardTitle>
        <CardDescription>
          Crie agendas selecionando data, cidade, região e múltiplos turnos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data */}
          <div className="space-y-2">
            <Label>Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.data && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.data ? format(formData.data, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  locale={ptBR}
                  selected={formData.data}
                  onSelect={(date) => setFormData(prev => ({ ...prev, data: date }))}
                  disabled={loading}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Cidade */}
          <div className="space-y-2">
            <Label>Cidade *</Label>
            <Select 
              value={formData.cidade_id} 
              onValueChange={handleCidadeChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma cidade" />
              </SelectTrigger>
              <SelectContent>
                {cidades.map((cidade) => (
                  <SelectItem key={cidade.id} value={cidade.id}>
                    {cidade.nome} - {cidade.estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Região */}
          <div className="space-y-2">
            <Label>Região *</Label>
            <Select 
              value={formData.regiao_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, regiao_id: value }))}
              disabled={loading || !cidadeSelecionada}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma região" />
              </SelectTrigger>
              <SelectContent>
                {regioesDisponiveis.map((regiao) => (
                  <SelectItem key={regiao.id} value={regiao.id}>
                    {regiao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Turnos (Seleção Múltipla) */}
          <div className="space-y-2">
            <Label>Turnos * (Selecione múltiplos)</Label>
            <MultiSelect
              value={formData.turno_ids}
              onValueChange={(values) => setFormData(prev => ({ ...prev, turno_ids: values }))}
              placeholder="Selecione os turnos"
              className="w-full"
            >
              {turnos.map((turno) => (
                <MultiSelectItem key={turno.id} value={turno.id}>
                  {turno.nome} ({turno.hora_inicio} - {turno.hora_fim})
                </MultiSelectItem>
              ))}
            </MultiSelect>
            {formData.turno_ids.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {formData.turno_ids.length} agenda(s) será(ão) criada(s)
              </p>
            )}
          </div>

          {/* Vagas Disponíveis */}
          <div className="space-y-2">
            <Label>Vagas Disponíveis *</Label>
            <Input
              type="number"
              value={formData.vagas_disponiveis}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                vagas_disponiveis: parseInt(e.target.value) || 1 
              }))}
              disabled={loading}
              min={1}
            />
          </div>

          {/* Permite Reserva */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="permite-reserva"
              checked={formData.permite_reserva}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                permite_reserva: !!checked 
              }))}
              disabled={loading}
            />
            <Label htmlFor="permite-reserva">Permitir Reserva</Label>
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !formData.data || !formData.regiao_id || formData.turno_ids.length === 0}
          >
            {loading ? "Criando..." : `Criar ${formData.turno_ids.length || 0} Agenda(s)`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
