/**
 * Serviço para gerenciar o armazenamento offline usando IndexedDB
 */

// Nome do banco de dados e versão
const DB_NAME = 'slotmaster-offline-db';
const DB_VERSION = 1;

// Nomes das stores (tabelas)
const STORES = {
  AGENDAMENTOS: 'agendamentos',
  AGENDAS: 'agendas',
  USER_DATA: 'userData',
  SYNC_QUEUE: 'syncQueue',
};

// Interface para itens na fila de sincronização
interface SyncQueueItem {
  id: string;
  table: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

/**
 * Inicializa o banco de dados IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Erro ao abrir o banco de dados:', event);
      reject('Não foi possível abrir o banco de dados offline');
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Criar stores se não existirem
      if (!db.objectStoreNames.contains(STORES.AGENDAMENTOS)) {
        const agendamentosStore = db.createObjectStore(STORES.AGENDAMENTOS, { keyPath: 'id' });
        agendamentosStore.createIndex('entregador_id', 'entregador_id', { unique: false });
        agendamentosStore.createIndex('status', 'status', { unique: false });
        agendamentosStore.createIndex('data', 'data', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.AGENDAS)) {
        const agendasStore = db.createObjectStore(STORES.AGENDAS, { keyPath: 'id' });
        agendasStore.createIndex('data', 'data', { unique: false });
        agendasStore.createIndex('regiao_id', 'regiao_id', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        db.createObjectStore(STORES.USER_DATA, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncQueueStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        syncQueueStore.createIndex('table', 'table', { unique: false });
        syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Adiciona um item ao banco de dados
 */
export async function addItem<T>(storeName: string, item: T): Promise<string> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);

    request.onsuccess = () => {
      resolve(request.result as string);
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Atualiza um item no banco de dados
 */
export async function updateItem<T>(storeName: string, item: T): Promise<void> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Obtém um item do banco de dados pelo ID
 */
export async function getItem<T>(storeName: string, id: string): Promise<T | null> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as T || null);
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Remove um item do banco de dados
 */
export async function removeItem(storeName: string, id: string): Promise<void> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Obtém todos os itens de uma store
 */
export async function getAllItems<T>(storeName: string): Promise<T[]> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as T[]);
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * Adiciona um item à fila de sincronização
 */
export async function addToSyncQueue(table: string, action: 'create' | 'update' | 'delete', data: any): Promise<void> {
  const syncItem: SyncQueueItem = {
    id: `${table}_${data.id}_${Date.now()}`,
    table,
    action,
    data,
    timestamp: Date.now(),
    retries: 0,
  };

  await addItem(STORES.SYNC_QUEUE, syncItem);
}

/**
 * Obtém todos os itens da fila de sincronização
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return getAllItems<SyncQueueItem>(STORES.SYNC_QUEUE);
}

/**
 * Remove um item da fila de sincronização
 */
export async function removeFromSyncQueue(id: string): Promise<void> {
  await removeItem(STORES.SYNC_QUEUE, id);
}

/**
 * Limpa todos os dados do banco
 */
export async function clearAllData(): Promise<void> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const storeNames = Array.from(db.objectStoreNames);
    const transaction = db.transaction(storeNames, 'readwrite');
    
    let completed = 0;
    let hasError = false;
    
    storeNames.forEach(storeName => {
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        completed++;
        if (completed === storeNames.length && !hasError) {
          resolve();
        }
      };
      
      request.onerror = () => {
        hasError = true;
        reject(request.error);
      };
    });
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

// Exportar constantes para uso em outros arquivos
export { STORES };