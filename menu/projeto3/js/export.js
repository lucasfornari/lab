/* ===========================================================
   EXPORTAR IMAGEM (PNG) — orquestra o card (share-card.js) e o html2canvas
   =========================================================== */

// Carrega html2canvas sob demanda (só no primeiro clique) e o mantém em cache.
// Usamos html2canvas porque ele RASTERIZA o DOM diretamente a partir dos estilos
// computados — não precisa baixar CSS/fontes —, então funciona bem em file://
// (onde o html-to-image falha por CORS e gera PNG preto/vazio).
let html2canvasPromise = null;
function loadHtml2Canvas(){
  if (window.html2canvas) return Promise.resolve(window.html2canvas);
  if (html2canvasPromise) return html2canvasPromise;
  html2canvasPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js';
    s.onload = () => resolve(window.html2canvas);
    s.onerror = () => { html2canvasPromise = null; reject(new Error('CDN indisponível')); };
    document.head.appendChild(s);
  });
  return html2canvasPromise;
}

// O html2canvas nem sempre respeita o border-radius do elemento raiz ao
// rasterizar, então os cantos do card às vezes saem quadrados. Para garantir
// cantos arredondados de verdade (e um PNG com fundo transparente por fora do
// card — ótimo ao colar em Discord/Twitter/WhatsApp), recortamos o resultado
// num segundo canvas usando um clip de retângulo arredondado.
function traceRoundedRectPath(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clipRoundedCanvas(sourceCanvas, radiusPx){
  const out = document.createElement('canvas');
  out.width = sourceCanvas.width;
  out.height = sourceCanvas.height;
  const ctx = out.getContext('2d');
  traceRoundedRectPath(ctx, 0, 0, out.width, out.height, radiusPx);
  ctx.clip();
  ctx.drawImage(sourceCanvas, 0, 0);
  return out;
}

const SHARE_CARD_RADIUS = 24; // deve bater com o border-radius do card em share-card.js
const SHARE_CARD_SCALE = 2;   // nitidez em telas retina

els.exportImgBtn.addEventListener('click', async () => {
  if (!characters.length) { flashApiStatus('Adicione itens antes de exportar a imagem.'); return; }

  const btn = els.exportImgBtn;
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader-circle" class="w-4 h-4 spin"></i> Gerando…';
  lucide.createIcons();

  const iconData = await preloadIconData(characters.map(c => c.icon).filter(Boolean));
  const card = buildShareCard(iconData);
  document.body.appendChild(card);
  try{
    const html2canvas = await loadHtml2Canvas();
    const rawCanvas = await html2canvas(card, {
      backgroundColor: getComputedStyle(card).backgroundColor, // fundo concreto (sem cantos transparentes)
      scale: SHARE_CARD_SCALE,
      useCORS: true,      // por segurança; os ícones já vão embutidos como data URL
      logging: false,
    });
    const finalCanvas = clipRoundedCanvas(rawCanvas, SHARE_CARD_RADIUS * SHARE_CARD_SCALE);
    const url = finalCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'planejador-de-tiros-genshin.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    btn.innerHTML = '<i data-lucide="check" class="w-4 h-4" style="color:var(--mint)"></i> Imagem salva!';
  }catch(e){
    flashApiStatus('Não foi possível gerar a imagem. Tente novamente.');
    btn.innerHTML = original;
  }finally{
    card.remove();
    btn.disabled = false;
    lucide.createIcons();
    setTimeout(() => { btn.innerHTML = original; lucide.createIcons(); }, 1800);
  }
});
