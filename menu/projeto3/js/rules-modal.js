/* ===========================================================
   MODAL DE REGRAS
   =========================================================== */
const rulesBtn = document.getElementById('rulesBtn');
const rulesModal = document.getElementById('rulesModal');
const rulesBackdrop = document.getElementById('rulesBackdrop');
const rulesCloseBtn = document.getElementById('rulesCloseBtn');

function openRulesModal(){
  rulesModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  rulesCloseBtn.focus();
}
function closeRulesModal(){
  rulesModal.classList.add('hidden');
  document.body.style.overflow = '';
  rulesBtn.focus();
}
rulesBtn.addEventListener('click', openRulesModal);
rulesCloseBtn.addEventListener('click', closeRulesModal);
rulesBackdrop.addEventListener('click', closeRulesModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !rulesModal.classList.contains('hidden')) closeRulesModal();
});
