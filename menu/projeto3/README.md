# Planejador de Tiros — Genshin Impact

Aplicação web estática que ajuda a planejar tiros (wishes) no Genshin Impact: calcula quantas primogemas, fates e tiros você precisa para garantir os personagens desejados, levando em conta o pity (garantia), o soft/hard pity e o 50/50.

É uma ferramenta não-oficial, sem build e sem backend — tudo roda no navegador.

## Funcionalidades

- Cálculo de quantos tiros e primogemas são necessários para conseguir um ou mais personagens e armas 5★, com pity independente por banner.
- Suporte a constelações (C0–C6) e refinamentos de arma (R1–R5), tratando cada cópia como um novo ciclo de pity.
- Configuração do estado atual do jogador: pity acumulado, tiros guardados, garantia (50/50) e Fate Point (Caminho Epitomizado) — opcional, perguntado no momento certo se não for informado antes.
- Três cenários por plano: melhor caso, média esperada e pior caso.
- Busca/autocomplete de personagens e armas 5★ a partir de uma API pública, com escopo filtrável (personagens/armas/ambos).
- Cadastro manual de itens ainda não presentes na API.
- Reordenação da lista por arrastar-e-soltar.
- Tema claro/escuro.
- Persistência automática no navegador (`localStorage`) de todos os campos preenchidos e da lista.
- Exportar o plano como imagem PNG pronta para compartilhar.
- Instalável como PWA (ícone na tela inicial do celular, abre em janela própria, funciona offline após a primeira visita).

## Stack

Não há etapa de build, bundler, gerenciador de pacotes nem testes. O projeto é HTML, CSS e JavaScript puro servidos estaticamente. As dependências externas são todas carregadas via CDN em tempo de execução:

- **Tailwind CSS** (`cdn.tailwindcss.com`) — estilização utilitária, configurada inline em `tailwind.config`.
- **Lucide** (`unpkg.com/lucide`) — biblioteca de ícones. Após qualquer alteração no DOM que insira `<i data-lucide="...">`, é preciso chamar `lucide.createIcons()`.
- **SortableJS** — arrastar-e-soltar para reordenar a lista.
- **html2canvas** (carregado sob demanda, só no primeiro clique em "Exportar imagem") — rasteriza o card de compartilhamento em PNG.
- **Google Fonts** — fontes Quicksand e Fredoka.
- **genshin.jmp.blue** — API pública que fornece os catálogos de personagens e armas (apenas 5★ são usados).

O JavaScript é dividido em **scripts clássicos** (não ES modules) que compartilham o escopo global. A ordem de carregamento em `index.html` importa: `state.js` vem primeiro (define o estado e refs de DOM) e `main.js` por último (executa a inicialização).

## Estrutura de arquivos

```
.
├── index.html            markup, SEO e carregamento de CSS/scripts
├── styles/
│   └── main.css          CSS global (variáveis de tema, utilitários próprios)
├── js/                   carregados em ordem de dependência (state.js primeiro, main.js por último)
│   ├── state.js          estado global, refs de DOM (els), fmt, persistência (saveState/loadState)
│   ├── rules-engine.js   núcleo de cálculo de gacha (puro, sem DOM) — personagem e arma
│   ├── theme.js          alternância de tema claro/escuro
│   ├── api.js            catálogos de personagens/armas via API, cores de elemento/tipo, URLs de ícone
│   ├── item-helpers.js   helpers puros sobre um item (isWeapon, itemCopies, itemTierLabel, listHasType...)
│   ├── autocomplete.js   busca/autocomplete do campo de personagem/arma
│   ├── characters.js     add/remove/mover/constelação/refinamento (ações de mutação da lista)
│   ├── render-list.js    renderChars (inclui mostrar/esconder o bloco de pity de arma) e SortableJS
│   ├── planner.js        buildPlan, renderResult, updateTotalNow
│   ├── manual-modal.js   modal de cadastro manual
│   ├── pity-modal.js     modal de pity faltando
│   ├── rules-modal.js    modal de regras
│   ├── share-card.js     monta o card off-screen usado na exportação em PNG
│   ├── export.js         orquestra a exportação: html2canvas + recorte de cantos arredondados
│   ├── device.js         detecção de layout mobile x desktop
│   ├── validation.js     validação dos campos de pity/tiros guardados
│   ├── search-scope.js   toggle de escopo da busca (personagem/arma/ambos)
│   ├── analytics.js      integração com Google Analytics (GA4) — carregado no <head>
│   ├── main.js           listeners restantes e sequência de inicialização
│   └── sw-register.js    registra o service worker (sw.js)
├── manifest.webmanifest  metadados de PWA (nome, ícones, cores, display standalone)
├── sw.js                 service worker: cacheia o app shell para instalação/uso offline
├── robots.txt
├── sitemap.xml
└── CLAUDE.md             guia para uso com o Claude Code
```

