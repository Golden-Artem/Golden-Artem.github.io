// === НАСТРОЙКА ПУТЕЙ К JSON ===
const files = {
  spells: 'data/spells.json',
  items: 'data/items.json',
  classes: 'data/classes.json',
  subclasses: 'data/subclasses.json',
  races: 'data/races.json',
  effects: 'data/effects.json'
};

let dataCache = {};
let currentTab = 'spells';

// === УНИВЕРСАЛЬНАЯ ЗАГРУЗКА JSON ===
async function loadFile(key) {
  if (dataCache[key]) return dataCache[key];
  try {
    const resp = await fetch(files[key]);
    if (!resp.ok) throw new Error(`Ошибка загрузки ${files[key]}: ${resp.status}`);
    const json = await resp.json();
    dataCache[key] = json;
    return json;
  } catch (err) {
    console.error(err);
    dataCache[key] = {};
    return {};
  }
}

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', async () => {
  // Навигация по вкладкам
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.type;
      await renderList();
    });
  });

  // Поиск
  document.getElementById('globalSearch').addEventListener('input', renderList);

  // Закрытие модального окна
  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
  });

  // Подгружаем все файлы при запуске
  await Promise.all(Object.keys(files).map(loadFile));

  console.log('✅ Все JSON файлы загружены', dataCache);
  await renderList();
});

// === ОТОБРАЖЕНИЕ СПИСКА ===
async function renderList() {
  await loadFile(currentTab);
  const obj = dataCache[currentTab] || {};
  const arr = Object.values(obj);
  const q = document.getElementById('globalSearch').value.trim().toLowerCase();
  const list = document.getElementById('list');
  list.innerHTML = '';

  const filtered = arr.filter(it => {
    if (!q) return true;
    return (
      (it.name || '').toLowerCase().includes(q) ||
      (it.tags || []).join(' ').toLowerCase().includes(q) ||
      (it.description || '').toLowerCase().includes(q)
    );
  });

  if (filtered.length === 0) {
    list.innerHTML = '<p style="grid-column:1/-1;color:#bbb">Ничего не найдено.</p>';
    return;
  }

  filtered.forEach(it => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${it.name}</h3>
      <div class="meta">${it.tags ? it.tags.join(', ') : ''}</div>
      <div style="margin-top:8px;color:#ccc;font-size:13px">${shortSummary(it)}</div>
    `;
    card.addEventListener('click', () => openModal(currentTab, it.id));
    list.appendChild(card);
  });
}

// === КОРОТКОЕ ОПИСАНИЕ ДЛЯ КАРТОЧКИ ===
function shortSummary(it) {
  switch (currentTab) {
    case 'spells':
      return `${it.level} уровень — ${it.school || ''} — ${it.classes ? it.classes.join(', ') : ''}`;
    case 'items':
      return `${it.type || ''} — ${it.rarity || ''}`;
    case 'classes':
      return `Класс — ${it.primary_ability ? it.primary_ability.join(', ') : ''}`;
    case 'races':
      return `Скорость: ${it.speed || '-'} клеток`;
    case 'effects':
      return `Тип: ${it.effect_type || ''}`;
    default:
      return '';
  }
}

// === ОТКРЫТИЕ МОДАЛКИ ===
async function openModal(type, id) {
  await loadFile(type);
  const item = dataCache[type][id];
  const modal = document.getElementById('modal');
  const content = document.getElementById('modalContent');

  if (!item) {
    content.innerHTML = '<p>Не найдено</p>';
  } else {
    let html = `<h2>${item.name}</h2>`;
    if (item.source) html += `<div style="color:#aaa;font-size:12px;">${item.source}</div>`;

    if (type === 'spells') {
      html += `
        <p><strong>Уровень:</strong> ${item.level} <strong>Школа:</strong> ${item.school || ''}<br/>
        <strong>Время накладывания:</strong> ${item.casting_time || ''} <strong>Дистанция:</strong> ${item.range || ''}</p>
      `;
    } else if (type === 'items') {
      html += `<p><strong>Тип:</strong> ${item.type || ''} <strong>Редкость:</strong> ${item.rarity || ''}</p>`;
    } else if (type === 'classes') {
      html += `<p><strong>Основная характеристика:</strong> ${item.primary_ability?.join(', ') || '-'}</p>`;
    } else if (type === 'races') {
      html += `<p><strong>Скорость:</strong> ${item.speed || '-'} клеток</p>`;
    }

    if (item.description) html += `<div>${item.description}</div>`;
    content.innerHTML = html;
  }

  modal.classList.remove('hidden');
}
