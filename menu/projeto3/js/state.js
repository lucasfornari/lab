/* ===========================================================
   ESTADO + REFERÊNCIAS DE DOM
   =========================================================== */
let characters = []; // lista desejada (mista): personagens e armas
                     // personagem: {id, name, icon, element, constellation, type:'character'}
                     // arma:       {id, name, icon, weaponType, refinement, type:'weapon'}
let allChars = [];   // catálogo da API, apenas 5★: [{slug, name, icon, element}]
let allWeapons = []; // catálogo de armas 5★: [{slug, name, icon, weaponType}]
let searchScope = 'both'; // 'character' | 'weapon' | 'both' — escopo da busca

const els = {
  appShell: document.getElementById('appShell'),
  currentPity: document.getElementById('currentPity'),
  guaranteed: document.getElementById('guaranteed'),
  weaponPityBlock: document.getElementById('weaponPityBlock'),
  weaponPity: document.getElementById('weaponPity'),
  weaponGuaranteed: document.getElementById('weaponGuaranteed'),
  ownedWishes: document.getElementById('ownedWishes'),
  totalWishesNow: document.getElementById('totalWishesNow'),
  recalcBtn: document.getElementById('recalcBtn'),
  clearBtn: document.getElementById('clearBtn'),
  charInput: document.getElementById('charInput'),
  autocompleteBox: document.getElementById('autocompleteBox'),
  addChar: document.getElementById('addChar'),
  scopeToggle: document.getElementById('scopeToggle'),
  manualAddLabel: document.getElementById('manualAddLabel'),
  apiStatus: document.getElementById('apiStatus'),
  charListUI: document.getElementById('charListUI'),
  emptyHint: document.getElementById('emptyHint'),
  reorderHint: document.getElementById('reorderHint'),
  resultBody: document.getElementById('resultBody'),
  statsBar: document.getElementById('statsBar'),
  statChars: document.getElementById('statChars'),
  statCopies: document.getElementById('statCopies'),
  statWishes: document.getElementById('statWishes'),
  statPrimos: document.getElementById('statPrimos'),
  exportSection: document.getElementById('exportSection'),
  exportImgBtn: document.getElementById('exportImgBtn'),
};

function fmt(n) { return Math.round(n).toLocaleString('pt-BR'); }

/* ===========================================================
   PERSISTÊNCIA (localStorage)
   =========================================================== */
const STORAGE_KEY = 'genshinPlannerState';
function saveState(){
  try{
    const state = {
      currentPity: els.currentPity.value,
      guaranteed: els.guaranteed.checked,
      weaponPity: els.weaponPity.value,
      weaponGuaranteed: els.weaponGuaranteed.checked,
      ownedWishes: els.ownedWishes.value,
      characters,
      searchScope,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch(e){ /* localStorage indisponível — ignora silenciosamente */ }
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    if (state.currentPity !== undefined) els.currentPity.value = state.currentPity;
    if (state.guaranteed !== undefined) els.guaranteed.checked = !!state.guaranteed;
    if (state.weaponPity !== undefined) els.weaponPity.value = state.weaponPity;
    if (state.weaponGuaranteed !== undefined) els.weaponGuaranteed.checked = !!state.weaponGuaranteed;
    if (state.ownedWishes !== undefined) els.ownedWishes.value = state.ownedWishes;
    if (typeof state.searchScope === 'string') searchScope = state.searchScope;
    if (Array.isArray(state.characters)) characters = state.characters.map(c => {
      // Compatibilidade: itens antigos (sem `type`) são personagens.
      if (c.type === 'weapon') return { ...c, type: 'weapon', refinement: Math.min(5, Math.max(1, c.refinement || 1)) };
      return { ...c, type: 'character', constellation: c.constellation || 0 };
    });
  }catch(e){ /* estado corrompido — ignora */ }
}
