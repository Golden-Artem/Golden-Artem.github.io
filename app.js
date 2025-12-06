// app.js — подключается в dndlist.html

/* -------------------------
   Конфигурация: пути к JSON
-------------------------*/
const DATA_PATH = './data/';
const files = {
  spells: `${DATA_PATH}spells.json`,
  items: `${DATA_PATH}items.json`,
  classes: `${DATA_PATH}classes.json`,
  subclasses: `${DATA_PATH}subclasses.json`,
  races: `${DATA_PATH}races.json`,
  effects: `${DATA_PATH}effects.json`
};

/* -------------------------
   Данные (будут загружены)
-------------------------*/
let spells = [];
let items = [];
let classes = [];
let subclasses = {}; // { classId: [subclass,...] }
let races = [];
let effects = [];
let skills = [
  {id:'acrobatics', name:'Акробатика'},
  {id:'arcana', name:'Аркана'},
  {id:'athletics', name:'Атлетика'},
  {id:'deception', name:'Обман'},
  {id:'history', name:'История'},
  {id:'insight', name:'Проницательность'},
  {id:'intimidation', name:'Запугивание'},
  {id:'investigation', name:'Исследование'},
  {id:'medicine', name:'Медицина'},
  {id:'nature', name:'Природа'},
  {id:'perception', name:'Восприятие'},
  {id:'performance', name:'Исполнение'},
  {id:'persuasion', name:'Убеждение'},
  {id:'sleight', name:'Ловкость рук'},
  {id:'stealth', name:'Скрытность'},
  {id:'survival', name:'Выживание'}
];

/* -------------------------
   Состояние приложения/персонажа
-------------------------*/
const state = {
  character: {
    name: '',
    classId: '',
    subclassId: '',
    level: 1,
    race: '',
    stats: {STR:10,DEX:10,CON:10,INT:10,WIS:10,CHA:10},
    hp: 0,
    ac: 10,
    init: 0,
    spells: [],
    items: [],
    effects: [],
    skills: [],
    money: {cp:0, sp:0, gp:0, pp:0},
    avatarDataUrl: null,
    background: '',
    customFeature: ''
  },
  drawing: false
};

/* -------------------------
   DOM refs
-------------------------*/
const refs = {
  classSelect: document.getElementById('classSelect'),
  subclassSelect: document.getElementById('subclassSelect'),
  raceSelect: document.getElementById('raceSelect'),
  classSideSelect: document.getElementById('classSideSelect'),
  subclassSideSelect: document.getElementById('subclassSideSelect'),
  raceSideSelect: document.getElementById('raceSideSelect'),

  saveJsonBtn: document.getElementById('saveJsonBtn'),
  loadJson: document.getElementById('loadJson'),
  clearBtn: document.getElementById('clearBtn'),
  toggleThemeBtn: document.getElementById('toggleTheme'),
  autoFill: document.getElementById('autoFill'),
  itemInput: document.getElementById('itemInput'),
  addItemBtn: document.getElementById('addItemBtn'),
  itemList: document.getElementById('itemList'),

  spellSearch: document.getElementById('spellSearch'),
  spellSearchBtn: document.getElementById('spellSearchBtn'),
  spellResults: document.getElementById('spellResults'),
  chosenSpells: document.getElementById('chosenSpells'),

  effectSearch: document.getElementById('effectSearch'),
  effectSearchBtn: document.getElementById('effectSearchBtn'),
  effectResults: document.getElementById('effectResults'),
  chosenEffects: document.getElementById('chosenEffects'),

  skillSearch: document.getElementById('skillSearch'),
  skillAddBtn: document.getElementById('skillAddBtn'),
  skillResults: document.getElementById('skillResults'),

  classesList: document.getElementById('classesList'),
  racesList: document.getElementById('racesList'),
  itemsList: document.getElementById('itemsList'),
  effectsList: document.getElementById('effectsList'),

  logConsole: document.getElementById('logConsole'),
  quickJsonPreview: document.getElementById('quickJsonPreview'),

  charName: document.getElementById('charName'),
  level: document.getElementById('level'),
  background: document.getElementById('background'),
  customFeature: document.getElementById('customFeature'),
  currentHP: document.getElementById('currentHP'),
  ac: document.getElementById('ac'),
  init: document.getElementById('init'),
  shortNote: document.getElementById('shortNote'),
  longNote: document.getElementById('longNote'),

  money_cp: document.getElementById('money_cp'),
  money_sp: document.getElementById('money_sp'),
  money_gp: document.getElementById('money_gp'),
  money_pp: document.getElementById('money_pp'),

  avatarCanvas: document.getElementById('avatarCanvas'),
  avatarFile: document.getElementById('avatarFile'),
  drawModeBtn: document.getElementById('drawModeBtn'),
  clearAvatarBtn: document.getElementById('clearAvatarBtn'),
  downloadAvatarBtn: document.getElementById('downloadAvatarBtn'),
  brushSize: document.getElementById('brushSize'),
  brushColor: document.getElementById('brushColor'),

  diceBtns: document.querySelectorAll('.diceBtn'),
  diceResult: document.getElementById('diceResult'),

  modal: document.getElementById('modal'),
  modalClose: document.getElementById('modalClose'),
  modalTitle: document.getElementById('modalTitle'),
  modalBody: document.getElementById('modalBody'),

  statsBlock: document.getElementById('statsBlock'),
  itemListNode: document.getElementById('itemList')
};

