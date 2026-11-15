// Saída em CSV, em fluxo, para resultados grandes demais para o Excel.
// Formato pensado para abrir no Excel em português: UTF-8 com marca BOM,
// separador ponto e vírgula e datas em dd/mm/aaaa. No formato para análise
// (R, Stata, Python): UTF-8 sem BOM, vírgula, ponto decimal e datas aaaa-mm-dd.

const BOM = '﻿';
const MS_POR_DIA = 86400000;
const EPOCA_EXCEL = Date.UTC(1899, 11, 30);

/** Converte o número de série de data do Excel para dd/mm/aaaa. */
export function dataExcelParaTexto(serie) {
  const d = new Date(EPOCA_EXCEL + serie * MS_POR_DIA);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

/** Converte o número de série de data do Excel para aaaa-mm-dd. */
export function dataExcelParaIso(serie) {
  return new Date(EPOCA_EXCEL + serie * MS_POR_DIA).toISOString().slice(0, 10);
}

/**
 * @param {(pedaco: Uint8Array) => void} aoSaida
 * @param {{separador?: string, analise?: boolean}} [opcoes] analise: formato para R, Stata e Python
 */
export function criarCsvEmFluxo(aoSaida, { analise = false, separador = analise ? ',' : ';' } = {}) {
  const codificador = new TextEncoder();
  const precisaAspas = new RegExp(`[${separador}"\\r\\n]`);
  let buffer = analise ? [] : [BOM];
  let tamanho = buffer.length;

  function despejar() {
    if (buffer.length) aoSaida(codificador.encode(buffer.join('')));
    buffer = [];
    tamanho = 0;
  }

  function campo(v, ehData) {
    if (v === null || v === undefined) return '';
    if (ehData && typeof v === 'number') return analise ? dataExcelParaIso(v) : dataExcelParaTexto(v);
    const texto = typeof v === 'number' && !analise ? String(v).replace('.', ',') : String(v);
    return precisaAspas.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  }

  return {
    /**
     * @param {(string|number|null)[]} valores
     * @param {boolean[]} [ehData] quais colunas são datas (número de série do Excel)
     */
    linha(valores, ehData = []) {
      const texto = valores.map((v, i) => campo(v, ehData[i])).join(separador) + '\r\n';
      buffer.push(texto);
      tamanho += texto.length;
      if (tamanho > 1 << 20) despejar();
    },
    finalizar() {
      despejar();
    },
  };
}
