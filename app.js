import { pack } from './packs/dm26ex4.js';

const BACKUP_VERSION = 4;
const LEGACY_STORAGE_KEY = `duema4con:${pack.id}:v1`;
const ACTIVE_CATEGORY_KEY = `duema4con:${pack.id}:active-category:v2`;
const INPUT_MODE_KEY = `duema4con:${pack.id}:input-mode:v3`;
const INPUT_MODES = new Set(['owned', 'planned', 'deck']);
const categoryMap = new Map(pack.categories.map(category => [category.id, category]));

const els = {
  eyebrow: document.querySelector('#eyebrow'),
  cardList: document.querySelector('#cardList'),
  missingList: document.querySelector('#missingList'),
  completionText: document.querySelector('#completionText'),
  completionLabel: document.querySelector('#completionLabel'),
  ownedSummary: document.querySelector('#ownedSummary'),
  missingSummary: document.querySelector('#missingSummary'),
  progressBar: document.querySelector('#progressBar'),
  missingBadge: document.querySelector('#missingBadge'),
  missingListSummary: document.querySelector('#missingListSummary'),
  checkView: document.querySelector('#checkView'),
  missingView: document.querySelector('#missingView'),
  navButtons: [...document.querySelectorAll('.nav-button')],
  filterButtons: [...document.querySelectorAll('[data-missing-filter]')],
  missingSegments: document.querySelector('#missingSegments'),
  incompleteFilterButton: document.querySelector('[data-missing-filter="incomplete"]'),
  zeroFilterButton: document.querySelector('[data-missing-filter="zero"]'),
  helperText: document.querySelector('#helperText'),
  checkIncompleteButton: document.querySelector('#checkIncompleteButton'),
  inputModeButton: document.querySelector('#inputModeButton'),
  inputModeButtonLabel: document.querySelector('#inputModeButtonLabel'),
  inputModeMenu: document.querySelector('#inputModeMenu'),
  inputModeOptions: [...document.querySelectorAll('[data-input-mode]')],
  appShell: document.querySelector('.app-shell'),
  moreButton: document.querySelector('#moreButton'),
  dataMenu: document.querySelector('#dataMenu'),
  categoryButtons: [...document.querySelectorAll('[data-category]')],
  exportButton: document.querySelector('#exportButton'),
  importInput: document.querySelector('#importInput'),
  imageDialog: document.querySelector('#imageDialog'),
  imageDialogImg: document.querySelector('#imageDialogImg'),
  imageDialogNo: document.querySelector('#imageDialogNo'),
  imageDialogTitle: document.querySelector('#imageDialogTitle'),
  imageDialogClose: document.querySelector('#imageDialogClose'),
  toast: document.querySelector('#toast'),
};

let activeCategoryId = loadActiveCategoryId();
let countsByCategory = Object.fromEntries(pack.categories.map(category => [category.id, loadCounts(category)]));
let plannedByCategory = Object.fromEntries(pack.categories.map(category => [category.id, loadPlanned(category)]));
let deckByCategory = Object.fromEntries(pack.categories.map(category => [category.id, loadDeck(category, countsByCategory[category.id])]));
let inputMode = loadInputMode();
let missingFilter = 'incomplete';
let toastTimer = 0;

function storageKey(categoryId) {
  return `duema4con:${pack.id}:${categoryId}:v2`;
}

function plannedStorageKey(categoryId) {
  return `duema4con:${pack.id}:${categoryId}:planned:v3`;
}

function deckStorageKey(categoryId) {
  return `duema4con:${pack.id}:${categoryId}:deck:v4`;
}

function loadInputMode() {
  const stored = localStorage.getItem(INPUT_MODE_KEY);
  return INPUT_MODES.has(stored) ? stored : 'owned';
}

function loadActiveCategoryId() {
  const stored = localStorage.getItem(ACTIVE_CATEGORY_KEY);
  return categoryMap.has(stored) ? stored : pack.defaultCategoryId;
}

function getCategory() {
  return categoryMap.get(activeCategoryId) || pack.categories[0];
}

function getCounts() {
  return countsByCategory[activeCategoryId];
}

function getPlanned() {
  return plannedByCategory[activeCategoryId];
}

function getDeck() {
  return deckByCategory[activeCategoryId];
}

function clampCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