/* -------------------------
   Утилиты
-------------------------*/
function log(txt){
  const el = document.createElement('div'); el.textContent = `[${new Date().toLocaleTimeString()}] ${txt}`;
  refs.logConsole.prepend(el);
}
function download(filename, text){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type:'application/json'}));
  a.download = filename; a.click();
}
function openModal(title, html){
  refs.modalTitle.textContent = title;
  refs.modalBody.innerHTML = html;
  refs.modal.classList.add('active');
}
function closeModal(){ refs.modal.classList.remove('active'); }

/* -------------------------
   Загрузка JSON файлов
-------------------------*/
async function loadJSON(path){
  try{
    const r = await fetch(path);
    if(!r.ok){ log(`Не удалось загрузить ${path}: ${r.status}`); return null; }
    return await r.json();
  }catch(e){ log(`Ошибка загрузки ${path}: ${e}`); return null; }
}

async function loadAllData(){
  // параллельно
  const proms = await Promise.all([
    loadJSON(files.classes),
    loadJSON(files.subclasses),
    loadJSON(files.races),
    loadJSON(files.spells),
    loadJSON(files.items),
    loadJSON(files.effects)
  ]);
  if(proms[0]) classes = proms[0];
  if(proms[1]) subclasses = proms[1]; // ожидаем объект: {classId: [ ... ]}
  if(proms[2]) races = proms[2];
  if(proms[3]) spells = proms[3];
  if(proms[4]) items = proms[4];
  if(proms[5]) effects = proms[5];

  log('Данные загружены из файлов (если они есть).');
  renderClassOptions();
  renderRaceOptions();
  renderIndexLists();
  renderSpellSearchResults(spells);
  renderEffectSearchResults(effects);
}

/* -------------------------
   Рендеры UI
-------------------------*/
function renderClassOptions(){
  refs.classSelect.innerHTML = '<option value="">—</option>';
  refs.classSideSelect.innerHTML = '<option value="">—</option>';
  classes.forEach(c=>{
    const o = document.createElement('option'); o.value=c.id; o.textContent=c.name; refs.classSelect.appendChild(o);
    const o2 = o.cloneNode(true); refs.classSideSelect.appendChild(o2);
  });
  renderSubclassOptions();
}
function renderSubclassOptions(){
  // выбираем значение из активного селекта (основного или бокового)
  const cls = refs.classSelect.value || refs.classSideSelect.value;
  refs.subclassSelect.innerHTML = '<option value="">—</option>';
  refs.subclassSideSelect.innerHTML = '<option value="">—</option>';
  if(!cls) return;
  const list = subclasses[cls] || [];
  list.forEach(s=>{
    const o = document.createElement('option'); o.value = s.id; o.textContent = s.name; refs.subclassSelect.appendChild(o);
    const o2 = o.cloneNode(true); refs.subclassSideSelect.appendChild(o2);
  });
}
function renderRaceOptions(){
  refs.raceSelect.innerHTML = '<option value="">—</option>';
  refs.raceSideSelect.innerHTML = '<option value="">—</option>';
  races.forEach(r=>{
    const o = document.createElement('option'); o.value=r.id; o.textContent=r.name; refs.raceSelect.appendChild(o);
    const o2 = o.cloneNode(true); refs.raceSideSelect.appendChild(o2);
  });
}

