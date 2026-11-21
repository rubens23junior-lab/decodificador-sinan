// Regras especiais de conversão: datas e idade codificada.
// Cada função devolve { valor } quando consegue converter, ou { erro } com o
// motivo em português quando o valor não pode ser lido com segurança.

const MS_POR_DIA = 86400000;
const EPOCA_EXCEL = Date.UTC(1899, 11, 30); // dia 0 do Excel (sistema 1900)

/**
 * Converte uma data do arquivo para o número de série de data do Excel.
 * Aceita AAAAMMDD (DBF), AAAA-MM-DD e DD/MM/AAAA (CSV).
 * Com "mesPrimeiro" (coluna marcada "mes_dia_ano" no dicionário), a data com
 * barras é lida no formato americano M/D/AAAA, com dia e mês de 1 ou 2 dígitos
 * (datas de transferência do surto de DTA de 2022 e 2023; decisão do Rubens, 19/11/2026).
 * @param {string} texto
 * @param {{mesPrimeiro?: boolean}} [opcoes]
 */
export function converterData(texto, { mesPrimeiro = false } = {}) {
  if (texto === '') return { valor: null };
  let m = /^(\d{4})(\d{2})(\d{2})$/.exec(texto) || /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  let ano, mes, dia;
  if (m) [, ano, mes, dia] = m.map(Number);
  else if (mesPrimeiro && (m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto))) [, mes, dia, ano] = m.map(Number);
  else if (!mesPrimeiro && (m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto))) [, dia, mes, ano] = m.map(Number);
  else return { erro: 'Data em formato desconhecido' };

  const ms = Date.UTC(ano, mes - 1, dia);
  const d = new Date(ms);
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) {
    return { erro: 'Data inexistente no calendário' };
  }
  if (ano < 1900) return { erro: 'Data anterior a 1900' };
  return { valor: (ms - EPOCA_EXCEL) / MS_POR_DIA };
}

/**
 * Semana epidemiológica (AAAASS) de uma data, pelo calendário epidemiológico
 * padronizado que os dicionários do Sinan citam para SEM_NOT, SEM_PRI e SEM_DIAG
 * ("preenchida automaticamente, a partir da data", formato AAAASS).
 * A semana vai de domingo a sábado e pertence ao ano em que cai a sua quarta-feira;
 * a semana 1 é a que contém 4 de janeiro. Regra conferida em 18/11/2026 contra as
 * semanas gravadas pelo Sinan em cerca de 2,5 milhões de registros públicos
 * (dengue, chikungunya, violência, sífilis congênita e hanseníase): todas iguais.
 * @param {string} texto data em AAAAMMDD, AAAA-MM-DD ou DD/MM/AAAA
 */
export function semanaEpidemiologica(texto) {
  const data = converterData(texto);
  if (data.erro) return { erro: `Semana não calculada: ${data.erro.toLowerCase()}` };
  if (data.valor === null) return { valor: null };
  const ms = EPOCA_EXCEL + data.valor * MS_POR_DIA;
  const domingo = ms - new Date(ms).getUTCDay() * MS_POR_DIA;
  const ano = new Date(domingo + 3 * MS_POR_DIA).getUTCFullYear();
  const quatroJan = Date.UTC(ano, 0, 4);
  const primeiroDomingo = quatroJan - new Date(quatroJan).getUTCDay() * MS_POR_DIA;
  const semana = Math.round((domingo - primeiroDomingo) / (7 * MS_POR_DIA)) + 1;
  return { valor: `${ano}${String(semana).padStart(2, '0')}` };
}

/**
 * Converte a idade codificada do SINAN: 1º dígito = unidade, demais = valor.
 * Se a unidade tiver "maximo" no dicionário, um valor acima dele é implausível.
 * @param {string} texto ex.: "4025"
 * @param {{codigos: string[], rotulo: string, plural: string, maximo?: number}[]} unidades
 */
export function converterIdade(texto, unidades) {
  if (texto === '') return { valor: null };
  if (!/^\d{4}$/.test(texto)) return { erro: 'Idade fora do formato de 4 dígitos' };
  const unidade = unidades.find((u) => u.codigos.includes(texto[0]));
  if (!unidade) return { erro: 'Unidade de idade desconhecida (1º dígito)' };
  const numero = Number(texto.slice(1));
  if (unidade.maximo !== undefined && numero > unidade.maximo) {
    return { erro: `Idade implausível: acima de ${unidade.maximo} ${unidade.maximo === 1 ? unidade.rotulo : unidade.plural}` };
  }
  return { valor: `${numero} ${numero === 1 ? unidade.rotulo : unidade.plural}` };
}

