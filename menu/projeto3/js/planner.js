/* ===========================================================
   CÁLCULO — considera múltiplas cópias por constelação (C0–C6)
   =========================================================== */
function buildPlan(){
  // Cada banner tem pity próprio. O pity/garantia informado vale só para a
  // PRIMEIRA cópia do primeiro item daquele tipo; as demais começam do zero.
  const startPity = Math.max(0, Math.min(89, parseInt(els.currentPity.value) || 0));
  const startGuar = els.guaranteed.checked;
  const startWeaponPity = Math.max(0, Math.min(79, parseInt(els.weaponPity.value) || 0));
  const startWeaponFate = els.weaponGuaranteed.checked ? WEAPON_FATE_POINTS_NEEDED : 0;
  let firstCharPullUsed = false;
  let firstWeaponPullUsed = false;
  let cumWorst = 0, cumExpected = 0, cumBest = 0;

  const perChar = characters.map(item => {
    const copies = itemCopies(item);
    let charWorst = 0, charExpected = 0, charBest = 0;
    for (let i = 0; i < copies; i++) {
      let w, e, b;
      if (isWeapon(item)) {
        const pity = !firstWeaponPullUsed ? startWeaponPity : 0;
        const fate = !firstWeaponPullUsed ? startWeaponFate : 0;
        firstWeaponPullUsed = true;
        w = worstCaseForChartedWeapon(pity, fate);
        e = expectedWishesForChartedWeapon(pity, fate);
        b = bestCaseForChartedWeapon(pity, fate);
      } else {
        const pity = !firstCharPullUsed ? startPity : 0;
        const guar = !firstCharPullUsed ? startGuar : false;
        firstCharPullUsed = true;
        w = worstCaseForFeatured(pity, guar);
        e = expectedWishesForFeatured(pity, guar);
        b = bestCaseForFeatured(pity, guar);
      }
      charWorst += w; charExpected += e; charBest += b;
      cumWorst += w; cumExpected += e; cumBest += b;
    }
    return {
      ...item, copies,
      charWorst, charExpected, charBest,
      cumWorst, cumExpected, cumBest,
    };
  });

  return { perChar, totalWorst: cumWorst, totalExpected: cumExpected, totalBest: cumBest };
}

