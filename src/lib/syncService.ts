import { supabase } from "@/integrations/supabase/client";
import { getSyncQueue, removeFromSyncQueue, STORES, getAllItems, removeItem } from "./indexedDB";
import { logger } from "./logger";

/**
 * Serviço para sincronizar dados offline com o servidor
 */
export class SyncService {
  private static instance: SyncService;
  private isSyncing: boolean = false;
  private syncInterval: number | null = null;

  private constructor() {}

  /**
   * Obtém a instância única do serviço de sincronização
   */
  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Inicia o serviço de sincronização
   */
  public startSyncService(intervalMs: number = 30000): void {
    // Parar qualquer intervalo existente
    this.stopSyncService();

    // Tentar sincronizar imediatamente
    this.syncData();

    // Configurar intervalo de sincronização
    this.syncInterval = window.setInterval(() => {
      this.syncData();
    }, intervalMs);

    // Adicionar listener para eventos online
    window.addEventListener('online', this.handleOnline);

    logger.info('Serviço de sincronização iniciado', { intervalMs });
  }

  /**
   * Para o serviço de sincronização
   */
  public stopSyncService(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    window.removeEventListener('online', this.handleOnline);
    logger.info('Serviço de sincronização parado');
  }

  /**
   * Handler para evento online
   */
  private handleOnline = (): void => {
    logger.info('Conexão restabelecida, iniciando sincronização');
    this.syncData();
  };

  /**
   * Sincroniza dados offline com o servidor
   */
  public async syncData(): Promise<boolean> {
    // Evitar múltiplas sincronizações simultâneas
    if (this.isSyncing || !navigator.onLine) {
      return false;
    }

    try {
      this.isSyncing = true;
      logger.info('Iniciando sincronização de dados offline');

      // Obter itens da fila de sincronização
      const syncQueue = await getSyncQueue();

      if (syncQueue.length === 0) {
        logger.info('Nenhum dado para sincronizar');
        return true;
      }

      logger.info(`Sincronizando ${syncQueue.length} itens`);

      // Processar cada item da fila
      for (const item of syncQueue) {
        try {
          switch (item.table) {
            case STORES.AGENDAMENTOS:
              await this.syncAgendamento(item);
              break;
            // Adicionar outros casos conforme necessário
            default:
              logger.warn(`Tipo de sincronização não implementado: ${item.table}`);
          }

          // Remover item da fila após sincronização bem-sucedida
          await removeFromSyncQueue(item.id);
        } catch (error) {
          logger.error(`Erro ao sincronizar item ${item.id}:`, error);
          // Incrementar contagem de tentativas em caso de falha
          // Implementar lógica de retry se necessário
        }
      }

      logger.info('Sincronização concluída com sucesso');
      return true;
    } catch (error) {
      logger.error('Erro durante sincronização:', error);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sincroniza um agendamento com o servidor
   */
  private async syncAgendamento(item: any): Promise<void> {
    const { action, data } = item;

    switch (action) {
      case 'create':
        // Remover propriedades específicas do offline
        const { offline, ...agendamentoData } = data;
        
        // Se o ID for temporário (offline_*), gerar um novo
        if (agendamentoData.id.startsWith('offline_')) {
          delete agendamentoData.id;
        }

        // Enviar para o Supabase
        const { error } = await supabase
          .from('agendamentos')
          .insert([agendamentoData]);

        if (error) {
          throw new Error(`Erro ao criar agendamento no servidor: ${error.message}`);
        }

        // Remover do armazenamento local após sincronização bem-sucedida
        if (data.id) {
          await removeItem(STORES.AGENDAMENTOS, data.id);
        }
        break;

      case 'update':
        const { error: updateError } = await supabase
          .from('agendamentos')
          .update(data)
          .eq('id', data.id);

        if (updateError) {
          throw new Error(`Erro ao atualizar agendamento no servidor: ${updateError.message}`);
        }
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from('agendamentos')
          .delete()
          .eq('id', data.id);

        if (deleteError) {
          throw new Error(`Erro ao excluir agendamento no servidor: ${deleteError.message}`);
        }
        break;
    }
  }

  /**
   * Verifica se há dados pendentes de sincronização
   */
  public async hasPendingSyncData(): Promise<boolean> {
    const syncQueue = await getSyncQueue();
    return syncQueue.length > 0;
  }

  /**
   * Obtém a contagem de itens pendentes de sincronização
   */
  public async getPendingSyncCount(): Promise<number> {
    const syncQueue = await getSyncQueue();
    return syncQueue.length;
  }
}

// Exportar instância única
export const syncService = SyncService.getInstance();