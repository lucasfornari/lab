/* ===========================================================
   GOOGLE ANALYTICS (gtag.js) — PLACEHOLDER
   -----------------------------------------------------------
   Ainda não há um código de medição real.
   Quando tiver o ID do GA4 (formato G-XXXXXXXXXX):
     1. Substitua GA_MEASUREMENT_ID abaixo pelo ID real.
     2. Em index.html, troque o mesmo ID na URL do script
        https://www.googletagmanager.com/gtag/js?id=...
   Enquanto o ID for o placeholder, nenhum dado é enviado
   (a inicialização é ignorada para não poluir métricas).
   =========================================================== */
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // TODO: substituir pelo ID real do GA4

window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }

if (GA_MEASUREMENT_ID && !GA_MEASUREMENT_ID.includes('XXXXXXXXXX')) {
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
} else {
  console.info('[analytics] gtag em modo placeholder — defina GA_MEASUREMENT_ID em js/analytics.js para ativar.');
}
