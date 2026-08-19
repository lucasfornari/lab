/* ===========================================================
   CONSTANTES DE REGRAS (Genshin — banner de personagem)
   =========================================================== */
const PRIMOS_PER_WISH = 160;
const HARD_PITY = 90;
const SOFT_PITY_START = 74;
const WIN_RATE = 0.55;        // taxa efetiva de vencer o 50/50 (Capturing Radiance)

/* Distribuição de probabilidade por tiro (a partir de um pity inicial).
   Base 0.6% até o tiro 73; do 74 ao 90 a taxa sobe linearmente até 100%.
   Incremento exato = (1 - 0.006) / (HARD_PITY - 73) ≈ 5.85% por tiro,
   conforme o dataset comunitário de ~260 milhões de pulls (paimon.moe / KQM). */
const BASE_RATE = 0.006;
const SOFT_PITY_STEP = (1 - BASE_RATE) / (HARD_PITY - (SOFT_PITY_START - 1)); // ≈ 0.0585
function fiveStarRateAtPity(pity) {
  const n = pity + 1;
  if (n >= HARD_PITY) return 1.0;
  if (n < SOFT_PITY_START) return BASE_RATE;
  return Math.min(1.0, BASE_RATE + (n - (SOFT_PITY_START - 1)) * SOFT_PITY_STEP);
}

function fiveStarDistribution(startPity) {
  const dist = [];
  let survive = 1.0;
  let expected = 0;
  for (let pity = startPity; pity < HARD_PITY; pity++) {
    const rate = fiveStarRateAtPity(pity);
    const wishesUsed = (pity - startPity) + 1;
    const prob = survive * rate;
    if (prob > 1e-9) {
      dist.push({ wishesUsed, prob });
      expected += wishesUsed * prob;
    }
    survive *= (1 - rate);
    if (survive < 1e-9) break;
  }
  return { dist, expected };
}

function expectedWishesForFeatured(startPity, startGuaranteed) {
  const firstFive = fiveStarDistribution(startPity).expected;
  const nextFive = fiveStarDistribution(0).expected;
  if (startGuaranteed) return firstFive;
  return firstFive + (1 - WIN_RATE) * nextFive;
}

function worstCaseForFeatured(startPity, startGuaranteed) {
  const firstCycle = HARD_PITY - startPity;
  if (startGuaranteed) return firstCycle;
  return firstCycle + HARD_PITY;
}

function bestCaseForFeatured(startPity, startGuaranteed) {
  const toSoftPity = Math.max(1, SOFT_PITY_START - startPity);
  const expected = expectedWishesForFeatured(startPity, startGuaranteed);
  return Math.min(toSoftPity, Math.round(expected));
}

/* ===========================================================
   CONSTANTES DE REGRAS (Genshin — banner de ARMA)
   O banner de arma tem pity próprio e o "Caminho Epitomizado"
   (Fate Points) no lugar do 50/50:
   - Hard pity 80 (5★ garantido), soft pity a partir do tiro ~63.
   - Taxa base 0.7% (um pouco maior que a do banner de personagem).
   - Ao tirar um 5★, há 75% de ser uma das DUAS armas em destaque;
     logo, a chance de ser a SUA arma escolhida é 75% / 2 = 37.5%.
   - Você fixa um "rumo" (chart) na arma desejada. Cada 5★ que NÃO
     for a sua arma rende 1 Fate Point; ao atingir o necessário
     (1 ponto, regras atuais), o próximo 5★ é garantidamente a sua.
   =========================================================== */
const WEAPON_HARD_PITY = 80;
const WEAPON_SOFT_PITY_START = 63;
const WEAPON_BASE_RATE = 0.007;
const CHART_HIT_RATE = 0.375;          // chance de um 5★ ser a arma escolhida
const WEAPON_FATE_POINTS_NEEDED = 1;   // pontos para garantir via Caminho Epitomizado
const WEAPON_SOFT_PITY_STEP = (1 - WEAPON_BASE_RATE) / (WEAPON_HARD_PITY - (WEAPON_SOFT_PITY_START - 1));

function weaponFiveStarRateAtPity(pity) {
  const n = pity + 1;
  if (n >= WEAPON_HARD_PITY) return 1.0;
  if (n < WEAPON_SOFT_PITY_START) return WEAPON_BASE_RATE;
  return Math.min(1.0, WEAPON_BASE_RATE + (n - (WEAPON_SOFT_PITY_START - 1)) * WEAPON_SOFT_PITY_STEP);
}

function weaponFiveStarDistribution(startPity) {
  const dist = [];
  let survive = 1.0;
  let expected = 0;
  for (let pity = startPity; pity < WEAPON_HARD_PITY; pity++) {
    const rate = weaponFiveStarRateAtPity(pity);
    const wishesUsed = (pity - startPity) + 1;
    const prob = survive * rate;
    if (prob > 1e-9) {
      dist.push({ wishesUsed, prob });
      expected += wishesUsed * prob;
    }
    survive *= (1 - rate);
    if (survive < 1e-9) break;
  }
  return { dist, expected };
}

function expectedWishesForChartedWeapon(startPity, startFatePoints) {
  const firstFive = weaponFiveStarDistribution(startPity).expected;
  const nextFive = weaponFiveStarDistribution(0).expected;
  // Com 1 Fate Point necessário, basta um 5★ "errado" para garantir o próximo.
  if (startFatePoints >= WEAPON_FATE_POINTS_NEEDED) return firstFive;
  return firstFive + (1 - CHART_HIT_RATE) * nextFive;
}

function worstCaseForChartedWeapon(startPity, startFatePoints) {
  const firstCycle = WEAPON_HARD_PITY - startPity;
  if (startFatePoints >= WEAPON_FATE_POINTS_NEEDED) return firstCycle;
  return firstCycle + WEAPON_HARD_PITY;
}

function bestCaseForChartedWeapon(startPity, startFatePoints) {
  const toSoftPity = Math.max(1, WEAPON_SOFT_PITY_START - startPity);
  const expected = expectedWishesForChartedWeapon(startPity, startFatePoints);
  return Math.min(toSoftPity, Math.round(expected));
}
