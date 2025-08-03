// Service Worker para SlotMaster PWA

const CACHE_NAME = 'slotmaster-cache-v2';
const OFFLINE_URL = '/offline.html';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.ico',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon.svg',
  // Recursos estáticos essenciais serão adicionados dinamicamente
];

// Cache para recursos dinâmicos
const DYNAMIC_CACHE = 'slotmaster-dynamic-v2';
const MAX_DYNAMIC_CACHE_SIZE = 50;

// Instalação do Service Worker e cache de recursos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache aberto');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de cache melhorada
self.addEventListener('fetch', (event) => {
  // Ignorar requisições para o Supabase e outras APIs externas
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('chrome-extension') ||
      event.request.method !== 'GET') {
    return;
  }

  // Estratégia Cache First para recursos estáticos
  if (isStaticResource(event.request.url)) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }

  // Estratégia Network First para páginas e API
  event.respondWith(networkFirstStrategy(event.request));
});

// Verifica se é um recurso estático
function isStaticResource(url) {
  return url.includes('/icons/') || 
         url.includes('/assets/') ||
         url.endsWith('.css') ||
         url.endsWith('.js') ||
         url.endsWith('.png') ||
         url.endsWith('.jpg') ||
         url.endsWith('.svg') ||
         url.endsWith('.ico');
}

// Estratégia Cache First
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Recurso não disponível', { status: 503 });
  }
}

// Estratégia Network First
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      // Cache dinâmico para páginas e recursos importantes
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      
      // Limitar tamanho do cache dinâmico
      limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback para cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se for navegação e não tiver cache, mostrar página offline
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    return new Response('Recurso não disponível offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Limita o tamanho do cache
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Remove os mais antigos
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Sincronização em segundo plano para enviar dados quando online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-agendamentos') {
    event.waitUntil(syncAgendamentos());
  }
});

// Eventos de push notification (preparação para futuras implementações)
self.addEventListener('push', (event) => {
  console.log('Push notification recebida:', event);
  
  let notificationData = {
    title: 'SlotMaster',
    body: 'Você tem uma nova notificação',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'slotmaster-notification'
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Erro ao processar dados da push notification:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'Ver detalhes'
        },
        {
          action: 'dismiss',
          title: 'Dispensar'
        }
      ]
    })
  );
});

// Clique em notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Comunicação com o cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'FORCE_SYNC') {
    event.waitUntil(syncAgendamentos());
  }
});

// Função para sincronizar agendamentos pendentes
async function syncAgendamentos() {
  try {
    const pendingItems = await getPendingAgendamentos();
    console.log(`Sincronizando ${pendingItems.length} itens pendentes`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const syncItem of pendingItems) {
      try {
        await sendAgendamentoToServer(syncItem);
        await markAgendamentoAsSynced(syncItem.id);
        successCount++;
        console.log(`✓ Sincronizado: ${syncItem.id}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Erro ao sincronizar ${syncItem.id}:`, error);
        
        // Incrementar contador de tentativas
        await incrementRetryCount(syncItem.id);
      }
    }
    
    console.log(`Sincronização concluída: ${successCount} sucessos, ${errorCount} erros`);
    
    // Notificar clientes sobre o status da sincronização
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          success: successCount,
          errors: errorCount
        });
      });
    });
    
    return errorCount === 0;
  } catch (error) {
    console.error('Erro geral na sincronização:', error);
    return false;
  }
}

// Incrementa o contador de tentativas de um item
async function incrementRetryCount(syncItemId) {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(syncItemId);
      
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.retries = (item.retries || 0) + 1;
          item.lastRetry = Date.now();
          
          // Se excedeu o máximo de tentativas, remover da fila
          if (item.retries >= 3) {
            store.delete(syncItemId);
            console.log(`Item ${syncItemId} removido após 3 tentativas`);
          } else {
            store.put(item);
          }
        }
        resolve();
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error('Erro ao incrementar retry count:', error);
  }
}

// Funções auxiliares para sincronização com IndexedDB
async function getPendingAgendamentos() {
  try {
    // Simula a abertura do IndexedDB no service worker
    const db = await openIndexedDB();
    const transaction = db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const items = request.result.filter(item => 
          item.table === 'agendamentos' && item.action === 'create'
        );
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Erro ao buscar agendamentos pendentes:', error);
    return [];
  }
}

async function sendAgendamentoToServer(syncItem) {
  try {
    // Enviar para o Supabase
    const response = await fetch('/api/agendamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncItem.data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao enviar agendamento:', error);
    throw error;
  }
}

async function markAgendamentoAsSynced(syncItemId) {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(syncItemId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Erro ao marcar como sincronizado:', error);
    return false;
  }
}

// Função para abrir IndexedDB no service worker
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('slotmaster-offline-db', 1);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncQueueStore.createIndex('table', 'table', { unique: false });
        syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}