self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('Push data parsing error:', e);
  }

  const title = data.title || 'Clinic Update';
  const options = {
    body: data.body || 'You have a new message from the clinic.',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: 'clinic-reply', // Helps group notifications
    renotify: true, // Notify even if a previous notification with the same tag is visible
    data: {
      url: data.url || '/messages'
    },
    // Vibration pattern for mobile devices
    vibrate: [200, 100, 200],
    // 'sound' is deprecated in most browsers, but we keep it for legacy support
    // The actual alert sound is usually the OS default for push notifications
    sound: 'default',
    actions: [
      { action: 'open', title: 'Open Messages' }
    ],
    // Ensure the notification stays until the user interacts
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if possible
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