function getStorageCount(ownedCount, deckCount) {
  const owned = clampCount(ownedCount);
  const deck = Math.min(clampCount(deckCount), owned);
  return Math.max(0, owned - deck);
}

function getPipStates(ownedCount, deckCount, plannedCount, target) {
  const owned = clampCount(ownedCount);
  const deck = Math.min(clampCount(deckCount), owned);
  const stored = owned - deck;
  const planned = clampCount(plannedCount);
  const targetCount = Math.max(1, clampCount(target));

  // バー本体は4コン目標分だけ表示する。5枚目以降の所持余剰はバーに増やさない。
  // ストレージ保管分を左から置き、4枚に足りない分だけデッキ使用分が右端から侵食する。
  const states = Array(targetCount).fill('empty');
  const storedVisible = Math.min(stored, targetCount);
  for (let index = 0; index < storedVisible; index += 1) {
    states[index] = 'owned';
  }

  const storageShortfall = Math.max(0, targetCount - storedVisible);
  const deckIntrusion = Math.min(deck, storageShortfall);
  for (let offset = 0; offset < deckIntrusion; offset += 1) {
    states[targetCount - 1 - offset] = 'deck';
  }

  // 注文予定だけは4コンバーの後ろへ青で追加表示する。
  for (let index = 0; index < planned; index += 1) {
    states.push('planned');
  }

  return states;
}

function emptyCounts(category) {
  return Object.fromEntries(category.cards.map(card => [card.id, 0]));
}

function normalizeCounts(category, raw, legacyNumberKeys = false) {
  return Object.fromEntries(category.cards.map(card => {
    const value = legacyNumberKeys ? raw?.[card.number] : raw?.[card.id];
    return [card.id, clampCount(value)];
  }));
}