function renderStatBlocks(){
  const stats = ['STR','DEX','CON','INT','WIS','CHA'];
  refs.statsBlock.innerHTML = '';
  stats.forEach(s=>{
    const val = state.character.stats[s] ?? 10;
    const div = document.createElement('div');
    div.className = 'stat';
    // value input + label; модификатор добавляется отдельно
    div.innerHTML = `<div class="val"><input data-stat="${s}" class="statInput" value="${val}"></div><div class="label">${s}</div>`;
    refs.statsBlock.appendChild(div);
  });

  // навесим обработчики на инпуты и создадим элементы модификаторов под каждой характеристикой
  document.querySelectorAll('.stat').forEach(statBlock => {
    const input = statBlock.querySelector('.statInput');
    // создаём/находим div.mod
    let modEl = statBlock.querySelector('.mod');
    if (!modEl) {
      modEl = document.createElement('div');
      modEl.className = 'mod';
      modEl.style.fontSize = '12px';
      modEl.style.marginTop = '4px';
      modEl.style.color = 'var(--muted)';
      statBlock.appendChild(modEl);
    }

    function updateFromInput(e){
      const st = input.dataset.stat;
      const v = parseInt(input.value) || 0;
      state.character.stats[st] = v;
      // обновляем отображение модификатора
      const mod = Math.floor((v - 10) / 2);
      modEl.textContent = (mod >= 0 ? `+${mod}` : `${mod}`);
      syncQuickPreview();
    }

    // инициалный расчёт
    updateFromInput();

    // слушатель
    input.addEventListener('input', updateFromInput);
  });
}

function renderIndexLists(){
  refs.classesList.innerHTML=''; classes.forEach(c=>{
    const d=document.createElement('div'); d.className='item';
    d.innerHTML = `<div>${c.name}</div><div class="meta"><button data-class="${c.id}" class="inspectClass">i</button></div>`;
    refs.classesList.appendChild(d);
  });
  refs.racesList.innerHTML=''; races.forEach(r=>{
    const d=document.createElement('div'); d.className='item';
    d.innerHTML = `<div>${r.name}</div><div class="meta"><button data-race="${r.id}" class="inspectRace">i</button></div>`;
    refs.racesList.appendChild(d);
  });
  refs.itemsList.innerHTML=''; items.forEach(it=>{
    const d=document.createElement('div'); d.className='item';
    d.innerHTML = `<div>${it.name}</div><div class="meta"><button data-item="${it.id}" class="inspectItem">i</button></div>`;
    refs.itemsList.appendChild(d);
  });
  refs.effectsList.innerHTML=''; effects.forEach(it=>{
    const d=document.createElement('div'); d.className='item';
    d.innerHTML = `<div>${it.name}</div><div class="meta"><button data-effect="${it.id}" class="inspectEffect">i</button></div>`;
    refs.effectsList.appendChild(d);
  });
}

