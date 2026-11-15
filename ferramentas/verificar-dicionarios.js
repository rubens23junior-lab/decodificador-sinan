// Verifica os dicionários (dicionarios/*.json) e as tabelas de apoio
// (dicionarios/tabelas/).
//
// Uso: node ferramentas/verificar-dicionarios.js [--arquivo <arquivo DBC/DBF/CSV>]
// Com --arquivo, compara também as colunas do arquivo com as de cada dicionário.
// Termina com código de erro se algum dicionário ou tabela tiver erros.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { verificarDicionario, verificarTabela, verificarTabelaMunicipios, compararColunas } from '../src/dicionario/verificar.js';
import { lerCabecalhoDBF } from '../src/leitura/dbf.js';
import { detectarFormato, detectarCodificacao } from '../src/leitura/index.js';
import { detectarSeparador } from '../src/leitura/csv.js';

const PASTA = fileURLToPath(new URL('../dicionarios/', import.meta.url));

function colunasDoArquivo(caminho) {
  const bytes = readFileSync(caminho);
  const formato = detectarFormato(basename(caminho), bytes);
  if (formato === 'csv') {
    const texto = new TextDecoder(detectarCodificacao(bytes)).decode(bytes.subarray(0, 65536)).replace(/^﻿/, '');
    const linha = texto.split(/\r?\n/)[0];
    return linha.split(detectarSeparador(linha)).map((n) => n.replace(/"/g, '').trim());
  }
  return lerCabecalhoDBF(bytes).campos.map((c) => c.nome);
}

function lerJson(caminho) {
  const bytes = readFileSync(caminho);
  return JSON.parse((caminho.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString('utf8'));
}

function relatar(titulo, conteudo, { erros, avisos }, resumo) {
  console.log(`\n== ${titulo}`);
  for (const e of erros) console.log(`  ERRO: ${e}`);
  for (const a of avisos) console.log(`  aviso: ${a}`);
  if (erros.length === 0) console.log(`  OK (${resumo(conteudo)})`);
  return erros.length > 0;
}

const indice = process.argv.indexOf('--arquivo');
const colunasArquivo = indice !== -1 ? colunasDoArquivo(process.argv[indice + 1]) : null;
let comErro = false;

for (const nome of readdirSync(PASTA).filter((n) => n.endsWith('.json')).sort()) {
  let dic;
  try {
    dic = lerJson(join(PASTA, nome));
  } catch (erro) {
    console.log(`\n== ${nome}\n  ERRO: o arquivo não é um JSON válido (${erro.message}).`);
    comErro = true;
    continue;
  }
  const resultado = verificarDicionario(dic);
  for (const [id, t] of Object.entries(dic.tabelas ?? {})) {
    if (t?.arquivo && !existsSync(join(PASTA, t.arquivo))) resultado.erros.push(`Tabela "${id}": arquivo ${t.arquivo} não encontrado.`);
  }
  comErro ||= relatar(nome, dic, resultado, (d) =>
    `${d.colunas.length} colunas, ${d.derivadas?.length ?? 0} colunas extras, ${d.pendencias?.length ?? 0} pendências`);

  if (colunasArquivo && resultado.erros.length === 0) {
    const { semTraducao, ausentesNoArquivo } = compararColunas(dic, colunasArquivo);
    console.log(`  Comparação com o arquivo (${colunasArquivo.length} colunas):`);
    console.log(`    colunas do arquivo sem tradução: ${semTraducao.length ? semTraducao.join(', ') : 'nenhuma'}`);
    console.log(`    colunas do dicionário ausentes no arquivo: ${ausentesNoArquivo.length ? ausentesNoArquivo.join(', ') : 'nenhuma'}`);
  }
}

const pastaTabelas = join(PASTA, 'tabelas');
for (const nome of readdirSync(pastaTabelas).filter((n) => /\.json(\.gz)?$/.test(n)).sort()) {
  let tabela;
  try {
    tabela = lerJson(join(pastaTabelas, nome));
  } catch (erro) {
    console.log(`\n== tabelas/${nome}\n  ERRO: não foi possível ler (${erro.message}).`);
    comErro = true;
    continue;
  }
  const ehIbge = tabela.municipios && !tabela.valores;
  comErro ||= relatar(`tabelas/${nome}`, tabela, ehIbge ? verificarTabelaMunicipios(tabela) : verificarTabela(tabela), (t) =>
    ehIbge ? `${t.total_municipios} municípios` : `${t.total} códigos`);
}

process.exit(comErro ? 1 : 0);
