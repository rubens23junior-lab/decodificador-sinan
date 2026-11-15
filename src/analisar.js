// Análise rápida do arquivo escolhido, antes do processamento: quantos
// registros, quais colunas, quais ficam sem tradução, e quantas notificações
// há em cada UF (para ajudar a escolher filtros e o formato de saída).

import { lerArquivo, detectarFormato } from './leitura/index.js';
import { verificarColunasDoAgravo, criarVerificadorDoAgravo } from './decodificacao/decodificador.js';
import { compararColunas } from './dicionario/verificar.js';

/**
 * @param {object} p
 * @param {Uint8Array} p.bytes
 * @param {string} p.nomeArquivo
 * @param {any} p.dic
 * @param {string} [p.codificacao]
 * @param {(fracao: number) => void} [p.aoProgresso]
 */
export function analisarArquivo({ bytes, nomeArquivo, dic, codificacao, aoProgresso }) {
  const formato = detectarFormato(nomeArquivo, bytes);
  const porNome = new Map(dic.colunas.map((c) => [c.nome.toUpperCase(), c]));
  let nomes = [];
  let contar = [];
  let datas = [];
  let conferirAgravo = () => {};
  const contagens = {};
  const intervalos = {};

  const resultado = lerArquivo(bytes, {
    formato,
    codificacao,
    aoCabecalho(cols) {
      nomes = cols.map((c) => c.nome);
      verificarColunasDoAgravo(dic, nomes);
      conferirAgravo = criarVerificadorDoAgravo(dic, nomes);
      // Colunas de UF: contagem por valor. Colunas de data: menor e maior data.
      contar = nomes.map((n, i) => [i, porNome.get(n.toUpperCase())]).filter(([, c]) => c?.tipo === 'uf');
      datas = nomes.map((n, i) => [i, porNome.get(n.toUpperCase())]).filter(([, c]) => c?.tipo === 'data');
      for (const [, c] of contar) contagens[c.nome] = {};
      for (const [, c] of datas) intervalos[c.nome] = { menor: null, maior: null };
    },
    aoRegistro(valores) {
      conferirAgravo(valores);
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
