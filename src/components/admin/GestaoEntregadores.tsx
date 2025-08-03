
import { useState } from "react";
import { useGestaoEntregadores } from "@/hooks/useGestaoEntregadores";
import { SearchBar } from "./gestao-entregadores/SearchBar";
import { EntregadorTabs } from "./gestao-entregadores/EntregadorTabs";
import { EditEntregadorModal } from "./EditEntregadorModal";
import { ImportacaoEntregadores } from "./ImportacaoEntregadores";
import { Entregador } from "./gestao-entregadores/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Users } from "lucide-react";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { logger } from "@/lib/logger";
import { AdminErrorBoundary } from "@/components/ErrorBoundary/index";

function GestaoEntregadoresComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEntregador, setEditingEntregador] = useState<Entregador | null>(null);
  const [activeTab, setActiveTab] = useState("pendente");
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  const { empresa } = useEmpresaUnificado();

  const {
    loading,
    handleStatusChange,
    handleReativar,
    handleEntregadorUpdated,
    getFilteredEntregadores,
    getEntregadoresPorStatus,
    refetch
  } = useGestaoEntregadores();

  const handleImportacaoConcluida = () => {
    logger.info('Importação de entregadores concluída', { empresaId: empresa?.id }, 'ADMIN');
    setImportModalOpen(false);
    refetch(); // Recarregar a lista de entregadores
  };

  if (loading) {
    logger.debug('Carregando gestão de entregadores', { empresaId: empresa?.id }, 'ADMIN');
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestão de Entregadores</h2>
          <p className="text-gray-600 text-sm sm:text-base">Carregando entregadores...</p>
        </div>
      </div>
    );
  }

  const filteredEntregadores = getFilteredEntregadores(searchTerm);
  const entregadoresPorStatus = getEntregadoresPorStatus(filteredEntregadores);

  logger.debug('Renderizando gestão de entregadores', {
    empresaId: empresa?.id,
    totalEntregadores: filteredEntregadores.length,
    searchTerm,
    activeTab
  }, 'ADMIN');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestão de Entregadores</h2>
          <p className="text-gray-600 text-sm sm:text-base">Gerencie todos os entregadores da plataforma</p>
        </div>
        
        <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload size={16} />
              Importar em Massa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users size={20} />
                Importação em Massa de Entregadores
              </DialogTitle>
              <DialogDescription>
                Importe múltiplos entregadores usando planilha Excel ou CSV
              </DialogDescription>
            </DialogHeader>
            
            {empresa?.id && (
              <ImportacaoEntregadores 
                empresaId={empresa.id}
                onImportacaoConcluida={handleImportacaoConcluida}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
      
      <SearchBar 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm}
      />
      
      <EntregadorTabs 
        entregadoresPorStatus={entregadoresPorStatus}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onStatusChange={handleStatusChange}
        onReativar={handleReativar}
        onEdit={setEditingEntregador}
      />
      
      {editingEntregador && (
        <EditEntregadorModal
          entregador={editingEntregador}
          open={!!editingEntregador}
          onOpenChange={() => setEditingEntregador(null)}
          onEntregadorUpdated={handleEntregadorUpdated}
        />
      )}
    </div>
  );
}

// Wrapper com error boundary específico para gestão de entregadores
export function GestaoEntregadores() {
  return (
    <AdminErrorBoundary 
      context="entregadores"
      fallbackTitle="Erro na Gestão de Entregadores"
      criticalOperation={true}
      onRetry={() => window.location.reload()}
      onNavigateBack={() => window.history.back()}
    >
      <GestaoEntregadoresComponent />
    </AdminErrorBoundary>
  );
}
