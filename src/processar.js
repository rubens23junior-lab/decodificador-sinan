// Processamento completo: lê o arquivo, decodifica cada registro e gera a
// planilha (ou o CSV) com as abas de apoio.
//
// Tudo acontece na memória do computador do usuário; nada é enviado pela rede.

import { lerArquivo, detectarFormato } from './leitura/index.js';
import { criarDecodificador, codigosDoAgravo, TIPO_CELULA } from './decodificacao/decodificador.js';
import { criarPlanilhaEmFluxo, ESTILO } from './saida/xlsx.js';
import { criarCsvEmFluxo } from './saida/csv.js';
import { NOMES_TIPOS, categoriasDaColuna } from './dicionario/tipos.js';

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MIME_CSV = 'text/csv';

function dataIso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nomeBase(dic, agora) {
  const agravo = dic.agravo.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return `${agravo}_decodificado_${dataIso(agora)}`;
}

function descreverFiltros(filtros, dic) {
  if (!filtros?.length) return 'Nenhum (todos os registros)';
  return filtros
    .map((f) => {
      const col = dic.colunas.find((c) => c.nome.toUpperCase() === f.coluna.toUpperCase());
      const nome = col ? `${col.rotulo} (${col.nome})` : f.coluna;
      if (f.valores) return `${nome} = ${f.valores.join(', ')}`;
      return `${nome} de ${f.de ?? 'início'} até ${f.ate ?? 'fim'}`;
    })
    .join('; ');
}

/** Escreve as abas de apoio: Inconsistências, Dicionário usado e Resumo. */
function escreverAbasDeApoio(planilha, { dic, tabelas, inconsistencias, resumo }) {
  planilha.iniciarAba('Inconsistências', { larguras: [14, 45, 22, 55, 12] });
  planilha.linha(['Coluna', 'Nome legível', 'Valor encontrado', 'Motivo', 'Quantidade'], ESTILO.cabecalho);
  for (const i of inconsistencias) planilha.linha([i.coluna, i.rotulo, i.valor, i.motivo, i.quantidade]);
  if (inconsistencias.length === 0) planilha.linha(['Nenhuma inconsistência encontrada.']);
  planilha.fecharAba();

  planilha.iniciarAba('Dicionário usado', { larguras: [16, 45, 30, 40, 26, 70, 60], linhasCabecalho: 0 });
  const titulo = (t) => planilha.linha([t], ESTILO.cabecalho);
  titulo('Dicionário');
  const codigos = codigosDoAgravo(dic);
  planilha.linha(['Agravo', `${dic.agravo.nome}${codigos.length ? ` (${codigos.join(' / ')})` : ''}`]);
  planilha.linha(['Versão', dic.versao]);
  planilha.linha(['Conferido por', `${dic.conferencia.por} em ${dic.conferencia.data}`]);
  for (const c of dic.convencoes ?? []) planilha.linha(['Regra', c]);
  planilha.linha([]);
  titulo('Fontes');
  planilha.linha(['ID', 'Documento', 'Órgão', 'Data', 'Arquivo'], ESTILO.cabecalhoOriginal);
  for (const [id, f] of Object.entries(dic.fontes)) planilha.linha([id, f.documento, f.orgao, f.data, f.arquivo]);
  planilha.linha([]);
  titulo('Colunas e categorias aplicadas');
  planilha.linha(['Coluna', 'Nome legível', 'Tipo', 'Fonte (local)', 'Tabela', 'Categorias', 'Observação'], ESTILO.cabecalhoOriginal);
  for (const col of dic.colunas) {
    const cats = categoriasDaColuna(dic, col)
      .map((c) => `${c.codigos.join('/')} = ${c.plural ? `${c.rotulo} (${c.plural})` : c.rotulo}${c.fonte ? ` [${c.fonte}]` : ''}`)
      .join('; ');
    const tipo = col.tipo === 'tabela' ? `${NOMES_TIPOS.tabela}` : NOMES_TIPOS[col.tipo];
    planilha.linha([col.nome, col.rotulo, tipo, `${col.fonte} (${col.local})`, col.tabela ?? '', cats, col.observacao ?? '']);
  }
  if (dic.derivadas?.length) {
    planilha.linha([]);
    titulo('Colunas extras (calculadas)');
    planilha.linha(['Coluna', 'Nome legível', 'Calculada a partir de', 'Tabela', 'Observação'], ESTILO.cabecalhoOriginal);
    for (const d of dic.derivadas) planilha.linha([d.nome, d.rotulo, d.de, d.tabela, d.observacao ?? '']);
  }
  if (Object.keys(dic.tabelas ?? {}).length) {
    planilha.linha([]);
    titulo('Tabelas de apoio');
    planilha.linha(['Tabela', 'Fonte', 'Códigos', 'Descrição'], ESTILO.cabecalhoOriginal);
    for (const [id, t] of Object.entries(dic.tabelas)) {
      const conteudo = tabelas[id];
      const total = conteudo.total ?? conteudo.total_municipios ?? '';
      planilha.linha([id, `${t.fonte} – ${dic.fontes[t.fonte].documento}`, total, conteudo.descricao ?? conteudo.regra ?? '']);
    }
  }
  planilha.fecharAba();

  planilha.iniciarAba('Resumo', { larguras: [42, 90], linhasCabecalho: 0 });
  titulo('Resumo do processamento');
  for (const [chave, valor] of resumo) planilha.linha([chave, valor]);
  planilha.fecharAba();
}

