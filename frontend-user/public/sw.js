// Empty Service Worker to prevent 404 errors during development
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('Service worker activated');
});
