/* ===========================================================
   MODAL DE PITY FALTANDO
   Cada banner tem pity próprio. Se a lista tem itens de um tipo
   mas o pity daquele banner não foi informado, pedimos a info
   antes de calcular (em vez de assumir 0 silenciosamente).
   =========================================================== */
const pityModal = document.getElementById('pityModal');
const pityBackdrop = document.getElementById('pityBackdrop');
const pityCloseBtn = document.getElementById('pityCloseBtn');
const pitySkipBtn = document.getElementById('pitySkipBtn');
const pityConfirmBtn = document.getElementById('pityConfirmBtn');
const pityCharGroup = document.getElementById('pityCharGroup');
const pityWeaponGroup = document.getElementById('pityWeaponGroup');
const pityModalChar = document.getElementById('pityModalChar');
const pityModalCharGuar = document.getElementById('pityModalCharGuar');
const pityModalWeapon = document.getElementById('pityModalWeapon');
const pityModalWeaponGuar = document.getElementById('pityModalWeaponGuar');
const pityError = document.getElementById('pityError');

let pityModalTypes = []; // tipos exibidos no modal aberto

// Pity "faltando" = existe item do tipo e o campo do banner está vazio.
function pityMissingFor(type){
  const input = type === 'weapon' ? els.weaponPity : els.currentPity;
  return listHasType(type) && input.value.trim() === '';
}
function missingPityTypes(){
  return ['character', 'weapon'].filter(pityMissingFor);
}

function openPityModal(types){
  pityModalTypes = types.slice();
  const wantChar = types.includes('character');
  const wantWeapon = types.includes('weapon');
  pityCharGroup.classList.toggle('hidden', !wantChar);
  pityWeaponGroup.classList.toggle('hidden', !wantWeapon);
  // pré-preenche com o que já houver nos campos principais
  pityModalChar.value = els.currentPity.value;
  pityModalCharGuar.checked = els.guaranteed.checked;
  pityModalWeapon.value = els.weaponPity.value;
  pityModalWeaponGuar.checked = els.weaponGuaranteed.checked;
  pityError.classList.add('hidden');
  pityModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  (wantChar ? pityModalChar : pityModalWeapon).focus();
}
function closePityModal(){
  pityModal.classList.add('hidden');
  document.body.style.overflow = '';
}

// Abre o modal só se o pity do tipo informado estiver faltando.
function maybePromptPity(type){
  if (pityMissingFor(type)) openPityModal([type]);
}

// Usado pelo botão "Recalcular": pede o que faltar antes de calcular.
function recalcWithPityCheck(){
  const missing = missingPityTypes();
  if (missing.length){ openPityModal(missing); return; }
  updateTotalNow();
  renderResult();
}

[pityModalChar, pityModalWeapon].forEach(input =>
  input.addEventListener('input', () => pityError.classList.add('hidden')));

pityConfirmBtn.addEventListener('click', () => {
  // Valida e grava os campos visíveis nos inputs principais.
  if (pityModalTypes.includes('character')){
    const raw = pityModalChar.value.trim();
    if (raw === ''){
      pityError.textContent = 'Informe o pity do banner de personagem (use 0 se acabou de sair um 5★).';
      pityError.classList.remove('hidden');
      pityModalChar.focus();
      return;
    }
    if (!/^\d+$/.test(raw) || Number(raw) < 0 || Number(raw) > 89){
      pityError.textContent = 'Pity de personagem inválido. Use um número inteiro entre 0 e 89.';
      pityError.classList.remove('hidden');
      pityModalChar.focus();
      return;
    }
    els.currentPity.value = Math.max(0, Math.min(89, parseInt(raw) || 0));
    els.guaranteed.checked = pityModalCharGuar.checked;
  }
  if (pityModalTypes.includes('weapon')){
    const raw = pityModalWeapon.value.trim();
    if (raw === ''){
      pityError.textContent = 'Informe o pity do banner de arma (use 0 se acabou de sair um 5★).';
      pityError.classList.remove('hidden');
      pityModalWeapon.focus();
      return;
    }
    if (!/^\d+$/.test(raw) || Number(raw) < 0 || Number(raw) > 79){
      pityError.textContent = 'Pity de arma inválido. Use um número inteiro entre 0 e 79.';
      pityError.classList.remove('hidden');
      pityModalWeapon.focus();
      return;
    }
    els.weaponPity.value = Math.max(0, Math.min(79, parseInt(raw) || 0));
    els.weaponGuaranteed.checked = pityModalWeaponGuar.checked;
  }
  closePityModal();
  updateTotalNow();
  renderResult();
  saveState();
});

// "Pular": assume 0 para os campos pendentes e calcula.
pitySkipBtn.addEventListener('click', () => {
  if (pityModalTypes.includes('character') && els.currentPity.value.trim() === '') els.currentPity.value = '0';
  if (pityModalTypes.includes('weapon') && els.weaponPity.value.trim() === '') els.weaponPity.value = '0';
  closePityModal();
  updateTotalNow();
  renderResult();
  saveState();
});

pityCloseBtn.addEventListener('click', closePityModal);
pityBackdrop.addEventListener('click', closePityModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !pityModal.classList.contains('hidden')) closePityModal();
});
