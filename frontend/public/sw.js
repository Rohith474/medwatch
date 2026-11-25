// MEDWATCH Service Worker — 100% Free Web Push Notifications (DPDP Act Discreet Mode)
self.addEventListener('push', function (event) {
  let data = {
    title: 'MEDWATCH Health Advisory',
    body: 'Important medicine safety update available. Tap to view.',
    url: '/alerts',
  };

  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'medwatch-alert-' + (data.id || 'latest'),
      data: { url: data.url || '/alerts' },
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/alerts';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