function loadCounts(category) {
  try {
    const current = localStorage.getItem(storageKey(category.id));
    if (current !== null) return normalizeCounts(category, JSON.parse(current));

    // 旧保存形式がある場合は通常カテゴリだけ number キーから移行する。
    if (category.id === 'normal') {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy !== null) {
        const migrated = normalizeCounts(category, JSON.parse(legacy), true);
        localStorage.setItem(storageKey(category.id), JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch {
    // 壊れた保存データはこのカテゴリだけ0枚から復旧する。
  }
  return emptyCounts(category);
}

function loadPlanned(category) {
  try {
    const current = localStorage.getItem(plannedStorageKey(category.id));
    if (current !== null) return normalizeCounts(category, JSON.parse(current));
  } catch {
    // 壊れた注文予定データはこのカテゴリだけ0枚から復旧する。
  }
  return emptyCounts(category);
}

function normalizeDeckCounts(category, raw, ownedCounts) {
  return Object.fromEntries(category.cards.map(card => {
    const owned = clampCount(ownedCounts?.[card.id]);
    return [card.id, Math.min(clampCount(raw?.[card.id]), owned)];
  }));
}

function loadDeck(category, ownedCounts) {
  try {
    const current = localStorage.getItem(deckStorageKey(category.id));
    if (current !== null) return normalizeDeckCounts(category, JSON.parse(current), ownedCounts);
  } catch {
    // 壊れたデッキ使用データはこのカテゴリだけ0枚から復旧する。
  }
  return emptyCounts(category);
}

function saveCounts(categoryId = activeCategoryId) {
  localStorage.setItem(storageKey(categoryId), JSON.stringify(countsByCategory[categoryId]));
}

function savePlanned(categoryId = activeCategoryId) {
  localStorage.setItem(plannedStorageKey(categoryId), JSON.stringify(plannedByCategory[categoryId]));
}

function saveDeck(categoryId = activeCategoryId) {
  localStorage.setItem(deckStorageKey(categoryId), JSON.stringify(deckByCategory[categoryId]));
}

function saveAllData() {
  for (const category of pack.categories) {
    saveCounts(category.id);
    savePlanned(category.id);
    saveDeck(category.id);
  }
}

function increment(cardId) {
  const counts = getCounts();
  const planned = getPlanned();
  const deck = getDeck();

  if (inputMode === 'planned') {
    planned[cardId] = clampCount(planned[cardId]) + 1;
    savePlanned();
  } else if (inputMode === 'deck') {
    const ownedCount = clampCount(counts[cardId]);
    const deckCount = clampCount(deck[cardId]);
    if (deckCount >= ownedCount) {
      showToast('デッキ使用数は所持数を超えられません');
      return;
    }
    deck[cardId] = deckCount + 1;
    saveDeck();
  } else {
    counts[cardId] = clampCount(counts[cardId]) + 1;
    if (planned[cardId] > 0) planned[cardId] -= 1;
    saveCounts();
    savePlanned();
  }

  vibrate(8);
  updateCard(cardId);
  updateSummary();
  renderMissingList();
}

function decrement(cardId) {
  const counts = getCounts();
  const planned = getPlanned();
  const deck = getDeck();

  if (inputMode === 'planned') {
    if (planned[cardId] <= 0) return;
    planned[cardId] -= 1;
    savePlanned();
  } else if (inputMode === 'deck') {
    if (deck[cardId] <= 0) return;
    deck[cardId] -= 1;
    saveDeck();
  } else {
    if (counts[cardId] <= 0) return;
    counts[cardId] -= 1;
    if (deck[cardId] > counts[cardId]) {
      deck[cardId] = counts[cardId];
      saveDeck();
    }
    saveCounts();
  }

  vibrate(8);
  updateCard(cardId);
  updateSummary();
  renderMissingList();
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function cardImageMarkup(card, className = 'card-thumb') {
  const firstImage = card.imageUrls?.[0] || '';
  return `
    <button class="card-image-button" type="button" aria-label="${escapeAttribute(card.code)} ${escapeAttribute(card.name)} の画像を拡大">
      <span class="card-image-placeholder" aria-hidden="true">${escapeAttribute(card.displayNo)}</span>
      <img class="${className}" src="${escapeAttribute(firstImage)}" alt="" loading="lazy" decoding="async">
      <span class="card-image-number" aria-hidden="true">${escapeAttribute(card.displayNo)}</span>
    </button>`;
}

function wireImageButton(container, card) {
  const button = container.querySelector('.card-image-button');
  const image = button.querySelector('img');
  const urls = card.imageUrls || [];
  let imageIndex = 0;

  const markLoaded = () => {
    button.classList.add('loaded');
    button.classList.remove('image-error');
  };
  const tryNext = () => {
    imageIndex += 1;
    if (imageIndex < urls.length) {
      image.src = urls[imageIndex];
      return;
    }
    button.classList.add('image-error');
  };

  image.addEventListener('load', markLoaded);
  image.addEventListener('error', tryNext);
  if (image.complete && image.naturalWidth > 0) markLoaded();

  button.addEventListener('click', () => openImageDialog(card));
}

function renderCardList() {
  const category = getCategory();
  const target = category.targetCopies;
  const fragment = document.createDocumentFragment();

  for (const card of category.cards) {
    const row = document.createElement('article');
    row.className = 'card-row';
    row.dataset.cardId = card.id;
    row.innerHTML = `
      ${cardImageMarkup(card)}
      <div class="card-meta">
        <p class="card-name"></p>
        <div class="card-sub">
          <span class="rarity"></span>
          <span class="card-code"></span>
          <span class="pips" aria-hidden="true"></span>
        </div>
      </div>
      <div class="count-controls">
        <button class="minus-button" type="button" aria-label="1枚減らす">−</button>
        <button class="count-box" type="button" aria-label="所持数を1枚増やす">
          <span class="count-value owned-planned-value"><strong class="owned-count">0</strong><em class="planned-count"></em><span class="count-target">${category.mode === 'fourCon' ? `/${target}` : '枚'}</span></span>
          <span class="deck-count-value" hidden><span class="deck-main">使用 <strong class="deck-count">0</strong></span><small class="deck-sub">所持 0・空き 0</small></span>
        </button>
      </div>`;

    row.querySelector('.card-name').textContent = card.name;
    row.querySelector('.rarity').textContent = card.rarity;
    row.querySelector('.card-code').textContent = card.code;
    row.querySelector('.pips').innerHTML = '';
    wireImageButton(row, card);

    row.querySelector('.count-box').addEventListener('click', () => increment(card.id));
    row.querySelector('.minus-button').addEventListener('click', () => decrement(card.id));
    fragment.append(row);
  }

  els.cardList.replaceChildren(fragment);
  category.cards.forEach(card => updateCard(card.id));
}

function updateCard(cardId) {
  const category = getCategory();
  const target = category.targetCopies;
  const counts = getCounts();
  const planned = getPlanned();
  const deck = getDeck();
  const row = els.cardList.querySelector(`[data-card-id="${cardId}"]`);
  if (!row) return;

  const count = clampCount(counts[cardId]);
  const plannedCount = clampCount(planned[cardId]);
  const deckCount = Math.min(clampCount(deck[cardId]), count);
  if (deckCount !== deck[cardId]) {
    deck[cardId] = deckCount;
    saveDeck();
  }

  const storedCount = getStorageCount(count, deckCount);
  const complete = storedCount >= target;
  const totalComplete = count >= target;
  const isDeckMode = inputMode === 'deck';
  row.classList.toggle('complete', complete);
  row.classList.toggle('total-complete', totalComplete);
  row.classList.toggle('has-planned', plannedCount > 0);
  row.classList.toggle('has-deck', deckCount > 0);

  row.querySelector('.owned-count').textContent = String(count);
  const plannedEl = row.querySelector('.planned-count');
  plannedEl.textContent = plannedCount > 0 ? `+${plannedCount}` : '';
  plannedEl.hidden = plannedCount === 0;

  row.querySelector('.owned-planned-value').hidden = isDeckMode;
  const deckValue = row.querySelector('.deck-count-value');
  deckValue.hidden = !isDeckMode;
  row.querySelector('.deck-count').textContent = String(deckCount);
  row.querySelector('.deck-sub').textContent = `保管 ${storedCount}・総 ${count}`;

  const activeDecrementCount = inputMode === 'planned'
    ? plannedCount
    : inputMode === 'deck'
      ? deckCount
      : count;
  const minus = row.querySelector('.minus-button');
  minus.disabled = activeDecrementCount === 0;

  // バー本体は4コン目標分だけ。余剰所持は表示しない。
  // ストレージ保管分を左から、デッキ使用による不足分だけ右端からオレンジで侵食。
  // 注文予定は4コンバーの後ろへ青で追加する。
  const pipStates = getPipStates(count, deckCount, plannedCount, target);
  const pips = row.querySelector('.pips');
  if (pips.children.length !== pipStates.length) {
    pips.innerHTML = pipStates.map(() => '<i class="pip"></i>').join('');
  }
  [...pips.children].forEach((pip, index) => {
    const state = pipStates[index];
    pip.classList.toggle('owned', state === 'owned');
    pip.classList.toggle('deck', state === 'deck');
    pip.classList.toggle('planned', state === 'planned');
    pip.classList.toggle('target-edge', pipStates.length > target && index === target - 1);
  });

  const card = category.cards.find(item => item.id === cardId);
  const countBox = row.querySelector('.count-box');
  if (inputMode === 'planned') {
    countBox.setAttribute('aria-label', `${card?.name || ''} 総所持${count}枚、ストレージ${storedCount}枚、注文予定${plannedCount}枚。タップで注文予定を1枚増やす`);
    minus.setAttribute('aria-label', `${card?.name || ''} の注文予定を1枚減らす`);
  } else if (inputMode === 'deck') {
    countBox.setAttribute('aria-label', `${card?.name || ''} 総所持${count}枚、デッキ使用${deckCount}枚、ストレージ${storedCount}枚。タップでデッキ使用を1枚増やす`);
    minus.setAttribute('aria-label', `${card?.name || ''} のデッキ使用を1枚減らす`);
  } else {
    countBox.setAttribute('aria-label', `${card?.name || ''} 総所持${count}枚、ストレージ${storedCount}枚、注文予定${plannedCount}枚。タップで所持数を1枚増やす${plannedCount > 0 ? '。注文予定から1枚振り替えます' : ''}`);
    minus.setAttribute('aria-label', `${card?.name || ''} の所持数を1枚減らす`);
  }
}

function updateCategoryChrome() {
  const category = getCategory();
  const isFourCon = category.mode === 'fourCon';
  const modeLabels = { owned: '所持数', planned: '注文予定', deck: 'デッキ使用' };

  els.eyebrow.textContent = `${pack.code || pack.id.toUpperCase()} / ${category.label}`;
  els.completionLabel.textContent = isFourCon ? '4コン完成' : '所持済み';

  if (inputMode === 'planned') {
    els.helperText.innerHTML = '画像タップで拡大。<b>注文予定をタップで +1枚</b>。';
  } else if (inputMode === 'deck') {
    els.helperText.innerHTML = '画像タップで拡大。<b>デッキ使用をタップで +1枚</b>。橙はデッキ中。';
  } else {
    els.helperText.innerHTML = '画像タップで拡大。<b>所持数をタップで +1枚</b>。';
  }

  els.checkIncompleteButton.textContent = isFourCon ? '未完成へ' : '未所持へ';
  els.inputModeButtonLabel.textContent = modeLabels[inputMode];
  els.inputModeButton.classList.toggle('planned-active', inputMode === 'planned');
  els.inputModeButton.classList.toggle('deck-active', inputMode === 'deck');
  els.inputModeButton.setAttribute('aria-label', `入力モード：${modeLabels[inputMode]}。タップして変更`);
  els.appShell.classList.toggle('planned-mode', inputMode === 'planned');
  els.appShell.classList.toggle('deck-mode', inputMode === 'deck');

  for (const option of els.inputModeOptions) {
    const active = option.dataset.inputMode === inputMode;
    option.classList.toggle('active', active);
    option.setAttribute('aria-checked', String(active));
  }

  els.incompleteFilterButton.textContent = isFourCon ? '4コン不足' : '未所持';
  els.zeroFilterButton.hidden = !isFourCon;
  els.missingSegments.classList.toggle('single', !isFourCon);

  for (const button of els.categoryButtons) {
    const active = button.dataset.category === category.id;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
}

function updateSummary() {
  const category = getCategory();
  const target = category.targetCopies;
  const counts = getCounts();
  const deck = getDeck();
  const storedValues = category.cards.map(card => getStorageCount(counts[card.id], deck[card.id]));
  const completed = storedValues.filter(count => count >= target).length;
  const creditedCopies = storedValues.reduce((sum, count) => sum + Math.min(count, target), 0);
  const totalCredited = category.cards.length * target;
  const missingCopies = totalCredited - creditedCopies;
  const incomplete = category.cards.length - completed;

  els.completionText.textContent = `${completed} / ${category.cards.length}`;
  els.progressBar.style.width = `${category.cards.length ? (completed / category.cards.length) * 100 : 0}%`;

  if (category.mode === 'fourCon') {
    els.ownedSummary.innerHTML = `ストレージ <b>${creditedCopies}</b> / ${totalCredited}`;
    els.missingSummary.innerHTML = `不足 <b>${missingCopies}</b>枚`;
  } else {
    els.ownedSummary.innerHTML = `ストレージ所持 <b>${completed}</b> / ${category.cards.length}`;
    els.missingSummary.innerHTML = `未保管 <b>${incomplete}</b>種`;
  }

  els.missingBadge.textContent = String(incomplete);
  els.missingBadge.hidden = incomplete === 0;
}

function renderMissingList() {
  const category = getCategory();
  const target = category.targetCopies;
  const counts = getCounts();
  const planned = getPlanned();
  const deck = getDeck();
  const isFourCon = category.mode === 'fourCon';

  if (!isFourCon) missingFilter = 'incomplete';

  const cards = category.cards.filter(card => {
    const storedCount = getStorageCount(counts[card.id], deck[card.id]);
    if (isFourCon && missingFilter === 'zero') return storedCount === 0;
    return storedCount < target;
  });

  if (isFourCon) {
    const missingCopies = cards.reduce((sum, card) => {
      const storedCount = getStorageCount(counts[card.id], deck[card.id]);
      return sum + (target - storedCount);
    }, 0);
    els.missingListSummary.textContent = missingFilter === 'zero'
      ? `ストレージ0枚 ${cards.length}種`
      : `未完成 ${cards.length}種 / あと ${missingCopies}枚`;
  } else {
    els.missingListSummary.textContent = `未保管 ${cards.length}種 / 全${category.cards.length}種`;
  }

  if (cards.length === 0) {
    const title = isFourCon
      ? (missingFilter === 'zero' ? 'ストレージ0枚のカードはありません' : '4コン完成！')
      : `${category.shortLabel} コンプ！`;
    const text = isFourCon
      ? (missingFilter === 'zero' ? '全種類が専用ストレージに1枚以上あります。' : `${category.label}が専用ストレージにすべて${target}枚そろっています。`)
      : `${category.label}が専用ストレージにすべて1枚以上あります。`;
    els.missingList.innerHTML = `<div class="empty-state"><strong>${escapeAttribute(title)}</strong>${escapeAttribute(text)}</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const card of cards) {
    const row = document.createElement('article');
    row.className = 'missing-row';
    const count = clampCount(counts[card.id]);
    const deckCount = Math.min(clampCount(deck[card.id]), count);
    const storedCount = getStorageCount(count, deckCount);
    const plannedCount = clampCount(planned[card.id]);
    row.innerHTML = `
      ${cardImageMarkup(card, 'missing-thumb')}
      <div class="card-meta">
        <p class="card-name"></p>
        <div class="card-sub">
          <span class="rarity"></span>
          <span class="card-code"></span>
          <span>保管 ${storedCount}${isFourCon ? `/${target}` : '枚'}・総 ${count}${deckCount > 0 ? `・<b class="deck-inline">デッキ${deckCount}</b>` : ''}${plannedCount > 0 ? `・<b class="planned-inline">注文+${plannedCount}</b>` : ''}</span>
        </div>
      </div>
      <div class="need-count">${isFourCon ? `あと ${target - storedCount}` : '未保管'}</div>`;
    row.querySelector('.card-name').textContent = card.name;
    row.querySelector('.rarity').textContent = card.rarity;
    row.querySelector('.card-code').textContent = card.code;
    wireImageButton(row, card);
    fragment.append(row);
  }
  els.missingList.replaceChildren(fragment);
}

function openImageDialog(card) {
  const urls = card.imageUrls || [];
  let index = 0;

  els.imageDialogNo.textContent = `${pack.code || pack.id.toUpperCase()} ${card.code} ・ ${card.rarity}`;
  els.imageDialogTitle.textContent = card.name;
  els.imageDialogImg.alt = `${card.name} のカード画像`;
  els.imageDialogImg.onerror = () => {
    index += 1;
    if (index < urls.length) {
      els.imageDialogImg.src = urls[index];
    } else {
      els.imageDialogImg.onerror = null;
    }
  };
  els.imageDialogImg.src = urls[0] || '';

  if (typeof els.imageDialog.showModal === 'function') {
    els.imageDialog.showModal();
  } else if (urls[0]) {
    window.open(urls[0], '_blank', 'noopener');
  }
}

function closeImageDialog() {
  els.imageDialogImg.onerror = null;
  if (els.imageDialog.open) els.imageDialog.close();
}

function openInputModeMenu() {
  els.inputModeMenu.hidden = false;
  els.inputModeButton.setAttribute('aria-expanded', 'true');
}

function closeInputModeMenu() {
  els.inputModeMenu.hidden = true;
  els.inputModeButton.setAttribute('aria-expanded', 'false');
}

function setInputMode(mode) {
  if (!INPUT_MODES.has(mode)) return;
  inputMode = mode;
  localStorage.setItem(INPUT_MODE_KEY, inputMode);
  updateCategoryChrome();
  getCategory().cards.forEach(card => updateCard(card.id));
  closeInputModeMenu();
  const labels = { owned: '所持数', planned: '注文予定', deck: 'デッキ使用' };
  showToast(`${labels[inputMode]}モードに切り替えました`);
}

function switchView(view) {
  const showCheck = view === 'check';
  els.checkView.hidden = !showCheck;
  els.missingView.hidden = showCheck;
  for (const button of els.navButtons) {
    const active = button.dataset.view === view;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  if (!showCheck) renderMissingList();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function switchCategory(categoryId) {
  closeInputModeMenu();
  if (!categoryMap.has(categoryId) || categoryId === activeCategoryId) {
    closeDataMenu();
    return;
  }

  activeCategoryId = categoryId;
  localStorage.setItem(ACTIVE_CATEGORY_KEY, activeCategoryId);
  missingFilter = 'incomplete';
  els.filterButtons.forEach(button => button.classList.toggle('active', button.dataset.missingFilter === 'incomplete'));
  updateCategoryChrome();
  renderCardList();
  updateSummary();
  renderMissingList();
  closeDataMenu();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function closeDataMenu() {
  closeInputModeMenu();
  els.dataMenu.hidden = true;
  els.moreButton.setAttribute('aria-expanded', 'false');
}

function exportBackup() {
  const data = {
    app: 'duema-4con-checker',
    version: BACKUP_VERSION,
    packId: pack.id,
    exportedAt: new Date().toISOString(),
    activeCategoryId,
    inputMode,
    countsByCategory,
    plannedByCategory,
    deckByCategory,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${pack.id}-checker-backup.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast('全カテゴリをバックアップしました');
}

async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data?.app !== 'duema-4con-checker' || data?.packId !== pack.id) throw new Error('format');

    if (data.version >= 2 && data.countsByCategory) {
      for (const category of pack.categories) {
        countsByCategory[category.id] = normalizeCounts(category, data.countsByCategory[category.id] || {});
        plannedByCategory[category.id] = data.version >= 3
          ? normalizeCounts(category, data.plannedByCategory?.[category.id] || {})
          : emptyCounts(category);
        deckByCategory[category.id] = data.version >= 4
          ? normalizeDeckCounts(category, data.deckByCategory?.[category.id] || {}, countsByCategory[category.id])
          : emptyCounts(category);
      }
      if (categoryMap.has(data.activeCategoryId)) activeCategoryId = data.activeCategoryId;
      if (INPUT_MODES.has(data.inputMode)) inputMode = data.inputMode;
    } else if (data.counts) {
      // 旧バックアップは通常カテゴリだけ復元し、追加レアリティには触れない。
      const normal = categoryMap.get('normal');
      countsByCategory.normal = normalizeCounts(normal, data.counts, true);
      plannedByCategory.normal = emptyCounts(normal);
      deckByCategory.normal = emptyCounts(normal);
    } else {
      throw new Error('format');
    }

    saveAllData();
    localStorage.setItem(ACTIVE_CATEGORY_KEY, activeCategoryId);
    localStorage.setItem(INPUT_MODE_KEY, inputMode);
    missingFilter = 'incomplete';
    updateCategoryChrome();
    renderCardList();
    updateSummary();
    renderMissingList();
    showToast('バックアップを読み込みました');
  } catch {
    showToast('このバックアップは読み込めません');
  } finally {
    els.importInput.value = '';
  }
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add('show');
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 1800);
}

function vibrate(ms) {
  if ('vibrate' in navigator) navigator.vibrate(ms);
}

els.navButtons.forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
els.filterButtons.forEach(button => button.addEventListener('click', () => {
  if (button.hidden) return;
  missingFilter = button.dataset.missingFilter;
  els.filterButtons.forEach(item => item.classList.toggle('active', item === button));
  renderMissingList();
}));

els.inputModeButton.addEventListener('click', event => {
  event.stopPropagation();
  if (els.inputModeMenu.hidden) openInputModeMenu();
  else closeInputModeMenu();
});
els.inputModeOptions.forEach(option => option.addEventListener('click', event => {
  event.stopPropagation();
  setInputMode(option.dataset.inputMode);
}));
document.addEventListener('click', event => {
  if (!event.target.closest('.mode-picker')) closeInputModeMenu();
});

els.checkIncompleteButton.addEventListener('click', () => {
  const category = getCategory();
  const counts = getCounts();
  const deck = getDeck();
  const first = category.cards.find(card => getStorageCount(counts[card.id], deck[card.id]) < category.targetCopies);
  if (!first) {
    showToast(category.mode === 'fourCon' ? `全${category.cards.length}種が4コン完成しています` : `${category.label}はコンプリート済みです`);
    return;
  }
  els.cardList.querySelector(`[data-card-id="${first.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

els.moreButton.addEventListener('click', () => {
  const opening = els.dataMenu.hidden;
  els.dataMenu.hidden = !opening;
  els.moreButton.setAttribute('aria-expanded', String(opening));
});
els.categoryButtons.forEach(button => button.addEventListener('click', () => switchCategory(button.dataset.category)));
els.exportButton.addEventListener('click', exportBackup);
els.importInput.addEventListener('change', () => {
  const [file] = els.importInput.files;
  if (file) importBackup(file);
});

els.imageDialogClose.addEventListener('click', closeImageDialog);
els.imageDialog.addEventListener('click', event => {
  if (event.target === els.imageDialog) closeImageDialog();
});

updateCategoryChrome();
renderCardList();
updateSummary();
renderMissingList();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
