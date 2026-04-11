let allData = [];

async function loadList(type) {
  const res = await fetch(`./db/${type}.json`);
  const items = await res.json();

  const container = document.getElementById(type);
  container.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "nav-item";
    div.textContent = item.name;

    div.onclick = () => {
      loadPage(type, item.file);
      document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
      div.classList.add('active');
    };

    container.appendChild(div);

    allData.push({ type, ...item });
  });
}

async function loadPage(type, file) {
  const res = await fetch(`./pages/${type}/${file}`);
  const text = await res.text();

  const content = document.getElementById("content");
  content.innerHTML = marked.parse(text);
}

function searchAll(query) {
  const content = document.getElementById("content");

  if (!query) return;

  const results = allData.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  let html = "<h2>Результаты поиска</h2><ul>";

  results.forEach(item => {
    html += `<li onclick="loadPage('${item.type}','${item.file}')">${item.name}</li>`;
  });

  html += "</ul>";

  content.innerHTML = html;
}

// загрузка
['races','classes','subclasses','weapons'].forEach(loadList);
