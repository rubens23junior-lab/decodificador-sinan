// Gera o guia de uso em PDF (docs/guia-de-uso.pdf) a partir do texto em
// docs/guia/guia-de-uso.html, das fotos em docs/guia/imagens/ e da planilha
// gerada com o arquivo FICTÍCIO (docs/guia/planilha-exemplo.xlsx).
//
// Uso: node ferramentas/gerar-guia.js [--versao X.Y.Z] (padrão: a versão do package.json)
// Antes, se as telas mudaram: node ferramentas/fotografar-guia.js --datasus
// Requer o Microsoft Edge instalado (usado só para "imprimir" o PDF, sem internet).

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { lerXlsx, lerZip } from './ler-xlsx.js';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const versao = args.includes('--versao') ? args[args.indexOf('--versao') + 1] : JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')).version;
const pastaGuia = join(raiz, 'docs/guia');
const saida = join(raiz, 'docs/guia-de-uso.pdf');

const EDGE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find(existsSync);
if (!EDGE) throw new Error('Microsoft Edge não encontrado.');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- Planilha do exemplo fictício: valores e células destacadas (estilo amarelo)
const bytes = readFileSync(join(pastaGuia, 'planilha-exemplo.xlsx'));
const abas = lerXlsx(bytes);
const zip = lerZip(bytes);
const estilos = zip['xl/styles.xml'].toString();
const xfs = [...estilos.match(/<cellXfs[\s\S]*?<\/cellXfs>/)[0].matchAll(/<xf\b[^>]*\/?>/g)].map((m) => m[0]);
const estiloAmarelo = xfs.findIndex((x) => /fillId="3"/.test(x)); // fundo amarelo (FFEB9C)
const estiloData = xfs.findIndex((x) => /numFmtId="14"/.test(x));
const nomesAbas = ['Dados', 'Inconsistências', 'Dicionário usado', 'Resumo'];
function celulasComEstilo(numeroAba, estilo) {
  const xml = zip[`xl/worksheets/sheet${numeroAba}.xml`].toString();
  return new Set([...xml.matchAll(new RegExp(`<c r="([A-Z]+\\d+)" s="${estilo}"`, 'g'))].map((m) => m[1]));
}
const amarelasDados = celulasComEstilo(1, estiloAmarelo);
const datasDados = celulasComEstilo(1, estiloData);
const letra = (i) => { let s = ''; i += 1; while (i > 0) { const r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); } return s; };
const dataExcel = (n) => { const d = new Date(Date.UTC(1899, 11, 30) + Number(n) * 86400000); return d.toISOString().slice(0, 10).split('-').reverse().join('/'); };

/** Desenha um pedaço de uma aba como numa planilha: letras das colunas, números das linhas e abas embaixo. */
function planilha(aba, linhas, colunas, { cabecalho = true, titulos = [], reticencias = false } = {}) {
  const dados = abas[aba];
  const numAba = nomesAbas.indexOf(aba) + 1;
  const amarelas = numAba === 1 ? amarelasDados : celulasComEstilo(numAba, estiloAmarelo);
  const datas = numAba === 1 ? datasDados : celulasComEstilo(numAba, estiloData);
  let h = '<div class="planilha"><table><tr><th class="letra"></th>';
  for (const c of colunas) h += `<th class="letra">${letra(c)}</th>`;
  h += '</tr>';
  linhas.forEach((l, k) => {
    if (reticencias && k > 0 && l - linhas[k - 1] > 1) {
      h += `<tr><td class="linha">⋮</td>${colunas.map(() => '<td class="reticencias">⋮</td>').join('')}</tr>`;
    }
    h += `<tr><td class="linha">${l + 1}</td>`;
    for (const c of colunas) {
      const ref = `${letra(c)}${l + 1}`;
      let v = dados[l]?.[c] ?? '';
      if (datas.has(ref) && /^\d+$/.test(v)) v = dataExcel(v);
      const classe = (cabecalho && l === 0) ? 'cab' : titulos.includes(l) && c === colunas[0] ? 'titulo' : amarelas.has(ref) ? 'amarelo' : '';
      h += `<td${classe ? ` class="${classe}"` : ''} title="${esc(v)}">${esc(v)}</td>`;
    }
    h += '</tr>';
  });
  h += `</table><div class="abas">${nomesAbas.map((n) => `<span${n === aba ? ' class="ativa"' : ''}>${n}</span>`).join('')}</div></div>`;
  return h;
}

const cabDados = abas.Dados[0];
const col = (nome) => {
  const i = cabDados.indexOf(nome);
  if (i < 0) throw new Error(`Coluna "${nome}" não encontrada na aba Dados.`);
  return i;
};

