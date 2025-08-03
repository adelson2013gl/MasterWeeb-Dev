
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { logger } from "@/lib/logger";

type Turno = Database['public']['Tables']['turnos']['Row'];

export function GestaoTurnos() {
  const { empresa } = useEmpresaUnificado();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoTurno, setNovoTurno] = useState({ nome: "", hora_inicio: "", hora_fim: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (empresa) {
      fetchTurnos();
    }
  }, [empresa]);

  const fetchTurnos = async () => {
    if (!empresa) return;
    
    try {
      logger.debug('Carregando turnos', { empresaId: empresa.id }, 'ADMIN');
      
      const { data, error } = await supabase
        .from('turnos')
        .select('*')
        .eq('empresa_id', empresa.id)  // CORRIGIDO: Filtrar por empresa
        .eq('ativo', true)
        .order('hora_inicio');

      if (error) {
        logger.error('Erro ao carregar turnos', { empresaId: empresa.id, error: error.message }, 'ADMIN');
        throw error;
      }

      logger.info('Turnos carregados', { empresaId: empresa.id, quantidade: data?.length }, 'ADMIN');
      setTurnos(data || []);

    } catch (error: any) {
      logger.error('Erro ao carregar turnos', { empresaId: empresa.id, error: error?.message }, 'ADMIN');
      toast.error("Erro ao carregar turnos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTurno = async () => {
    if (!novoTurno.nome || !novoTurno.hora_inicio || !novoTurno.hora_fim || !empresa) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Validar horários
    if (novoTurno.hora_inicio >= novoTurno.hora_fim) {
      toast.error("O horário de início deve ser anterior ao horário de fim");
      return;
    }

    setSubmitting(true);
    try {
      logger.info('Adicionando turno', { 
        nome: novoTurno.nome, 
        hora_inicio: novoTurno.hora_inicio, 
        hora_fim: novoTurno.hora_fim,
        empresaId: empresa.id 
      }, 'ADMIN');
      
      const { data, error } = await supabase
        .from('turnos')
        .insert({
          nome: novoTurno.nome,
          hora_inicio: novoTurno.hora_inicio,
          hora_fim: novoTurno.hora_fim,
          empresa_id: empresa.id,  // CORRIGIDO: Adicionado empresa_id obrigatório
          ativo: true
        })
        .select()
        .single();

      if (error) {
        logger.error('Erro ao adicionar turno', { 
          nome: novoTurno.nome, 
          empresaId: empresa.id, 
          error: error.message 
        }, 'ADMIN');
        throw error;
      }

      logger.info('Turno adicionado com sucesso', { turnoId: data.id, nome: data.nome }, 'ADMIN');
      
      // Atualizar lista local
      setTurnos(prev => [...prev, data]);
      
      setNovoTurno({ nome: "", hora_inicio: "", hora_fim: "" });
      setDialogOpen(false);
      toast.success("Turno adicionado com sucesso!");
      
    } catch (error: any) {
      logger.error('Erro ao adicionar turno', { nome: novoTurno.nome, error: error?.message }, 'ADMIN');
      toast.error(`Erro ao adicionar turno: ${error?.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTurnoStatus = async (id: string) => {
    try {
      if (!empresa) return;
      
      const turno = turnos.find(t => t.id === id);
      if (!turno) return;

      logger.info('Alterando status do turno', { turnoId: id, novoStatus: !turno.ativo }, 'ADMIN');
      
      const { error } = await supabase
        .from('turnos')
        .update({ ativo: !turno.ativo })
        .eq('id', id)
        .eq('empresa_id', empresa.id);  // CORRIGIDO: Verificar empresa por segurança

      if (error) {
        logger.error('Erro ao alterar status do turno', { turnoId: id, error: error.message }, 'ADMIN');
        throw error;
      }

      // Atualizar lista local
      setTurnos(prev => prev.map(t => 
        t.id === id ? { ...t, ativo: !t.ativo } : t
      ));
      
      toast.success("Status do turno atualizado!");
      
    } catch (error: any) {
      logger.error('Erro ao alterar status do turno', { turnoId: id, error: error?.message }, 'ADMIN');
      toast.error(`Erro ao alterar status: ${error?.message}`);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.substring(0, 5); // Remove seconds if present
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Turnos</h2>
        <p className="text-gray-600">Configure os turnos de trabalho disponíveis</p>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Turnos Cadastrados ({turnos.length})</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Turno
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Turno</DialogTitle>
              <DialogDescription>
                Cadastre um novo turno de trabalho
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome-turno">Nome do Turno</Label>
                <Input
                  id="nome-turno"
                  placeholder="Ex: Manhã, Tarde, Noite"
                  value={novoTurno.nome}
                  onChange={(e) => setNovoTurno(prev => ({ ...prev, nome: e.target.value }))}
                  disabled={submitting}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hora-inicio">Horário de Início</Label>
                  <Input
                    id="hora-inicio"
                    type="time"
                    value={novoTurno.hora_inicio}
                    onChange={(e) => setNovoTurno(prev => ({ ...prev, hora_inicio: e.target.value }))}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="hora-fim">Horário de Fim</Label>
                  <Input
                    id="hora-fim"
                    type="time"
                    value={novoTurno.hora_fim}
                    onChange={(e) => setNovoTurno(prev => ({ ...prev, hora_fim: e.target.value }))}
                    disabled={submitting}
                  />
                </div>
              </div>
              <Button onClick={handleAddTurno} className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  "Adicionar Turno"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {turnos.map(turno => (
          <Card key={turno.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <Clock className="h-5 w-5 mr-2" />
                  {turno.nome}
                </CardTitle>
                <Badge variant={turno.ativo ? "secondary" : "outline"} 
                       className={turno.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {turno.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <CardDescription>
                {formatTime(turno.hora_inicio)} às {formatTime(turno.hora_fim)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleTurnoStatus(turno.id)}
                >
                  {turno.ativo ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {turnos.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Nenhum turno cadastrado
            </h3>
            <p className="text-gray-500 mb-4">
              Adicione turnos para organizar os horários de trabalho
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
