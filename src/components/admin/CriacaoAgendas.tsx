
import React, { useState } from 'react';
import { ModalDetalhesAgenda } from '@/components/admin/ModalDetalhesAgenda';
import { FormularioCriacaoAgenda } from '@/components/admin/criacao-agendas/FormularioCriacaoAgenda';
import { TabelaAgendasAtivas } from '@/components/admin/criacao-agendas/TabelaAgendasAtivas';
import { ModalEdicaoAgenda } from '@/components/admin/criacao-agendas/ModalEdicaoAgenda';
import { ExportAgendasButton } from '@/components/admin/ExportAgendasButton';
import { MonitorOverbooking } from '@/components/admin/MonitorOverbooking';
import { useCriacaoAgendas } from '@/hooks/useCriacaoAgendas';
import { useAgendasAtivasAdmin } from '@/hooks/useAgendasAtivasAdmin';
import { Agenda, FormEdicaoAgenda as EditFormData } from '@/types/agenda';

export default function CriacaoAgendas() {
  const [editingAgenda, setEditingAgenda] = useState<Agenda | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [agendaSelecionada, setAgendaSelecionada] = useState<Agenda | null>(null);
  const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);

  const {
    regioes,
    turnos,
    loading: loadingCriacao,
    atualizarAgenda,
    cancelarAgenda,
  } = useCriacaoAgendas();

  const { agendas, loading: loadingAgendas, refetch: refetchAgendas } = useAgendasAtivasAdmin();

  const handleEditAgenda = (agenda: Agenda) => {
    setEditingAgenda(agenda);
    setIsEditModalOpen(true);
  };

  const handleUpdateAgenda = async (data: EditFormData) => {
    if (!editingAgenda) return;

    await atualizarAgenda(editingAgenda.id, data, editingAgenda.vagas_ocupadas);
    setIsEditModalOpen(false);
    setEditingAgenda(null);
    refetchAgendas();
  };

  const handleCancelAgenda = async (agendaId: string) => {
    await cancelarAgenda(agendaId);
    refetchAgendas();
  };

  const handleViewDetalhes = (agenda: Agenda) => {
    setAgendaSelecionada(agenda);
    setIsDetalhesModalOpen(true);
  };

  const handleCloseDetalhes = () => {
    setIsDetalhesModalOpen(false);
    setAgendaSelecionada(null);
  };

  return (
    <div className="space-y-6">
      <MonitorOverbooking />

      {/* Novo formulário com seleção múltipla */}
      <FormularioCriacaoAgenda />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Agendas Ativas</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie e visualize todas as agendas criadas
          </p>
        </div>
        
        <ExportAgendasButton />
      </div>

      <TabelaAgendasAtivas
        agendas={agendas}
        onEditAgenda={handleEditAgenda}
        onCancelAgenda={handleCancelAgenda}
        onViewDetalhes={handleViewDetalhes}
      />

      <ModalEdicaoAgenda
        isOpen={isEditModalOpen}
        agenda={editingAgenda}
        regioes={regioes}
        turnos={turnos}
        loading={loadingCriacao}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAgenda(null);
        }}
        onSubmit={handleUpdateAgenda}
      />

      <ModalDetalhesAgenda
        agenda={agendaSelecionada}
        isOpen={isDetalhesModalOpen}
        onClose={handleCloseDetalhes}
      />
    </div>
  );
}
