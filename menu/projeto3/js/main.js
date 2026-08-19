/* ===========================================================
   LISTENERS PRINCIPAIS + SEQUÊNCIA DE INICIALIZAÇÃO
   =========================================================== */
els.addChar.addEventListener('click', () => {
  if (!els.charInput.value.trim()){
    setSearchInputError('Digite o nome de um personagem ou arma para adicionar.');
    els.charInput.focus();
    return;
  }
  setSearchInputError('');
  addFromSearch();
});

els.charInput.addEventListener('input', () => {
  if (charInputError && !charInputError.classList.contains('hidden')) setSearchInputError('');
});

['currentPity', 'weaponPity', 'ownedWishes'].forEach(id =>
  els[id].addEventListener('input', () => {
    if (!validateCoreInputs()) return;
    updateTotalNow();
    renderResult();
    saveState();
  }));

els.currentPity.addEventListener('blur', () => {
  normalizeRangeInput(els.currentPity, 0, 89);
  if (!validateCoreInputs()) return;
  updateTotalNow();
  renderResult();
  saveState();
});

els.weaponPity.addEventListener('blur', () => {
  normalizeRangeInput(els.weaponPity, 0, 79);
  if (!validateCoreInputs()) return;
  updateTotalNow();
  renderResult();
  saveState();
});

els.ownedWishes.addEventListener('blur', () => {
  normalizeRangeInput(els.ownedWishes, 0, Number.MAX_SAFE_INTEGER);
  if (!validateCoreInputs()) return;
  updateTotalNow();
  renderResult();
  saveState();
});

[els.guaranteed, els.weaponGuaranteed].forEach(el =>
  el.addEventListener('change', () => {
    if (!validateCoreInputs()) return;
    updateTotalNow();
    renderResult();
    saveState();
  }));

// Antes de recalcular, pede o pity de cada banner que tiver item mas estiver vazio.
els.recalcBtn.addEventListener('click', () => {
  if (!validateCoreInputs()){
    flashApiStatus('Corrija os campos destacados antes de recalcular.');
    return;
  }
  recalcWithPityCheck();
});

els.clearBtn.addEventListener('click', () => {
  characters = [];
  els.currentPity.value = '';
  els.guaranteed.checked = false;
  els.weaponPity.value = '';
  els.weaponGuaranteed.checked = false;
  els.ownedWishes.value = '';
  els.charInput.value = '';
  setSearchInputError('');
  setInputError(els.currentPity, currentPityError, '');
  setInputError(els.weaponPity, weaponPityError, '');
  setInputError(els.ownedWishes, ownedWishesError, '');
  updateTotalNow();
  renderChars();
  renderResult();
  saveState();
});

/* INIT */
applyDeviceLayout();
lucide.createIcons();
loadState();
normalizeRangeInput(els.currentPity, 0, 89);
normalizeRangeInput(els.weaponPity, 0, 79);
normalizeRangeInput(els.ownedWishes, 0, Number.MAX_SAFE_INTEGER);
validateCoreInputs();
loadCatalog();
loadWeaponCatalog();
setSearchScope(searchScope);
updateTotalNow();
renderChars();
renderResult();
initSortable();
