/* ===========================================================
   ESCOPO DA BUSCA (personagem / arma / ambos)
   =========================================================== */
const SCOPE_LABELS = {
  character: { search: 'Buscar personagem 5★', placeholder: 'ex.: Hu Tao, Furina...', manual: 'Adicionar personagem manualmente' },
  weapon:    { search: 'Buscar arma 5★',       placeholder: 'ex.: Aquila Favonia, Homa...', manual: 'Adicionar arma manualmente' },
  both:      { search: 'Buscar personagem ou arma 5★', placeholder: 'ex.: Hu Tao, Aquila Favonia...', manual: 'Adicionar manualmente' },
};
const searchLabel = document.getElementById('searchLabel');

function setSearchScope(scope){
  searchScope = ['character', 'weapon', 'both'].includes(scope) ? scope : 'both';
  const cfg = SCOPE_LABELS[searchScope];
  searchLabel.textContent = cfg.search;
  els.charInput.placeholder = cfg.placeholder;
  els.manualAddLabel.textContent = cfg.manual;
  els.scopeToggle.querySelectorAll('.seg-btn').forEach(btn =>
    btn.setAttribute('aria-selected', String(btn.dataset.scope === searchScope)));
  if (els.charInput.value) renderAutocomplete(els.charInput.value);
}
els.scopeToggle.querySelectorAll('.seg-btn').forEach(btn =>
  btn.addEventListener('click', () => { setSearchScope(btn.dataset.scope); saveState(); }));
