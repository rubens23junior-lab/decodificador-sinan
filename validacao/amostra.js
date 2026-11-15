// Validação: sorteia uma amostra de células traduzidas pela ferramenta para o
// Rubens conferir à mão contra os documentos oficiais (conferência às claras).
//
// Cada linha é uma célula (um registro × uma coluna) cujo código foi traduzido.
// Por agravo são 100 células, divididas por tipo de coluna (COTAS). O sorteio é
// uniforme dentro de cada tipo (amostragem por reservatório) e usa uma semente
// fixa: rodar de novo com os mesmos arquivos dá exatamente a mesma amostra.
//
// Uso: node validacao/amostra.js
// Saída: docs/validacao/amostra-conferencia.xlsx (sem registros inteiros: só a célula sorteada)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { lerArquivo, detectarFormato } from '../src/leitura/index.js';
import { criarDecodificador } from '../src/decodificacao/decodificador.js';
import { categoriasDaColuna, NOMES_TIPOS } from '../src/dicionario/tipos.js';
import { criarXlsx, ESTILO } from '../src/saida/xlsx.js';

const SEMENTE = 20261102;
const ARQUIVOS = [
  ['dengue', 'DENGBR25.dbc'],
  ['chikungunya', 'CHIKBR25.dbc'],
  ['zika', 'ZIKABR25.dbc'],
  ['leishmaniose-tegumentar', 'LTANBR25.dbc'],
  ['leishmaniose-visceral', 'LVH.csv'],
];
// Células por tipo de coluna, em cada agravo (total 100). Se um tipo não tiver
// células suficientes, a sobra vai para as listas de códigos.
const COTAS = { categorico: 60, idade: 8, municipio: 8, uf: 6, tabela: 8, extra: 10 };
const NOME_COTA = { categorico: 'Lista de códigos', idade: 'Idade', municipio: 'Município', uf: 'UF', tabela: 'CNES/CBO', extra: 'Coluna extra (região/macrorregião)' };

const raiz = fileURLToPath(new URL('../', import.meta.url));

