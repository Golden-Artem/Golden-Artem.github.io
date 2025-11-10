const files = {
  spells: '/data/spells.json',
  items: '/data/items.json',
  classes: '/data/classes.json',
  subclasses: '/data/subclasses.json',
  races: '/data/races.json',
  effects: '/data/effects.json'
};

let dataCache = {};

async function loadJSON(file) {
  const res = await fetch(file);
  if (!res.ok) return [];
  return await res.json();
}

async function loadAllData() {
  dataCache.classes = await loadJSON(files.classes);
  dataCache.subclasses = await loadJSON(files.subclasses);
  dataCache.races = await loadJSON(files.races);
  dataCache.spells = await loadJSON(files.spells);

  populateSelect('classSelect', dataCache.classes);
  populateSelect('subclassSelect', dataCache.subclasses);
  populateSelect('raceSelect', dataCache.races);
}

function populateSelect(id, arr) {
  const el = document.getElementById(id);
  el.innerHTML = `<option value="">— выберите —</option>`;
  arr.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.name;
    opt.textContent = e.name;
    el.appendChild(opt);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadAllData();

  document.getElementById('saveJSON').onclick = saveSheet;
  document.getElementById('loadJSON').onclick = loadSheet;
  document.getElementById('clearSheet').onclick = clearSheet;
});

function saveSheet() {
  const data = {
    name: document.getElementById('charName').value,
    class: document.getElementById('classSelect').value,
    subclass: document.getElementById('subclassSelect').value,
    race: document.getElementById('raceSelect').value,
    level: document.getElementById('level').value,
    armorClass: document.getElementById('armorClass').value,
    initiative: document.getElementById('initiative').value,
    speed: document.getElementById('speed').value,
    hp: document.getElementById('hp').value,
    inventory: document.getElementById('inventory').value,
    money: {
      cp: document.getElementById('cp').value,
      sp: document.getElementById('sp').value,
      gp: document.getElementById('gp').value,
      pp: document.getElementById('pp').value,
      ep: document.getElementById('ep').value
    }
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${data.name || 'character'}.json`;
  a.click();
}

function loadSheet() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const data = JSON.parse(reader.result);
      document.getElementById('charName').value = data.name || '';
      document.getElementById('classSelect').value = data.class || '';
      document.getElementById('subclassSelect').value = data.subclass || '';
      document.getElementById('raceSelect').value = data.race || '';
      document.getElementById('level').value = data.level || 1;
      document.getElementById('armorClass').value = data.armorClass || 10;
      document.getElementById('initiative').value = data.initiative || 0;
      document.getElementById('speed').value = data.speed || 9;
      document.getElementById('hp').value = data.hp || 10;
      document.getElementById('inventory').value = data.inventory || '';
      const money = data.money || {};
      for (let k of ['cp','sp','gp','pp','ep'])
        document.getElementById(k).value = money[k] || 0;
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearSheet() {
  document.querySelectorAll('input, textarea, select').forEach(el => {
    if (el.type === 'number') el.value = 0;
    else el.value = '';
  });
}
