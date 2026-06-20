// Service worker registration (external file so a strict CSP `script-src 'self'`
// allows it — an inline script would be blocked).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/service-worker.js').catch(function (e) {
      console.warn('Service worker registration failed:', e);
    });
  });
}
