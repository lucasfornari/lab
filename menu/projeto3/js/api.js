/* ===========================================================
   API DE PERSONAGENS (genshin.jmp.blue) — apenas 5★
   =========================================================== */
const API_BASE = 'https://genshin.jmp.blue';

const ELEMENT_COLORS = {
  pyro:   { fg: '#c0392b', bg: 'rgba(192,57,43,0.14)' },
  hydro:  { fg: '#2563eb', bg: 'rgba(37,99,235,0.14)' },
  electro:{ fg: '#9333ea', bg: 'rgba(147,51,234,0.14)' },
  anemo:  { fg: '#0d9488', bg: 'rgba(13,148,136,0.14)' },
  cryo:   { fg: '#0891b2', bg: 'rgba(8,145,178,0.14)' },
  geo:    { fg: '#b45309', bg: 'rgba(180,83,9,0.14)' },
  dendro: { fg: '#16a34a', bg: 'rgba(22,163,74,0.14)' },
};
function elementColor(el){
  return ELEMENT_COLORS[(el||'').toLowerCase()] || { fg: 'var(--text-secondary)', bg: 'var(--surface-alt)' };
}

function iconUrl(slug) {
  return `${API_BASE}/characters/${slug}/icon-big`;
}

/* Armas: todas usam o mesmo realce âmbar (★5). O ícone do tipo
   (espada, arco, etc.) ajuda a diferenciar de personagens na UI. */
const WEAPON_TYPE_ICONS = {
  sword:    'sword',
  claymore: 'axe',
  polearm:  'tally-5',
  bow:      'crosshair',
  catalyst: 'sparkles',
};
function weaponTypeIcon(type) {
  return WEAPON_TYPE_ICONS[(type || '').toLowerCase()] || 'sword';
}
function weaponTypeColor() {
  return { fg: 'var(--amber)', bg: 'var(--amber-soft)' };
}

function weaponIconUrl(slug) {
  return `${API_BASE}/weapons/${slug}/icon`;
}

async function loadCatalog() {
  try {
    const res = await fetch(`${API_BASE}/characters/all?lang=en`);
    if (!res.ok) throw new Error('status ' + res.status);
    const data = await res.json(); // objeto { slug: {...} } ou array, conforme a API
    const list = Array.isArray(data) ? data : Object.values(data);
    allChars = list
      .filter(c => c && Number(c.rarity) === 5 && c.name)
      .map(c => ({
        slug: c.slug || (c.name || '').toLowerCase().replace(/\s+/g, '-'),
        name: c.name,
        element: c.vision || c.element || '',
        icon: iconUrl(c.slug || (c.name || '').toLowerCase().replace(/\s+/g, '-')),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    updateApiStatus();
  } catch (e) {
    els.apiStatus.innerHTML = '<span class="inline-flex items-center gap-1"><i data-lucide="triangle-alert" class="w-3.5 h-3.5"></i> Não foi possível carregar a lista de personagens — tente novamente mais tarde.</span>';
    lucide.createIcons();
  }
}

async function loadWeaponCatalog() {
  try {
    const res = await fetch(`${API_BASE}/weapons/all?lang=en`);
    if (!res.ok) throw new Error('status ' + res.status);
    const data = await res.json(); // array de objetos de arma
    const list = Array.isArray(data) ? data : Object.values(data);
    allWeapons = list
      .filter(w => w && Number(w.rarity) === 5 && w.name)
      .map(w => {
        const slug = w.id || w.slug || (w.name || '').toLowerCase().replace(/\s+/g, '-');
        return {
          slug,
          name: w.name,
          weaponType: w.type || '',
          icon: weaponIconUrl(slug),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    updateApiStatus();
  } catch (e) {
    // Catálogo de armas é opcional: mantém a busca de personagens funcionando.
    allWeapons = [];
    updateApiStatus();
  }
}

/* Mensagem de status combinando os dois catálogos. */
function updateApiStatus() {
  if (!allChars.length && !allWeapons.length) return;
  const parts = [];
  if (allChars.length)   parts.push(`${allChars.length} personagens`);
  if (allWeapons.length) parts.push(`${allWeapons.length} armas`);
  els.apiStatus.textContent = `${parts.join(' e ')} 5★ disponíveis para busca.`;
}
