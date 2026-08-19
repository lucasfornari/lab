/* ===========================================================
   AÇÕES DE MUTAÇÃO DA LISTA (personagens e armas)
   =========================================================== */

/* Cadastro a partir dos catálogos (apenas 5★) */
function addCharacterFromCatalog(slug){
  const cat = allChars.find(c => c.slug === slug);
  if (!cat) return;
  if (characters.some(c => c.id === slug)){
    flashApiStatus('Esse personagem já está na lista.');
    return;
  }
  characters.push({ id: cat.slug, name: cat.name, icon: cat.icon, element: cat.element, constellation: 0, type: 'character' });
  renderChars();
  renderResult();
  saveState();
  maybePromptPity('character');
}

function addWeaponFromCatalog(slug){
  const cat = allWeapons.find(w => w.slug === slug);
  if (!cat) return;
  if (characters.some(c => c.id === slug)){
    flashApiStatus('Essa arma já está na lista.');
    return;
  }
  characters.push({ id: cat.slug, name: cat.name, icon: cat.icon, weaponType: cat.weaponType, refinement: 1, type: 'weapon' });
  renderChars();
  renderResult();
  saveState();
  maybePromptPity('weapon');
}

/* Adiciona a partir do texto do campo, respeitando o escopo da busca.
   Sem correspondência exata → abre o cadastro manual no tipo certo. */
function addFromSearch(){
  const raw = els.charInput.value.trim();
  if (!raw){
    if (typeof setSearchInputError === 'function') setSearchInputError('Digite o nome de um personagem ou arma para adicionar.');
    els.charInput.focus();
    return;
  }
  if (typeof setSearchInputError === 'function') setSearchInputError('');
  const norm = raw.toLowerCase();
  const wantChar = searchScope !== 'weapon';
  const wantWeapon = searchScope !== 'character';

  const charHit = wantChar && (allChars.find(c => c.name.toLowerCase() === norm) || allChars.find(c => c.name.toLowerCase().includes(norm)));
  const weaponHit = wantWeapon && (allWeapons.find(w => w.name.toLowerCase() === norm) || allWeapons.find(w => w.name.toLowerCase().includes(norm)));

  if (charHit){ addCharacterFromCatalog(charHit.slug); }
  else if (weaponHit){ addWeaponFromCatalog(weaponHit.slug); }
  else {
    closeAutocomplete();
    openManualModal(raw, searchScope === 'weapon' ? 'weapon' : 'character');
    return;
  }
  els.charInput.value = '';
  if (typeof setSearchInputError === 'function') setSearchInputError('');
  closeAutocomplete();
}

function flashApiStatus(msg){
  els.apiStatus.textContent = msg;
  setTimeout(updateApiStatus, 2200);
}

function removeCharacter(id) {
  characters = characters.filter(c => c.id !== id);
  renderChars();
  renderResult();
  saveState();
}

function moveChar(id, dir) {
  const i = characters.findIndex(c => c.id === id);
  const j = i + dir;
  if (j < 0 || j >= characters.length) return;
  [characters[i], characters[j]] = [characters[j], characters[i]];
  renderChars();
  renderResult();
  saveState();
}

function setConstellation(id, value){
  const c = characters.find(c => c.id === id);
  if (!c) return;
  c.constellation = Math.max(0, Math.min(6, parseInt(value) || 0));
  renderChars();
  renderResult();
  saveState();
}

function setRefinement(id, value){
  const w = characters.find(c => c.id === id);
  if (!w) return;
  w.refinement = Math.max(1, Math.min(5, parseInt(value) || 1));
  renderChars();
  renderResult();
  saveState();
}
