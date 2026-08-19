/* ===========================================================
   REGISTRO DO SERVICE WORKER (sw.js na raiz do site)
   =========================================================== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* PWA é um extra — se o registro falhar, o app segue funcionando normalmente */
    });
  });
}
