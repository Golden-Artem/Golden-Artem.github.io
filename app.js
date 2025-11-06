const files = {
  spells: '/data/spells.json',
  items: '/data/items.json',
  classes: '/data/classes.json',
  subclasses: '/data/subclasses.json',
  races: '/data/races.json',
  effects: '/data/effects.json'
};

let dataCache = {};
let currentTab = 'spells';

document.addEventListener('DOMContentLoaded', async () => {
  // навигация табов
  document.querySelectorAll('.tab').forEach(btn=>{
    btn.addEventListener('click', async (e)=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.type;
      await renderList();
    });
  });

  document.getElementById('globalSearch').addEventListener('input', renderList);
  document.getElementById('closeModal').addEventListener('click', ()=>{ document.getElementById('modal').classList.add('hidden'); });

  // предварительно подгружаем несколько основных файлов (ленивый режим можно расширить)
  await loadFile('spells');
  await loadFile('items');
  await loadFile('classes');
  await loadFile('subclasses');
  await loadFile('races');
  await loadFile('effects');

  await renderList();
});

async function loadFile(key){
  if(dataCache[key]) return dataCache[key];
  try {
    const resp = await fetch(files[key]);
    if(!resp.ok) {
      console.warn('Не удалось загрузить', files[key]);
      dataCache[key] = {};
      return {};
    }
    const json = await resp.json();
    dataCache[key] = json;
    return json;
  } catch (err){
    console.error('Ошибка fetch', err);
    dataCache[key] = {};
    return {};
  }
}

async function renderList(){
  await loadFile(currentTab);
  const obj = dataCache[currentTab] || {};
  const arr = Object.values(obj);
  const q = document.getElementById('globalSearch').value.trim().toLowerCase();
  const list = document.getElementById('list');
  list.innerHTML = '';

  const filtered = arr.filter(it=>{
    if(!q) return true;
    const inName = (it.name || '').toLowerCase().includes(q);
    const inTags = (it.tags||[]).join(' ').toLowerCase().includes(q);
    const inDesc = (it.description||'').toLowerCase().includes(q);
    return inName || inTags || inDesc;
  });

  if(filtered.length === 0){
    list.innerHTML = '<p style="grid-column:1/-1;color:#bbb">Ничего не найдено.</p>';
    return;
  }

  filtered.forEach(it=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3>${it.name}</h3><div class="meta">${it.tags ? it.tags.join(', ') : ''}</div><div style="margin-top:8px;color:#ccc;font-size:13px">${shortSummary(it)}</div>`;
    card.addEventListener('click', ()=> openModal(currentTab, it.id));
    list.appendChild(card);
  });
}

function shortSummary(it){
  if(currentTab === 'spells') return `${it.level} уровень — ${it.school || ''} — ${it.classes ? it.classes.join(', ') : ''}`;
  if(currentTab === 'items') return `${it.type || ''} — ${it.rarity || ''}`;
  if(currentTab === 'classes') return `Класс — ${it.primary_ability ? it.primary_ability.join(', ') : ''}`;
  if(currentTab === 'races') return `Скорость: ${it.speed || '-'} клеток`;
  return '';
}

async function openModal(type, id){
  await loadFile(type);
  const item = dataCache[type][id];
  if(!item){
    document.getElementById('modalContent').innerHTML = '<p>Не найдено</p>';
  } else {
    // Собираем HTML
    let html = `<h2>${item.name}</h2>`;
    if(item.source) html += `<div style="color:#aaa;font-size:12px;">${item.source}</div>`;
    if(type === 'spells'){
      html += `<p><strong>Уровень:</strong> ${item.level} <strong>Школа:</strong> ${item.school||''}<br/><strong>Время накладывания:</strong> ${item.casting_time||''} <strong>Дистанция:</strong> ${item.range||''}</p>`;
    } else if (type === 'items'){
      html += `<p><strong>Тип:</strong> ${item.type || ''} <strong>Редкость:</strong> ${item.rarity || ''}</p>`;
    }
    if(item.description) html += `<div>${item.description}</div>`;
    document.getElementById('modalContent').innerHTML = html;
  }
  document.getElementById('modal').classList.remove('hidden');
}