/**
 * Processa um arquivo.
 * @param {object} p
 * @param {Uint8Array} p.bytes conteúdo do arquivo
 * @param {string} p.nomeArquivo
 * @param {any} p.dic dicionário do agravo
 * @param {Record<string, any>} p.tabelas tabelas de apoio, pelo id do dicionário
 * @param {object} [p.opcoes]
 * @param {'xlsx'|'csv'} [p.opcoes.saida] formato de saída (padrão xlsx)
 * @param {boolean} [p.opcoes.manterOriginais] (padrão: sim)
 * @param {boolean} [p.opcoes.cabecalhoOriginal] 2ª linha com o nome original (padrão: não)
 * @param {boolean} [p.opcoes.formatoAnalise] nomes do SINAN, idade_anos e CSV para R/Stata/Python (padrão: não)
 * @param {string[]|null} [p.opcoes.colunas] colunas escolhidas (padrão: todas)
 * @param {object[]} [p.opcoes.filtros]
 * @param {string} [p.opcoes.codificacao]
 * @param {string} p.versaoFerramenta
 * @param {Date} [p.agora]
 * @param {(fracao: number, lidos: number) => void} [p.aoProgresso]
 * @param {(nome: string, tipo: string) => {escrever: (pedaco: Uint8Array) => void, concluir: () => object}} [p.criarDestino]
 *   onde guardar cada arquivo gerado; o padrão junta os pedaços em "partes"
 * @returns {{arquivos: {nome: string, tipo: string}[], lidos: number, incluidos: number, excluidos: number, inconsistencias: object[]}}
 *   cada arquivo traz também o que o destino devolveu ao concluir
 */
