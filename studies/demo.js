(() => {
  /* ---------- demonstração: a mesma lógica da opção 1, num 20 × 20 ---------- */
  const N = 20, CRIT = 4, TOTAL = N * N;
  const CORES = ["#f7f1e3", "#e8c872", "#c9963b", "#7a5320"];
  const VIZ = Array.from({ length: TOTAL }, (_, k) => {
    const i = Math.floor(k / N), j = k % N, v = [];
    if (i > 0) v.push(k - N);
    if (i < N - 1) v.push(k + N);
    if (j > 0) v.push(k - 1);
    if (j < N - 1) v.push(k + 1);
    return v;
  });

  function gerador(semente) {
    return () => {
      semente |= 0; semente = (semente + 0x6d2b79f5) | 0;
      let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const sortear = gerador(7);

  // textos da demonstração nos dois idiomas; a página diz qual usar em <html lang>
  const INGLES = document.documentElement.lang.startsWith("en");
  const num = (x, casas) => x.toLocaleString(INGLES ? "en-US" : "pt-BR",
    { minimumFractionDigits: casas, maximumFractionDigits: casas });
  const TEXTOS = INGLES ? {
    densidade: d => `${num(d, 3)} grains per cell`,
    andamento: (o, s, a) => `in progress: wave ${o}, ${s} topplings, ${a} cells`,
    ultima: (s, o, a) => `last: ${s} topplings in ${o} waves, ${a} cells`,
    desligado: "monitor off",
    risco: c => `${num(c, 1)}% chance of a catastrophe on the next grain`,
    alerta: (c, s) => `Alert: ${num(c, 1)}% chance that the next grain causes an avalanche of ≥ ${s} topplings. The blue zone shows where.`,
    pausar: "Pause", iniciar: "Start",
  } : {
    densidade: d => `${num(d, 3)} grãos por célula`,
    andamento: (o, s, a) => `em andamento: onda ${o}, ${s} tombamentos, ${a} células`,
    ultima: (s, o, a) => `última: ${s} tombamentos em ${o} ondas, ${a} células`,
    desligado: "monitor desligado",
    risco: c => `${num(c, 1)}% de chance de catástrofe no próximo grão`,
    alerta: (c, s) => `Alerta: ${num(c, 1)}% de chance de o próximo grão causar uma avalanche ≥ ${s} tombamentos. A zona azul mostra onde.`,
    pausar: "Pausar", iniciar: "Iniciar",
  };

  let z = new Int16Array(TOTAL);
  let graos = 0, ultimoGrao = -1;
  let aval = null;          // avalanche em andamento
  let ultima = null;        // última avalanche que terminou
  let risco = null, emAlerta = false, auto = false;

  const tela = document.getElementById("tela");
  const ctx = tela.getContext("2d");
  const el = id => document.getElementById(id);
  const cMonitor = el("c-monitor"), cLimiar = el("c-limiar"), cAlerta = el("c-alerta"), cVel = el("c-vel");
  const bAuto = el("b-auto"), aviso = el("aviso");

  const limiar = () => Math.max(1, Number(cLimiar.value) || 240);
  const minimoAlerta = () => Math.max(0.1, Number(cAlerta.value) || 5) / 100;

  // relaxa de uma vez (sem animação) e devolve o número de tombamentos
  function relaxar(a, inicio) {
    const pilha = [inicio];
    let tamanho = 0;
    while (pilha.length) {
      const p = pilha.pop();
      if (a[p] < CRIT) continue;
      a[p] -= CRIT; tamanho++;
      for (const v of VIZ[p]) { a[v]++; if (a[v] >= CRIT) pilha.push(v); }
      if (a[p] >= CRIT) pilha.push(p);
    }
    return tamanho;
  }
  function tamanhoSeCair(k) {
    const a = z.slice(); a[k]++;
    return relaxar(a, k);
  }
  function avaliarRisco() {
    const zona = new Set(), s = limiar();
    for (let k = 0; k < TOTAL; k++) if (z[k] === CRIT - 1 && tamanhoSeCair(k) >= s) zona.add(k);
    return { zona, chance: zona.size / TOTAL };
  }
  // chamado sempre que o tabuleiro fica estável; devolve true se um alerta acabou de começar
  function estabilizou() {
    if (!cMonitor.checked) { risco = null; emAlerta = false; return false; }
    risco = avaliarRisco();
    const agora = risco.chance >= minimoAlerta();
    const novo = agora && !emAlerta;
    emAlerta = agora;
    if (novo && auto) { auto = false; atualizarBotao(); }
    return novo;
  }
  function soltar(k) {
    z[k]++; graos++; ultimoGrao = k;
    if (z[k] >= CRIT) aval = { pendentes: [k], atual: [], area: new Set(), tamanho: 0, ondas: 0 };
  }
  function proximaOnda() {
    if (!aval.pendentes.length) {
      ultima = { tamanho: aval.tamanho, ondas: aval.ondas, area: aval.area };
      aval = null;
      return;
    }
    const onda = aval.pendentes, tocadas = new Set(onda);
    for (const k of onda) { z[k] -= CRIT; for (const v of VIZ[k]) { z[v]++; tocadas.add(v); } }
    aval.atual = onda;
    onda.forEach(k => aval.area.add(k));
    aval.tamanho += onda.length; aval.ondas++;
    aval.pendentes = [...tocadas].filter(k => z[k] >= CRIT);
  }
  function terminarAvalanche() {
    if (!aval) return;
    while (aval) proximaOnda();
    estabilizou();
  }
  function soltarEm(k) {
    terminarAvalanche();
    soltar(k);
    if (!aval) estabilizou();
    desenhar();
  }

  function quadro() {
    if (aval) {
      proximaOnda();
      if (!aval) estabilizou();
    } else if (auto) {
      for (let g = 0; g < 3 && !aval; g++) {
        soltar(Math.floor(sortear() * TOTAL));
        if (!aval && estabilizou()) break;
      }
    } else {
      return;
    }
    desenhar();
  }

  function desenhar() {
    const lado = tela.width, c = lado / N;
    ctx.clearRect(0, 0, lado, lado);
    for (let k = 0; k < TOTAL; k++) {
      ctx.fillStyle = CORES[Math.min(z[k], 3)] || CORES[3];
      ctx.fillRect((k % N) * c, Math.floor(k / N) * c, Math.ceil(c), Math.ceil(c));
    }
    const pinta = (conj, cor) => {
      ctx.fillStyle = cor;
      conj.forEach(k => ctx.fillRect((k % N) * c, Math.floor(k / N) * c, Math.ceil(c), Math.ceil(c)));
    };
    if (risco) pinta(risco.zona, "rgba(38, 89, 242, 0.68)");
    const area = aval ? aval.area : (ultima ? ultima.area : null);
    if (area) pinta(area, "rgba(217, 26, 26, 0.35)");
    if (aval) pinta(aval.atual, "rgba(217, 26, 26, 0.9)");
    if (ultimoGrao >= 0) {
      const x = (ultimoGrao % N + 0.5) * c, y = (Math.floor(ultimoGrao / N) + 0.5) * c, r = c * 0.32;
      ctx.strokeStyle = "#111"; ctx.lineWidth = Math.max(2, c * 0.12);
      ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke();
    }

    let soma = 0; for (let k = 0; k < TOTAL; k++) soma += z[k];
    el("e-graos").textContent = num(graos, 0);
    el("e-dens").textContent = TEXTOS.densidade(soma / TOTAL);
    if (aval) el("e-aval").textContent = TEXTOS.andamento(aval.ondas, aval.tamanho, aval.area.size);
    else if (ultima) el("e-aval").textContent = TEXTOS.ultima(ultima.tamanho, ultima.ondas, ultima.area.size);
    el("e-risco").textContent = risco ? TEXTOS.risco(risco.chance * 100) : TEXTOS.desligado;
    aviso.hidden = !(risco && emAlerta);
    if (risco && emAlerta) aviso.textContent = TEXTOS.alerta(risco.chance * 100, limiar());
  }

  function ajustarTela() {
    const dpr = window.devicePixelRatio || 1;
    const lado = Math.max(200, Math.round(tela.clientWidth * dpr));
    if (tela.width !== lado) { tela.width = lado; tela.height = lado; }
    desenhar();
  }
  function atualizarBotao() { bAuto.textContent = auto ? TEXTOS.pausar : TEXTOS.iniciar; }

  let relogio = null;
  function reiniciarRelogio() { clearInterval(relogio); relogio = setInterval(quadro, Number(cVel.value) || 160); }

  bAuto.addEventListener("click", () => { auto = !auto; atualizarBotao(); });
  el("b-grao").addEventListener("click", () => soltarEm(Math.floor(sortear() * TOTAL)));
  el("b-fim").addEventListener("click", () => { terminarAvalanche(); desenhar(); });
  [cMonitor, cLimiar, cAlerta].forEach(c => c.addEventListener("change", () => { if (!aval) { emAlerta = false; estabilizou(); } desenhar(); }));
  cVel.addEventListener("change", reiniciarRelogio);
  tela.addEventListener("click", ev => {
    const r = tela.getBoundingClientRect();
    const j = Math.min(N - 1, Math.floor((ev.clientX - r.left) / r.width * N));
    const i = Math.min(N - 1, Math.floor((ev.clientY - r.top) / r.height * N));
    soltarEm(i * N + j);
  });
  window.addEventListener("resize", ajustarTela);

  // começa já no estado crítico e para no primeiro alerta, como a animação faria
  for (let g = 0; g < 3000; g++) { const k = Math.floor(sortear() * TOTAL); z[k]++; graos++; relaxar(z, k); }
  estabilizou();
  while (!emAlerta && graos < 20000) {
    const k = Math.floor(sortear() * TOTAL); z[k]++; graos++; ultimoGrao = k;
    relaxar(z, k);
    estabilizou();
  }
  ajustarTela();
  reiniciarRelogio();
})();
