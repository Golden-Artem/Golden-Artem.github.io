async function loadList(type) {
  const res = await fetch(`db/${type}.json`);
  const items = await res.json();

  const container = document.getElementById(type);
  container.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "nav-item";
    div.textContent = item.name;

    div.onclick = () => {
      loadPage(type, item.file);

      // подсветка выбранного
      document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
      div.classList.add("active");
    };

    container.appendChild(div);
  });
}

async function loadPage(type, file) {
  const res = await fetch(`pages/${type}/${file}`);
  const text = await res.text();

  const content = document.getElementById("content");
  content.innerHTML = marked.parse(text);

  // прокрутка вверх при открытии
  content.scrollTop = 0;
}

// загрузка всех списков при старте
loadList('races');
loadList('classes');
loadList('subclasses');
loadList('weapons');