/** Gerador pseudoaleatório com semente (mulberry32). */
function aleatorio(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Reservatório: guarda n itens sorteados uniformemente de um fluxo. */
function reservatorio(n, sorteio) {
  const itens = [];
  let vistos = 0;
  return {
    oferecer(fazer) {
      vistos++;
      if (itens.length < n) itens.push(fazer());
      else {
        const j = Math.floor(sorteio() * vistos);
        if (j < n) itens[j] = fazer();
      }
    },
    get itens() { return itens; },
    get vistos() { return vistos; },
  };
}

const arquivoFonte = (dic, id) => (dic.fontes[id] ? basename(dic.fontes[id].arquivo.replace(/ \(fora do Git\)$/, '')) : '');

/** Onde o Rubens confere a célula: documento e local. */
function ondeConferir(dic, col, codigo) {
  if (col.derivada) {
    const t = dic.tabelas[col.tabela];
    return `Tabela ${col.tabela}: ${t.fonte} (${arquivoFonte(dic, t.fonte)}); município pelo código de ${col.de}`;
  }
  if (col.tipo === 'categorico') {
    const cat = categoriasDaColuna(dic, col).find((c) => c.codigos.includes(codigo));
    const id = cat?.fonte ?? col.fonte;
    const decisao = /Decisão do Rubens/.test(col.observacao ?? '') ? ' (ver também a decisão do Rubens na observação da coluna)' : '';
    return `${id} (${arquivoFonte(dic, id)}), ${cat?.local ?? col.local}${decisao}`;
  }
  if (col.tipo === 'tabela') {
    const t = dic.tabelas[col.tabela];
    const alternativa = {
      cnes: '; também na consulta pública do CNES (cnes.datasus.gov.br)',
      cbo: '; também em docs/fontes/CBO/cbo2002-ocupacao.csv (os títulos podem diferir em maiúsculas)',
    }[col.tabela] ?? '';
    return `Tabela ${col.tabela}: ${t.fonte} (${arquivoFonte(dic, t.fonte)})${alternativa}`;
  }
  if (col.tipo === 'municipio' || col.tipo === 'uf') {
    const t = dic.tabelas.ibge_municipios;
    return `${t.fonte} (${arquivoFonte(dic, t.fonte)}); regra no dicionário: ${col.fonte}, ${col.local}`;
  }
  return `${col.fonte} (${arquivoFonte(dic, col.fonte)}), ${col.local}`;
}

const linhas = [];
const metodo = [['Agravo', 'Arquivo', 'Registros lidos', 'Tipo de coluna', 'Células disponíveis', 'Células sorteadas']];
const sorteio = aleatorio(SEMENTE);

for (const [agravo, nomeArquivo] of ARQUIVOS) {
  const caminho = `${raiz}dados_publicos/${nomeArquivo}`;
  if (!existsSync(caminho)) throw new Error(`Arquivo não encontrado: ${caminho}`);
  const dic = JSON.parse(readFileSync(`${raiz}dicionarios/${agravo}.json`, 'utf8'));
  const tabelas = {};
  for (const [id, t] of Object.entries(dic.tabelas ?? {})) {
    const bytes = readFileSync(`${raiz}dicionarios/${t.arquivo}`);
    tabelas[id] = JSON.parse((t.arquivo.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString('utf8'));
  }
  const decodificador = criarDecodificador(dic, tabelas, { manterOriginais: false });
  const porNome = new Map(dic.colunas.map((c) => [c.nome.toUpperCase(), c]));
  const derivadas = new Map((dic.derivadas ?? []).map((d) => [d.nome.toUpperCase(), { ...d, derivada: true, rotulo: d.rotulo }]));

  // Reservatórios com folga: a sobra de um tipo vai para as listas de códigos.
  const res = Object.fromEntries(Object.keys(COTAS).map((t) => [t, reservatorio(100, sorteio)]));
  let colunas; // [{ k, iArquivo, col, cota }]
  let numero = 0;
  const bytes = readFileSync(caminho);
  const leitura = lerArquivo(bytes, {
    formato: detectarFormato(nomeArquivo, bytes),
    aoCabecalho(campos) {
      const nomes = campos.map((c) => c.nome.toUpperCase());
      colunas = decodificador.prepararColunas(campos.map((c) => c.nome)).map((p, k) => {
        const m = /^(\S+) \(calculada de (\S+)\)$/.exec(p.original);
        const col = m ? derivadas.get(m[1].toUpperCase()) : porNome.get(p.original.toUpperCase());
        if (!col) return null;
        const cota = col.derivada ? 'extra' : col.tipo;
        if (!(cota in COTAS)) return null;
        return { k, iArquivo: nomes.indexOf((m ? m[2] : p.original).toUpperCase()), col, cota };
      }).filter(Boolean);
    },
    aoRegistro(valores) {
      numero++;
      const { valores: saida, alertas } = decodificador.decodificar(valores);
      for (const c of colunas) {
        const codigo = valores[c.iArquivo];
        const texto = saida[c.k];
        if (codigo === '' || texto === null || texto === undefined || alertas?.includes(c.k)) continue;
        const registro = numero;
        res[c.cota].oferecer(() => ({ registro, col: c.col, cota: c.cota, codigo, texto: String(texto) }));
      }
    },
  });

  // Aplica as cotas; a sobra vai para as listas de códigos.
  let sobra = 0;
  const escolhidas = {};
  for (const [tipo, n] of Object.entries(COTAS)) {
    if (tipo === 'categorico') continue;
    escolhidas[tipo] = res[tipo].itens.slice(0, n);
    sobra += n - escolhidas[tipo].length;
  }
  escolhidas.categorico = res.categorico.itens.slice(0, COTAS.categorico + sobra);
  for (const [tipo, itens] of Object.entries(escolhidas)) {
    metodo.push([dic.agravo.nome, nomeArquivo, leitura.lidos, NOME_COTA[tipo], res[tipo].vistos, itens.length]);
    for (const it of itens) linhas.push({ agravo: dic.agravo.nome, nomeArquivo, dic, ...it });
  }
  console.log(`${dic.agravo.nome}: ${leitura.lidos.toLocaleString('pt-BR')} registros; ${Object.values(escolhidas).reduce((s, i) => s + i.length, 0)} células sorteadas`);
}

// Ordena por agravo, coluna e registro, para facilitar a consulta aos PDFs.
const ordemAgravo = new Map(ARQUIVOS.map(([, a], i) => [a, i]));
linhas.sort((a, b) => ordemAgravo.get(a.nomeArquivo) - ordemAgravo.get(b.nomeArquivo) || a.col.nome.localeCompare(b.col.nome) || a.registro - b.registro);

const amostra = [['Nº', 'Agravo', 'Arquivo', 'Registro nº', 'Coluna', 'Nome legível', 'Tipo', 'Código original', 'Texto da ferramenta', 'Onde conferir', 'Correto? (SIM/NÃO)', 'Comentário']];
linhas.forEach((l, i) => {
  const tipo = l.col.derivada ? 'Coluna extra' : NOMES_TIPOS[l.col.tipo];
  amostra.push([i + 1, l.agravo, l.nomeArquivo, l.registro, l.col.nome, l.col.rotulo, tipo, l.codigo, l.texto, ondeConferir(l.dic, l.col, l.codigo), '', '']);
});

const instrucoes = [
  ['Conferência por amostra: validação da ferramenta para uso científico'],
  [''],
  ['Como conferir'],
  ['1. Na aba Amostra, cada linha é uma célula sorteada: um registro e uma coluna de um arquivo público do DATASUS.'],
  ['2. Para cada linha, abra o documento indicado em "Onde conferir" (pasta docs/fontes) e procure o código original.'],
  ['3. Escreva SIM em "Correto?" se o texto da ferramenta for o que o documento oficial diz para aquele código; senão, NÃO e explique no Comentário.'],
  ['4. Confira pelo documento, sem confiar na ferramenta. Diferenças só de maiúsculas e acentos que reproduzem a fonte contam como SIM.'],
  ['5. Idade: o 1º dígito é a unidade (1 hora, 2 dia, 3 mês, 4 ano) e os demais, o valor. Município e UF: tabela do IBGE (DTB). CNES e CBO: tabelas do DATASUS.'],
  [''],
  ['Método'],
  [`Sorteio com semente fixa ${SEMENTE} (gerador mulberry32), uniforme dentro de cada tipo de coluna (amostragem por reservatório).`],
  ['Só entram células com código traduzido (ficam de fora campos vazios, texto livre, datas e códigos sem tradução).'],
  ['Cotas por agravo: 60 em listas de códigos, 8 idade, 8 município, 6 UF, 8 CNES/CBO, 10 colunas extras; a sobra de um tipo vai para as listas de códigos.'],
  ['Script: validacao/amostra.js. Detalhes por agravo na aba Método.'],
  [`Gerada em ${new Date().toLocaleString('pt-BR')}.`],
];

const destino = `${raiz}docs/validacao/amostra-conferencia.xlsx`;
writeFileSync(destino, criarXlsx([
  { nome: 'Instruções', linhas: instrucoes.map((l, i) => (i === 0 || l[0] === 'Como conferir' || l[0] === 'Método' ? [{ valor: l[0], estilo: ESTILO.cabecalho }] : l)), larguras: [140], cabecalho: false },
  { nome: 'Amostra', linhas: amostra, larguras: [6, 18, 13, 11, 12, 34, 16, 14, 40, 55, 12, 40] },
  { nome: 'Método', linhas: metodo, larguras: [30, 14, 14, 32, 18, 16] },
]));
console.log(`Gravada ${destino} com ${linhas.length} células.`);
