/* ===========================================================
   CARD DE COMPARTILHAMENTO — template usado pela exportação em PNG
   =========================================================== */

// Pré-carrega os ícones para descobrir quais realmente podem ser desenhados: só
// entram no card as imagens que carregam COM CORS (crossOrigin='anonymous'). As
// que falham (outro domínio sem CORS, 404) caem na inicial do nome — assim não há
// quadrado preto de imagem quebrada nem canvas "tainted" que quebre o toDataURL.
// Além de validar o CORS, RASTERIZAMOS cada ícone num canvas e o convertemos em
// data URL (base64). O card usa essas imagens embutidas em vez das URLs remotas —
// assim o html2canvas desenha instantaneamente, sem uma segunda requisição de rede
// que poderia não terminar a tempo (era por isso que ícones mais pesados sumiam da
// imagem de forma intermitente). Cada URL tem um timeout; a que falhar (sem CORS,
// 404, lenta demais ou canvas "tainted") cai na inicial do nome.
const ICON_LOAD_TIMEOUT = 8000;
function preloadIconData(urls){
  return Promise.all([...new Set(urls)].map(url => new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let done = false;
    const finish = (data) => { if (done) return; done = true; clearTimeout(timer); resolve([url, data]); };
    const timer = setTimeout(() => finish(null), ICON_LOAD_TIMEOUT);
    img.onload = () => {
      const nw = img.naturalWidth, nh = img.naturalHeight;
      if (!nw || !nh) { finish(null); return; }
      try {
        // Recorte quadrado central (cover) para o avatar circular, com tamanho
        // limitado para não gerar data URLs enormes.
        const s = Math.min(nw, nh);
        const out = Math.min(s, 144);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = out;
        canvas.getContext('2d').drawImage(img, (nw - s) / 2, (nh - s) / 2, s, s, 0, 0, out, out);
        finish(canvas.toDataURL('image/png'));
      } catch (e) {
        finish(null); // canvas "tainted" (imagem sem cabeçalho CORS) — não exportável
      }
    };
    img.onerror = () => finish(null);
    img.src = url;
  }))).then(pairs => new Map(pairs.filter(([, data]) => data).map(([u, data]) => [u, data])));
}

// Marca "sparkle" desenhada como path SVG (estrela de 4 pontas com coordenadas
// simétricas exatas) em vez do glyph unicode "✦" centralizado por line-height —
// o glyph dependia da métrica da fonte do navegador e saía torto/desalinhado ao
// rasterizar. Um <svg> não tem essa ambiguidade de baseline.
const SPARKLE_PATH = 'M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z';

