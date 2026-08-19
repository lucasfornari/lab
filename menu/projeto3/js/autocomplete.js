/* ===========================================================
   AUTOCOMPLETE VISUAL
   =========================================================== */
let activeAutocompleteIndex = -1;
let currentMatches = [];

// Coleta candidatos dos catálogos conforme o escopo selecionado.
function autocompleteMatches(q){
  const out = [];
  if (searchScope !== 'weapon'){
    allChars.filter(c => c.name.toLowerCase().includes(q))
      .forEach(c => out.push({ kind: 'character', slug: c.slug, name: c.name, icon: c.icon, element: c.element }));
  }
  if (searchScope !== 'character'){
    allWeapons.filter(w => w.name.toLowerCase().includes(q))
      .forEach(w => out.push({ kind: 'weapon', slug: w.slug, name: w.name, icon: w.icon, weaponType: w.weaponType }));
  }
  out.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return out.slice(0, 8);
}

function selectAutocomplete(match){
  if (match.kind === 'weapon') addWeaponFromCatalog(match.slug);
  else addCharacterFromCatalog(match.slug);
  els.charInput.value = '';
  closeAutocomplete();
}

function renderAutocomplete(query){
  const q = query.trim().toLowerCase();
  if (!q){ closeAutocomplete(); return; }
  currentMatches = autocompleteMatches(q);
  activeAutocompleteIndex = currentMatches.length ? 0 : -1;
  if (!currentMatches.length){
    const what = searchScope === 'weapon' ? 'arma' : searchScope === 'character' ? 'personagem' : 'personagem ou arma';
    els.autocompleteBox.innerHTML = `<div class="px-4 py-3 text-sm" style="color:var(--text-faint)">Nenhum(a) ${what} 5★ encontrado(a).</div>`;
    els.autocompleteBox.classList.remove('hidden');
    return;
  }
  els.autocompleteBox.innerHTML = currentMatches.map((m, i) => {
    const weapon = m.kind === 'weapon';
    const ec = weapon ? weaponTypeColor() : elementColor(m.element);
    const tag = weapon ? (m.weaponType || 'Arma') : (m.element || '—');
    const ph = weapon ? weaponTypeIcon(m.weaponType) : 'star';
    return `
    <div class="autocomplete-item ${i === activeAutocompleteIndex ? 'active' : ''} flex items-center gap-3 px-3 py-2.5 cursor-pointer" data-index="${i}">
      <div class="w-9 h-9 rounded-full overflow-hidden shrink-0 relative flex items-center justify-center" style="background:var(--surface-alt)">
        <i data-lucide="${ph}" class="w-4 h-4 absolute" style="color:var(--text-faint)"></i>
        <img src="${m.icon}" class="w-full h-full object-cover relative z-10" style="background:var(--surface-alt)" loading="lazy" onerror="this.remove()">
      </div>
      <span class="flex-1 font-600 text-sm truncate">${m.name}</span>
      <span class="text-[10px] font-600 px-2 py-0.5 rounded-full" style="color:${ec.fg}; background:${ec.bg}">${tag}</span>
      <span class="text-[10px] font-700" style="color:var(--amber)">★5</span>
    </div>`;
  }).join('');
  els.autocompleteBox.classList.remove('hidden');
  lucide.createIcons();
  els.autocompleteBox.querySelectorAll('.autocomplete-item').forEach(el => {
    el.addEventListener('click', () => selectAutocomplete(currentMatches[parseInt(el.dataset.index)]));
  });
}
function closeAutocomplete(){
  els.autocompleteBox.classList.add('hidden');
  els.autocompleteBox.innerHTML = '';
  currentMatches = [];
  activeAutocompleteIndex = -1;
}
els.charInput.addEventListener('input', () => renderAutocomplete(els.charInput.value));
els.charInput.addEventListener('focus', () => { if (els.charInput.value) renderAutocomplete(els.charInput.value); });
document.addEventListener('click', (e) => {
  if (!els.autocompleteBox.contains(e.target) && e.target !== els.charInput) closeAutocomplete();
});
els.charInput.addEventListener('keydown', e => {
  if (!currentMatches.length){
    if (e.key === 'Enter') addFromSearch();
    return;
  }
  if (e.key === 'ArrowDown'){ e.preventDefault(); activeAutocompleteIndex = Math.min(currentMatches.length - 1, activeAutocompleteIndex + 1); highlightAutocomplete(); }
  else if (e.key === 'ArrowUp'){ e.preventDefault(); activeAutocompleteIndex = Math.max(0, activeAutocompleteIndex - 1); highlightAutocomplete(); }
  else if (e.key === 'Enter'){
    e.preventDefault();
    if (activeAutocompleteIndex >= 0 && currentMatches[activeAutocompleteIndex]){
      selectAutocomplete(currentMatches[activeAutocompleteIndex]);
    } else addFromSearch();
  } else if (e.key === 'Escape'){ closeAutocomplete(); }
});
function highlightAutocomplete(){
  els.autocompleteBox.querySelectorAll('.autocomplete-item').forEach((el, i) => el.classList.toggle('active', i === activeAutocompleteIndex));
}
