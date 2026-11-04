(() => {
  /* ---------- realce de sintaxe Python ---------- */
  const PALAVRAS = new Set("False None True and as assert break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(" "));
  const EMBUTIDAS = new Set("print len range set list dict sum max min next iter int float str tuple enumerate isinstance super open zip map any all bool".split(" "));
  const PADRAO = /(#[^\n]*)|([rbfuRBFU]{0,2}(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'))|(@[A-Za-z_][\w.]*)|(\b\d[\d_]*(?:\.\d+)?\b)|([A-Za-z_]\w*)/g;
  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const marca = (cls, s) => `<span class="tk-${cls}">${esc(s)}</span>`;
  function realcar(src) {
    let saida = "", ultimo = 0, anterior = "", m;
    PADRAO.lastIndex = 0;
    while ((m = PADRAO.exec(src))) {
      saida += esc(src.slice(ultimo, m.index));
      const [tok, com, str, dec, num, id] = m;
      if (com) saida += marca("com", tok);
      else if (str) saida += marca("str", tok);
      else if (dec) saida += marca("dec", tok);
      else if (num) saida += marca("num", tok);
      else if (id) {
        if (PALAVRAS.has(id)) saida += marca("kw", id);
        else if (anterior === "def" || anterior === "class") saida += marca("def", id);
        else if (id === "self") saida += marca("self", id);
        else if (EMBUTIDAS.has(id)) saida += marca("bi", id);
        else saida += esc(id);
        anterior = id;
      }
      ultimo = PADRAO.lastIndex;
    }
    return saida + esc(src.slice(ultimo));
  }
  document.querySelectorAll("code.py").forEach(el => { el.innerHTML = realcar(el.textContent); });

  const INGLES = document.documentElement.lang.startsWith("en");
  const COPIA = INGLES
    ? { copiar: "Copy", copiado: "Copied", selecionado: "Selected: press Ctrl+C" }
    : { copiar: "Copiar", copiado: "Copiado", selecionado: "Selecionado: use Ctrl+C" };

  document.querySelectorAll("figure.codigo").forEach(fig => {
    const botao = fig.querySelector(".copiar");
    const codigo = fig.querySelector("pre code");
    if (!botao || !codigo) return;
    botao.addEventListener("click", () => {
      const texto = codigo.textContent;
      const ok = () => { botao.textContent = COPIA.copiado; setTimeout(() => { botao.textContent = COPIA.copiar; }, 1600); };
      const selecionar = () => {
        const r = document.createRange(); r.selectNodeContents(codigo);
        const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        botao.textContent = COPIA.selecionado;
      };
      try { navigator.clipboard.writeText(texto).then(ok, selecionar); } catch (e) { selecionar(); }
    });
  });

  /* ---------- sumário: fecha no celular e marca a seção atual ---------- */
  const detalhes = document.getElementById("sumario-detalhes");
  if (window.matchMedia("(max-width: 1000px)").matches) detalhes.open = false;
  const links = [...document.querySelectorAll(".sumario a")];
  const alvos = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(entradas => {
      entradas.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.classList.toggle("ativo", a.getAttribute("href") === "#" + e.target.id));
      });
    }, { rootMargin: "0px 0px -70% 0px" });
    alvos.forEach(a => obs.observe(a));
  }
})();
