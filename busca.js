(() => {
  "use strict";
  const current = 2026;
  const pageSize = 25;
  const archive = "https://github.com/simpef/certificados/blob/main/";
  const form = document.querySelector("#filtros");
  const query = document.querySelector("#nome");
  const year = document.querySelector("#ano");
  const category = document.querySelector("#categoria");
  const status = document.querySelector("#status");
  const list = document.querySelector("#resultados");
  const empty = document.querySelector("#vazio");
  const message = document.querySelector("#mensagem");
  const more = document.querySelector("#mais");
  const searchButton = document.querySelector("#buscar");
  const normalize = (name) => name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const catalog = (window.CATALOGO_SIMPEF ?? []).map((item) => ({ ...item, search: normalize(item.nome) }));
  let matches = [];
  let shown = 0;

  function itemElement(tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function result(item) {
    const row = itemElement("li", "", "result");
    const text = document.createElement("div");
    const meta = itemElement("div", "", "meta");
    meta.append(
      itemElement("span", item.ano, item.ano === current ? "badge current" : "badge"),
      itemElement("span", item.categoria, "badge"),
    );
    text.append(meta, itemElement("h3", item.nome));
    if (item.trabalho || item.funcao) {
      text.append(itemElement("p", item.trabalho ? "Autor principal" : item.funcao, "role"));
    }
    if (item.titulo) text.append(itemElement("p", item.titulo));
    const link = itemElement("a", "Abrir PDF ↗", "pdf");
    link.href = archive + item.pdf.split("/").map(encodeURIComponent).join("/");
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `Abrir PDF de ${item.nome}, ${item.categoria}, ${item.ano} (nova aba)`);
    row.append(text, link);
    return row;
  }

  function edition(item) {
    if (year.value === "todas") return true;
    if (year.value === "anteriores") return item.ano < current;
    return item.ano === Number(year.value);
  }

  function categories() {
    const previous = category.value;
    const available = [...new Set(catalog.filter(edition).map((item) => item.categoria))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    category.replaceChildren(new Option("Todas as categorias", ""), ...available.map((value) => new Option(value, value)));
    if (available.includes(previous)) category.value = previous;
  }

  function showMore() {
    const slice = matches.slice(shown, shown + pageSize);
    list.append(...slice.map(result));
    shown += slice.length;
    more.hidden = shown >= matches.length;
    if (matches.length) {
      const quantity = matches.length === 1 ? "1 certificado encontrado" : `${matches.length} certificados encontrados`;
      status.textContent = more.hidden ? quantity : `${quantity} · ${shown} exibidos`;
    }
  }

  function search(explicit = false) {
    const name = normalize(query.value);
    list.replaceChildren();
    shown = 0;
    matches = [];
    status.textContent = "";
    more.hidden = true;
    empty.hidden = false;
    if (!catalog.length) {
      message.textContent = "O catálogo não carregou. Atualize a página ou consulte o acervo no GitHub.";
      return;
    }
    if (name.length < 2) {
      message.textContent = name.length || explicit ? "Digite pelo menos duas letras para pesquisar." : "Digite um nome para ver os certificados da edição selecionada.";
      return;
    }
    const words = name.split(" ");
    matches = catalog.filter((item) => edition(item)
      && (!category.value || item.categoria === category.value)
      && words.every((word) => item.search.includes(word)));
    if (!matches.length) {
      status.textContent = "Nenhum certificado encontrado";
      message.textContent = "Tente outro trecho do nome ou selecione outra edição. Para trabalhos, use o nome do autor principal.";
      return;
    }
    empty.hidden = true;
    showMore();
  }

  document.querySelector("#total-atual").textContent = catalog.filter((item) => item.ano === current).length || "359";
  form.addEventListener("submit", (event) => { event.preventDefault(); search(true); });
  searchButton.addEventListener("click", () => search(true));
  query.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.isComposing) {
      event.preventDefault();
      search(true);
    }
  });
  query.addEventListener("input", () => search());
  year.addEventListener("change", () => { categories(); search(); });
  category.addEventListener("change", () => search());
  more.addEventListener("click", showMore);
  categories();
  search();
})();
