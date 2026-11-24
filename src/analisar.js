// Análise rápida do arquivo escolhido, antes do processamento: quantos
// registros, quais colunas, quais ficam sem tradução, e quantas notificações
// há em cada UF (para ajudar a escolher filtros e o formato de saída).
// Se o arquivo não for do agravo escolhido, a análise para e, quando recebe os
// outros dicionários, sugere o agravo provável.

import { lerArquivo, detectarFormato } from './leitura/index.js';
import {
  verificarColunasDoAgravo, criarVerificadorDoAgravo, sugerirAgravo, codigosDoAgravo, ErroDecodificacao,
  ErroEstruturaAntiga, estruturaAntiga, mensagemEstruturaAntiga,
} from './decodificacao/decodificador.js';
import { compararColunas } from './dicionario/verificar.js';

const AMOSTRA_SUGESTAO = 1000; // registros guardados para sugerir o agravo provável
const PARAR = Symbol('parar a leitura');

/** Arquivo que não é do agravo escolhido; traz o agravo provável, se houver. */
export class ErroAgravoIncompativel extends ErroDecodificacao {
  /**
   * @param {string} mensagem
   * @param {{id: string, nome: string} | null} sugestao
   */
  constructor(mensagem, sugestao) {
    super(mensagem);
    this.sugestao = sugestao;
  }
}

/**
 * @param {object} p
 * @param {Uint8Array} p.bytes
 * @param {string} p.nomeArquivo
 * @param {any} p.dic
 * @param {Record<string, any>} [p.dicionarios] todos os dicionários disponíveis, para sugerir o agravo provável
 * @param {string} [p.codificacao]
 * @param {(fracao: number) => void} [p.aoProgresso]
 */
export function analisarArquivo({ bytes, nomeArquivo, dic, dicionarios, codificacao, aoProgresso }) {
  const formato = detectarFormato(nomeArquivo, bytes);
  const porNome = new Map(dic.colunas.map((c) => [c.nome.toUpperCase(), c]));
  let nomes = [];
  let contar = [];
  let datas = [];
  let conferirAgravo = () => {};
  let recusa = null; // erro da conferência do agravo, quando houver
  const amostra = [];
  const contagens = {};
  const intervalos = {};

  const conferir = (fn) => {
    try {
      fn();
    } catch (e) {
      if (!(e instanceof ErroDecodificacao)) throw e;
      recusa = e;
    }
  };

  let resultado;
  try {
    resultado = lerArquivo(bytes, {
      formato,
      codificacao,
      aoCabecalho(cols) {
        nomes = cols.map((c) => c.nome);
        conferir(() => verificarColunasDoAgravo(dic, nomes));
        if (!recusa) conferirAgravo = criarVerificadorDoAgravo(dic, nomes);
        // Colunas de UF: contagem por valor. Colunas de data: menor e maior data.
        contar = nomes.map((n, i) => [i, porNome.get(n.toUpperCase())]).filter(([, c]) => c?.tipo === 'uf');
        datas = nomes.map((n, i) => [i, porNome.get(n.toUpperCase())]).filter(([, c]) => c?.tipo === 'data');
        for (const [, c] of contar) contagens[c.nome] = {};
        for (const [, c] of datas) intervalos[c.nome] = { menor: null, maior: null };
      },
      aoRegistro(valores) {
        if (amostra.length < AMOSTRA_SUGESTAO) amostra.push(valores);
        if (!recusa) conferir(() => conferirAgravo(valores));
        // Com o arquivo recusado, basta a amostra para sugerir o agravo.
        if (recusa) {
          if (amostra.length >= AMOSTRA_SUGESTAO) throw PARAR;
          return;
        }
        for (const [i, c] of contar) {
          const mapa = contagens[c.nome];
          mapa[valores[i]] = (mapa[valores[i]] ?? 0) + 1;
        }
        for (const [i, c] of datas) {
          const v = valores[i];
          if (!/^\d{8}$/.test(v)) continue;
          const iv = intervalos[c.nome];
          if (iv.menor === null || v < iv.menor) iv.menor = v;
          if (iv.maior === null || v > iv.maior) iv.maior = v;
        }
      },
      aoProgresso,
    });
  } catch (e) {
    if (e !== PARAR) throw e;
  }
  if (!recusa) conferir(() => conferirAgravo.concluir?.());
  if (recusa) throw explicarRecusa(recusa, dic, dicionarios, nomes, amostra);

  const { semTraducao, ausentesNoArquivo } = compararColunas(dic, nomes);
  // Colunas com dados que identificam a pessoa (exportações do Sinan): a tela avisa.
  const presentes = new Set(nomes.map((n) => n.toUpperCase()));
  const identificacao = dic.colunas.filter((c) => c.identifica && presentes.has(c.nome.toUpperCase())).map((c) => c.nome);
  return {
    identificacao,
    formato,
    codificacao: resultado.codificacao,
    registros: resultado.lidos,
    excluidos: resultado.excluidos,
    colunas: nomes,
    semTraducao,
    ausentesNoArquivo,
    contagens,
    intervalos,
  };
}