/* chosen lists */
function renderChosenItems(){
  refs.itemList.innerHTML='';
  state.character.items.forEach((it, idx)=>{
    const div=document.createElement('div'); div.className='item';
    div.innerHTML = `<div>${it}</div><div class="meta"><button data-idx="${idx}" class="removeItem">×</button></div>`;
    refs.itemList.appendChild(div);
  });
  document.querySelectorAll('.removeItem').forEach(b=>b.onclick=(e)=>{ const i=+e.target.dataset.idx; state.character.items.splice(i,1); renderChosenItems(); syncQuickPreview(); });
}
function renderChosenSpells(){
  refs.chosenSpells.innerHTML='';
  state.character.spells.forEach((s, idx)=>{
    const div=document.createElement('div'); div.className='item';
    div.innerHTML = `<div>${s.name} (ур. ${s.level})</div><div class="meta"><button data-idx="${idx}" class="spellInfo">i</button><button data-idx="${idx}" class="removeSpell">×</button></div>`;
    refs.chosenSpells.appendChild(div);
  });
  document.querySelectorAll('.removeSpell').forEach(b=>b.onclick=(e)=>{ const i=+e.target.dataset.idx; state.character.spells.splice(i,1); renderChosenSpells(); syncQuickPreview(); });
  document.querySelectorAll('.spellInfo').forEach(b=>b.onclick=(e)=>{ const i=+e.target.dataset.idx; const sp=state.character.spells[i]; openModal(sp.name, `<strong>Школа:</strong> ${sp.school||'-'}<br><strong>Уровень:</strong> ${sp.level}<hr>${sp.description}`) });
}
function renderChosenEffects(){
  refs.chosenEffects.innerHTML='';
  state.character.effects.forEach((ef, idx)=>{
    const div=document.createElement('div'); div.className='item';
    div.innerHTML=`<div>${ef.name}</div><div class="meta"><button data-idx="${idx}" class="effectInfo">i</button><button data-idx="${idx}" class="removeEffect">×</button></div>`;
    refs.chosenEffects.appendChild(div);
  });
  document.querySelectorAll('.removeEffect').forEach(b=>b.onclick=(e)=>{ const i=+e.target.dataset.idx; state.character.effects.splice(i,1); renderChosenEffects(); syncQuickPreview(); });
  document.querySelectorAll('.effectInfo').forEach(b=>b.onclick=(e)=>{ const i=+e.target.dataset.idx; const sp=state.character.effects[i]; openModal(sp.name, `${sp.descr||''}`) });
}
function renderSkillResults(list){
  refs.skillResults.innerHTML='';
  list.forEach(s=>{
    const el=document.createElement('div'); el.className='item';
    el.innerHTML=`<div>${s.name}</div><div class="meta"><button data-skill="${s.id}" class="addSkill">Добавить</button></div>`;
    refs.skillResults.appendChild(el);
  });
  document.querySelectorAll('.addSkill').forEach(b=>b.onclick=(e)=>{ const id=e.target.dataset.skill; const sk=skills.find(x=>x.id===id); if(!sk) return; if(!state.character.skills.some(x=>x.id===id)) state.character.skills.push(sk); renderSkillList(); syncQuickPreview(); });
}
function renderSkillList(){
  const node=document.getElementById('skillResults');
  let html='';
  state.character.skills.forEach((s,idx)=> html += `<div class="item"><div>${s.name}</div><div class="meta"><button data-idx="${idx}" class="removeSkill">×</button></div></div>`);
  node.innerHTML = html || '<div class="muted-note">Нет навыков</div>';
  document.querySelectorAll('.removeSkill').forEach(b=>b.onclick=(e)=>{ const i=+e.target.dataset.idx; state.character.skills.splice(i,1); renderSkillList(); syncQuickPreview(); });
}
function renderSpellSearchResults(list){
  refs.spellResults.innerHTML='';
  (list||[]).forEach(s=>{
    const row=document.createElement('div'); row.className='item';
    row.innerHTML = `<div><strong>${s.name}</strong><div style="font-size:12px;color:var(--muted)">${s.school||''} • уровень ${s.level}</div></div>
      <div class="meta"><label><input type="checkbox" data-spell="${s.id}" ${state.character.spells.some(x=>x.id===s.id)?'checked':''}/> Добавить</label>
      <button data-spell="${s.id}" class="inspectSpell">i</button></div>`;
    refs.spellResults.appendChild(row);
  });
  document.querySelectorAll('input[type="checkbox"][data-spell]').forEach(cb=>{
    cb.onchange = (e)=>{
      const id = e.target.dataset.spell;
      const sp = spells.find(x=>x.id===id);
      if(!sp) return;
      if(e.target.checked){
        if(!state.character.spells.some(x=>x.id===id)) state.character.spells.push(sp);
      } else {
        state.character.spells = state.character.spells.filter(x=>x.id!==id);
      }
      renderChosenSpells(); syncQuickPreview();
    };
  });
  document.querySelectorAll('.inspectSpell').forEach(b=>b.onclick=(e)=>{ const id=e.target.dataset.spell; const sp=spells.find(x=>x.id===id); if(sp) openModal(sp.name, `<strong>Школа:</strong> ${sp.school||'-'}<br><strong>Уровень:</strong> ${sp.level}<hr>${sp.description}`) });
}
function renderEffectSearchResults(list){
  refs.effectResults.innerHTML='';
  (list||[]).forEach(s=>{
    const row=document.createElement('div'); row.className='item';
    row.innerHTML = `<div><strong>${s.name}</strong><div style="font-size:12px;color:var(--muted)">${s.descr? s.descr.slice(0,60)+'…':''}</div></div>
      <div class="meta"><label><input type="checkbox" data-effect="${s.id}" ${state.character.effects.some(x=>x.id===s.id)?'checked':''}/> Добавить</label><button data-effect="${s.id}" class="inspectEffectBtn">i</button></div>`;
    refs.effectResults.appendChild(row);
  });
  document.querySelectorAll('input[type="checkbox"][data-effect]').forEach(cb=>{
    cb.onchange = (e)=>{
      const id = e.target.dataset.effect;
      const ef = effects.find(x=>x.id===id);
      if(!ef) return;
      if(e.target.checked){
        if(!state.character.effects.some(x=>x.id===id)) state.character.effects.push(ef);
      } else {
        state.character.effects = state.character.effects.filter(x=>x.id!==id);
      }
      renderChosenEffects(); syncQuickPreview();
    };
  });
  document.querySelectorAll('.inspectEffectBtn').forEach(b=>b.onclick=(e)=>{ const id=e.target.dataset.effect; const sp=effects.find(x=>x.id===id); if(sp) openModal(sp.name, `${sp.descr||''}`) });
}

