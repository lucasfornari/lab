/* ===========================================================
   RENDERIZAÇÃO DA LISTA + DRAG-AND-DROP
   =========================================================== */
function renderChars() {
  els.emptyHint.style.display = characters.length ? 'none' : 'block';
  els.exportSection.classList.toggle('hidden', characters.length === 0);
  els.reorderHint.classList.toggle('hidden', characters.length < 2);
  // O bloco de pity da arma só aparece quando há arma na lista — evita
  // mostrar campos que não se aplicam ao caso comum (só personagens).
  if (els.weaponPityBlock) els.weaponPityBlock.classList.toggle('hidden', !listHasType('weapon'));
  els.charListUI.innerHTML = characters.map((c, idx) => {
    const ec = itemBadgeColor(c);
    const copies = itemCopies(c);
    const tier = itemTierLabel(c);
    const selector = isWeapon(c)
      ? `<select onchange="setRefinement('${c.id}', this.value)" title="Refinamento alvo" class="w-14 rounded-xl border px-1.5 py-1.5 text-xs font-600 outline-none text-center" style="background:var(--surface-alt); border-color:var(--border)">
           ${Array.from({length:5}, (_,k)=>`<option value="${k+1}" ${(c.refinement||1)===k+1?'selected':''}>R${k+1}</option>`).join('')}
         </select>`
      : `<select onchange="setConstellation('${c.id}', this.value)" title="Constelação alvo" class="w-14 rounded-xl border px-1.5 py-1.5 text-xs font-600 outline-none text-center" style="background:var(--surface-alt); border-color:var(--border)">
           ${Array.from({length:7}, (_,k)=>`<option value="${k}" ${(c.constellation||0)===k?'selected':''}>C${k}</option>`).join('')}
         </select>`;
    return `
    <li data-id="${c.id}" class="flex flex-wrap items-center gap-2 sm:gap-3 surface rounded-2xl px-3 py-2.5 soft-shadow fade-in">
      <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <span class="drag-handle w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shrink-0" style="color:var(--text-faint)" title="Arraste para reordenar">
          <i data-lucide="grip-vertical" class="w-4 h-4"></i>
        </span>
        <span class="hidden sm:inline-block w-5 text-center font-700 text-sm shrink-0" style="color:var(--text-faint)">${idx + 1}</span>
        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 relative flex items-center justify-center" style="background:var(--surface-alt)">
          <i data-lucide="${itemPlaceholderIcon(c)}" class="w-5 h-5 absolute" style="color:var(--text-faint)"></i>
          ${c.icon ? `<img src="${c.icon}" alt="${c.name}" class="w-full h-full object-cover relative z-10" style="background:var(--surface-alt)" loading="lazy" onerror="this.remove()">` : ''}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-600 truncate flex items-center gap-2">
            <span class="truncate">${c.name}</span>
            ${c.manual
              ? `<span class="text-[10px] font-700 shrink-0 px-1.5 py-0.5 rounded-full" style="background:var(--surface-alt); color:var(--text-faint)" title="Cadastrado manualmente">manual</span>`
              : `<span class="text-[10px] font-700 shrink-0" style="color:var(--amber)">★5</span>`}
            ${isWeapon(c) ? `<span class="text-[10px] font-700 shrink-0 px-1.5 py-0.5 rounded-full" style="background:var(--amber-soft); color:var(--amber)" title="Arma">arma</span>` : ''}
          </div>
          <div class="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span class="text-[10px] font-600 px-2 py-0.5 rounded-full" style="color:${ec.fg}; background:${ec.bg}">${itemTagText(c)}</span>
            <span class="text-[10px]" style="color:var(--text-faint)">${tier} · ${copies} cópia${copies>1?'s':''}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        ${selector}
        <button onclick="moveChar('${c.id}',-1)" class="hidden sm:flex icon-btn w-8 h-8 rounded-xl items-center justify-center" style="background:var(--surface-alt)" title="Subir"><i data-lucide="chevron-up" class="w-4 h-4"></i></button>
        <button onclick="moveChar('${c.id}',1)" class="hidden sm:flex icon-btn w-8 h-8 rounded-xl items-center justify-center" style="background:var(--surface-alt)" title="Descer"><i data-lucide="chevron-down" class="w-4 h-4"></i></button>
        <button onclick="removeCharacter('${c.id}')" class="icon-btn w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style="background:var(--rose-soft); color:var(--rose)" title="Remover"><i data-lucide="x" class="w-4 h-4"></i></button>
      </div>
    </li>
  `;
  }).join('');
  lucide.createIcons();
}

let sortableInstance = null;
function initSortable(){
  sortableInstance = new Sortable(els.charListUI, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: () => {
      const newOrder = Array.from(els.charListUI.children).map(li => li.dataset.id);
      characters.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
      renderChars();
      renderResult();
      saveState();
    }
  });
}
