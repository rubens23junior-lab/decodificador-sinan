// Teste de ponta a ponta no Microsoft Edge (sem janela): abre a ferramenta
// empacotada direto do disco (file://), escolhe um arquivo, processa e baixa
// a planilha, como o usuário faria. Registra toda tentativa de conexão de
// rede e todo erro na página.
//
// Uso: node ferramentas/testar-navegador.js [--arquivo <caminho>] [--agravo zika] [--uf 33] [--saida xlsx|csv] [--analise] [--espera-erro]
// Requer: npm run construir antes; Microsoft Edge instalado.

import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { lerXlsx } from './ler-xlsx.js';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const opcao = (n, padrao) => (args.includes(n) ? args[args.indexOf(n) + 1] : padrao);
const arquivo = resolve(opcao('--arquivo', join(raiz, 'exemplos/exemplo_dengue_FICTICIO.dbc')));
const agravo = opcao('--agravo', 'dengue'); // nome do dicionário, por exemplo "zika"
const uf = opcao('--uf', '');
const saida = opcao('--saida', 'xlsx');
const esperaErro = args.includes('--espera-erro');
const captura = opcao('--captura', ''); // pasta onde salvar fotos da tela (opcional)

const EDGE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(existsSync);
if (!EDGE) throw new Error('Microsoft Edge não encontrado.');
const pagina = join(raiz, 'dist/decodificador-sinan/index.html');
if (!existsSync(pagina)) throw new Error('Rode "npm run construir" antes.');