function renderResult() {
  const ownedWishes = Math.max(0, parseInt(els.ownedWishes.value) || 0);

  if (!characters.length) {
    els.resultBody.innerHTML = `<p class="text-center py-4" style="color:var(--text-secondary)">Adicione personagens ou armas para ver o cálculo.</p>`;
    els.statsBar.classList.add('hidden');
    return;
  }

  const plan = buildPlan();
  const { perChar, totalWorst, totalExpected, totalBest } = plan;
  const worstPrimos = totalWorst * PRIMOS_PER_WISH;
  const expectedPrimos = Math.ceil(totalExpected) * PRIMOS_PER_WISH;
  const bestPrimos = totalBest * PRIMOS_PER_WISH;

  const missingWorst = Math.max(0, totalWorst - ownedWishes);
  const missingExpected = Math.max(0, Math.ceil(totalExpected) - ownedWishes);
  const missingPrimosWorst = missingWorst * PRIMOS_PER_WISH;
  const missingPrimosExpected = missingExpected * PRIMOS_PER_WISH;

  // estatísticas no topo
  const totalCopies = perChar.reduce((s, c) => s + c.copies, 0);
  els.statChars.textContent = characters.length;
  els.statCopies.textContent = totalCopies;
  els.statWishes.textContent = `~${fmt(totalExpected)}`;
  els.statPrimos.textContent = fmt(expectedPrimos / 1000) + 'k';
  els.statsBar.classList.remove('hidden');

  const tableRows = perChar.map((r, i) => {
    const ec = itemBadgeColor(r);
    return `
    <div class="flex items-center gap-3 rounded-2xl px-3 py-2.5" style="background:var(--surface)">
      <div class="w-9 h-9 rounded-full overflow-hidden shrink-0 relative flex items-center justify-center" style="background:var(--surface-alt)">
        <i data-lucide="${itemPlaceholderIcon(r)}" class="w-4 h-4 absolute" style="color:var(--text-faint)"></i>
        ${r.icon ? `<img src="${r.icon}" class="w-full h-full object-cover relative z-10" style="background:var(--surface-alt)" loading="lazy" onerror="this.remove()">` : ''}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-600 truncate">${i + 1}. ${r.name} <span class="text-[10px] font-600 px-1.5 py-0.5 rounded-full ml-1" style="color:${ec.fg}; background:${ec.bg}">${itemTierLabel(r)}</span></div>
        <div class="text-[11px]" style="color:var(--text-secondary)">${r.copies} cópia${r.copies>1?'s':''} necessária${r.copies>1?'s':''}</div>
      </div>
      <div class="text-right leading-tight shrink-0">
        <div class="font-700">${fmt(r.charBest)}–${fmt(r.charWorst)} <span class="font-400 text-xs" style="color:var(--text-secondary)">tiros</span></div>
        <div class="text-xs" style="color:var(--text-secondary)">~${fmt(r.charExpected)} em média · acum. ${fmt(r.cumBest)}–${fmt(r.cumWorst)}</div>
      </div>
    </div>
  `;
  }).join('');

  const enough = ownedWishes >= totalWorst;
  const enoughExpected = ownedWishes >= Math.ceil(totalExpected);

  const pctWorst = totalWorst > 0 ? Math.min(100, (ownedWishes / totalWorst) * 100) : 0;
  const pctExpectedMarker = totalWorst > 0 ? Math.min(100, (totalExpected / totalWorst) * 100) : 0;

  els.resultBody.innerHTML = `
    <div class="space-y-2.5">${tableRows}</div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
      <div class="rounded-2xl p-4 soft-shadow border-2" style="background:var(--surface); border-color:var(--mint)">
        <div class="text-xs font-600 uppercase tracking-wide flex items-center gap-1" style="color:var(--mint)"><i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Melhor caso</div>
        <div class="text-2xl font-700 mt-1" style="color:var(--mint)">${fmt(totalBest)} tiros</div>
        <div class="text-sm" style="color:var(--text-secondary)">${fmt(bestPrimos)} primogems</div>
        <div class="text-[11px] mt-1" style="color:var(--text-faint)">soft pity + ganha 50/50</div>
      </div>
      <div class="rounded-2xl p-4 soft-shadow" style="background:var(--surface)">
        <div class="text-xs font-600 uppercase tracking-wide flex items-center gap-1" style="color:var(--text-secondary)"><i data-lucide="trending-up" class="w-3.5 h-3.5"></i> Média esperada</div>
        <div class="text-2xl font-700 mt-1">~${fmt(totalExpected)} tiros</div>
        <div class="text-sm" style="color:var(--text-secondary)">~${fmt(expectedPrimos)} primogems</div>
        <div class="text-[11px] mt-1" style="color:var(--text-faint)">cenário provável</div>
      </div>
      <div class="rounded-2xl p-4 soft-shadow border-2" style="background:var(--surface); border-color:var(--rose)">
        <div class="text-xs font-600 uppercase tracking-wide flex items-center gap-1" style="color:var(--rose)"><i data-lucide="shield" class="w-3.5 h-3.5"></i> Pior caso</div>
        <div class="text-2xl font-700 mt-1">${fmt(totalWorst)} tiros</div>
        <div class="text-sm" style="color:var(--text-secondary)">${fmt(worstPrimos)} primogems</div>
        <div class="text-[11px] mt-1" style="color:var(--text-faint)">hard pity + perde 50/50</div>
      </div>
    </div>

    <div class="rounded-2xl p-4 mt-1" style="background:var(--surface)">
      <div class="font-600 mb-1">
        Você tem <strong>${fmt(ownedWishes)} tiros</strong>
        <span class="font-400 text-sm" style="color:var(--text-secondary)">(equivale a ${fmt(ownedWishes * PRIMOS_PER_WISH)} primogems)</span>
      </div>
      <div class="relative progress-track rounded-full h-3 mt-2 mb-1 overflow-hidden">
        <div class="progress-fill h-full rounded-full" style="width:${pctWorst}%"></div>
        <div class="absolute top-0 bottom-0 w-0.5" style="left:${pctExpectedMarker}%; background:var(--rose)" title="Cenário esperado"></div>
      </div>
      <div class="text-[11px] flex justify-between" style="color:var(--text-faint)">
        <span>0</span><span>${fmt(totalWorst)} tiros (pior caso)</span>
      </div>
      ${enough
        ? `<div class="mt-2 font-700 inline-flex items-center gap-1.5" style="color:var(--mint)"><i data-lucide="party-popper" class="w-4 h-4"></i> Suficiente até para o pior caso! Você já pode garantir todos.</div>`
        : `<div class="mt-2">
             Para <strong>garantir todos</strong> (pior caso) faltam
             <strong>${fmt(missingWorst)} tiros</strong> = <strong>${fmt(missingPrimosWorst)} primogems</strong>.
             ${enoughExpected
               ? `<div class="font-600 mt-1" style="color:var(--mint)">Mas na média esperada, você provavelmente já consegue.</div>`
               : ownedWishes >= totalBest
                 ? `<div class="mt-1 text-sm" style="color:var(--text-secondary)">No melhor caso (com sorte) você já consegue, mas ainda faltam ~${fmt(missingExpected)} tiros para o cenário provável.</div>`
                 : `<div class="mt-1 text-sm" style="color:var(--text-secondary)">Faltam ~${fmt(missingExpected)} tiros para o cenário provável, ou ${fmt(Math.max(0, totalBest - ownedWishes))} tiros para o melhor caso.</div>`}
           </div>`
      }
    </div>
  `;
  lucide.createIcons();
}

/* ===========================================================
   ESTADO ATUAL — total de tiros disponível agora
   =========================================================== */
function updateTotalNow() {
  const w = Math.max(0, parseInt(els.ownedWishes.value) || 0);
  els.totalWishesNow.textContent = `${fmt(w)} tiros`;
}
