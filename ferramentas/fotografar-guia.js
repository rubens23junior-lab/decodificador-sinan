// Tira as fotos de tela usadas no guia de uso em PDF (docs/guia/).
//
// Abre o programa empacotado no Microsoft Edge (sem janela), usa só o arquivo
// FICTÍCIO de dengue que vem no pacote e fotografa cada passo. Com --datasus,
// também fotografa o formulário público de transferência de arquivos do
// DATASUS (só a página; nenhum dado é enviado e nenhum arquivo é baixado).
//
// Uso: node ferramentas/fotografar-guia.js [--pacote <pasta do programa>] [--datasus]
// Padrão de --pacote: o programa montado neste repositório, em dist/decodificador-sinan (rode antes node ferramentas/construir.js)
// As fotos vão para docs/guia/imagens/ e a planilha baixada vai para docs/guia/planilha-exemplo.xlsx.

import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync, mkdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const opcao = (n, padrao) => (args.includes(n) ? args[args.indexOf(n) + 1] : padrao);
const pacote = resolve(opcao('--pacote', join(raiz, 'dist/decodificador-sinan')));
const pastaFotos = join(raiz, 'docs/guia/imagens');
mkdirSync(pastaFotos, { recursive: true });

const EDGE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(existsSync);
if (!EDGE) throw new Error('Microsoft Edge não encontrado.');
if (!existsSync(join(pacote, 'index.html'))) throw new Error(`Programa não encontrado em ${pacote}`);

const perfil = mkdtempSync(join(tmpdir(), 'guia-edge-'));
const downloads = mkdtempSync(join(tmpdir(), 'guia-downloads-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${perfil}`, 'about:blank'], { stdio: 'ignore' });

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function ate(condicao, limiteMs, descricao) {
  const inicio = Date.now();
  for (;;) {
    const r = await condicao();
    if (r) return r;
    if (Date.now() - inicio > limiteMs) throw new Error(`Tempo esgotado esperando: ${descricao}`);
    await esperar(200);
  }
}

let ws;
let proximoId = 0;
const pendentes = new Map();
let downloadConcluido = null;
function cdp(method, params = {}) {
  const id = ++proximoId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((ok, falha) => pendentes.set(id, { ok, falha }));
}
const avaliar = async (expr) => (await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
const visivel = (id) => avaliar(`!!document.getElementById(${JSON.stringify(id)}) && !document.getElementById(${JSON.stringify(id)}).hidden`);

async function tamanho(largura) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: largura, height: 900, deviceScaleFactor: 2, mobile: false });
}

