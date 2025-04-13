// sw.js (in the root directory)
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
    icon: '/src/assets/logo.png',
    badge: '/src/assets/badge.png',
    tag: data.tag || `default-push-${Date.now()}`, // Gunakan tag unik
    renotify: true, // Izinkan renotify
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});