/* quick preview */
function syncQuickPreview(){
  const s = state.character;
  refs.quickJsonPreview.textContent = `${s.name || '—'} • ${s.classId||''}${s.subclassId?'/'+s.subclassId:''} • ${s.race||''}`;
  refs.classSideSelect.value = s.classId;
  refs.subclassSideSelect.value = s.subclassId;
  refs.raceSideSelect.value = s.race;

  // money inputs
  refs.money_cp.value = s.money.cp || 0;
  refs.money_sp.value = s.money.sp || 0;
  refs.money_gp.value = s.money.gp || 0;
  refs.money_pp.value = s.money.pp || 0;

  // main inputs
  refs.charName.value = s.name || '';
  refs.level.value = s.level || 1;
  refs.currentHP.value = s.hp || 0;
  refs.ac.value = s.ac || 10;
  refs.init.value = s.init || 0;

  // background / custom feature visible in inputs
  refs.background.value = s.background || '';
  refs.customFeature.value = s.customFeature || '';

  // notes are stored separately in export object; if present in state.character we don't override notes (syncQuickPreview is not authoritative for notes)
}

/* -------------------------
   События UI
-------------------------*/
document.addEventListener('DOMContentLoaded', async ()=>{
  await loadAllData();

  renderStatBlocks();
  renderIndexLists();
  renderSkillResults(skills.slice(0,10));
  renderSpellSearchResults(spells);
  renderEffectSearchResults(effects);
  renderChosenSpells();
  renderChosenEffects();
  renderSkillList();
  renderChosenItems();
  syncQuickPreview();
  log('Интерфейс готов.');

  // навешиваем многие обработчики
  refs.saveJsonBtn.onclick = ()=> saveCharacterToFile();
  refs.loadJson.onchange = (e)=> loadCharacterFromFile(e);
  refs.clearBtn.onclick = ()=> clearSheet();

  refs.addItemBtn.onclick = ()=> {
    const v = refs.itemInput.value.trim();
    if(!v) return;
    state.character.items.push(v); refs.itemInput.value=''; renderChosenItems(); syncQuickPreview();
  };

  refs.spellSearchBtn.onclick = ()=> {
    const q = refs.spellSearch.value.trim().toLowerCase();
    const res = spells.filter(s => s.name.toLowerCase().includes(q) || (s.description||'').toLowerCase().includes(q));
    renderSpellSearchResults(res);
  };

  refs.effectSearchBtn.onclick = ()=> {
    const q = refs.effectSearch.value.trim().toLowerCase();
    const res = effects.filter(s => s.name.toLowerCase().includes(q) || (s.descr||'').toLowerCase().includes(q));
    renderEffectSearchResults(res);
  };

  refs.skillAddBtn.onclick = ()=> {
    const q = refs.skillSearch.value.trim().toLowerCase();
    const res = skills.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    renderSkillResults(res.length?res:skills.slice(0,10));
  };

  // class/subclass/race wiring
  refs.classSelect.onchange = (e)=>{
    state.character.classId = e.target.value;
    refs.classSideSelect.value = e.target.value;
    renderSubclassOptions(); syncQuickPreview();
    autoFillClassStats();
  };
  refs.classSideSelect.onchange = (e)=>{
    state.character.classId = e.target.value;
    refs.classSelect.value = e.target.value; renderSubclassOptions(); syncQuickPreview(); autoFillClassStats();
  };
  refs.subclassSelect.onchange = (e)=>{ state.character.subclassId = e.target.value; refs.subclassSideSelect.value = e.target.value; syncQuickPreview(); };
  refs.subclassSideSelect.onchange = (e)=>{ state.character.subclassId = e.target.value; refs.subclassSelect.value = e.target.value; syncQuickPreview(); };

  refs.raceSelect.onchange = (e)=>{ state.character.race = e.target.value; refs.raceSideSelect.value = e.target.value; syncQuickPreview(); };
  refs.raceSideSelect.onchange = (e)=>{ state.character.race = e.target.value; refs.raceSelect.value = e.target.value; syncQuickPreview(); };

  refs.charName.addEventListener('input', (e)=>{ state.character.name = e.target.value; syncQuickPreview(); });
  refs.level.addEventListener('input', (e)=>{ state.character.level = parseInt(e.target.value)||1; syncQuickPreview(); });
  refs.currentHP.addEventListener('input', (e)=>{ state.character.hp = parseInt(e.target.value)||0; syncQuickPreview(); });
  refs.ac.addEventListener('input', (e)=>{ state.character.ac = e.target.value; syncQuickPreview(); });
  refs.init.addEventListener('input', (e)=>{ state.character.init = e.target.value; syncQuickPreview(); });
  document.getElementById('shortNote').addEventListener('input', ()=> syncQuickPreview());
  document.getElementById('longNote').addEventListener('input', ()=> syncQuickPreview());

  // money inputs
  refs.money_cp.addEventListener('input', ()=> { state.character.money.cp = parseInt(refs.money_cp.value)||0; syncQuickPreview(); });
  refs.money_sp.addEventListener('input', ()=> { state.character.money.sp = parseInt(refs.money_sp.value)||0; syncQuickPreview(); });
  refs.money_gp.addEventListener('input', ()=> { state.character.money.gp = parseInt(refs.money_gp.value)||0; syncQuickPreview(); });
  refs.money_pp.addEventListener('input', ()=> { state.character.money.pp = parseInt(refs.money_pp.value)||0; syncQuickPreview(); });

  // theme toggle (фикс светлой темы)
  if(refs.toggleThemeBtn){
    refs.toggleThemeBtn.onclick = ()=>{
      document.documentElement.classList.toggle('light');
      const isLight = document.documentElement.classList.contains('light');
      refs.toggleThemeBtn.textContent = isLight ? 'Светлая тема' : 'Тёмная тема';
      log('Тема: ' + (isLight ? 'светлая' : 'тёмная'));
    };
    // ставим подпись корректно
    refs.toggleThemeBtn.textContent = document.documentElement.classList.contains('light') ? 'Светлая тема' : 'Тёмная тема';
  }

  // inspect buttons in side lists (делегирование)
  document.body.addEventListener('click', (e)=>{
    if(e.target.matches('.inspectClass')){
      const id=e.target.dataset.class; const c=classes.find(x=>x.id===id); if(c) openModal(c.name, c.description || '');
    } else if(e.target.matches('.inspectRace')){
      const id=e.target.dataset.race; const c=races.find(x=>x.id===id); if(c) openModal(c.name, c.desc || '');
    } else if(e.target.matches('.inspectItem')){
      const id=e.target.dataset.item; const c=items.find(x=>x.id===id); if(c) openModal(c.name, c.descr || '');
    } else if(e.target.matches('.inspectEffect')){
      const id=e.target.dataset.effect; const c=effects.find(x=>x.id===id); if(c) openModal(c.name, c.descr || '');
    }
  });

  refs.modalClose.onclick = closeModal;
  refs.modal.onclick = (e)=>{ if(e.target===refs.modal) closeModal(); };

  // dice
  refs.diceBtns.forEach(btn=>{
    btn.onclick = ()=>{ const sides = +btn.dataset.sides; const val = 1 + Math.floor(Math.random()*sides); refs.diceResult.textContent = `d${sides} → ${val}`; log(`Бросок ${sides}: ${val}`); };
  });

  /* avatar drawing & upload */
  const ctx = refs.avatarCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  let drawing=false, last=null, brush = +refs.brushSize.value, color = refs.brushColor.value;
  function clearAvatar(){ ctx.clearRect(0,0,refs.avatarCanvas.width, refs.avatarCanvas.height); state.character.avatarDataUrl = null; log('Аватар очищен'); }
  clearAvatar();

  refs.avatarFile.onchange = (e)=>{
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ev=>{
      const img = new Image();
      img.onload = ()=>{ ctx.clearRect(0,0,refs.avatarCanvas.width, refs.avatarCanvas.height); const ratio = Math.min(refs.avatarCanvas.width/img.width, refs.avatarCanvas.height/img.height); const w = img.width*ratio, h=img.height*ratio; ctx.drawImage(img, (refs.avatarCanvas.width-w)/2, (refs.avatarCanvas.height-h)/2, w,h); state.character.avatarDataUrl = refs.avatarCanvas.toDataURL(); };
      img.src = ev.target.result;
    };
    r.readAsDataURL(f); e.target.value='';
  };

  refs.drawModeBtn.onclick = ()=>{
    state.drawing = !state.drawing;
    refs.drawModeBtn.textContent = state.drawing ? 'Рисование: ВКЛ' : 'Рисовать';
    log('Режим рисования: ' + (state.drawing?'вкл':'выкл'));
  };
  refs.clearAvatarBtn.onclick = clearAvatar;
  refs.downloadAvatarBtn.onclick = ()=>{ const data=refs.avatarCanvas.toDataURL('image/png'); const a=document.createElement('a'); a.href=data; a.download='avatar.png'; a.click(); };

  refs.brushSize.oninput = ()=> brush = +refs.brushSize.value;
  refs.brushColor.oninput = ()=> color = refs.brushColor.value;

  function getCanvasPos(e){
    const rect=refs.avatarCanvas.getBoundingClientRect();
    if(e.touches && e.touches[0]) {
      return {x:(e.touches[0].clientX-rect.left)*(refs.avatarCanvas.width/rect.width), y:(e.touches[0].clientY-rect.top)*(refs.avatarCanvas.height/rect.height)};
    }
    return {x:(e.clientX-rect.left)*(refs.avatarCanvas.width/rect.width), y:(e.clientY-rect.top)*(refs.avatarCanvas.height/rect.height)};
  }

  refs.avatarCanvas.addEventListener('pointerdown', (e)=>{
    if(!state.drawing) return;
    drawing=true; last = getCanvasPos(e);
    ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.strokeStyle=color; ctx.lineWidth=brush;
    ctx.beginPath(); ctx.moveTo(last.x,last.y);
    e.preventDefault();
  });
  refs.avatarCanvas.addEventListener('pointermove', (e)=>{
    if(!drawing || !state.drawing) return;
    const p = getCanvasPos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); last=p;
  });
  window.addEventListener('pointerup', ()=>{ if(drawing) { drawing=false; ctx.closePath(); state.character.avatarDataUrl = refs.avatarCanvas.toDataURL(); } });
  refs.avatarCanvas.addEventListener('touchstart', e=>{ if(state.drawing) e.preventDefault(); }, {passive:false});

  // quick actions log buttons (help debug)
  document.querySelectorAll('button').forEach(b=>b.addEventListener('click', ()=>log('Нажата кнопка: '+(b.textContent||b.id))));
});

