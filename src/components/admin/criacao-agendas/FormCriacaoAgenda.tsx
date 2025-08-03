import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";
import { safeStringToPlanoType } from "@/lib/typeGuards";
import { Database } from "@/integrations/supabase/types";

type Cidade = Database['public']['Tables']['cidades']['Row'];
type Regiao = Database['public']['Tables']['regioes']['Row'];
type Turno = Database['public']['Tables']['turnos']['Row'];

interface AgendaFormData {
  data: Date;
  turno_id: string;
  regiao_id: string;
  vagas_disponiveis: number;
  permite_reserva: boolean;
}

export function FormCriacaoAgenda() {
  const [formData, setFormData] = useState<AgendaFormData[]>([
    { data: new Date(), turno_id: "", regiao_id: "", vagas_disponiveis: 1, permite_reserva: false },
  ]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCidades, setLoadingCidades] = useState(true);
  const [loadingRegioes, setLoadingRegioes] = useState(true);
  const [loadingTurnos, setLoadingTurnos] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { empresa } = useEmpresaUnificado();

  useEffect(() => {
    if (empresa) {
      fetchCidades();
      fetchRegioes();
      fetchTurnos();
    }
  }, [empresa]);

  const fetchCidades = async () => {
    try {
      logger.debug('Carregando cidades para criação de agendas', { empresaId: empresa.id }, 'ADMIN');
      
      const { data, error } = await supabase
        .from('cidades')
        .select('*')
        .eq('empresa_id', empresa.id)
        .eq('ativo', true)
        .order('nome');

      if (error) {
        logger.error('Erro ao carregar cidades', { empresaId: empresa.id, error: error.message }, 'ADMIN');
        throw error;
      }
      
      logger.info('Cidades carregadas', { empresaId: empresa.id, quantidade: data?.length }, 'ADMIN');
      setCidades(data || []);
    } catch (error: any) {
      logger.error('Erro ao carregar cidades', { error: error?.message }, 'ADMIN');
      toast.error("Não foi possível carregar as cidades");
    } finally {
      setLoadingCidades(false);
    }
  };

  const fetchRegioes = async () => {
    try {
      logger.debug('Carregando regiões para criação de agendas', { empresaId: empresa.id }, 'ADMIN');
      
      const { data, error } = await supabase
        .from('regioes')
        .select('*')
        .eq('empresa_id', empresa.id)
        .eq('ativo', true)
        .order('nome');

      if (error) {
        logger.error('Erro ao carregar regiões', { empresaId: empresa.id, error: error.message }, 'ADMIN');
        throw error;
      }
      
      logger.info('Regiões carregadas', { empresaId: empresa.id, quantidade: data?.length }, 'ADMIN');
      setRegioes(data || []);
    } catch (error: any) {
      logger.error('Erro ao carregar regiões', { error: error?.message }, 'ADMIN');
      toast.error("Não foi possível carregar as regiões");
    } finally {
      setLoadingRegioes(false);
    }
  };

  const fetchTurnos = async () => {
    try {
      logger.debug('Carregando turnos para criação de agendas', { empresaId: empresa.id }, 'ADMIN');
      
      const { data, error } = await supabase
        .from('turnos')
        .select('*')
        .eq('empresa_id', empresa.id)
        .eq('ativo', true)
        .order('nome');

      if (error) {
        logger.error('Erro ao carregar turnos', { empresaId: empresa.id, error: error.message }, 'ADMIN');
        throw error;
      }
      
      logger.info('Turnos carregados', { empresaId: empresa.id, quantidade: data?.length }, 'ADMIN');
      setTurnos(data || []);
    } catch (error: any) {
      logger.error('Erro ao carregar turnos', { error: error?.message }, 'ADMIN');
      toast.error("Não foi possível carregar os turnos");
    } finally {
      setLoadingTurnos(false);
    }
  };

  const handleAddAgenda = () => {
    setFormData([
      ...formData,
      { data: new Date(), turno_id: "", regiao_id: "", vagas_disponiveis: 1, permite_reserva: false },
    ]);
  };

  const handleRemoveAgenda = (index: number) => {
    const newFormData = [...formData];
    newFormData.splice(index, 1);
    setFormData(newFormData);
  };

  const handleInputChange = (index: number, field: string, value: any) => {
    const newFormData = [...formData];
    newFormData[index][field as keyof AgendaFormData] = value;
    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!empresa) {
      toast.error("Empresa não encontrada");
      return;
    }

    // Validar se todos os campos estão preenchidos
    for (const agenda of formData) {
      if (!agenda.data || !agenda.turno_id || !agenda.regiao_id || !agenda.vagas_disponiveis) {
        toast.error("Preencha todos os campos");
        return;
      }
    }

    setSubmitting(true);

    try {
      logger.info('Criando agendas', { quantidade: formData.length, empresaId: empresa.id }, 'ADMIN');
      
      // Verificar limites do plano
      const podeCriar = await verificarLimites(empresa, formData);
      if (!podeCriar) {
        return;
      }

      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();

      // Criar agendas no banco de dados
      for (const agenda of formData) {
        const { data, error } = await supabase
          .from('agendas')
          .insert({
            data: agenda.data.toISOString().split('T')[0],
            turno_id: agenda.turno_id,
            regiao_id: agenda.regiao_id,
            empresa_id: empresa.id,
            vagas_disponiveis: agenda.vagas_disponiveis,
            permite_reserva: agenda.permite_reserva,
            created_by: user?.id,
            ativo: true
          })
          .select()
          .single();

        if (error) {
          logger.error('Erro ao criar agenda', { agenda, error: error.message }, 'ADMIN');
          throw error;
        }
        
        logger.info('Agenda criada com sucesso', { agendaId: data.id }, 'ADMIN');
      }

      logger.info('Agendas criadas com sucesso', { quantidade: formData.length }, 'ADMIN');
      toast.success("Agendas criadas com sucesso!");
      setFormData([
        { data: new Date(), turno_id: "", regiao_id: "", vagas_disponiveis: 1, permite_reserva: false },
      ]);
      
    } catch (error: any) {
      logger.error('Erro ao criar agendas', { error: error?.message }, 'ADMIN');
      toast.error(`Erro ao criar agendas: ${error?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const verificarLimites = async (empresa: any, novasAgendas: AgendaFormData[]) => {
    try {
      logger.debug('Verificando limites do plano', { empresaId: empresa.id, plano: empresa.plano }, 'ADMIN');
      
      // Buscar total de agendas criadas no mês atual
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString();
      
      const { count, error } = await supabase
        .from('agendas')
        .select('*', { count: 'exact', head: false })
        .eq('empresa_id', empresa.id)
        .gte('data', startOfMonth.split('T')[0])
        .lte('data', endOfMonth.split('T')[0]);

      if (error) {
        logger.error('Erro ao buscar total de agendas', { error: error.message }, 'ADMIN');
        throw error;
      }

      const totalAgendasMes = count || 0;
      
      // Definir limites de acordo com o plano
      const limiteBasico = 50;
      const limitePro = 200;
      const limiteEnterprise = 1000;
      
      const planoEmpresa = safeStringToPlanoType(empresa.plano);
      
      logger.debug('Limites do plano', { plano: planoEmpresa, totalAgendasMes, novasAgendas: novasAgendas.length }, 'ADMIN');
      
      if (planoEmpresa === 'basico' && totalAgendasMes + novasAgendas.length > limiteBasico) {
        toast.error(`Seu plano Básico permite criar no máximo ${limiteBasico} agendas por mês. Você já criou ${totalAgendasMes}.`);
        return false;
      }
      
      if (planoEmpresa === 'pro' && totalAgendasMes + novasAgendas.length > limitePro) {
        toast.error(`Seu plano Pro permite criar no máximo ${limitePro} agendas por mês. Você já criou ${totalAgendasMes}.`);
        return false;
      }

      if (planoEmpresa === 'enterprise' && totalAgendasMes + novasAgendas.length > limiteEnterprise) {
        toast.error(`Seu plano Enterprise permite criar no máximo ${limiteEnterprise} agendas por mês. Você já criou ${totalAgendasMes}.`);
        return false;
      }
      
      return true;
      
    } catch (error) {
      logger.error('Erro ao verificar limites do plano', { error: error?.message }, 'ADMIN');
      toast.error(`Erro ao verificar limites do plano: ${error?.message}`);
      return false;
    }
  };

  if (loadingCidades || loadingRegioes || loadingTurnos) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Criação de Agendas</CardTitle>
        <CardDescription>
          Crie as agendas para os próximos agendamentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formData.map((agenda, index) => (
            <div key={index} className="border p-4 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Data */}
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !agenda.data && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {agenda.data ? format(agenda.data, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione a data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        locale={ptBR}
                        selected={agenda.data}
                        onSelect={(date) => handleInputChange(index, 'data', date)}
                        disabled={submitting}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Turno */}
                <div className="space-y-2">
                  <Label htmlFor={`turno-${index}`}>Turno</Label>
                  <Select 
                    value={agenda.turno_id} 
                    onValueChange={(value) => handleInputChange(index, 'turno_id', value)}
                    disabled={submitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o turno" />
                    </SelectTrigger>
                    <SelectContent>
                      {turnos.map((turno) => (
                        <SelectItem key={turno.id} value={turno.id}>
                          {turno.nome} ({turno.hora_inicio} - {turno.hora_fim})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Região */}
                <div className="space-y-2">
                  <Label htmlFor={`regiao-${index}`}>Região</Label>
                  <Select 
                    value={agenda.regiao_id} 
                    onValueChange={(value) => handleInputChange(index, 'regiao_id', value)}
                    disabled={submitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a região" />
                    </SelectTrigger>
                    <SelectContent>
                      {regioes.map((regiao) => (
                        <SelectItem key={regiao.id} value={regiao.id}>
                          {regiao.nome} ({cidades.find(c => c.id === regiao.cidade_id)?.nome})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Vagas Disponíveis */}
                <div className="space-y-2">
                  <Label htmlFor={`vagas-${index}`}>Vagas Disponíveis</Label>
                  <Input
                    type="number"
                    id={`vagas-${index}`}
                    value={agenda.vagas_disponiveis}
                    onChange={(e) => handleInputChange(index, 'vagas_disponiveis', parseInt(e.target.value))}
                    disabled={submitting}
                    min={1}
                  />
                </div>

                {/* Permite Reserva */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`reserva-${index}`}
                    checked={agenda.permite_reserva}
                    onCheckedChange={(checked) => handleInputChange(index, 'permite_reserva', checked)}
                    disabled={submitting}
                  />
                  <Label htmlFor={`reserva-${index}`}>Permitir Reserva</Label>
                </div>
              </div>

              {/* Remover Agenda */}
              {formData.length > 1 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveAgenda(index)}
                  disabled={submitting}
                  className="mt-4"
                >
                  Remover Agenda
                </Button>
              )}
            </div>
          ))}

          {/* Adicionar Agenda */}
          <Button
            variant="secondary"
            onClick={handleAddAgenda}
            disabled={submitting}
          >
            Adicionar Agenda
          </Button>

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando Agendas...
              </>
            ) : (
              "Criar Agendas"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
