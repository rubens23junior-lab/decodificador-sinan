// Gera dicionarios/tabelas/ocupacoes-sinan.json: as ocupações da tabela do
// próprio Sinan NET (OCUPANET.DBF, pacote TAB_SINANNET do DATASUS) que NÃO
// estão na tabela CBO 2002 do projeto (dicionarios/tabelas/cbo.json).
// São os códigos especiais do Sinan (999991 Estudante, 998999 Ignorada,
// XXX Não informado etc.) e alguns códigos antigos. A CBO tem prioridade;
// esta tabela só complementa (aprovado pelo Rubens em 15/11/2026).
//
// O arquivo de definição da violência do TabWin (ViolenciaNet.def, GT-Sinan/MS)
// diz que ID_OCUPA_N é lido por ocupanet.dbf.
//
// O DBF está na página de código 850 do DOS (byte 29 = 0x02). O Node não traz
// essa codificação; os únicos bytes acima de 127 do arquivo são traduzidos
// pela tabela abaixo, conferida com "iconv -f CP850" em 15/11/2026. Outro byte
// acima de 127 nas linhas usadas faz o programa parar.
//
// Uso: node ferramentas/gerar-ocupacoes-sinan.js

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerCabecalhoDBF } from '../src/leitura/dbf.js';
import { criarXlsx, ESTILO } from '../src/saida/xlsx.js';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const ARQUIVO = 'docs/fontes/tabelas-apoio/TAB_SINANNET/OCUPANET.DBF';
const CP850 = { 0x82: 'é', 0x83: 'â', 0x87: 'ç', 0x88: 'ê', 0x93: 'ô', 0xa0: 'á', 0xa1: 'í', 0xa2: 'ó', 0xa3: 'ú', 0xa8: '¿', 0xc6: 'ã', 0xe4: 'õ' };

const bytes = new Uint8Array(readFileSync(join(raiz, ARQUIVO)));
const cab = lerCabecalhoDBF(bytes);
if (bytes[29] !== 0x02) throw new Error(`${ARQUIVO}: esperava a página de código 850 (byte 29 = 2), veio ${bytes[29]}.`);
const iCodigo = cab.campos.findIndex((c) => c.nome === 'ID_OCUPA_N');
const iNome = cab.campos.findIndex((c) => c.nome === 'NM_OCUPACA');
if (iCodigo === -1 || iNome === -1) throw new Error(`${ARQUIVO}: colunas ID_OCUPA_N e NM_OCUPACA não encontradas.`);

// Lê os bytes de cada campo direto do registro e traduz um a um (o
// TextDecoder do Node trataria "latin1" como windows-1252 e trocaria 0x80–0x9F).
const campoCodigo = cab.campos[iCodigo];
const campoNome = cab.campos[iNome];
const texto = (registro, campo) => [...registro.subarray(campo.deslocamento, campo.deslocamento + campo.tamanho)].map((b) => {
  if (b < 128) return String.fromCharCode(b);
  if (!CP850[b]) throw new Error(`${ARQUIVO}: byte 0x${b.toString(16)} sem tradução conferida.`);
  return CP850[b];
}).join('').trim();
const linhas = [];
for (let r = 0; r < cab.numRegistros; r++) {
  const inicio = cab.tamCabecalho + r * cab.tamRegistro;
  const registro = bytes.subarray(inicio, inicio + cab.tamRegistro);
  if (registro[0] === 0x2a) continue; // registro excluído
  linhas.push([texto(registro, campoCodigo), registro]);
}

// Decisões do Rubens na conferência de 15/11/2026: nome mantido como no
// arquivo oficial, com observação.
const OBSERVACOES = {
  223610: 'Código antigo: não existe na CBO 2002 (Fonoaudiólogo é 223810). Nome mantido como na tabela do Sinan, por decisão do Rubens (15/11/2026).',
  999994: 'O arquivo oficial diz "HABITACAO HABITUAL"; provavelmente quis dizer "ocupação habitual", mas não há documento que confirme. Mantido como no arquivo, por decisão do Rubens (15/11/2026).',
};

