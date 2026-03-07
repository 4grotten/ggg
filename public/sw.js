// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  let data = { title: 'Easy Card', body: 'Новое уведомление', icon: '/app-icon-192.png' };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/app-icon-192.png',
      badge: '/app-icon-192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'default',
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
