// Validação: decodifica um arquivo com a nossa ferramenta (o mesmo código da
// tela) e conta, para cada coluna, os pares "código original -> texto".
// É o equivalente de validacao/microdatasus-pares.R, com a mesma saída.
//
// Uso: node validacao/ferramenta-pares.js <arquivo> <agravo> <saida.csv>
// Exemplo:
//   node validacao/ferramenta-pares.js dados_publicos/dengue-chikungunya/DENGBR25.dbc dengue dados_publicos/saida/pares-ferramenta-dengue.csv
//
// Saída (CSV em UTF-8): coluna, codigo, rotulo, n
//   - datas: código e texto em AAAA-MM-DD, como o R as escreve;
//   - campo vazio continua vazio; código sem tradução aparece com o próprio código.

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { lerArquivo, detectarFormato } from '../src/leitura/index.js';
import { criarDecodificador } from '../src/decodificacao/decodificador.js';

const [arquivo, agravo, saida] = process.argv.slice(2);
if (!saida) {
  console.error('Uso: node validacao/ferramenta-pares.js <arquivo> <agravo> <saida.csv>');
  process.exit(1);
}
const raiz = fileURLToPath(new URL('../', import.meta.url));
const dic = JSON.parse(readFileSync(`${raiz}dicionarios/${agravo}.json`, 'utf8'));
const tabelas = {};
for (const [id, t] of Object.entries(dic.tabelas ?? {})) {
  const bytes = readFileSync(`${raiz}dicionarios/${t.arquivo}`);
  tabelas[id] = JSON.parse((t.arquivo.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString('utf8'));
}

const inicio = Date.now();
const decodificador = criarDecodificador(dic, tabelas, { manterOriginais: false });
const tipoPorNome = new Map(dic.colunas.map((c) => [c.nome.toUpperCase(), c.tipo]));

const MS_POR_DIA = 86400000;
const EPOCA_EXCEL = Date.UTC(1899, 11, 30);
const isoDeSerial = (n) => new Date(EPOCA_EXCEL + n * MS_POR_DIA).toISOString().slice(0, 10);
const isoDeTexto = (v) => (/^\d{8}$/.test(v) ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6)}` : v);

let colunas; // [{ nome, iArquivo, iSaida, data }]
const contagem = new Map(); // "coluna\u0000codigo\u0000rotulo" -> n
const bytes = readFileSync(arquivo);
const leitura = lerArquivo(bytes, {
  formato: detectarFormato(basename(arquivo), bytes),
  aoCabecalho(campos) {
    const nomes = campos.map((c) => c.nome);
    const plano = decodificador.prepararColunas(nomes);
    colunas = plano.map((p, iSaida) => {
      const nome = p.original.toUpperCase();
      return { nome, iArquivo: nomes.findIndex((n) => n.toUpperCase() === nome), iSaida, data: tipoPorNome.get(nome) === 'data' };
    }).filter((c) => c.iArquivo !== -1);
  },
  aoRegistro(valores) {
    const { valores: decodificados } = decodificador.decodificar(valores);
    for (const c of colunas) {
      let codigo = valores[c.iArquivo];
      let rotulo = decodificados[c.iSaida] ?? '';
      if (c.data) {
        codigo = isoDeTexto(codigo);
        rotulo = typeof rotulo === 'number' ? isoDeSerial(rotulo) : isoDeTexto(String(rotulo));
      }
      const chave = `${c.nome}\u0000${codigo}\u0000${rotulo}`;
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    }
  },
});

const aspas = (v) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const linhas = ['coluna,codigo,rotulo,n'];
for (const [chave, n] of contagem) linhas.push([...chave.split('\u0000'), String(n)].map(aspas).join(','));
writeFileSync(saida, linhas.join('\n') + '\n');
console.log(`Lidos ${leitura.lidos.toLocaleString('pt-BR')} registros (${extname(arquivo).slice(1).toUpperCase()}, ${leitura.codificacao}); ` +
  `gravado ${saida} com ${contagem.size.toLocaleString('pt-BR')} pares; ${((Date.now() - inicio) / 1000).toFixed(0)} s`);
