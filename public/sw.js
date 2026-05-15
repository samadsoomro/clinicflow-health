self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch(e) {
    data = { title: 'Notification', body: event.data?.text() || '' };
  }

  const title = data.title || 'ClinicToken Alert';
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'clinic-alert',
    data: data.data || { url: '/' },
    requireInteraction: data.requireInteraction || true,
    vibrate: data.vibrate || [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      // Open new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Suppress PWA install prompt
self.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
});