/* -------------------------
   Save / Load character
-------------------------*/
function saveCharacterToFile(){
  // собираем всё содержимое формы
  state.character.name = refs.charName.value || '';
  state.character.level = parseInt(refs.level.value) || 1;
  state.character.hp = parseInt(refs.currentHP.value) || 0;
  state.character.ac = refs.ac.value || 10;
  state.character.init = refs.init.value || 0;

  // класс / подкласс / раса
  state.character.classId = refs.classSelect.value;
  state.character.subclassId = refs.subclassSelect.value;
  state.character.race = refs.raceSelect.value;

  // фон и архетип
  state.character.background = refs.background.value || '';
  state.character.customFeature = refs.customFeature.value || '';

  // характеристики
  document.querySelectorAll('.statInput').forEach(inp=>{
    const st = inp.dataset.stat;
    state.character.stats[st] = parseInt(inp.value)||0;
  });

  // деньги
  state.character.money = {
    cp: parseInt(refs.money_cp.value)||0,
    sp: parseInt(refs.money_sp.value)||0,
    gp: parseInt(refs.money_gp.value)||0,
    pp: parseInt(refs.money_pp.value)||0
  };

  // заметки
  const shortNote = document.getElementById('shortNote').value;
  const longNote = document.getElementById('longNote').value;

  // аватар
  try { state.character.avatarDataUrl = refs.avatarCanvas.toDataURL(); } catch(e){}

  const exportObj = {
    meta: { version: 'v2', created: new Date().toISOString() },
    character: state.character,
    notes: { short: shortNote, long: longNote }
  };

  download('character.json', JSON.stringify(exportObj, null, 2));
  log('Сохранено в JSON.');
}

