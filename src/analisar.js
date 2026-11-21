// Análise rápida do arquivo escolhido, antes do processamento: quantos
// registros, quais colunas, quais ficam sem tradução, e quantas notificações
// há em cada UF (para ajudar a escolher filtros e o formato de saída).
// Se o arquivo não for do agravo escolhido, a análise para e, quando recebe os
// outros dicionários, sugere o agravo provável.

import { lerArquivo, detectarFormato } from './leitura/index.js';
import { verificarColunasDoAgravo, criarVerificadorDoAgravo, sugerirAgravo, ErroDecodificacao } from './decodificacao/decodificador.js';
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
  return {
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

/** Monta a mensagem do arquivo incompatível, com o agravo provável. */
function explicarRecusa(recusa, dic, dicionarios, nomes, amostra) {
  if (!dicionarios) return recusa;
  const outros = Object.fromEntries(Object.entries(dicionarios).filter(([, d]) => d !== dic));
  const sugestao = sugerirAgravo(outros, nomes, amostra);
  const motivo = recusa.message.replace(/ Confira se escolheu.*$/, '');
  const mensagem = sugestao
    ? `${motivo} Pelas colunas e pelo código do agravo, ele parece ser de ${sugestao.nome}. Nenhuma planilha foi gerada.`
    : `${motivo} Ele também não corresponde a nenhum outro agravo disponível. Confira se é um arquivo de notificações do SINAN. Nenhuma planilha foi gerada.`;
  return new ErroAgravoIncompativel(mensagem, sugestao);
}
