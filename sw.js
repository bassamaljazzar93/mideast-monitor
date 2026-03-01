const CACHE_NAME = 'mideast-monitor-v1';
const ASSETS = ['/', '/index.html'];

('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('api.gdeltproject.org') || e.request.url.includes('cdnjs')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'حدث جديد', body: 'تحقق من الخريطة' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: data
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});

// Background sync for new events
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'NOTIFY_NEW_EVENTS') {
    self.registration.showNotification('🔴 أحداث جديدة - الشرق الأوسط', {
      body: e.data.body || 'تم رصد أحداث جديدة في المنطقة',
      icon: '/icon-192.png',
      vibrate: [300, 100, 300],
      tag: 'new-events',
      renotify: true
    });
  }
});