// Monta, a partir dos dados do buildPlan(), um card off-screen autossuficiente.
// Layout todo em <table> com vertical-align:middle (o html2canvas centraliza
// células de tabela de forma confiável, ao contrário de inline-block + flex/gap).
// `iconData` = Map de URL de ícone -> data URL (base64) rasterizado no preload.
function buildShareCard(iconData){
  const css = getComputedStyle(document.documentElement);
  const cv = (name, fallback) => (css.getPropertyValue(name).trim() || fallback);
  const C = {
    bg: cv('--bg', '#fff'), text: cv('--text', '#111'), sec: cv('--text-secondary', '#666'),
    faint: cv('--text-faint', '#999'), surface: cv('--surface', '#f4f4f5'),
    surfaceAlt: cv('--surface-alt', '#e4e4e7'), border: cv('--border', '#e5e5e5'),
    primary: cv('--primary', '#a78bfa'), mint: cv('--mint', '#34d399'), rose: cv('--rose', '#fb7185'),
  };

  const owned = Math.max(0, parseInt(els.ownedWishes.value) || 0);
  const pity = parseInt(els.currentPity.value) || 0;
  const guar = els.guaranteed.checked ? 'sim' : 'não';

  const plan = buildPlan();
  const { perChar, totalWorst, totalExpected, totalBest } = plan;
  const expectedPrimos = Math.ceil(totalExpected) * PRIMOS_PER_WISH;
  const missingWorst = Math.max(0, totalWorst - owned);
  const missingExpected = Math.max(0, Math.ceil(totalExpected) - owned);
  const enough = owned >= totalWorst;
  const enoughExpected = owned >= Math.ceil(totalExpected);
  const pctWorst = totalWorst > 0 ? Math.min(100, (owned / totalWorst) * 100) : 0;

  // Layout responsivo: a lista de itens é distribuída em 1, 2 ou 3 colunas conforme
  // a quantidade, para que o card mantenha uma proporção agradável mesmo com muitos
  // personagens (ex.: 50) — em vez de virar uma tira vertical infinita.
  const n = perChar.length;
  const cols = n <= 8 ? 1 : n <= 20 ? 2 : 3;
  const cardWidth = cols === 1 ? 640 : cols === 2 ? 900 : 1180;

  // Pílula padronizada de um item: avatar + nome/nível em cima, faixa de tiros
  // (melhor–pior · média · acumulado) embaixo. Estrutura em blocos de largura total
  // (sem colunas laterais) para nunca estourar nem desalinhar em células estreitas.
  const pill = (r, i) => {
    const ec = itemBadgeColor(r);
    const initial = (r.name || '?').trim().charAt(0).toUpperCase();
    const iconSrc = r.icon ? iconData.get(r.icon) : null;
    const icon = iconSrc
      ? `<img src="${iconSrc}" style="width:36px;height:36px;object-fit:cover;display:block;">`
      : `<div style="line-height:36px;font-size:15px;font-weight:700;color:${C.sec};text-align:center;">${initial}</div>`;
    return `
    <div style="background:${C.surface}; border-radius:16px; padding:11px 13px; box-sizing:border-box; height:100%;">
      <table style="width:100%; border-collapse:collapse;"><tr>
        <td style="width:36px; vertical-align:middle;">
          <div style="width:36px; height:36px; border-radius:50%; overflow:hidden; background:${C.surfaceAlt};">${icon}</div>
        </td>
        <td style="vertical-align:middle; padding-left:11px;">
          <div style="font-size:14px; font-weight:600; color:${C.text}; line-height:1.25;">${i + 1}. ${r.name}</div>
          <div style="font-size:11px; color:${C.sec}; line-height:1.3;"><span style="color:${ec.fg}; font-weight:700">${itemTierLabel(r)}</span> · ${r.copies} cópia${r.copies>1?'s':''}</div>
        </td>
      </tr></table>
      <div style="margin-top:9px; padding-top:9px; border-top:1px solid ${C.border};">
        <div style="font-size:15px; font-weight:700; color:${C.text};">${fmt(r.charBest)}–${fmt(r.charWorst)} <span style="font-size:11px; font-weight:400; color:${C.sec}">tiros</span></div>
        <div style="font-size:11px; color:${C.sec}; margin-top:1px;">média ~${fmt(r.charExpected)} · acumulado ${fmt(r.cumBest)}–${fmt(r.cumWorst)}</div>
      </div>
    </div>`;
  };

  // Distribui as pílulas em uma tabela de `cols` colunas (table-layout fixo garante
  // larguras iguais e impede overflow); células vazias preenchem a última linha.
  const cellW = (100 / cols).toFixed(4);
  let gridRows = '';
  for (let i = 0; i < n; i += cols) {
    let cells = '';
    for (let j = 0; j < cols; j++) {
      const item = perChar[i + j];
      cells += `<td style="width:${cellW}%; vertical-align:top; padding:5px;">${item ? pill(item, i + j) : ''}</td>`;
    }
    gridRows += `<tr>${cells}</tr>`;
  }
  const rows = `<table style="width:100%; border-collapse:collapse; table-layout:fixed; margin:0 -5px;">${gridRows}</table>`;

  const totalCell = (label, value, sub, color, borderColor) => `
    <div style="background:${C.surface}; border:2px solid ${borderColor}; border-radius:16px; padding:12px 14px;">
      <div style="font-size:10px; font-weight:600; letter-spacing:.4px; text-transform:uppercase; color:${color}">${label}</div>
      <div style="font-size:20px; font-weight:700; color:${color}; margin-top:2px;">${value}</div>
      <div style="font-size:11px; color:${C.sec}">${sub}</div>
    </div>`;

  const conclusion = enough
    ? `<div style="margin-top:8px; font-size:13px; font-weight:700; color:${C.mint}">🎉 Suficiente até para o pior caso! Você já pode garantir todos.</div>`
    : `<div style="margin-top:8px; font-size:12.5px; color:${C.text}">Para <strong>garantir todos</strong> (pior caso) faltam <strong>${fmt(missingWorst)} tiros</strong> = <strong>${fmt(missingWorst * PRIMOS_PER_WISH)} primogems</strong>.${
        enoughExpected
          ? `<div style="margin-top:3px; font-weight:600; color:${C.mint}">Mas na média esperada, você provavelmente já consegue.</div>`
          : `<div style="margin-top:3px; color:${C.sec}">Faltam ~${fmt(missingExpected)} tiros para o cenário provável.</div>`
      }</div>`;

  const card = document.createElement('div');
  // Fontes reais do app (Fredoka/Quicksand, já carregadas via Google Fonts no
  // <head>) em vez de 'Inter' — que não é carregada em lugar nenhum do site e
  // caía no fallback do sistema, destoando do visual da página. Peso limitado a
  // 600 no Fredoka (só 400/500/600 estão carregados) para não forçar negrito
  // sintético do navegador, que rasteriza de forma inconsistente.
  card.style.cssText = `position:fixed; left:-99999px; top:0; width:${cardWidth}px; padding:28px;
    box-sizing:border-box; background:${C.bg}; color:${C.text};
    font-family:'Quicksand',system-ui,sans-serif; border-radius:24px;`;

  card.innerHTML = `
    <table style="border-collapse:collapse; margin-bottom:18px;"><tr>
      <td style="vertical-align:middle; width:48px;">
        <div style="width:48px; height:48px; border-radius:14px; background:${C.primary};">
          <table style="width:48px; height:48px; border-collapse:collapse;"><tr>
            <td style="width:48px; height:48px; text-align:center; vertical-align:middle;">
              <svg width="24" height="24" viewBox="0 0 24 24" style="display:inline-block; vertical-align:middle;"><path d="${SPARKLE_PATH}" fill="#ffffff"/></svg>
            </td>
          </tr></table>
        </div>
      </td>
      <td style="vertical-align:middle; padding-left:12px;">
        <div style="font-family:'Fredoka',sans-serif; font-size:19px; font-weight:600; color:${C.text}; line-height:1.2;">Planejador de Tiros</div>
        <div style="font-size:13px; color:${C.sec}; line-height:1.2;">Genshin Impact</div>
      </td>
    </tr></table>
    <div style="font-size:12.5px; color:${C.sec}; margin-bottom:16px;">
      <strong>${n}</strong> ${n === 1 ? 'item' : 'itens'} · Pity atual: <strong>${pity}</strong> · Garantia: <strong>${guar}</strong> · Tiros guardados: <strong>${fmt(owned)}</strong>
    </div>

    ${rows}

    <table style="width:100%; border-collapse:collapse; margin:14px 0 12px;"><tr>
      <td style="width:33.33%; vertical-align:top; padding-right:5px;">${totalCell('Melhor caso', `${fmt(totalBest)} tiros`, `${fmt(totalBest * PRIMOS_PER_WISH)} primogems`, C.mint, C.mint)}</td>
      <td style="width:33.33%; vertical-align:top; padding:0 2.5px;">${totalCell('Média esperada', `~${fmt(totalExpected)} tiros`, `~${fmt(expectedPrimos)} primogems`, C.text, C.border)}</td>
      <td style="width:33.33%; vertical-align:top; padding-left:5px;">${totalCell('Pior caso', `${fmt(totalWorst)} tiros`, `${fmt(totalWorst * PRIMOS_PER_WISH)} primogems`, C.rose, C.rose)}</td>
    </tr></table>

    <div style="background:${C.surface}; border-radius:16px; padding:14px 16px;">
      <div style="font-size:13px; font-weight:600; color:${C.text}">Você tem <strong>${fmt(owned)} tiros</strong>
        <span style="font-weight:400; font-size:12px; color:${C.sec}">(≈ ${fmt(owned * PRIMOS_PER_WISH)} primogems)</span>
      </div>
      <div style="position:relative; height:12px; border-radius:999px; background:${C.surfaceAlt}; overflow:hidden; margin:8px 0 4px;">
        <div style="position:absolute; left:0; top:0; bottom:0; width:${pctWorst}%; background:${C.primary}; border-radius:999px;"></div>
      </div>
      <div style="font-size:11px; color:${C.faint}; text-align:right;">${fmt(totalWorst)} tiros (pior caso)</div>
      ${conclusion}
    </div>

    <div style="margin-top:18px; padding-top:14px; border-top:1px solid ${C.border}; font-size:11px; color:${C.faint}; text-align:center;">
      Gerado com o Planejador de Tiros · probabilidades estimadas
    </div>`;
  return card;
}
