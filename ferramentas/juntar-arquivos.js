// Junta vários arquivos do SINAN (DBC, DBF ou CSV) do mesmo agravo num CSV só,
// com os códigos como vieram. Serve para agravos com poucas notificações por ano
// (por exemplo, tétano neonatal), em que a amostra de validação precisa de vários anos.
//
// As colunas são a união das colunas de todos os arquivos, na ordem em que aparecem;
// quando um arquivo não tem a coluna, a célula fica em branco. Não acrescenta
// nenhuma coluna (o registro nº do CSV segue a ordem dos arquivos informados).
//
// Uso: node ferramentas/juntar-arquivos.js <saída.csv> <arquivo1> <arquivo2> ...
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { lerArquivo, detectarFormato } from '../src/leitura/index.js';

const [saida, ...entradas] = process.argv.slice(2);
if (!saida || entradas.length === 0) {
  console.error('Uso: node ferramentas/juntar-arquivos.js <saída.csv> <arquivo1> <arquivo2> ...');
  process.exit(1);
}

const colunas = [];
const linhas = [];
for (const caminho of entradas) {
  const bytes = readFileSync(caminho);
  let nomes;
  let n = 0;
  lerArquivo(bytes, {
    formato: detectarFormato(basename(caminho), bytes),
    aoCabecalho(campos) {
      nomes = campos.map((c) => c.nome.toUpperCase());
      for (const c of nomes) if (!colunas.includes(c)) colunas.push(c);
    },
    aoRegistro(valores) {
      linhas.push(Object.fromEntries(nomes.map((c, i) => [c, valores[i]])));
      n++;
    },
  });
  console.log(`${basename(caminho)}: ${n} registros`);
}

const campo = (v) => (/[";\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const texto = [colunas.join(';'), ...linhas.map((l) => colunas.map((c) => campo(l[c] ?? '')).join(';'))].join('\r\n') + '\r\n';
writeFileSync(saida, texto, 'utf8');
console.log(`Gravado ${saida}: ${linhas.length} registros e ${colunas.length} colunas.`);