function loadCharacterFromFile(e){
  const f = e.target.files[0];
  if(!f) return;
  const r = new FileReader();
  r.onload = ev=>{
    try{
      const obj = JSON.parse(ev.target.result);
      if(!obj.character) return alert('Неверный формат файла!');

      state.character = Object.assign({}, state.character, obj.character);

      // восстанавливаем поля
      refs.charName.value = state.character.name || '';
      refs.level.value = state.character.level || 1;
      refs.currentHP.value = state.character.hp || 0;
      refs.ac.value = state.character.ac || 10;
      refs.init.value = state.character.init || 0;

      refs.background.value = state.character.background || '';
      refs.customFeature.value = state.character.customFeature || '';

      // класс / подкласс / раса (и боковые селекты)
      refs.classSelect.value = state.character.classId || '';
      refs.classSideSelect.value = state.character.classId || '';
      renderSubclassOptions(); // важно: сначала отрисовать подклассы
      refs.subclassSelect.value = state.character.subclassId || '';
      refs.subclassSideSelect.value = state.character.subclassId || '';
      refs.raceSelect.value = state.character.race || '';
      refs.raceSideSelect.value = state.character.race || '';

      // характеристики
      renderStatBlocks();
      for(const [k,v] of Object.entries(state.character.stats||{})){
        const el = document.querySelector(`.statInput[data-stat="${k}"]`);
        if(el) el.value = v;
      }

      // деньги
      refs.money_cp.value = state.character.money?.cp || 0;
      refs.money_sp.value = state.character.money?.sp || 0;
      refs.money_gp.value = state.character.money?.gp || 0;
      refs.money_pp.value = state.character.money?.pp || 0;

      // заметки
      if(obj.notes){
        document.getElementById('shortNote').value = obj.notes.short || '';
        document.getElementById('longNote').value = obj.notes.long || '';
      } else {
        document.getElementById('shortNote').value = '';
        document.getElementById('longNote').value = '';
      }

      // аватар
      if(state.character.avatarDataUrl){
        const img = new Image();
        img.onload = ()=>{
          const ctx = refs.avatarCanvas.getContext('2d');
          ctx.clearRect(0,0,refs.avatarCanvas.width,refs.avatarCanvas.height);
          const ratio = Math.min(refs.avatarCanvas.width/img.width, refs.avatarCanvas.height/img.height);
          const w = img.width*ratio, h = img.height*ratio;
          ctx.drawImage(img,(refs.avatarCanvas.width-w)/2,(refs.avatarCanvas.height-h)/2,w,h);
        };
        img.src = state.character.avatarDataUrl;
      } else {
        // если нет аватара — очистим холст
        const ctx = refs.avatarCanvas.getContext('2d'); ctx.clearRect(0,0,refs.avatarCanvas.width, refs.avatarCanvas.height);
      }

      renderChosenItems();
      renderChosenSpells();
      renderChosenEffects();
      renderSkillList();
      syncQuickPreview();
      log('Файл загружен.');
    }catch(err){
      alert('Ошибка чтения JSON: '+err.message);
    }
  };
  r.readAsText(f);
  e.target.value = '';
}

