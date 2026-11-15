// Roda o processamento completo pelo terminal (mesmo código usado na tela),
// para testes com arquivos reais. A saída vai para dados_publicos/saida/,
// que fica fora do Git.
//
// Uso: node ferramentas/decodificar.js <arquivo> [--agravo dengue] [--saida xlsx|csv]
//        [--uf 33] [--de AAAAMMDD] [--ate AAAAMMDD] [--sem-originais] [--cabecalho-original] [--analise]

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { processar } from '../src/processar.js';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const opcao = (nome) => {
  const i = args.indexOf(nome);
  return i === -1 ? undefined : args[i + 1];
};
const caminho = args[0];
if (!caminho || caminho.startsWith('--')) {
  console.error('Uso: node ferramentas/decodificar.js <arquivo> [--agravo dengue] [--saida xlsx|csv] [--uf 33] [--de AAAAMMDD] [--ate AAAAMMDD] [--sem-originais] [--cabecalho-original] [--analise]');
  process.exit(1);
}

const agravo = opcao('--agravo') ?? 'dengue';
const dic = JSON.parse(readFileSync(`${raiz}dicionarios/${agravo}.json`, 'utf8'));
const tabelas = {};
for (const [id, t] of Object.entries(dic.tabelas ?? {})) {
  const bytes = readFileSync(`${raiz}dicionarios/${t.arquivo}`);
  tabelas[id] = JSON.parse((t.arquivo.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString('utf8'));
}

const filtros = [];
if (opcao('--uf')) filtros.push({ coluna: 'SG_UF_NOT', valores: opcao('--uf').split(',') });
if (opcao('--de') || opcao('--ate')) filtros.push({ coluna: 'DT_NOTIFIC', de: opcao('--de'), ate: opcao('--ate') });

const versao = JSON.parse(readFileSync(`${raiz}package.json`, 'utf8')).version;
const inicio = Date.now();
let ultimo = 0;
const resultado = processar({
  bytes: readFileSync(caminho),
  nomeArquivo: basename(caminho),
  dic,
  tabelas,
  versaoFerramenta: versao,
  opcoes: {
    saida: opcao('--saida') ?? 'xlsx',
    manterOriginais: !args.includes('--sem-originais'),
    cabecalhoOriginal: args.includes('--cabecalho-original'),
    formatoAnalise: args.includes('--analise'),
    filtros,
  },
  aoProgresso(fracao, lidos) {
    if (Date.now() - ultimo > 5000) {
      ultimo = Date.now();
      console.log(`  ${(fracao * 100).toFixed(0)}% (${lidos.toLocaleString('pt-BR')} registros lidos)`);
    }
  },
});

const pasta = `${raiz}dados_publicos/saida/`;
mkdirSync(pasta, { recursive: true });
for (const a of resultado.arquivos) {
  const tamanho = a.partes.reduce((s, p) => s + p.length, 0);
  writeFileSync(pasta + a.nome, Buffer.concat(a.partes));
  console.log(`Gravado ${pasta}${a.nome} (${(tamanho / 1048576).toFixed(1)} MB)`);
}
const memoria = (process.memoryUsage().rss / 1048576).toFixed(0);
console.log(`Lidos ${resultado.lidos.toLocaleString('pt-BR')}; incluídos ${resultado.incluidos.toLocaleString('pt-BR')}; ` +
  `${resultado.inconsistencias.length} linhas de inconsistências; ${((Date.now() - inicio) / 1000).toFixed(1)} s; memória ${memoria} MB`);