export function processar({ bytes, nomeArquivo, dic, tabelas, opcoes = {}, versaoFerramenta, agora = new Date(), aoProgresso, criarDestino = destinoEmMemoria }) {
  const { saida = 'xlsx', manterOriginais = true, colunas = null, filtros = [], codificacao, formatoAnalise = false } = opcoes;
  // No formato para análise o cabeçalho tem uma linha só, para ser lido direto pelo R.
  const cabecalhoOriginal = !formatoAnalise && (opcoes.cabecalhoOriginal ?? false);
  const formato = detectarFormato(nomeArquivo, bytes);
  const dec = criarDecodificador(dic, tabelas, { manterOriginais, colunas, filtros, formatoAnalise });
  const base = nomeBase(dic, agora);

  const principal = { nome: `${base}.${saida}`, tipo: saida === 'csv' ? MIME_CSV : MIME_XLSX };
  principal.destino = criarDestino(principal.nome, principal.tipo);
  const planilha = saida === 'xlsx' ? criarPlanilhaEmFluxo(principal.destino.escrever) : null;
  const csv = saida === 'csv' ? criarCsvEmFluxo(principal.destino.escrever, { analise: formatoAnalise }) : null;

  let estilosBase = null;
  let ehData = null;
  let lidos = 0;
  let incluidos = 0;
  let colunasSaida = [];

  const leitura = lerArquivo(bytes, {
    formato,
    codificacao,
    aoCabecalho(cols) {
      colunasSaida = dec.prepararColunas(cols.map((c) => c.nome));
      ehData = colunasSaida.map((c) => c.tipoCelula === TIPO_CELULA.data);
      estilosBase = ehData.map((d) => (d ? ESTILO.data : ESTILO.normal));
      if (planilha) {
        planilha.iniciarAba('Dados', {
          larguras: colunasSaida.map((c) => Math.min(45, Math.max(10, c.cabecalho.length + 2))),
          linhasCabecalho: cabecalhoOriginal ? 2 : 1,
        });
        planilha.linha(colunasSaida.map((c) => c.cabecalho), ESTILO.cabecalho);
        if (cabecalhoOriginal) planilha.linha(colunasSaida.map((c) => c.original), ESTILO.cabecalhoOriginal);
      } else {
        csv.linha(colunasSaida.map((c) => c.cabecalho));
        if (cabecalhoOriginal) csv.linha(colunasSaida.map((c) => c.original));
      }
    },
    aoRegistro(valores) {
      lidos++;
      if (!dec.aceita(valores)) return;
      incluidos++;
      const r = dec.decodificar(valores);
      if (planilha) {
        let estilos = estilosBase;
        if (r.alertas) {
          estilos = estilosBase.slice();
          for (const k of r.alertas) estilos[k] = ESTILO.destaque;
        }
        planilha.linha(r.valores, estilos);
      } else {
        csv.linha(r.valores, ehData);
      }
    },
    aoProgresso: aoProgresso ? (f) => aoProgresso(f, lidos) : undefined,
  });

  const inconsistencias = dec.listarInconsistencias();
  const resumo = [
    ['Arquivo de entrada', nomeArquivo],
    ['Formato e codificação', `${formato.toUpperCase()}, ${leitura.codificacao}`],
    ['Registros lidos', lidos],
    ['Registros marcados como excluídos no arquivo (não incluídos)', leitura.excluidos],
    ['Filtros aplicados', descreverFiltros(filtros, dic)],
    ['Registros incluídos na planilha', incluidos],
    ['Colunas na planilha', colunasSaida.length],
    ['Colunas originais mantidas ao lado das traduzidas', manterOriginais ? 'Sim' : 'Não'],
    ['Formato para análise (R, Stata, Python)', formatoAnalise
      ? 'Sim: nomes de coluna do SINAN em minúsculas (código original em <nome>_cod); idade_anos em anos completos (menor de 1 ano = 0; idade inválida ou implausível fica vazia). O nome legível de cada coluna está na aba Dicionário usado.'
      : 'Não'],
    ['Valores sem tradução (total de ocorrências)', inconsistencias.filter((i) => i.valor !== '(coluna inteira)').reduce((s, i) => s + i.quantidade, 0)],
    ['Dicionário', `${dic.agravo.nome} – ${dic.versao}`],
    ['Dicionário conferido por', `${dic.conferencia.por} em ${dic.conferencia.data}`],
    ['Data e hora do processamento', agora.toLocaleString('pt-BR')],
    ['Versão da ferramenta', versaoFerramenta],
    ['Privacidade', 'Processado inteiramente no computador do usuário, sem envio pela internet. A planilha contém os mesmos dados do arquivo original.'],
  ];

  const arquivos = [principal];
  if (planilha) {
    planilha.fecharAba();
    escreverAbasDeApoio(planilha, { dic, tabelas, inconsistencias, resumo });
    planilha.finalizar();
  } else {
    csv.finalizar();
    const apoio = { nome: `${base}_apoio.xlsx`, tipo: MIME_XLSX };
    apoio.destino = criarDestino(apoio.nome, apoio.tipo);
    const planilhaApoio = criarPlanilhaEmFluxo(apoio.destino.escrever);
    escreverAbasDeApoio(planilhaApoio, { dic, tabelas, inconsistencias, resumo });
    planilhaApoio.finalizar();
    arquivos.push(apoio);
  }

  return {
    arquivos: arquivos.map(({ nome, tipo, destino }) => ({ nome, tipo, ...destino.concluir() })),
    lidos,
    incluidos,
    excluidos: leitura.excluidos,
    inconsistencias,
  };
}

/** Destino padrão: guarda os pedaços na memória ({ partes }). */
function destinoEmMemoria() {
  const partes = [];
  return {
    escrever: (pedaco) => partes.push(pedaco.slice()),
    concluir: () => ({ partes }),
  };
}
