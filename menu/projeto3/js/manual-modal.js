/* ===========================================================
   MODAL DE CADASTRO MANUAL (personagens e armas fora da API)
   =========================================================== */
const manualAddTrigger = document.getElementById('manualAddTrigger');
const manualModal = document.getElementById('manualModal');
const manualBackdrop = document.getElementById('manualBackdrop');
const manualCloseBtn = document.getElementById('manualCloseBtn');
const manualCancelBtn = document.getElementById('manualCancelBtn');
const manualSubmitBtn = document.getElementById('manualSubmitBtn');
const manualName = document.getElementById('manualName');
const manualNameLabel = document.getElementById('manualNameLabel');
const manualElement = document.getElementById('manualElement');
const manualWeaponType = document.getElementById('manualWeaponType');
const manualIcon = document.getElementById('manualIcon');
const manualElementField = document.getElementById('manualElementField');
const manualWeaponField = document.getElementById('manualWeaponField');
const manualModeToggle = document.getElementById('manualModeToggle');
const manualTitleText = document.getElementById('manualTitleText');
const manualError = document.getElementById('manualError');

let manualMode = 'character'; // 'character' | 'weapon'

function slugify(name){
  return name.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

// Aplica o modo (personagem/arma) à UI do modal.
function setManualMode(mode){
  manualMode = mode === 'weapon' ? 'weapon' : 'character';
  const weapon = manualMode === 'weapon';
  manualTitleText.textContent = weapon ? 'Adicionar arma manualmente' : 'Adicionar personagem manualmente';
  manualNameLabel.textContent = weapon ? 'Nome da arma' : 'Nome do personagem';
  manualName.placeholder = weapon ? 'ex.: Nova Espada' : 'ex.: Varka';
  manualElementField.classList.toggle('hidden', weapon);
  manualWeaponField.classList.toggle('hidden', !weapon);
  manualModeToggle.querySelectorAll('.seg-btn').forEach(btn =>
    btn.setAttribute('aria-selected', String(btn.dataset.mode === manualMode)));
  manualError.classList.add('hidden');
}

function openManualModal(prefillName, mode){
  setManualMode(mode || 'character');
  manualName.value = prefillName || '';
  manualElement.value = '';
  manualWeaponType.value = '';
  manualError.classList.add('hidden');
  manualModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  manualName.focus();
}
function closeManualModal(){
  manualModal.classList.add('hidden');
  document.body.style.overflow = '';
  manualAddTrigger.focus();
}

function isValidHttpUrl(value){
  try{
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  }catch(e){
    return false;
  }
}

// O gatilho "Não encontrou?" abre no modo que combina com o escopo da busca.
manualAddTrigger.addEventListener('click', () => {
  closeAutocomplete();
  openManualModal(els.charInput.value.trim(), searchScope === 'weapon' ? 'weapon' : 'character');
});
manualModeToggle.querySelectorAll('.seg-btn').forEach(btn =>
  btn.addEventListener('click', () => setManualMode(btn.dataset.mode)));
manualCloseBtn.addEventListener('click', closeManualModal);
manualCancelBtn.addEventListener('click', closeManualModal);
manualBackdrop.addEventListener('click', closeManualModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !manualModal.classList.contains('hidden')) closeManualModal();
});
manualName.addEventListener('input', () => manualError.classList.add('hidden'));
manualIcon.addEventListener('input', () => manualError.classList.add('hidden'));

manualSubmitBtn.addEventListener('click', () => {
  const name = manualName.value.trim();
  const icon = manualIcon.value.trim();
  const weapon = manualMode === 'weapon';
  if (!name){
    manualError.textContent = weapon ? 'Digite um nome para a arma.' : 'Digite um nome para o personagem.';
    manualError.classList.remove('hidden');
    manualName.focus();
    return;
  }
  if (name.length < 2){
    manualError.textContent = 'Use pelo menos 2 caracteres no nome.';
    manualError.classList.remove('hidden');
    manualName.focus();
    return;
  }
  if (name.length > 50){
    manualError.textContent = 'Use no máximo 50 caracteres no nome.';
    manualError.classList.remove('hidden');
    manualName.focus();
    return;
  }
  if (icon && !isValidHttpUrl(icon)){
    manualError.textContent = 'A URL do ícone precisa começar com http:// ou https://';
    manualError.classList.remove('hidden');
    manualIcon.focus();
    return;
  }
  const slug = 'manual-' + slugify(name);
  const dup = characters.some(c => c.id === slug || c.name.toLowerCase() === name.toLowerCase());
  if (dup){
    manualError.textContent = weapon ? 'Essa arma já está na sua lista.' : 'Esse personagem já está na sua lista.';
    manualError.classList.remove('hidden');
    return;
  }
  if (weapon){
    characters.push({
      id: slug,
      name,
      icon,
      weaponType: manualWeaponType.value,
      refinement: 1,
      type: 'weapon',
      manual: true,
    });
  } else {
    characters.push({
      id: slug,
      name,
      icon,
      element: manualElement.value,
      constellation: 0,
      type: 'character',
      manual: true,
    });
  }
  renderChars();
  renderResult();
  saveState();
  closeManualModal();
  els.charInput.value = '';
  closeAutocomplete();
  maybePromptPity(weapon ? 'weapon' : 'character');
});
