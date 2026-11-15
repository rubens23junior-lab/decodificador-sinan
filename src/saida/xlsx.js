// Geração de planilhas Excel (.xlsx) em fluxo: as linhas são escritas uma a
// uma e compactadas na hora, para aguentar centenas de milhares de linhas.
// Textos repetidos ("Sim", "Não", nomes de municípios) são guardados uma vez
// só (tabela de textos compartilhados), o que reduz muito o tamanho.

import { criarZipEmFluxo, juntar } from './zip.js';

export class ErroPlanilha extends Error {}

// Compactação: medida no arquivo nacional de dengue de 2025, o nível 3 é o
// melhor equilíbrio entre tempo e tamanho (ver docs/desempenho.md).
const NIVEL_PADRAO = 3;

/** Limite de linhas por aba do Excel. */
export const MAX_LINHAS_EXCEL = 1048576;
const MAX_TEXTO_CELULA = 32767;

// Estilos disponíveis para as células (índices em styles.xml).
export const ESTILO = {
  normal: 0,
  cabecalho: 1, // negrito, fundo cinza
  quebraTexto: 2, // texto com quebra de linha automática
  destaque: 3, // fundo amarelo (valores que precisam de atenção)
  data: 4, // data dd/mm/aaaa
  cabecalhoOriginal: 5, // itálico, fundo cinza claro (2ª linha de cabeçalho)
};

const ESTILOS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF595959"/><name val="Calibri"/></font></fonts>
<fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9D9D9"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFEB9C"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/></patternFill></fill></fills>
<borders count="1"><border/></borders>
<cellStyleXfs count="1"><xf/></cellStyleXfs>
<cellXfs count="6"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/><xf applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf fillId="3" applyFill="1"/><xf numFmtId="14" applyNumberFormat="1"/><xf fontId="2" fillId="4" applyFont="1" applyFill="1"/></cellXfs>
</styleSheet>`;

/** Letra(s) da coluna: 0 → A, 25 → Z, 26 → AA. */
export function letraColuna(indice) {
  let s = '';
  let n = indice + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Escapa texto para XML, removendo caracteres de controle inválidos. */
export function escaparXml(texto) {
  return String(texto)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nomeAbaValido(nome) {
  return nome.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31);
}

/**
 * Cria uma planilha em fluxo.
 * @param {(pedaco: Uint8Array) => void} aoSaida recebe os bytes do .xlsx, em ordem
 * @param {{nivel?: number}} [opcoes] nível de compactação (1 = mais rápido; 9 = menor)
 */
export function criarPlanilhaEmFluxo(aoSaida, { nivel = NIVEL_PADRAO } = {}) {
  const zip = criarZipEmFluxo(aoSaida, { nivel });
  const compartilhados = new Map();
  const abas = [];
  const letras = [];
  let aba = null;
  let buffer = [];
  let tamanhoBuffer = 0;

  const letra = (i) => letras[i] ?? (letras[i] = letraColuna(i));

  function despejar() {
    if (buffer.length) zip.escrever(buffer.join(''));
    buffer = [];
    tamanhoBuffer = 0;
  }
  function anexar(xml) {
    buffer.push(xml);
    tamanhoBuffer += xml.length;
    if (tamanhoBuffer > 1 << 18) despejar();
  }

  function indiceTexto(texto) {
    let i = compartilhados.get(texto);
    if (i === undefined) {
      i = compartilhados.size;
      compartilhados.set(texto, i);
    }
    return i;
  }

  return {
    /**
     * @param {string} nome
     * @param {{larguras?: number[], linhasCabecalho?: number, filtro?: boolean}} [opcoes]
     *   linhasCabecalho: quantas linhas ficam congeladas no topo (0 = nenhuma)
     */
    iniciarAba(nome, { larguras = [], linhasCabecalho = 1, filtro = true } = {}) {
      if (aba) throw new ErroPlanilha('Feche a aba anterior antes de iniciar outra.');
      aba = { nome: nomeAbaValido(nome), linhas: 0, maxColunas: 0, linhasCabecalho, filtro };
      abas.push(aba);
      zip.abrir(`xl/worksheets/sheet${abas.length}.xml`);
      let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
      if (linhasCabecalho > 0) {
        xml += `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${linhasCabecalho}" topLeftCell="A${linhasCabecalho + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`;
      }
      if (larguras.length) {
        xml += '<cols>' + larguras.map((l, i) => `<col min="${i + 1}" max="${i + 1}" width="${l}" customWidth="1"/>`).join('') + '</cols>';
      }
      anexar(xml + '<sheetData>');
    },

    /**
     * Escreve uma linha.
     * @param {(string|number|null|undefined)[]} valores
     * @param {number|(number|undefined)[]} [estilos] estilo de todas as células ou de cada uma
     */
    linha(valores, estilos = 0) {
      if (aba.linhas >= MAX_LINHAS_EXCEL) {
        throw new ErroPlanilha(`A aba "${aba.nome}" passou de ${MAX_LINHAS_EXCEL.toLocaleString('pt-BR')} linhas, o limite do Excel. Use filtros ou a saída em CSV.`);
      }
      const r = ++aba.linhas;
      let xml = `<row r="${r}">`;
      for (let c = 0; c < valores.length; c++) {
        const v = valores[c];
        const s = typeof estilos === 'number' ? estilos : estilos[c] ?? 0;
        if (v === null || v === undefined || v === '') {
          // célula vazia só é gravada se o estilo aparece sem conteúdo (cabeçalho, destaque)
          if (s && s !== ESTILO.data && s !== ESTILO.quebraTexto) xml += `<c r="${letra(c)}${r}" s="${s}"/>`;
          continue;
        }
        const atr = s ? ` s="${s}"` : '';
        if (typeof v === 'number' && Number.isFinite(v)) {
          xml += `<c r="${letra(c)}${r}"${atr}><v>${v}</v></c>`;
        } else {
          let texto = String(v);
          if (texto.length > MAX_TEXTO_CELULA) texto = texto.slice(0, MAX_TEXTO_CELULA);
          xml += `<c r="${letra(c)}${r}"${atr} t="s"><v>${indiceTexto(texto)}</v></c>`;
        }
      }
      if (valores.length > aba.maxColunas) aba.maxColunas = valores.length;
      anexar(xml + '</row>');
    },

    fecharAba() {
      let xml = '</sheetData>';
      if (aba.filtro && aba.linhasCabecalho > 0 && aba.linhas >= aba.linhasCabecalho && aba.maxColunas > 0) {
        xml += `<autoFilter ref="A${aba.linhasCabecalho}:${letra(aba.maxColunas - 1)}${aba.linhas}"/>`;
      }
      anexar(xml + '</worksheet>');
      despejar();
      zip.fechar();
      aba = null;
    },

    /** Grava as partes finais do arquivo. */
    finalizar() {
      if (aba) this.fecharAba();
      zip.abrir('xl/sharedStrings.xml');
      anexar(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${compartilhados.size}" uniqueCount="${compartilhados.size}">`);
      for (const texto of compartilhados.keys()) anexar(`<si><t xml:space="preserve">${escaparXml(texto)}</t></si>`);
      anexar('</sst>');
      despejar();
      zip.fechar();

      zip.arquivo('xl/styles.xml', ESTILOS_XML);
      zip.arquivo('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        abas.map((a, i) => `<sheet name="${escaparXml(a.nome)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
        '</sheets></workbook>');
      zip.arquivo('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        abas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
        `<Relationship Id="rId${abas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `<Relationship Id="rId${abas.length + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>` +
        '</Relationships>');
      zip.arquivo('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>');
      zip.arquivo('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' +
        abas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
        '</Types>');
      zip.finalizar();
    },
  };
}

