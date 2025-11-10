const files = {
  spells: '/data/spells.json',
  items: '/data/items.json',
  classes: '/data/classes.json',
  subclasses: '/data/subclasses.json',
  races: '/data/races.json',
  effects: '/data/effects.json'
};

let data = {};

// === ЗАГРУЗКА JSON ===
async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Ошибка загрузки ${path}`);
  return await res.json();
}

async function loadData() {
  for (let [key, path] of Object.entries(files)) {
    try {
      data[key] = await loadJSON(path);
    } catch (e) {
      console.warn("Не удалось загрузить", key, e);
      data[key] = [];
    }
  }
  populateSelectors();
}

// === НАПОЛНЕНИЕ СПИСКОВ ===
function populateSelectors() {
  const raceSel = document.getElementById("raceSelect");
  const classSel = document.getElementById("classSelect");
  const subclassSel = document.getElementById("subclassSelect");

  raceSel.innerHTML = `<option value="">— Выберите расу —</option>`;
  data.races.forEach(r => {
    raceSel.innerHTML += `<option value="${r.name}">${r.name}</option>`;
  });

  classSel.innerHTML = `<option value="">— Выберите класс —</option>`;
  data.classes.forEach(c => {
    classSel.innerHTML += `<option value="${c.name}">${c.name}</option>`;
  });

  classSel.addEventListener("change", () => {
    const selected = classSel.value;
    const filtered = data.subclasses.filter(s => s.parent === selected);
    subclassSel.innerHTML = `<option value="">— Выберите подкласс —</option>`;
    filtered.forEach(s => {
      subclassSel.innerHTML += `<option value="${s.name}">${s.name}</option>`;
    });
  });
}

// === СОХРАНЕНИЕ ===
document.getElementById("saveBtn").addEventListener("click", () => {
  const character = {
    name: document.getElementById("charName").value,
    race: document.getElementById("raceSelect").value,
    class: document.getElementById("classSelect").value,
    subclass: document.getElementById("subclassSelect").value,
    level: document.getElementById("charLevel").value,
    stats: {
      str: str.value, dex: dex.value, con: con.value, int: int.value, wis: wis.value, cha: cha.value
    },
    ac: ac.value,
    initiative: initiative.value,
    inventory: inventory.value,
    money: {
      cp: cp.value, sp: sp.value, gp: gp.value, pp: pp.value, ep: ep.value
    }
  };
  const blob = new Blob([JSON.stringify(character, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${character.name || 'персонаж'}.json`;
  link.click();
});

// === ЗАГРУЗКА ===
document.getElementById("loadBtn").addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const char = JSON.parse(ev.target.result);
      document.getElementById("charName").value = char.name || "";
      document.getElementById("raceSelect").value = char.race || "";
      document.getElementById("classSelect").value = char.class || "";
      document.getElementById("subclassSelect").value = char.subclass || "";
      document.getElementById("charLevel").value = char.level || 1;
      for (let k in char.stats) document.getElementById(k).value = char.stats[k];
      ac.value = char.ac || 10;
      initiative.value = char.initiative || 0;
      inventory.value = char.inventory || "";
      if (char.money) for (let m in char.money) document.getElementById(m).value = char.money[m];
    };
    reader.readAsText(file);
  };
  input.click();
});

// === ОЧИСТКА ===
document.getElementById("clearBtn").addEventListener("click", () => {
  if (confirm("Очистить лист персонажа?")) {
    document.querySelectorAll("input, textarea, select").forEach(e => {
      if (e.type === "number") e.value = 0;
      else e.value = "";
    });
  }
});

document.addEventListener("DOMContentLoaded", loadData);