/* -------------------------
   Clear sheet
-------------------------*/
function clearSheet(){
  if(!confirm('Очистить лист персонажа?')) return;
  state.character = {
    name:'',
    classId:'',
    subclassId:'',
    level:1,
    race:'',
    stats:{STR:10,DEX:10,CON:10,INT:10,WIS:10,CHA:10},
    hp:0, ac:10, init:0,
    spells:[], items:[], effects:[], skills:[],
    money: {cp:0,sp:0,gp:0,pp:0},
    avatarDataUrl: null,
    background: '',
    customFeature: ''
  };
  document.getElementById('charName').value='';
  document.getElementById('shortNote').value='';
  document.getElementById('longNote').value='';
  document.getElementById('background').value='';
  document.getElementById('customFeature').value='';
  renderStatBlocks(); renderChosenSpells(); renderChosenEffects(); renderChosenItems(); renderSkillList(); syncQuickPreview();
  // clear avatar canvas
  const ctx = refs.avatarCanvas.getContext('2d'); ctx.clearRect(0,0,refs.avatarCanvas.width, refs.avatarCanvas.height);
  log('Лист очищен.');
}

/* -------------------------
   Small helper: autofill stats for classes
-------------------------*/
function autoFillClassStats(){
  if(!document.getElementById('autoFill').checked) return;
  const cid = refs.classSelect.value;
  if(cid === 'fighter'){
    state.character.stats = {STR:16,DEX:12,CON:14,INT:8,WIS:10,CHA:10};
  } else if(cid === 'wizard'){
    state.character.stats = {STR:8,DEX:12,CON:12,INT:16,WIS:10,CHA:10};
  } else if(cid === 'rogue'){
    state.character.stats = {STR:10,DEX:16,CON:12,INT:12,WIS:10,CHA:10};
  } else {
    state.character.stats = {STR:10,DEX:10,CON:10,INT:10,WIS:10,CHA:10};
  }
  renderStatBlocks(); syncQuickPreview();
}

/* -------------------------
   End of file
-------------------------*/