/** Fotografa a área entre o topo do primeiro elemento e o fim do último (seletores CSS). */
async function fotografar(nome, seletorInicio, seletorFim = seletorInicio, margem = 12) {
  const r = await avaliar(`(() => {
    const a = document.querySelector(${JSON.stringify(seletorInicio)}).getBoundingClientRect();
    const b = document.querySelector(${JSON.stringify(seletorFim)}).getBoundingClientRect();
    const x = Math.min(a.left, b.left), y = a.top + scrollY;
    return { x, y, width: Math.max(a.right, b.right) - x, height: b.bottom + scrollY - y };
  })()`);
  const clip = {
    x: Math.max(0, r.x - margem), y: Math.max(0, r.y - margem),
    width: r.width + 2 * margem, height: r.height + 2 * margem, scale: 1,
  };
  const { data } = await cdp('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
  writeFileSync(join(pastaFotos, `${nome}.png`), Buffer.from(data, 'base64'));
  console.log(`Foto: ${nome}.png`);
}

async function abrir(url, pronto) {
  await cdp('Page.navigate', { url });
  await ate(() => avaliar(`document.readyState === "complete" && (${pronto})`), 30000, `abrir ${url}`);
}

try {
  const porta = await ate(() => {
    const f = join(perfil, 'DevToolsActivePort');
    return existsSync(f) && readFileSync(f, 'utf8').split('\n')[0];
  }, 15000, 'Edge iniciar');
  const alvos = await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json();
  ws = new WebSocket(alvos.find((a) => a.type === 'page').webSocketDebuggerUrl);
  await new Promise((ok) => ws.addEventListener('open', ok));
  ws.addEventListener('message', ({ data }) => {
    const m = JSON.parse(data);
    if (m.id && pendentes.has(m.id)) {
      const p = pendentes.get(m.id);
      pendentes.delete(m.id);
      m.error ? p.falha(new Error(m.error.message)) : p.ok(m.result);
    } else if (m.method === 'Page.downloadProgress' && m.params.state === 'completed') {
      downloadConcluido = m.params;
    }
  });
  for (const d of ['Page', 'Runtime', 'DOM']) await cdp(`${d}.enable`);
  await cdp('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });

  // ---- Programa (com o arquivo fictício)
  await tamanho(1000);
  await abrir(pathToFileURL(join(pacote, 'index.html')).href, 'document.querySelectorAll("input[name=agravo]").length > 0');
  console.log(`Programa: versão ${await avaliar('document.getElementById("versao").innerText')}`);
  await fotografar('programa-1-inicio', '.topo', '.aviso');
  await avaliar('document.querySelector(".apresentacao").open = true');
  await fotografar('programa-1-apresentacao', '.apresentacao');
  await avaliar('document.querySelector(".apresentacao").open = false');
  await avaliar('document.querySelector(\'input[name="agravo"][value="dengue"]\').click()');
  await fotografar('programa-1-agravo', '#passo-agravo');
  const { root } = await cdp('DOM.getDocument');
  const { nodeId } = await cdp('DOM.querySelector', { nodeId: root.nodeId, selector: '#arquivo' });
  const exemplo = join(pacote, 'exemplos', 'exemplo_dengue_FICTICIO.dbc');
  await cdp('DOM.setFileInputFiles', { nodeId, files: [exemplo] });
  await ate(() => visivel('analise'), 60000, 'análise do arquivo');
  await esperar(500);
  await fotografar('programa-2-arquivo', '#passo-arquivo');

  // Opções: primeiro com os valores padrão; depois um exemplo de filtros preenchidos.
  await fotografar('programa-3-opcoes', '#passo-opcoes');
  const definir = (id, valor) => avaliar(`(() => { const e = document.getElementById(${JSON.stringify(id)});
    e.value = ${JSON.stringify(valor)}; e.dispatchEvent(new Event("change")); return e.value; })()`);
  const ufExemplo = await avaliar(`(() => { const s = document.getElementById("filtro-uf");
    const o = [...s.options].filter((o) => o.value).sort((a, b) => parseInt(b.text.split("– ")[1]) - parseInt(a.text.split("– ")[1]))[0];
    return o ? o.value : ""; })()`);
  await definir('filtro-uf', ufExemplo);
  const munExemplo = await avaliar('[...document.getElementById("filtro-mun").options].filter((o) => o.value)[0]?.value ?? ""');
  await definir('filtro-mun', munExemplo);
  await definir('filtro-de', '2025-01-01');
  await definir('filtro-ate', '2025-06-30');
  await fotografar('programa-3-filtros', '#passo-opcoes fieldset:nth-of-type(1)');
  await definir('filtro-uf', '');
  await definir('filtro-de', '');
  await definir('filtro-ate', '');
  await avaliar('document.querySelector("#passo-opcoes details").open = true');
  await fotografar('programa-3-colunas', '#passo-opcoes fieldset:nth-of-type(2)');
  await avaliar('document.querySelector("#passo-opcoes details").open = false');
  await fotografar('programa-3-saida', '#passo-opcoes fieldset:nth-of-type(3)');
  await fotografar('programa-3-barra', '#barra-acao', '#barra-acao', 0);
  // A planilha de exemplo do guia mostra o código original ao lado do texto,
  // por isso esta opção (desmarcada por padrão) é marcada aqui.
  await avaliar('(() => { const c = document.getElementById("manter-originais"); c.checked = true; c.dispatchEvent(new Event("change")); })()');

  // Deixa o computador "lento" de propósito para dar tempo de fotografar a barra de progresso.
  await cdp('Emulation.setCPUThrottlingRate', { rate: 100 });
  await avaliar('document.getElementById("processar").click()');
  try {
    await ate(() => avaliar('!document.getElementById("progresso").hidden'), 60000, 'barra de progresso');
    await fotografar('programa-4-progresso', '#progresso');
  } catch (e) {
    console.log(`Sem foto da barra de progresso: ${e.message}`);
  }
  await cdp('Emulation.setCPUThrottlingRate', { rate: 1 });
  await ate(async () => (await visivel('resultado')) || (await visivel('erro')), 300000, 'processamento');
  if (await visivel('erro')) throw new Error(`Erro no processamento: ${await avaliar('document.getElementById("erro").innerText')}`);
  await fotografar('programa-5-resultado', '#resultado');
  await ate(() => downloadConcluido, 60000, 'download da planilha');
  const xlsx = readdirSync(downloads).find((n) => n.endsWith('.xlsx'));
  copyFileSync(join(downloads, xlsx), join(raiz, 'docs/guia/planilha-exemplo.xlsx'));
  console.log(`Planilha baixada: ${xlsx} (copiada para docs/guia/planilha-exemplo.xlsx)`);

  // Aviso de arquivo de outro agravo: o mesmo arquivo de dengue com Chikungunya escolhida.
  await avaliar('document.querySelector(\'input[name="agravo"][value="chikungunya"]\').click()');
  await ate(() => visivel('erro'), 60000, 'aviso de arquivo de outro agravo');
  await esperar(300);
  await fotografar('programa-6-outro-agravo', '#erro');

  // ---- Site do DATASUS (só a página pública do formulário)
  if (args.includes('--datasus')) {
    await tamanho(1000);
    await abrir('https://datasus.saude.gov.br/transferencia-de-arquivos/', '!!document.getElementById("mySelect")');
    const escolher = (id, valor) => avaliar(`(() => { const s = document.getElementById(${JSON.stringify(id)});
      const o = [...s.options].find((o) => o.value === ${JSON.stringify(valor)}); if (!o) return false;
      o.selected = true; s.dispatchEvent(new Event("change")); o.scrollIntoView({ block: "nearest" }); return true; })()`);
    const opcoesDe = (id) => avaliar(`document.getElementById(${JSON.stringify(id)}).options.length`);
    // Esconde o menu e os botões que ficam presos na tela (cobrem o formulário na foto)
    // e marca o título "Download de arquivos" como início da foto.
    const limparTela = () => avaliar(`(() => {
      for (const el of document.querySelectorAll("body *")) {
        const p = getComputedStyle(el).position;
        if (p === "fixed" || p === "sticky") el.style.setProperty("display", "none", "important");
      }
      const t = [...document.querySelectorAll("h1,h2,h3")].find((h) => h.innerText.trim() === "Download de arquivos");
      if (t) t.id = "titulo-download";
      return !!t; })()`);
    if (!(await limparTela())) throw new Error('Título "Download de arquivos" não encontrado no site do DATASUS.');
    if (!(await escolher('mySelect', 'SINAN'))) throw new Error('Fonte SINAN não encontrada no site do DATASUS.');
    await ate(() => opcoesDe('modSelect'), 20000, 'lista Modalidade');
    await escolher('modSelect', '1');
    await ate(() => opcoesDe('tipo_arquivo'), 20000, 'lista Tipo de Arquivo');
    await escolher('tipo_arquivo', 'DENG');
    await ate(() => opcoesDe('modAno'), 20000, 'lista Ano');
    await escolher('modAno', '2024');
    await ate(() => opcoesDe('moduf'), 20000, 'lista UF');
    await escolher('moduf', 'BR');
    await esperar(800);
    await limparTela();
    await fotografar('datasus-1-formulario', '#titulo-download', 'button[onclick="enviar();"]');
    await avaliar('enviar()');
    await ate(() => avaliar('!!document.querySelector("table input[type=checkbox]")'), 30000, 'lista de arquivos');
    await esperar(800);
    await limparTela();
    await fotografar('datasus-2-lista', 'table', 'a[onclick="downloadSelected();"]');
    // O botão Download só prepara o arquivo.zip no site; nada é baixado para este computador.
    await avaliar('downloadSelected()');
    await ate(() => avaliar('!!document.querySelector("#arquivo_compactado a")'), 120000, 'arquivo.zip preparado');
    await esperar(500);
    await limparTela();
    await fotografar('datasus-3-zip', 'table', '#arquivo_compactado');
  }
  console.log('Fotos prontas em docs/guia/imagens/.');
} finally {
  ws?.close();
  edge.kill();
  await esperar(500);
  for (const p of [perfil, downloads]) {
    try { rmSync(p, { recursive: true, force: true }); } catch { /* o Edge pode demorar a soltar os arquivos */ }
  }
}
