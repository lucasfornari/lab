/* ===========================================================
   HELPERS DE ITEM (personagem ou arma) — puro, sem DOM
   =========================================================== */
function isWeapon(item){ return item.type === 'weapon'; }
// Cópias necessárias: personagem C0–C6 = 1–7; arma R1–R5 = 1–5.
function itemCopies(item){ return isWeapon(item) ? (item.refinement || 1) : ((item.constellation || 0) + 1); }
function itemTierLabel(item){ return isWeapon(item) ? `R${item.refinement || 1}` : `C${item.constellation || 0}`; }
function itemBadgeColor(item){ return isWeapon(item) ? weaponTypeColor() : elementColor(item.element); }
function itemTagText(item){ return isWeapon(item) ? (item.weaponType || 'Arma') : (item.element || 'Elemento desconhecido'); }
function itemPlaceholderIcon(item){ return isWeapon(item) ? weaponTypeIcon(item.weaponType) : 'star'; }

// Existe pelo menos um item da lista do tipo pedido ('character' | 'weapon')?
function listHasType(type){ return characters.some(c => (type === 'weapon') === isWeapon(c)); }
