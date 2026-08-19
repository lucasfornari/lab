# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral

Aplicação web estática — um planejador/calculadora de tiros (wishes) para Genshin Impact. Não há build, bundler, dependências instaladas localmente, testes nem ferramentas de lint. A estrutura é:

- `index.html` — markup e SEO. Carrega o CSS e os scripts (estes no fim do `<body>`, em ordem de dependência).
- `styles/main.css` — CSS global (variáveis de tema, classes utilitárias próprias).
- `js/*.js` — lógica dividida por funcionalidade (um arquivo por área da página).

## Como rodar

Abra `index.html` no navegador (`file://`) ou sirva estaticamente, por exemplo:

```bash
python3 -m http.server 8000   # depois acesse http://localhost:8000/
```

Servir via HTTP é preferível porque o app faz `fetch` à API externa e usa `localStorage`/clipboard, que funcionam melhor fora do protocolo `file://`.

## Organização do JavaScript

Os scripts são **scripts clássicos** (não ES modules) e compartilham o escopo global — funções e `const`/`let` de topo de um arquivo ficam visíveis nos demais. A ordem de carregamento em `index.html` importa: `state.js` vem primeiro porque define `els`, `characters`, `allChars`/`allWeapons` e `fmt`, que outros arquivos referenciam ao registrar listeners no carregamento; `main.js` vem por último porque executa a sequência de init. Handlers inline (`onclick="setConstellation(...)"`) dependem de essas funções serem declarações de função globais — mantenha-as assim.

Arquivos por responsabilidade, na ordem em que são carregados:

- `state.js` — estado global, refs de DOM (`els`), `fmt`, persistência (`saveState`/`loadState`).
- `rules-engine.js` — núcleo de cálculo de gacha (puro, sem DOM); cobre banner de personagem (50/50) e de arma (Caminho Epitomizado).
- `theme.js` — alternância de tema claro/escuro.
- `api.js` — catálogos de personagens e armas via API, cores de elemento/tipo de arma, URLs de ícone.
- `item-helpers.js` — helpers puros sobre um item da lista (`isWeapon`, `itemCopies`, `itemTierLabel`, `itemBadgeColor`, `itemTagText`, `itemPlaceholderIcon`, `listHasType`), usados por vários arquivos abaixo.
- `autocomplete.js` — busca/autocomplete do campo de personagem/arma.
- `characters.js` — ações de mutação da lista: add/remove/mover/constelação/refinamento.
- `render-list.js` — `renderChars()` (inclui mostrar/esconder o bloco de pity de arma conforme a lista) + `initSortable()` (SortableJS).
- `planner.js` — `buildPlan`, `renderResult`, `updateTotalNow`.
- `manual-modal.js` / `pity-modal.js` / `rules-modal.js` — os três modais (cadastro manual, pity faltando, regras).
- `share-card.js` — monta o card off-screen (`buildShareCard`) usado na exportação em PNG.
- `export.js` — orquestra a exportação: carrega o html2canvas sob demanda, rasteriza o card e recorta os cantos arredondados.
- `device.js` — detecção de layout mobile x desktop.
- `validation.js` — validação dos campos de pity/tiros guardados.
- `search-scope.js` — toggle de escopo da busca (personagem/arma/ambos).
- `main.js` — listeners restantes e sequência de inicialização.

## Dependências (todas via CDN, em runtime)

- **Tailwind CSS** (`cdn.tailwindcss.com`) — estilização utilitária, configurado inline em `tailwind.config`.
- **Lucide** (`unpkg.com/lucide`) — ícones. Após qualquer alteração no DOM que insira `<i data-lucide="...">`, é obrigatório chamar `lucide.createIcons()` para renderizar os ícones (esse padrão se repete em todas as funções de render).
- **SortableJS** — arrastar-e-soltar para reordenar a lista de personagens (`initSortable`).
- **genshin.jmp.blue** — API pública que fornece o catálogo de personagens (`API_BASE`). Só personagens 5★ (`rarity === 5`) são usados.

## Arquitetura

O estado da aplicação vive em variáveis globais (`state.js`):

- `characters` — lista que o usuário montou, mista entre personagens e armas (`{id, name, icon, element, constellation, type:'character', manual?}` ou `{id, name, icon, weaponType, refinement, type:'weapon', manual?}`).
- `allChars` / `allWeapons` — catálogos 5★ carregados da API, usados pela busca/autocomplete.
- `searchScope` — `'character' | 'weapon' | 'both'`, escopo atual da busca (persistido também).

O fluxo é unidirecional e manual: ações do usuário mutam `characters`/inputs e então sempre chamam a tríade `renderChars()` → `renderResult()` → `saveState()`. Não há framework reativo; toda atualização de UI é re-renderização explícita de `innerHTML`. Ao adicionar funcionalidade, siga esse mesmo padrão de chamar render + persistir.

Persistência é via `localStorage` (`STORAGE_KEY = 'genshinPlannerState'` para pity/garantia/tiros/lista/escopo; `'genshinPlannerTheme'` para tema claro/escuro). `loadState()`/`saveState()` são tolerantes a falha (try/catch silencioso).

### Núcleo de cálculo (regras de gacha)

`rules-engine.js` tem dois conjuntos paralelos de funções: um para o banner de **personagem** (`fiveStar*` / `*CaseForFeatured`) e um para o de **arma** (`weaponFiveStar*` / `*CaseForChartedWeapon`), com constantes próprias (hard/soft pity, taxa base). Pontos-chave ao modificar:

- `fiveStarRateAtPity` modela soft pity linear (taxa base 0.6% até o tiro 73, subindo até 100% no hard pity 90); `weaponFiveStarRateAtPity` é o equivalente para arma (hard pity 80, soft pity ~63).
- `expectedWishesForFeatured(startPity, startGuaranteed)` combina a distribuição do primeiro 5★ com o custo esperado de perder o 50/50 (`WIN_RATE = 0.55`, refletindo o Capturing Radiance); `expectedWishesForChartedWeapon` faz o mesmo para o Caminho Epitomizado (`CHART_HIT_RATE = 0.375`, `WEAPON_FATE_POINTS_NEEDED = 1`).
- `buildPlan()` (em `planner.js`) é o orquestrador: itera por item e por cópia (constelação C0–C6 = 1–7 cópias; refinamento R1–R5 = 1–5 cópias). Cada banner tem seu próprio pity: apenas a **primeira** cópia do **primeiro** personagem usa `startPity`/`startGuaranteed`, e apenas a **primeira** cópia da **primeira** arma usa `startWeaponPity`/`startWeaponFate`; todas as demais cópias do mesmo tipo começam do zero (controlado pelas flags `firstCharPullUsed`/`firstWeaponPullUsed`). Mantenha essa semântica ao alterar o cálculo.
- Constantes: 1 tiro = 160 primogems (`PRIMOS_PER_WISH`).

### Convenções

- Toda a interface, comentários e textos voltados ao usuário estão em **português (pt-BR)**, com acentuação correta. Mantenha esse idioma.
- Temas são controlados pela classe `.dark` no `<html>` e por variáveis CSS (`--bg`, `--primary`, etc.) definidas em `:root` e `html.dark`. Use essas variáveis em vez de cores fixas.
- Personagens não encontrados na API podem ser adicionados manualmente (modal "cadastro manual"), recebendo `id` com prefixo `manual-` e flag `manual: true`.
