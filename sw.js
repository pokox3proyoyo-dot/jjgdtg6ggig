// Service Worker для Secure Hax Messenger
// Обеспечивает offline функциональность и кэширование

const CACHE_NAME = 'secure-hax-messenger-v1.0.0';
const urlsToCache = [
  '/',
  '/secure-hax-messenger-CUSTOM-VOICE.html',
  '/nacl.min.js',
  '/nacl-util.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Roboto+Mono:wght@400;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js',
  'https://avatanplus.com/files/resources/mid/57b39ece5502b15695a4560c.png',
  'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=300&h=150&fit=crop',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=300&h=150&fit=crop',
  'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=300&h=150&fit=crop'
];

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker установлен');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Кэш открыт');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('❌ Ошибка кэширования:', err))
  );
  // Принудительно активировать новый SW
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker активирован');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Удаляем старые кэши
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Удаляем старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Захватываем все клиенты
  self.clients.claim();
});

// Перехват запросов (Cache First стратегия)
self.addEventListener('fetch', event => {
  // Игнорируем non-GET запросы и запросы к Firebase
  if (event.request.method !== 'GET' || 
      event.request.url.includes('firebaseio.com') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Если найдено в кэше, возвращаем
        if (response) {
          return response;
        }

        // Иначе делаем сетевой запрос
        return fetch(event.request)
          .then(response => {
            // Проверяем валидность ответа
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Клонируем ответ для кэширования
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // При офлайне возвращаем кэшированную главную страницу
            if (event.request.mode === 'navigate') {
              return caches.match('/secure-hax-messenger-CUSTOM-VOICE.html');
            }
          });
      })
  );
});

// Обработка push-уведомлений (для будущих версий)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Новое сообщение в Secure Hax Messenger',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Открыть чат',
        icon: '/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Secure Hax Messenger', options)
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    // Открываем приложение
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});