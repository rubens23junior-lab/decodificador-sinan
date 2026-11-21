// Gera as tabelas de apoio em dicionarios/tabelas/ a partir das fontes do
// DATASUS em docs/fontes/tabelas-apoio:
//   cnes.json.gz          código CNES → nome do estabelecimento (TAB_CNES/DBF/CADGERBR.dbf)
//   cbo.json              código CBO → ocupação (TAB_CNES/DBF/CBO_02.dbf)
//   municipios-datasus.json  municípios que não estão na tabela do IBGE (tb_municip.csv)
//   regioes-saude.json    município → região de saúde (rl_municip_regsaud.csv + tb_regsaud.csv)
//   macrorregioes-saude.json  município → macrorregião de saúde (Regionais/*.xlsx, painel do Ministério da Saúde)
//
// Uso: node ferramentas/gerar-tabelas.js
// Todas as tabelas têm o formato { fonte, descricao, total, valores: { código: rótulo } }.

import { readFileSync, writeFileSync, openSync, readSync, closeSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { lerCabecalhoDBF, criarLeitorRegistrosDBF } from '../src/leitura/dbf.js';
import { lerArquivo } from '../src/leitura/index.js';
import { lerXlsx } from './ler-xlsx.js';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const fontes = `${raiz}docs/fontes/tabelas-apoio/`;
const destino = `${raiz}dicionarios/tabelas/`;
mkdirSync(destino, { recursive: true });

const ORIGEM_DATASUS = 'Baixado pelo Rubens em 01/11/2026 de https://datasus.saude.gov.br';
const ORIGEM_CNES = 'Pacote TAB_CNES baixado pelo Rubens em 01/11/2026 de https://datasus.saude.gov.br/transferencia-de-arquivos/ (a página não informa data); cabeçalho do DBF com data';

/** Lê um DBF grande em pedaços, devolvendo só as colunas pedidas. */
function lerDBF(caminho, colunas) {
  const fd = openSync(caminho, 'r');
  const inicio = Buffer.alloc(65536);
  readSync(fd, inicio, 0, inicio.length, 0);
  const cab = lerCabecalhoDBF(new Uint8Array(inicio.buffer));
  const indices = colunas.map((c) => {
    const i = cab.campos.findIndex((campo) => campo.nome === c);
    if (i === -1) throw new Error(`Coluna ${c} não encontrada em ${caminho}`);
    return i;
  });
  const linhas = [];
  const leitor = criarLeitorRegistrosDBF(cab, { aoRegistro: (v) => linhas.push(indices.map((i) => v[i])) });
  const buf = Buffer.alloc(8 << 20);
  for (let pos = cab.tamCabecalho; ; ) {
    const n = readSync(fd, buf, 0, buf.length, pos);
    if (n <= 0) break;
    leitor.empurrar(new Uint8Array(buf.buffer, 0, n));
    pos += n;
  }
  closeSync(fd);
  leitor.finalizar();
  return { linhas, data: cab.data };
}

/** Lê um CSV inteiro (detecta separador e codificação) como lista de objetos. */
function lerCSV(caminho) {
  const linhas = [];
  let nomes;
  lerArquivo(readFileSync(caminho), {
    formato: 'csv',
    aoCabecalho: (cols) => (nomes = cols.map((c) => c.nome)),
    aoRegistro: (v) => linhas.push(Object.fromEntries(nomes.map((n, i) => [n, v[i]]))),
  });
  return linhas;
}

const dataBr = (d) => d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

function gravar(nome, tabela, comprimir = false) {
  const json = JSON.stringify(tabela);
  const conteudo = comprimir ? gzipSync(json, { level: 9 }) : json;
  writeFileSync(destino + nome, conteudo);
  console.log(`${nome}: ${tabela.total} códigos (${(conteudo.length / 1024 / 1024).toFixed(1)} MB)`);
}

// Alguns estabelecimentos (em geral consultórios) têm no nome um número de
// 11 dígitos, quase sempre o CPF do profissional, às vezes com o rótulo "CPF".
// O número é trocado por "[número omitido]" para não republicar dado pessoal;
// o resto do nome fica como está. CNPJ (14 dígitos) não é afetado.
const NUMERO_PESSOAL = /(?:\bCPF\s*(?:N[º°O]?\.?\s*)?)?(?<![\d./-])\d{3}[ .]?\d{3}[ .]?\d{3}[ ./-]?\d{2}(?![\d/.]|-\d)/g;
export function omitirNumeroPessoal(nome) {
  return nome.replace(NUMERO_PESSOAL, '[número omitido]');
}

// CNES: nome fantasia; se vazio, razão social.
{
  const { linhas, data } = lerDBF(`${fontes}TAB_CNES/DBF/CADGERBR.dbf`, ['CNES', 'FANTASIA', 'RAZ_SOCI']);
  const valores = {};
  for (const [codigo, fantasia, razao] of linhas) {
    if (codigo && !(codigo in valores)) valores[codigo] = omitirNumeroPessoal(fantasia || razao || '');
  }
  gravar('cnes.json.gz', {
    fonte: {
      documento: 'Cadastro Nacional de Estabelecimentos de Saúde – cadastro geral do Brasil (CADGERBR.dbf)',
      orgao: 'Ministério da Saúde / DATASUS',
      data: `${ORIGEM_CNES} ${dataBr(data)}`,
      arquivo: 'docs/fontes/tabelas-apoio/TAB_CNES/DBF/CADGERBR.dbf (fora do Git)',
    },
    descricao: 'Código CNES (7 dígitos) → nome fantasia do estabelecimento (razão social quando não há nome fantasia). Inclui estabelecimentos já excluídos do cadastro. Números de 11 dígitos no nome (em geral CPF) aparecem como "[número omitido]".',
    total: Object.keys(valores).length,
    valores,
  }, true);
}

// CBO 2002.
{
  const { linhas } = lerDBF(`${fontes}TAB_CNES/DBF/CBO_02.dbf`, ['CHAVE', 'DS_REGRA']);
  const valores = Object.fromEntries(linhas.filter(([c]) => c));
  gravar('cbo.json', {
    fonte: {
      documento: 'Classificação Brasileira de Ocupações – CBO 2002 (CBO_02.dbf, pacote TAB_CNES)',
      orgao: 'Ministério da Saúde / DATASUS',
      data: ORIGEM_CNES.replace(/; cabeçalho.*/, ''),
      arquivo: 'docs/fontes/tabelas-apoio/TAB_CNES/DBF/CBO_02.dbf (fora do Git)',
    },
    descricao: 'Código CBO 2002 (6 dígitos) → ocupação.',
    total: Object.keys(valores).length,
    valores,
  });
}

// Municípios do DATASUS que não estão na tabela do IBGE (ignorados, recentes etc.).
{
  const ibge = JSON.parse(readFileSync(`${raiz}dicionarios/tabelas/ibge-municipios.json`, 'utf8'));
  const valores = {};
  for (const m of lerCSV(`${fontes}tb_municip.csv`)) {
    if (!ibge.municipios[m.CO_MUNICIP]) valores[m.CO_MUNICIP] = { nome: m.DS_NOME, uf: m.CO_UF, situacao: m.CO_STATUS };
  }
  gravar('municipios-datasus.json', {
    fonte: {
      documento: 'Tabela de municípios do DATASUS (tb_municip.csv)',
      orgao: 'Ministério da Saúde / DATASUS',
      data: ORIGEM_DATASUS,
      arquivo: 'docs/fontes/tabelas-apoio/tb_municip.csv',
    },
    descricao: 'Só os códigos de 6 dígitos ausentes da tabela do IBGE (por exemplo "Município ignorado" de cada UF). Usada como complemento: o IBGE tem prioridade.',
    total: Object.keys(valores).length,
    valores,
  });
}

// Região de saúde de cada município.
{
  const nomes = Object.fromEntries(lerCSV(`${fontes}tb_regsaud.csv`).map((r) => [r.CO_REGSAUD, r.DS_NOME]));
  const valores = {};
  for (const r of lerCSV(`${fontes}rl_municip_regsaud.csv`)) {
    if (!nomes[r.CO_REGSAUD]) throw new Error(`Região de saúde ${r.CO_REGSAUD} sem nome em tb_regsaud.csv`);
    valores[r.CO_MUNICIP] = `${nomes[r.CO_REGSAUD]} (${r.CO_REGSAUD})`;
  }
  gravar('regioes-saude.json', {
    fonte: {
      documento: 'Relação município × região de saúde (rl_municip_regsaud.csv) e tabela de regiões de saúde (tb_regsaud.csv)',
      orgao: 'Ministério da Saúde / DATASUS',
      data: ORIGEM_DATASUS,
      arquivo: 'docs/fontes/tabelas-apoio/rl_municip_regsaud.csv; docs/fontes/tabelas-apoio/tb_regsaud.csv',
    },
    descricao: 'Município (6 dígitos) → nome e código da região de saúde. Não é a regional de saúde do Sinan (ID_REGIONA), que usa outra numeração.',
    total: Object.keys(valores).length,
    valores,
  });
}

// Macrorregião de saúde de cada município (planilha do painel de
// macrorregiões do Ministério da Saúde). A macrorregião interestadual
// (MIS-PEBA, 53 municípios) não entra.
{
  const ARQUIVO = 'Regionais/4caf4b19-1dc1-4980-9dbf-f7396f2851d9.xlsx';
  const [cabecalho, ...linhas] = lerXlsx(readFileSync(`${fontes}${ARQUIVO}`)).Sheet1;
  const coluna = (nome) => {
    const i = cabecalho.indexOf(nome);
    if (i === -1) throw new Error(`Coluna "${nome}" não encontrada em ${ARQUIVO}`);
    return i;
  };
  const [iMun, iCod, iNome] = [coluna('Código Município'), coluna('Código Macrorregião de Saúde'), coluna('Macrorregião Saúde')];
  const valores = {};
  for (const l of linhas) {
    if (!/^\d{6}$/.test(l[iMun]) || !l[iCod] || !l[iNome]) throw new Error(`Linha incompleta em ${ARQUIVO}: ${l.join(' | ')}`);
    if (valores[l[iMun]]) throw new Error(`Município ${l[iMun]} repetido em ${ARQUIVO}`);
    valores[l[iMun]] = `${l[iNome].trim()} (${l[iCod]})`;
  }
  gravar('macrorregioes-saude.json', {
    fonte: {
      documento: 'Planilha de regiões e macrorregiões de saúde do painel "Macrorregiões" (SEIDIGI/DEMAS), com dados do DGIP/SE/MS',
      orgao: 'Ministério da Saúde',
      data: 'Painel atualizado em 02/11/2026 às 06:00:22, conforme o Rubens; baixado pelo Rubens em 02/11/2026 de https://infoms.saude.gov.br/extensions/SEIDIGI_DEMAS_MACRORREGIOES/SEIDIGI_DEMAS_MACRORREGIOES.html',
      arquivo: `docs/fontes/tabelas-apoio/${ARQUIVO}`,
    },
    descricao: 'Município (6 dígitos) → nome e código da macrorregião de saúde, como escritos no painel. Sem a macrorregião interestadual.',
    total: Object.keys(valores).length,
    valores,
  });
}
