// Gera dicionarios/tabelas/cid10.json (código CID-10 → nome) a partir de duas
// fontes do DATASUS em docs/fontes/tabelas-apoio:
//   CNVS CID10 v2019/CID10_01.CNV ... CID10_22.CNV  tabelas de conversão do TabWin (2019)
//   CID10-CSV/CID-10-CATEGORIAS.CSV e CID-10-SUBCATEGORIAS.CSV  CID-10 versão 2008, nomes completos
//
// Regra (aprovada pelo Rubens em 15/11/2026): vale a versão mais recente.
//   1. Nome do TabWin 2019 inteiro: usado como está.
//   2. Nome do TabWin cortado (o campo tem largura fixa): completado com o nome
//      da CSV 2008, só se o nome da CSV começar exatamente pelo trecho do TabWin.
//   3. O resto não entra na tabela e fica listado em "pendencias".
// As marcas @, # e & que o TabWin põe antes de alguns códigos são retiradas;
// o significado delas não está nos arquivos (pendência).
//
// Também gera docs/conferencia/conferencia-cid10.xlsx, com uma amostra sorteada
// (sempre a mesma) para o Rubens conferir contra as fontes.
//
// Uso: node ferramentas/gerar-cid10.js

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarXlsx, ESTILO } from '../src/saida/xlsx.js';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const fontes = join(raiz, 'docs/fontes/tabelas-apoio');
const pastaCnv = join(fontes, 'CNVS CID10 v2019');
const pastaCsv = join(fontes, 'CID10-CSV');
const ler = (caminho) => new TextDecoder('windows-1252').decode(readFileSync(caminho));
const CODIGO = /^[A-Z]\d{2}\d?$/;
const comPonto = (c) => (c.length === 4 ? `${c.slice(0, 3)}.${c[3]}` : c);
// Compara sem diferença de espaços nem de aspas (o TabWin usa ´, a CSV usa ").
const comparavel = (s) => s.normalize('NFC').replace(/\s+/g, ' ').replace(/[´`'"“”]/g, '"').trim();

// ---- CSV 2008: nomes completos
const csv = new Map();
for (const l of ler(join(pastaCsv, 'CID-10-CATEGORIAS.CSV')).split(/\r?\n/).slice(1)) {
  const c = l.split(';');
  if (c[0]?.trim()) csv.set(c[0].trim(), c[2].trim());
}
for (const l of ler(join(pastaCsv, 'CID-10-SUBCATEGORIAS.CSV')).split(/\r?\n/).slice(1)) {
  const c = l.split(';');
  const k = c[0]?.trim();
  if (k && k.length === 4) csv.set(k, c[4].trim());
}

// ---- TabWin 2019
const valores = {};
const pendencias = [];
const contagem = { inteiros: 0, completados: 0 };
const paraConferir = { inteiros: [], completados: [] }; // [código, nome no TabWin, nome na CSV, nome usado]
const arquivos = readdirSync(pastaCnv).filter((f) => /^CID10_\d\d\.cnv$/i.test(f)).sort();
if (arquivos.length !== 22) throw new Error(`Esperava 22 arquivos CID10_NN.CNV, achei ${arquivos.length}.`);
for (const arquivo of arquivos) {
  const linhas = ler(join(pastaCnv, arquivo)).split(/\r?\n/);
  const declarado = Number(linhas[0].trim().split(/\s+/)[1]);
  const entradas = linhas.slice(1).filter((l) => l.trim());
  if (entradas.length !== declarado) throw new Error(`${arquivo}: cabeçalho anuncia ${declarado} linhas, há ${entradas.length}.`);
  // A coluna dos códigos tem posição fixa; é achada na primeira linha.
  const p0 = entradas[0].match(/^(\s*\d+\s{2})[@#&]?(\S+)/);
  const inicioRotulo = p0[1].length;
  const colunaCodigo = entradas[0].lastIndexOf(p0[2]);
  for (const l of entradas) {
    const m = l.slice(inicioRotulo).match(/^[@#&]?(\S+) /);
    const campoRotulo = l.slice(inicioRotulo, colunaCodigo);
    const codigos = l.slice(colunaCodigo).split(',').map((s) => s.trim()).filter(Boolean);
    const codigo = m?.[1];
    if (!codigo || !CODIGO.test(codigo) || codigos[0] !== codigo || !codigos.every((c) => CODIGO.test(c))) {
      pendencias.push({ codigo: codigo ?? '', arquivo, motivo: 'Linha fora do padrão do arquivo (não foi possível separar código e nome com segurança)', linha: l.trim() });
      continue;
    }
    for (const extra of codigos.slice(1)) {
      pendencias.push({ codigo: comPonto(extra), arquivo, motivo: `O TabWin conta este código junto com ${comPonto(codigo)}, sem nome próprio`, linha: l.trim() });
    }
    const nomeTabwin = campoRotulo.trim().replace(/^[@#&]?\S+\s/, '').trim();
    const cortado = campoRotulo.trimEnd().length >= campoRotulo.length - 2;
    const chave = comPonto(codigo);
    if (valores[chave]) throw new Error(`${arquivo}: código ${chave} repetido.`);
    if (!cortado) {
      valores[chave] = nomeTabwin;
      contagem.inteiros++;
      paraConferir.inteiros.push([chave, campoRotulo.trim(), csv.get(codigo) ?? '(não está na CSV)', nomeTabwin]);
      continue;
    }
    const completo = csv.get(codigo);
    if (completo && comparavel(completo).startsWith(comparavel(nomeTabwin))) {
      valores[chave] = { nome: completo, origem: 'Nome do TabWin 2019 cortado; completado com a CSV da CID-10 2008' };
      contagem.completados++;
      paraConferir.completados.push([chave, campoRotulo.trim(), completo, completo]);
    } else {
      pendencias.push({ codigo: chave, arquivo, motivo: completo ? 'Nome cortado no TabWin e diferente na CSV 2008' : 'Nome cortado no TabWin e código ausente da CSV 2008', linha: l.trim() });
    }
  }
}

const tabela = {
  fonte: {
    documento: 'CID-10: tabelas de conversão do TabWin (CID10_01.CNV a CID10_22.CNV, versão 2019) e arquivos CSV da CID-10 versão 2008 (CID10CSV.zip, CBCD/DATASUS)',
    orgao: 'Ministério da Saúde / DATASUS',
    data: 'CNV baixados pelo Rubens da página de transferência de arquivos do DATASUS (https://datasus.saude.gov.br/transferencia-de-arquivos/), arquivos de 2025; CID10CSV.zip baixado em 15/11/2026 de http://www2.datasus.gov.br/cid10/V2008/downloads/CID10CSV.zip (SHA-256 84f23809275575f751255048064bbb244b0de33fd5987ab98df0f98e5f5d2c95)',
    arquivo: 'docs/fontes/tabelas-apoio/CNVS CID10 v2019/; docs/fontes/tabelas-apoio/CID10-CSV/',
  },
  descricao: 'Código CID-10 (categoria "X85" ou subcategoria com ponto "Y04.0") → nome. Nome do TabWin 2019; quando ele vem cortado, completado com a CSV 2008 se o início for igual. Marcas @, # e & do TabWin retiradas.',
  total: Object.keys(valores).length,
  valores,
  pendencias,
};
writeFileSync(join(raiz, 'dicionarios/tabelas/cid10.json'), JSON.stringify(tabela));
console.log(`cid10.json: ${tabela.total} códigos (${contagem.inteiros} com nome inteiro do TabWin, ${contagem.completados} completados pela CSV 2008); ${pendencias.length} pendências`);
const porMotivo = {};
for (const p of pendencias) porMotivo[p.motivo] = (porMotivo[p.motivo] ?? 0) + 1;
for (const [motivo, n] of Object.entries(porMotivo)) console.log(`  ${n}: ${motivo}`);

// ---- planilha de conferência: amostra sorteada com semente fixa
let semente = 20261115;
const aleatorio = () => ((semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648);
const sortear = (lista, n) => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, n).sort((a, b) => a[0].localeCompare(b[0]));
};
const N_COMPLETADOS = 50;
const N_INTEIROS = 20;
const cabecalho = ['Código', 'Linha do TabWin 2019 (como está no arquivo)', 'Nome na CSV 2008', 'Nome que a ferramenta vai usar', 'Está certo? (Sim/Não)', 'Observação'];
const amostra = (lista, n) => [cabecalho, ...sortear(lista, n).map((l) => [...l.map((v) => ({ valor: v, estilo: ESTILO.quebraTexto })), '', ''])];
const instrucoes = [
  ['Conferência da tabela da CID-10 (campo CIRC_LESAO da violência)'],
  [''],
  ['A tabela foi montada assim: vale o nome do TabWin 2019; quando ele vem cortado, é completado com o nome da CSV 2008, só se o começo for igual.'],
  [`Aba "Completados": ${N_COMPLETADOS} códigos sorteados entre os ${contagem.completados} que tiveram o nome completado pela CSV 2008. Confira se o nome usado é o certo (o final vem da versão 2008).`],
  [`Aba "Inteiros": ${N_INTEIROS} códigos sorteados entre os ${contagem.inteiros} com nome inteiro no TabWin. Confira se o nome foi copiado sem erro.`],
  [`Aba "Pendências": os ${pendencias.length} códigos que ficaram sem nome. Eles saem na planilha com o código como veio e vão para a aba Inconsistências.`],
  ['Para conferir, abra os arquivos de docs/fontes/tabelas-apoio/CNVS CID10 v2019 e CID10-CSV, ou a CID-10 no site do DATASUS.'],
  ['Na coluna "Está certo?", escreva Sim ou Não. Se for Não, explique na Observação.'],
  [''],
  ['A amostra é sorteada sempre do mesmo jeito (semente fixa), para que o sorteio possa ser repetido.'],
];
const linhasPendencias = [['Código', 'Arquivo', 'Motivo', 'Linha do TabWin'], ...pendencias.map((p) => [p.codigo, p.arquivo, p.motivo, { valor: p.linha, estilo: ESTILO.quebraTexto }])];
const larguras = [10, 60, 60, 60, 14, 40];
const planilha = join(raiz, 'docs/conferencia/conferencia-cid10.xlsx');
// A planilha já conferida pelo Rubens não é sobrescrita (apague-a para gerar outra).
const jaExistia = existsSync(planilha);
if (jaExistia) {
  console.log('Planilha de conferência já existe: mantida.');
} else writeFileSync(planilha, criarXlsx([
  { nome: 'Instruções', linhas: instrucoes, larguras: [140], cabecalho: false },
  { nome: 'Completados', linhas: amostra(paraConferir.completados, N_COMPLETADOS), larguras },
  { nome: 'Inteiros', linhas: amostra(paraConferir.inteiros, N_INTEIROS), larguras },
  { nome: 'Pendências', linhas: linhasPendencias, larguras: [10, 16, 60, 90] },
]));
if (!jaExistia) console.log(`Gerado ${planilha}`);