// ---- Figura "antes e depois": as mesmas notificações no arquivo original e na planilha
function antesDepois() {
  const pares = [ // [nome legível, nome original]; data sem coluna de código ao lado
    ['Data da notificação', 'DT_NOTIFIC'], ['UF de notificação', 'SG_UF_NOT'], ['Município de notificação', 'ID_MUNICIP'],
    ['Idade', 'NU_IDADE_N'], ['Sexo', 'CS_SEXO'], ['Raça/Cor', 'CS_RACA'], ['Escolaridade', 'CS_ESCOL_N'],
  ];
  const csv = readFileSync(join(raiz, 'exemplos/exemplo_dengue_FICTICIO.csv'), 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
  const cabCsv = csv[0].split(';');
  const linhas = [1, 2, 3];
  let antes = '<div class="planilha"><table><tr>' + pares.map(([, o]) => `<td class="cab">${o}</td>`).join('') + '</tr>';
  for (const l of linhas) {
    const campos = csv[l].split(';');
    antes += '<tr>' + pares.map(([, o]) => `<td>${esc(campos[cabCsv.indexOf(o)])}</td>`).join('') + '</tr>';
  }
  antes += '</table></div>';
  let depois = '<div class="planilha"><table><tr>' + pares.map(([n]) => `<td class="cab">${esc(n)}</td>`).join('') + '</tr>';
  for (const l of linhas) {
    depois += '<tr>' + pares.map(([n]) => {
      const c = col(n);
      let v = abas.Dados[l][c];
      if (datasDados.has(`${letra(c)}${l + 1}`)) v = dataExcel(v);
      return `<td>${esc(v)}</td>`;
    }).join('') + '</tr>';
  }
  depois += '</table></div>';
  return `${antes}<div style="text-align:center;font-size:18pt;color:#0b5cad;margin:1mm 0">↓</div>${depois}`;
}

// ---- Figura da aba Dados: algumas colunas, as primeiras linhas e as linhas com destaque
function figuraDados() {
  const nomes = ['Data dos primeiros sintomas', 'Idade', 'NU_IDADE_N', 'Sexo', 'CS_SEXO', 'Raça/Cor', 'CS_RACA', 'Município de residência'];
  const colunas = nomes.map(col);
  const linhasAmarelas = [...amarelasDados]
    .filter((ref) => colunas.includes([...ref.matchAll(/[A-Z]+/g)][0][0].split('').reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0) - 1))
    .map((ref) => Number(ref.match(/\d+/)[0]) - 1);
  const linhas = [...new Set([0, 1, 2, 3, ...linhasAmarelas])].sort((a, b) => a - b);
  return planilha('Dados', linhas, colunas, { reticencias: true });
}

const figuras = {
  'antes-depois': antesDepois(),
  dados: figuraDados(),
  inconsistencias: planilha('Inconsistências', abas['Inconsistências'].map((_, i) => i), [0, 1, 2, 3, 4]),
  dicionario: planilha('Dicionário usado', [0, 1, 2, 3, 10, 11, 12], [0, 1], { cabecalho: false, titulos: [0, 10], reticencias: true }),
  resumo: planilha('Resumo', abas.Resumo.map((_, i) => i), [0, 1], { cabecalho: false, titulos: [0] }),
};

// ---- Monta o HTML final com fotos embutidas e "imprime" em PDF no Edge
const hoje = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
let html = readFileSync(join(pastaGuia, 'guia-de-uso.html'), 'utf8')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\{\{versao\}\}/g, versao)
  .replace(/\{\{data\}\}/g, hoje)
  .replace(/\{\{img:([\w-]+)\}\}/g, (_, nome) => {
    const f = join(pastaGuia, 'imagens', `${nome}.png`);
    if (!existsSync(f)) throw new Error(`Foto não encontrada: ${f}. Rode ferramentas/fotografar-guia.js.`);
    return `data:image/png;base64,${readFileSync(f).toString('base64')}`;
  })
  .replace(/\{\{fig:([\w-]+)\}\}/g, (_, nome) => {
    if (!(nome in figuras)) throw new Error(`Figura desconhecida: ${nome}`);
    return figuras[nome];
  });
if (/\{\{/.test(html)) throw new Error('Sobrou marca {{...}} sem substituir no guia.');
// --html <arquivo>: guarda também a página montada, para conferir na tela.
if (args.includes('--html')) writeFileSync(args[args.indexOf('--html') + 1], html);

const temp = mkdtempSync(join(tmpdir(), 'guia-'));
try {
  const pagina = join(temp, 'guia.html');
  writeFileSync(pagina, html);
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${join(temp, 'perfil')}`,
    '--no-pdf-header-footer', `--print-to-pdf=${saida}`, pathToFileURL(pagina).href], { stdio: 'ignore', timeout: 120000 });
} finally {
  try { rmSync(temp, { recursive: true, force: true }); } catch { /* o Edge pode demorar a soltar os arquivos */ }
}
if (!existsSync(saida)) throw new Error('O Edge não gerou o PDF.');
console.log(`Gerado ${saida} (${(readFileSync(saida).length / 1024).toFixed(0)} KB)`);
