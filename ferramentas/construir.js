// Monta a versão distribuída: dist/decodificador-sinan/ (index.html, LEIA-ME,
// LICENSE e exemplos) e o arquivo compactado dist/decodificador-sinan-<versão>.zip.
//
// Uso: node ferramentas/construir.js   (ou: npm run construir)
//
// - Só entram dicionários marcados como conferidos.
// - Dicionários e tabelas ficam embutidos no código: nada é carregado à parte,
//   e a página funciona aberta direto do computador (file://), sem internet.
// - A página declara uma política de segurança (Content-Security-Policy) que
//   bloqueia qualquer conexão de rede.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { criarZip } from '../src/saida/zip.js';
import { verificarDicionario } from '../src/dicionario/verificar.js';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const versao = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')).version;
const pastaDic = join(raiz, 'dicionarios');

// ---- dicionários conferidos
const agravos = [];
// Dengue vem primeiro na lista da tela (o agravo mais usado); os demais, em ordem alfabética.
const PRIMEIRO = 'dengue.json';
const nomesDic = readdirSync(pastaDic).filter((n) => n.endsWith('.json')).sort((a, b) => (b === PRIMEIRO) - (a === PRIMEIRO) || a.localeCompare(b));
for (const nome of nomesDic) {
  const dic = JSON.parse(readFileSync(join(pastaDic, nome), 'utf8'));
  const { erros } = verificarDicionario(dic);
  if (erros.length) throw new Error(`Dicionário ${nome} com erros:\n${erros.join('\n')}`);
  if (!dic.conferencia.conferido) {
    console.log(`Ignorado (não conferido): ${nome}`);
    continue;
  }
  agravos.push({ id: nome.replace(/\.json$/, ''), arquivo: join(pastaDic, nome), dic });
}
if (!agravos.length) throw new Error('Nenhum dicionário conferido: nada a empacotar.');

// ---- módulos virtuais com os dados embutidos
const caminho = (p) => JSON.stringify(p.replace(/\\/g, '/'));
function moduloDadosEmbutidos() {
  const linhas = [];
  const importados = new Map();
  const importar = (arquivo) => {
    if (!importados.has(arquivo)) {
      importados.set(arquivo, `d${importados.size}`);
      linhas.push(`import d${importados.size - 1} from ${caminho(arquivo)};`);
    }
    return importados.get(arquivo);
  };
  const entradas = agravos.map(({ id, arquivo, dic }) => {
    const tabelas = Object.entries(dic.tabelas ?? {}).map(([tid, t]) => `${JSON.stringify(tid)}: ${importar(join(pastaDic, t.arquivo))}`);
    return `${JSON.stringify(id)}: { dic: ${importar(arquivo)}, tabelas: { ${tabelas.join(', ')} } }`;
  });
  return `${linhas.join('\n')}\nexport const AGRAVOS = { ${entradas.join(', ')} };`;
}
function moduloDadosInterface() {
  const linhas = agravos.map(({ arquivo }, i) => `import a${i} from ${caminho(arquivo)};`);
  linhas.push(`import municipios from ${caminho(join(pastaDic, 'tabelas', 'ibge-municipios.json'))};`);
  const entradas = agravos.map(({ id }, i) => `${JSON.stringify(id)}: { dic: a${i}, municipios }`);
  return `${linhas.join('\n')}\nexport const AGRAVOS_INTERFACE = { ${entradas.join(', ')} };`;
}
const pluginDados = {
  name: 'dados',
  setup(build) {
    build.onResolve({ filter: /^dados-(embutidos|interface)$/ }, (a) => ({ path: a.path, namespace: 'dados' }));
    build.onLoad({ filter: /.*/, namespace: 'dados' }, (a) => ({
      contents: a.path === 'dados-embutidos' ? moduloDadosEmbutidos() : moduloDadosInterface(),
      resolveDir: raiz,
      loader: 'js',
    }));
  },
};

async function empacotar(entrada, extra = {}) {
  const r = await esbuild.build({
    entryPoints: [join(raiz, entrada)],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome110', 'edge110'],
    minify: true,
    keepNames: true, // os tipos de erro são reconhecidos pelo nome
    legalComments: 'inline', // mantém o aviso de licença do blast.c e do fflate
    charset: 'utf8',
    write: false,
    loader: { '.gz': 'binary', '.json': 'json' },
    plugins: [pluginDados],
    ...extra,
  });
  return r.outputFiles[0].text;
}