/**
 * Idade em anos completos, para análise: horas, dias e meses valem 0 (menor de
 * 1 ano). Idade em branco, inválida ou implausível volta null (vazio).
 * @param {string} texto ex.: "4025"
 * @param {{codigos: string[], rotulo: string, plural: string, maximo?: number}[]} unidades
 */
export function idadeEmAnos(texto, unidades) {
  const r = converterIdade(texto, unidades);
  if (r.erro || r.valor === null) return null;
  const unidade = unidades.find((u) => u.codigos.includes(texto[0]));
  return unidade.rotulo === 'ano' ? Number(texto.slice(1)) : 0;
}

// ---- Conserto de acentos estragados em texto livre (decisão do Rubens, 19/11/2026)
// Alguns arquivos públicos gravam o texto já estragado por uma conversão de
// codificação feita antes da publicação. Duas formas são consertadas, porque a
// troca é exata e reversível; o que não se encaixar nelas fica como veio.
//
// 1) Texto em UTF-8 lido como windows-1252 ("Ã¡" no lugar de "á"; surto de DTA
//    de 2024). Os caracteres voltam aos bytes do windows-1252 e são lidos de novo
//    como UTF-8; só vale se a leitura for perfeita.
// 2) Texto na página de código 850 (DOS) lido como windows-1252 ("¡" no lugar de
//    "í", "‡" no lugar de "ç"; surto de DTA de 2022 e 2023). Só vale se o texto
//    tiver um desses sinais e nenhuma letra acentuada correta; aí cada sinal
//    vira a letra que o mesmo byte tem na página 850. A correspondência foi tirada
//    da tabela cp850 da biblioteca padrão do Python e conferida nos arquivos.

const BYTE_1252 = (() => {
  const dec = new TextDecoder('windows-1252');
  const mapa = new Map();
  for (let b = 0; b < 256; b++) mapa.set(dec.decode(new Uint8Array([b])), b);
  return mapa;
})();
const UTF8_ESTRITO = new TextDecoder('utf-8', { fatal: true });

// sinal (caractere do windows-1252) → letra que o mesmo byte tem na página 850
const CP850_LETRAS = new Map([
  ['…', 'à'], ['ƒ', 'â'], ['Æ', 'ã'], ['‚', 'é'], ['ˆ', 'ê'],
  ['¡', 'í'], ['¢', 'ó'], ['“', 'ô'], ['ä', 'õ'], ['£', 'ú'],
  ['\u0081', 'ü'], ['‡', 'ç'], ['µ', 'Á'], ['·', 'À'], ['¶', 'Â'],
  ['\u0090', 'É'], ['Ò', 'Ê'], ['Ö', 'Í'], ['å', 'Õ'], ['š', 'Ü'],
  ['€', 'Ç'], ['¦', 'ª'], ['§', 'º'], [' ', 'á'],
]);
const SINAL_CP850 = /[…ƒÆ‚ˆ¡¢“ä£\u0081‡µ·¶\u0090ÒÖåš€¦§]|[A-Za-z/] [a-z]/;
const LETRA_ACENTUADA = /[áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]/;

/**
 * Conserta os acentos estragados de um texto livre, quando a forma do estrago
 * é uma das duas conhecidas. Devolve o texto consertado ou o próprio texto.
 * @param {string} texto
 */
export function corrigirAcentos(texto) {
  if (/[ÃÂ]/.test(texto)) {
    const bytes = [];
    for (const c of texto) {
      const b = BYTE_1252.get(c);
      if (b === undefined) return texto;
      bytes.push(b);
    }
    try {
      return UTF8_ESTRITO.decode(new Uint8Array(bytes));
    } catch {
      return texto;
    }
  }
  if (SINAL_CP850.test(texto) && !LETRA_ACENTUADA.test(texto)) {
    return [...texto].map((c) => CP850_LETRAS.get(c) ?? c).join('');
  }
  return texto;
}