const perfil = mkdtempSync(join(tmpdir(), 'decodificador-edge-'));
const downloads = mkdtempSync(join(tmpdir(), 'decodificador-downloads-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${perfil}`, 'about:blank'], { stdio: 'ignore' });

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
async function ate(condicao, limiteMs, descricao) {
  const inicio = Date.now();
  for (;;) {
    const r = await condicao();
    if (r) return r;
    if (Date.now() - inicio > limiteMs) throw new Error(`Tempo esgotado esperando: ${descricao}`);
    await esperar(300);
  }
}

let ws;
let proximoId = 0;
const pendentes = new Map();
const ouvintes = [];
function cdp(method, params = {}) {
  const id = ++proximoId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((ok, falha) => pendentes.set(id, { ok, falha }));
}

const requisicoes = [];
const errosPagina = [];
let downloadConcluido = null;

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
    } else if (m.method) {
      for (const f of ouvintes) f(m);
    }
  });
  ouvintes.push(({ method, params }) => {
    if (method === 'Network.requestWillBeSent') requisicoes.push(params.request.url);
    if (method === 'Runtime.exceptionThrown') errosPagina.push(params.exceptionDetails.exception?.description ?? params.exceptionDetails.text);
    if (method === 'Log.entryAdded' && params.entry.level === 'error') errosPagina.push(params.entry.text);
    if (method === 'Runtime.consoleAPICalled' && params.type === 'error') errosPagina.push(params.args.map((a) => a.value ?? a.description).join(' '));
    if (method === 'Page.downloadProgress' && params.state === 'completed') downloadConcluido = params;
  });
  for (const d of ['Page', 'Runtime', 'Network', 'Log', 'DOM']) await cdp(`${d}.enable`);
  await cdp('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });

  const avaliar = async (expr) => (await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
  const visivel = (id) => avaliar(`!document.getElementById(${JSON.stringify(id)}).hidden`);
  const texto = (id) => avaliar(`document.getElementById(${JSON.stringify(id)}).innerText`);
  async function fotografar(nome) {
    if (!captura) return;
    await cdp('Emulation.setDeviceMetricsOverride', { width: 1100, height: 900, deviceScaleFactor: 1, mobile: false });
    const { data } = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(join(captura, `${nome}.png`), Buffer.from(data, 'base64'));
  }

  const url = pathToFileURL(pagina).href;
  console.log(`Abrindo ${url}`);
  await cdp('Page.navigate', { url });
  await ate(() => avaliar('document.readyState === "complete" && document.querySelectorAll("input[name=agravo]").length > 0'), 20000, 'página carregar');
  console.log(`Página aberta. Agravos: ${await avaliar('[...document.querySelectorAll("input[name=agravo]")].map(r=>r.parentElement.innerText).join(", ")')}`);
  {
    const escolhido = await avaliar(`(() => { const r = document.querySelector('input[name="agravo"][value=' + JSON.stringify(${JSON.stringify(agravo)}) + ']');
      if (!r) return ""; r.click(); return r.checked ? r.parentElement.innerText : ""; })()`);
    if (!escolhido) throw new Error(`Agravo "${agravo}" não existe no pacote.`);
    console.log(`Agravo escolhido: ${escolhido}`);
  }

  const { root } = await cdp('DOM.getDocument');
  const { nodeId } = await cdp('DOM.querySelector', { nodeId: root.nodeId, selector: '#arquivo' });
  await cdp('DOM.setFileInputFiles', { nodeId, files: [arquivo] });
  console.log(`Arquivo escolhido: ${arquivo}`);
  const t0 = Date.now();
  await ate(async () => (await visivel('analise')) || (await visivel('erro')), 600000, 'análise');

  if (await visivel('erro')) {
    const msg = await texto('erro');
    console.log(`Mensagem de erro na tela: ${msg}`);
    if (!esperaErro) throw new Error('Erro inesperado na análise.');
  } else {
    console.log(`Análise (${((Date.now() - t0) / 1000).toFixed(1)} s): ${await texto('analise')}`);
    if (esperaErro) throw new Error('Esperava uma mensagem de erro, mas a análise passou.');
    if (args.includes('--analise')) await avaliar('(()=>{const c=document.getElementById("formato-analise"); c.checked=true; c.dispatchEvent(new Event("change"));})()');
    if (uf) await avaliar(`(()=>{const s=document.getElementById('filtro-uf'); s.value=${JSON.stringify(uf)}; s.dispatchEvent(new Event('change'));})()`);
    await avaliar(`(()=>{const r=document.querySelector('input[name="saida"][value=${JSON.stringify(saida)}]'); r.checked=true;})()`);
    console.log(`Estimativa: ${await texto('estimativa')}`);
    await fotografar('1-opcoes');
    const t1 = Date.now();
    await avaliar('document.getElementById("processar").click()');
    await ate(async () => (await visivel('resultado')) || (await visivel('erro')), 1800000, 'processamento');
    if (await visivel('erro')) throw new Error(`Erro no processamento: ${await texto('erro')}`);
    console.log(`Resultado (${((Date.now() - t1) / 1000).toFixed(1)} s): ${(await texto('resultado')).replace(/\n+/g, ' | ')}`);
    await fotografar('2-resultado');
    await ate(() => downloadConcluido, 120000, 'download');
    const baixados = readdirSync(downloads);
    console.log(`Baixado: ${baixados.join(', ')}`);
    const xlsx = baixados.find((n) => n.endsWith('.xlsx') && !n.includes('_apoio'));
    if (xlsx) {
      const bytes = readFileSync(join(downloads, xlsx));
      try {
        const abas = lerXlsx(bytes);
        console.log(`Planilha baixada: ${Object.entries(abas).map(([n, l]) => `${n} (${l.length} linhas)`).join(', ')}`);
        console.log(`Cabeçalho da aba Dados: ${abas.Dados[0].slice(0, 8).join(", ")}…`);
      } catch (e) {
        // Uma aba com mais de 512 MB de texto passa do limite de texto do Node;
        // a planilha foi gerada, só não dá para lê-la de volta por este script.
        if (e.code !== 'ERR_STRING_TOO_LONG') throw e;
        console.log(`Planilha baixada (${(bytes.length / 1048576).toFixed(1)} MB): grande demais para este script ler as abas de volta.`);
      }
    }
  }

  const externas = requisicoes.filter((u) => !/^(file|blob|data|about|chrome|edge):/.test(u));
  console.log(`Requisições registradas: ${requisicoes.length} (${[...new Set(requisicoes.map((u) => u.split(':')[0]))].join(', ')}). Fora do computador: ${externas.length}`);
  if (externas.length) throw new Error(`A página tentou acessar a rede: ${externas.join(', ')}`);
  if (errosPagina.length) throw new Error(`Erros na página:\n${errosPagina.join('\n')}`);
  console.log('OK: nenhum erro na página e nenhuma conexão de rede.');
} finally {
  ws?.close();
  edge.kill();
  await esperar(500);
  for (const p of [perfil, downloads]) {
    try { rmSync(p, { recursive: true, force: true }); } catch { /* o Edge pode demorar a soltar os arquivos */ }
  }
}