const hash = (texto) => `'sha256-${createHash('sha256').update(texto, 'utf8').digest('base64')}'`;

const codigoWorker = await empacotar('src/interface/worker.js');
const codigoApp = await empacotar('src/interface/app.js', { define: { __VERSAO__: JSON.stringify(versao) } });
// O navegador troca toda quebra de linha CRLF por LF antes de calcular o hash
// do <style>. No Windows o Git pode entregar o arquivo com CRLF; sem esta
// troca o hash da política não bate e o estilo inteiro fica bloqueado.
const lf = (texto) => texto.replace(/\r\n?/g, '\n');
const estilo = lf(readFileSync(join(raiz, 'src/interface/estilo.css'), 'utf8'));

for (const proibido of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'EventSource', 'importScripts']) {
  if (codigoWorker.includes(proibido) || codigoApp.includes(proibido)) {
    throw new Error(`O código empacotado contém "${proibido}": a ferramenta não pode fazer requisições de rede.`);
  }
}
if (codigoWorker.includes('<!--')) throw new Error('O código do worker contém "<!--", que não pode ir dentro da página.');

const politica = [
  "default-src 'none'",
  `script-src ${hash(codigoApp)}`,
  'worker-src blob:',
  `style-src ${hash(estilo)}`,
  "connect-src 'none'",
  "img-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const pagina = lf(readFileSync(join(raiz, 'src/interface/pagina.html'), 'utf8'))
  .replace('<!--POLITICA-->', `<meta http-equiv="Content-Security-Policy" content="${politica}">`)
  .replace('<!--ESTILO-->', () => `<style>${estilo}</style>`)
  .replace('<!--CODIGO-WORKER-->', () => `<script type="text/plain" id="codigo-worker">${codigoWorker.replace(/<\/(script)/gi, '<\\/$1')}</script>`)
  .replace('<!--CODIGO-APP-->', () => `<script>${codigoApp}</script>`);

// ---- pasta de distribuição
const dist = join(raiz, 'dist');
const pasta = join(dist, 'decodificador-sinan');
if (existsSync(pasta)) rmSync(pasta, { recursive: true });
mkdirSync(join(pasta, 'exemplos'), { recursive: true });
writeFileSync(join(pasta, 'index.html'), pagina);
copyFileSync(join(raiz, 'docs', 'LEIA-ME.txt'), join(pasta, 'LEIA-ME.txt'));
copyFileSync(join(raiz, 'LICENSE'), join(pasta, 'LICENSE'));
// Guia ilustrado em PDF (gerado por ferramentas/gerar-guia.js)
const guia = join(raiz, 'docs', 'guia-de-uso.pdf');
if (existsSync(guia)) copyFileSync(guia, join(pasta, 'guia-de-uso.pdf'));
const pastaExemplos = join(raiz, 'exemplos');
const exemplos = existsSync(pastaExemplos) ? readdirSync(pastaExemplos) : [];
for (const e of exemplos) copyFileSync(join(pastaExemplos, e), join(pasta, 'exemplos', e));

const arquivosZip = [
  { nome: 'decodificador-sinan/index.html', conteudo: pagina },
  { nome: 'decodificador-sinan/LEIA-ME.txt', conteudo: readFileSync(join(pasta, 'LEIA-ME.txt')) },
  { nome: 'decodificador-sinan/LICENSE', conteudo: readFileSync(join(pasta, 'LICENSE')) },
  ...(existsSync(guia) ? [{ nome: 'decodificador-sinan/guia-de-uso.pdf', conteudo: readFileSync(guia) }] : []),
  ...exemplos.map((e) => ({ nome: `decodificador-sinan/exemplos/${e}`, conteudo: readFileSync(join(pastaExemplos, e)) })),
];
const zip = criarZip(arquivosZip);
const nomeZip = `decodificador-sinan-${versao}.zip`;
writeFileSync(join(dist, nomeZip), zip);

console.log(`Agravos: ${agravos.map((a) => a.dic.agravo.nome).join(', ')}`);
console.log(`index.html: ${(pagina.length / 1048576).toFixed(1)} MB (worker ${(codigoWorker.length / 1048576).toFixed(1)} MB, tela ${(codigoApp.length / 1024).toFixed(0)} KB)`);
console.log(`Exemplos: ${exemplos.length}`);
console.log(`Gerado dist/decodificador-sinan/ e dist/${nomeZip} (${(zip.length / 1048576).toFixed(1)} MB)`);