const cbo = JSON.parse(readFileSync(join(raiz, 'dicionarios/tabelas/cbo.json'), 'utf8')).valores;
const valores = {};
for (const [codigo, registro] of linhas) {
  if (!codigo || cbo[codigo]) continue;
  if (valores[codigo]) throw new Error(`${ARQUIVO}: código ${codigo} repetido.`);
  const nome = texto(registro, campoNome);
  valores[codigo] = OBSERVACOES[codigo] ? { nome, observacao: OBSERVACOES[codigo] } : nome;
}

const tabela = {
  fonte: {
    documento: 'Tabela de ocupações do Sinan NET (OCUPANET.DBF, pacote TAB_SINANNET do TabWin), usada pelo ViolenciaNet.def para ID_OCUPA_N',
    orgao: 'Ministério da Saúde / DATASUS',
    data: `Pacote baixado pelo Rubens em 15/11/2026 da página de transferência de arquivos do DATASUS (https://datasus.saude.gov.br/transferencia-de-arquivos/); cabeçalho do DBF com data ${cab.data.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`,
    arquivo: ARQUIVO,
  },
  descricao: 'Só os códigos de ocupação do Sinan que não estão na CBO 2002 do projeto (por exemplo 999991 Estudante). Usada como complemento: a CBO tem prioridade. Nomes como escritos no arquivo (maiúsculas, sem acento).',
  total: Object.keys(valores).length,
  valores,
};
writeFileSync(join(raiz, 'dicionarios/tabelas/ocupacoes-sinan.json'), JSON.stringify(tabela, null, 1));
console.log(`ocupacoes-sinan.json: ${tabela.total} códigos (de ${linhas.length} no OCUPANET)`);
for (const [c, n] of Object.entries(valores)) console.log(`  ${c}  ${n}`);

// ---- planilha de conferência: todos os códigos do complemento, com o nome
// curto do semocupa.CNV (mesmo pacote) ao lado quando existir.
const semocupa = {};
for (const l of new TextDecoder('windows-1252').decode(readFileSync(join(raiz, 'docs/fontes/tabelas-apoio/TAB_SINANNET/semocupa.CNV'))).split(/\r?\n/)) {
  const m = l.match(/^\s+\d+\s{2}(.+?)\s{2,}(\S+)\s*$/);
  if (m) semocupa[m[2]] = m[1].trim();
}
const linhasConferencia = [
  ['Código', 'Nome no OCUPANET.DBF (o que a ferramenta vai usar)', 'Nome curto no semocupa.CNV (mesmo pacote)', 'Está certo? (Sim/Não)', 'Observação'],
  ...Object.entries(valores).map(([c, v]) => [c, typeof v === 'string' ? v : v.nome, semocupa[c] ?? '(não está no semocupa.CNV)', '', '']),
];
const planilha = join(raiz, 'docs/conferencia/conferencia-ocupacoes-sinan.xlsx');
// A planilha já conferida pelo Rubens não é sobrescrita (apague-a para gerar outra).
const jaExistia = existsSync(planilha);
if (jaExistia) {
  console.log('Planilha de conferência já existe: mantida.');
} else writeFileSync(planilha, criarXlsx([
  { nome: 'Instruções', linhas: [
    ['Conferência das ocupações do Sinan que não estão na CBO 2002 (campo ID_OCUPA_N)'], [''],
    ['Estes códigos vêm da tabela OCUPANET.DBF do pacote TAB_SINANNET do DATASUS. A CBO continua tendo prioridade; esta lista só cobre o que falta nela.'],
    ['Confira cada nome no arquivo docs/fontes/tabelas-apoio/TAB_SINANNET/OCUPANET.DBF (ou OCUPANET.cnv, que tem os nomes cortados em 50 letras).'],
    ['Os nomes ficam como escritos no arquivo (maiúsculas, sem acento). Na coluna "Está certo?", escreva Sim ou Não; se for Não, explique na Observação.'],
  ], larguras: [140], cabecalho: false },
  { nome: 'Códigos', linhas: linhasConferencia.map((l, i) => (i === 0 ? l : l.map((v) => ({ valor: v, estilo: ESTILO.quebraTexto })))), larguras: [10, 60, 40, 14, 40] },
]));
if (!jaExistia) console.log(`Gerado ${planilha}`);