/** Anos das notificações da amostra (NU_ANO ou ano da data de notificação): " de 2010" ou " de 2007 a 2008". */
function anosDaAmostra(nomes, amostra) {
  const maiusc = nomes.map((n) => n.toUpperCase());
  const iAno = maiusc.indexOf('NU_ANO');
  const iData = maiusc.indexOf('DT_NOTIFIC');
  const anos = new Set();
  for (const v of amostra) {
    const a = (iAno >= 0 && /^(19|20)\d\d$/.test(v[iAno]) && v[iAno]) || (iData >= 0 && (String(v[iData]).match(/(19|20)\d\d/) || [])[0]);
    if (a) anos.add(a);
  }
  const lista = [...anos].sort();
  if (!lista.length) return '';
  return lista.length === 1 ? ` de ${lista[0]}` : ` de ${lista[0]} a ${lista.at(-1)}`;
}

/** Monta a mensagem do arquivo incompatível, com o agravo provável. */
function explicarRecusa(recusa, dic, dicionarios, nomes, amostra) {
  // Ficha antiga do mesmo agravo (por exemplo, dengue antes de 2014): mensagem própria,
  // com os anos das notificações. Vale também quando as colunas nem combinam (dengue de
  // 2000 a 2006), desde que o código do agravo do arquivo seja o deste dicionário.
  if (dic.estrutura && estruturaAntiga(dic, nomes)) {
    const maiusc = nomes.map((n) => n.toUpperCase());
    const i = maiusc.indexOf(String(dic.agravo.coluna ?? '').toUpperCase());
    const codigos = codigosDoAgravo(dic);
    const marcas = dic.estrutura.marcas_sem_codigo_do_agravo ?? [];
    const doAgravo = i >= 0
      ? amostra.length > 0 && amostra.filter((v) => codigos.includes(v[i])).length > amostra.length / 2
      // Sem a coluna do código do agravo (dengue de 2000 a 2006): reconhecido pelas
      // colunas próprias da ficha daquela época, todas presentes.
      : marcas.length > 0 && marcas.every((m) => maiusc.includes(m.toUpperCase()));
    if (recusa instanceof ErroEstruturaAntiga || doAgravo) return new ErroEstruturaAntiga(mensagemEstruturaAntiga(dic, anosDaAmostra(nomes, amostra)));
  }
  if (!dicionarios) return recusa;
  const outros = Object.fromEntries(Object.entries(dicionarios).filter(([, d]) => d !== dic));
  const sugestao = sugerirAgravo(outros, nomes, amostra);
  const motivo = recusa.message.replace(/ Confira se escolheu.*$/, '');
  const mensagem = sugestao
    ? `${motivo} Pelas colunas e pelo código do agravo, ele parece ser de ${sugestao.nome}. Nenhuma planilha foi gerada.`
    : `${motivo} Ele também não corresponde a nenhum outro agravo disponível. Confira se é um arquivo de notificações do SINAN. Nenhuma planilha foi gerada.`;
  return new ErroAgravoIncompativel(mensagem, sugestao);
}
