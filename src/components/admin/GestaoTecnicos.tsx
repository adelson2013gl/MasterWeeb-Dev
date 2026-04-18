
import { useState } from "react";
import { useGestaoTecnicos } from "@/hooks/useGestaoTecnicos";
import { SearchBar } from "./gestao-tecnicos/SearchBar";
import { TecnicoTabs } from "./gestao-tecnicos/TecnicoTabs";
import { EditTecnicoModal } from "./EditTecnicoModal";
import { ImportacaoTecnicos } from "./ImportacaoTecnicos";
import { Tecnico } from "./gestao-tecnicos/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Users } from "lucide-react";
import { useEmpresaUnificado } from "@/contexts/EmpresaUnificadoContext";
import { logger } from "@/lib/logger";
import { AdminErrorBoundary } from "@/components/ErrorBoundary/index";

function GestaoTecnicosComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTecnico, setEditingTecnico] = useState<Tecnico | null>(null);
  const [activeTab, setActiveTab] = useState("pendente");
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  const { empresa } = useEmpresaUnificado();

  const {
    loading,
    handleStatusChange,
    handleReativar,
    handleTecnicoUpdated,
    getFilteredTecnicos,
    getTecnicosPorStatus,
    refetch
  } = useGestaoTecnicos();

  const handleImportacaoConcluida = () => {
    logger.info('Importação de tecnicos concluída', { empresaId: empresa?.id }, 'ADMIN');
    setImportModalOpen(false);
    refetch(); // Recarregar a lista de tecnicos
  };

  if (loading) {
    logger.debug('Carregando gestão de tecnicos', { empresaId: empresa?.id }, 'ADMIN');
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestão de Tecnicos</h2>
          <p className="text-gray-600 text-sm sm:text-base">Carregando tecnicos...</p>
        </div>
      </div>
    );
  }

  const filteredTecnicos = getFilteredTecnicos(searchTerm);
  const tecnicosPorStatus = getTecnicosPorStatus(filteredTecnicos);

  logger.debug('Renderizando gestão de tecnicos', {
    empresaId: empresa?.id,
    totalTecnicos: filteredTecnicos.length,
    searchTerm,
    activeTab
  }, 'ADMIN');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestão de Tecnicos</h2>
          <p className="text-gray-600 text-sm sm:text-base">Gerencie todos os tecnicos da plataforma</p>
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
                Importação em Massa de Tecnicos
              </DialogTitle>
              <DialogDescription>
                Importe múltiplos tecnicos usando planilha Excel ou CSV
              </DialogDescription>
            </DialogHeader>
            
            {empresa?.id && (
              <ImportacaoTecnicos 
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
      
      <TecnicoTabs 
        tecnicosPorStatus={tecnicosPorStatus}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onStatusChange={handleStatusChange}
        onReativar={handleReativar}
        onEdit={setEditingTecnico}
      />
      
      {editingTecnico && (
        <EditTecnicoModal
          tecnico={editingTecnico}
          open={!!editingTecnico}
          onOpenChange={() => setEditingTecnico(null)}
          onTecnicoUpdated={handleTecnicoUpdated}
        />
      )}
    </div>
  );
}

// Wrapper com error boundary específico para gestão de tecnicos
export function GestaoTecnicos() {
  return (
    <AdminErrorBoundary 
      context="tecnicos"
      fallbackTitle="Erro na Gestão de Tecnicos"
      criticalOperation={true}
      onRetry={() => window.location.reload()}
      onNavigateBack={() => window.history.back()}
    >
      <GestaoTecnicosComponent />
    </AdminErrorBoundary>
  );
}
