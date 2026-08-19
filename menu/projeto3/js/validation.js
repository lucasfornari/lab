/* ===========================================================
   VALIDAÇÃO DOS CAMPOS PRINCIPAIS
   =========================================================== */
const currentPityError = document.getElementById('currentPityError');
const weaponPityError = document.getElementById('weaponPityError');
const ownedWishesError = document.getElementById('ownedWishesError');
const charInputError = document.getElementById('charInputError');

function setInputError(inputEl, errorEl, message){
  if (!inputEl || !errorEl) return;
  const hasError = !!message;
  inputEl.classList.toggle('is-invalid', hasError);
  inputEl.setAttribute('aria-invalid', String(hasError));
  errorEl.textContent = message || '';
  errorEl.classList.toggle('hidden', !hasError);
}

function setSearchInputError(message){
  setInputError(els.charInput, charInputError, message);
}

function validateOptionalIntegerInRange(inputEl, errorEl, min, max, label){
  const raw = inputEl.value.trim();
  if (!raw){
    setInputError(inputEl, errorEl, '');
    return true;
  }
  if (!/^\d+$/.test(raw)){
    setInputError(inputEl, errorEl, `${label}: use apenas números inteiros.`);
    return false;
  }
  const value = Number(raw);
  if (value < min || value > max){
    setInputError(inputEl, errorEl, `${label}: informe um valor entre ${min} e ${max}.`);
    return false;
  }
  setInputError(inputEl, errorEl, '');
  return true;
}

function validateOwnedWishes(){
  const raw = els.ownedWishes.value.trim();
  if (!raw){
    setInputError(els.ownedWishes, ownedWishesError, '');
    return true;
  }
  if (!/^\d+$/.test(raw)){
    setInputError(els.ownedWishes, ownedWishesError, 'Tiros guardados: use apenas números inteiros.');
    return false;
  }
  setInputError(els.ownedWishes, ownedWishesError, '');
  return true;
}

function validateCoreInputs(){
  const okChar = validateOptionalIntegerInRange(els.currentPity, currentPityError, 0, 89, 'Pity de personagem');
  const okWeapon = validateOptionalIntegerInRange(els.weaponPity, weaponPityError, 0, 79, 'Pity de arma');
  const okWishes = validateOwnedWishes();
  return okChar && okWeapon && okWishes;
}

function normalizeRangeInput(inputEl, min, max){
  const raw = inputEl.value.trim();
  if (!raw) return;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)){ inputEl.value = ''; return; }
  const clamped = Math.max(min, Math.min(max, Math.trunc(parsed)));
  inputEl.value = String(clamped);
}
