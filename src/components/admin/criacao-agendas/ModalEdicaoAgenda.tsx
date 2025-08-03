
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Agenda, FormEdicaoAgenda as EditFormData } from '@/types/agenda';

interface Regiao {
  id: string;
  nome: string;
  cidade_id: string;
}

interface Turno {
  id: string;
  nome: string;
  hora_inicio: string;
  hora_fim: string;
}

interface ModalEdicaoAgendaProps {
  isOpen: boolean;
  agenda: Agenda | null;
  regioes: Regiao[];
  turnos: Turno[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (data: EditFormData) => Promise<void>;
}

/**
 * Modal para edição de agendas existentes
 * Permite alterar vagas disponíveis, configurações de reserva, turno e região
 */
export function ModalEdicaoAgenda({
  isOpen,
  agenda,
  regioes,
  turnos,
  loading,
  onClose,
  onSubmit
}: ModalEdicaoAgendaProps) {
  const editForm = useForm<EditFormData>({
    defaultValues: {
      vagas_disponiveis: 10,
      permite_reserva: true,
      turno_id: '',
      regiao_id: '',
    },
  });

  // Atualizar formulário quando a agenda mudou
  React.useEffect(() => {
    if (agenda) {
      editForm.reset({
        vagas_disponiveis: agenda.vagas_disponiveis,
        permite_reserva: agenda.permite_reserva,
        turno_id: agenda.turno_id,
        regiao_id: agenda.regiao_id,
      });
    }
  }, [agenda, editForm]);

  const handleSubmit = async (data: EditFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Agenda</DialogTitle>
        </DialogHeader>
        
        <Form {...editForm}>
          <form onSubmit={editForm.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={editForm.control}
              name="vagas_disponiveis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vagas Disponíveis</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={agenda?.vagas_ocupadas || 1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                  {agenda && (
                    <p className="text-xs text-muted-foreground">
                      Mínimo: {agenda.vagas_ocupadas} (vagas já ocupadas)
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={editForm.control}
              name="turno_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turno</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o turno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {turnos.map((turno) => (
                        <SelectItem key={turno.id} value={turno.id}>
                          {turno.nome} ({turno.hora_inicio} - {turno.hora_fim})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={editForm.control}
              name="regiao_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Região</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a região" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {regioes.map((regiao) => (
                        <SelectItem key={regiao.id} value={regiao.id}>
                          {regiao.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={editForm.control}
              name="permite_reserva"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permite Reserva</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