## Arquitetura

O estado da aplicação vive em variáveis globais (`state.js`):

- `characters` — lista montada pelo usuário, mista entre personagens (`{..., constellation, type:'character'}`) e armas (`{..., refinement, type:'weapon'}`).
- `allChars` / `allWeapons` — catálogos 5★ carregados da API, usados pela busca/autocomplete.
- `searchScope` — escopo atual da busca (`'character' | 'weapon' | 'both'`), também persistido.

O fluxo é unidirecional e manual: ações do usuário mutam `characters`/inputs e então chamam sempre a tríade `renderChars()` → `renderResult()` → `saveState()`. Não há framework reativo; toda atualização de UI é re-renderização explícita de `innerHTML`.

A persistência é via `localStorage` (`genshinPlannerState` para pity/garantia/tiros/lista/escopo, `genshinPlannerTheme` para o tema). `loadState()`/`saveState()` são tolerantes a falha.

### Núcleo de cálculo

A lógica de probabilidade está em `rules-engine.js`, com um conjunto de funções para o banner de **personagem** (`fiveStar*`) e outro para o de **arma** (`weaponFiveStar*`, Caminho Epitomizado):

- `fiveStarRateAtPity` modela o soft pity linear (taxa base 0,6% até o tiro 73, subindo até 100% no hard pity 90); `weaponFiveStarRateAtPity` é o equivalente para arma (hard pity 80, soft pity ~63).
- `expectedWishesForFeatured(startPity, startGuaranteed)` combina a distribuição do primeiro 5★ com o custo de perder o 50/50 (`WIN_RATE = 0.55`, refletindo o Capturing Radiance); `expectedWishesForChartedWeapon` faz o mesmo para o Fate Point (`CHART_HIT_RATE = 0.375`).
- `buildPlan()` (em `planner.js`) orquestra o cálculo: itera por item e por cópia (C0–C6 = 1–7 cópias; R1–R5 = 1–5 cópias). Cada banner tem pity independente: só a primeira cópia do primeiro personagem usa o pity/garantia informados, e só a primeira cópia da primeira arma usa o pity/fate point de arma; as demais começam do zero.
- Custo: 1 tiro = 160 primogems (`PRIMOS_PER_WISH`).

## Como rodar

Abra `index.html` no navegador (`file://`) ou, preferencialmente, sirva estaticamente:

```bash
python3 -m http.server 8000   # depois acesse http://localhost:8000/
```

Servir via HTTP é preferível porque o app faz `fetch` à API externa e usa `localStorage`/clipboard, que funcionam melhor fora do protocolo `file://`.

## Convenções

- Toda a interface, comentários e textos voltados ao usuário estão em **português (pt-BR)** com acentuação correta.
- Temas são controlados pela classe `.dark` no `<html>` e por variáveis CSS (`--bg`, `--primary`, etc.) definidas em `:root` e `html.dark`. Use essas variáveis em vez de cores fixas.
- Personagens não encontrados na API recebem `id` com prefixo `manual-` e flag `manual: true`.