/**
 * @typedef {string|number|null|{valor: string|number|null, estilo?: number}} Celula
 * @typedef {{nome: string, linhas: Celula[][], larguras?: number[], cabecalho?: boolean}} Aba
 * Se "cabecalho" for verdadeiro (padrão), a 1ª linha fica em negrito,
 * congelada e com filtro.
 */

/**
 * Cria um arquivo .xlsx pequeno inteiro na memória.
 * @param {Aba[]} abas
 * @returns {Uint8Array}
 */
export function criarXlsx(abas) {
  const partes = [];
  const planilha = criarPlanilhaEmFluxo((p) => partes.push(p.slice()));
  for (const a of abas) {
    const comCabecalho = a.cabecalho !== false;
    planilha.iniciarAba(a.nome, { larguras: a.larguras, linhasCabecalho: comCabecalho ? 1 : 0 });
    a.linhas.forEach((linha, r) => {
      const padrao = comCabecalho && r === 0 ? ESTILO.cabecalho : ESTILO.normal;
      const valores = linha.map((c) => (c !== null && typeof c === 'object' ? c.valor : c));
      const estilos = linha.map((c) => (c !== null && typeof c === 'object' && c.estilo !== undefined ? c.estilo : padrao));
      planilha.linha(valores, estilos);
    });
    planilha.fecharAba();
  }
  planilha.finalizar();
  return juntar(partes);
}
