importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const { precacheAndRoute } = workbox.precaching;
const { registerRoute } = workbox.routing;
const { NetworkFirst, StaleWhileRevalidate, CacheFirst } = workbox.strategies;
const { CacheableResponsePlugin } = workbox.cacheableResponse;

// Precache aset statis yang diperlukan untuk Application Shell
precacheAndRoute([
  { url: '/', revision: null },
  { url: '/index.html', revision: null },
  { url: '/src/css/style.css', revision: null },
  { url: '/src/css/theme.css', revision: null },
  { url: '/src/css/base.css', revision: null },
  { url: '/src/css/components/auth.css', revision: null },
  { url: '/src/css/components/header.css', revision: null },
  { url: '/src/css/components/story-list.css', revision: null },
  { url: '/src/css/components/story-detail.css', revision: null },
  { url: '/src/css/components/form.css', revision: null },
  { url: '/src/css/components/map.css', revision: null },
  { url: '/src/css/components/toast.css', revision: null },
  { url: '/Logo.png', revision: null },
  { url: '/src/assets/favicon.ico', revision: null },
  { url: '/manifest.json', revision: null },
  { url: '/src/js/main.js', revision: null },
  { url: '/src/js/utils/router.js', revision: null },
  { url: '/src/js/utils/auth.js', revision: null },
  { url: '/src/js/utils/toast.js', revision: null },
  { url: '/src/js/utils/map.js', revision: null },
  { url: '/src/js/utils/indexedDB.js', revision: null },
  { url: '/src/js/utils/notifications.js', revision: null },
  { url: '/src/js/views/StoryListView.js', revision: null },
  { url: '/src/js/views/StoryDetailView.js', revision: null },
  { url: '/src/js/views/AddStoryView.js', revision: null },
  { url: '/src/js/views/AuthView.js', revision: null },
  { url: '/src/js/models/StoryModel.js', revision: null },
  { url: '/src/js/presenters/StoryListPresenter.js', revision: null },
  { url: '/src/js/presenters/StoryDetailPresenter.js', revision: null },
  { url: '/src/js/presenters/AddStoryPresenter.js', revision: null },
  { url: '/src/js/presenters/AuthPresenter.js', revision: null },
  { url: '/src/js/presenters/FavoritesPresenter.js', revision: null },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css', revision: null },
  { url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Poppins:wght@300;500;700&display=swap', revision: null },
]);

// Cache strategi untuk API (NetworkFirst, fallback ke cache)
registerRoute(
  ({ url }) => url.origin === 'https://story-api.dicoding.dev' && url.pathname.startsWith('/v1/stories'),
  new NetworkFirst({
    cacheName: 'api-stories',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache strategi untuk CSS dan JavaScript (StaleWhileRevalidate)
registerRoute(
  ({ request }) => request.destination === 'style',
  new CacheFirst({
    cacheName: 'styles-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache strategi untuk JavaScript (StaleWhileRevalidate)
registerRoute(
  ({ request }) => request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'scripts-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache strategi untuk font dan aset eksternal (CacheFirst)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || 
               url.origin === 'https://fonts.gstatic.com' || 
               url.origin === 'https://cdnjs.cloudflare.com',
  new CacheFirst({
    cacheName: 'external-assets',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache strategi untuk gambar (StaleWhileRevalidate)
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Fallback untuk halaman offline
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).catch(() => {
          return caches.match('/index.html');
        });
      })
    );
  }
});

// Notifikasi handling (tetap pertahankan kode notifikasi Anda)
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed:', event.notification.tag);
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'notificationclosed',
        tag: event.notification.tag,
      });
    });
  });
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;

  if (action === 'view-story') {
    const url = notification.data.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        for (let client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  } else if (action === 'dismiss') {
    console.log('Service Worker: Notification dismissed:', notification.tag);
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'notificationclosed',
          tag: notification.tag,
        });
      });
    });
  }

  notification.close();
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || 'Notifikasi Baru';
  const options = {
    body: data.body || 'Anda memiliki notifikasi baru.',
    icon: '/Logo.png',
    badge: '/Logo.png',
    tag: data.tag || `default-push-${Date.now()}`,
    renotify: true,
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});