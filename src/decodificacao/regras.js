// Regras especiais de conversão: datas e idade codificada.
// Cada função devolve { valor } quando consegue converter, ou { erro } com o
// motivo em português quando o valor não pode ser lido com segurança.

const MS_POR_DIA = 86400000;
const EPOCA_EXCEL = Date.UTC(1899, 11, 30); // dia 0 do Excel (sistema 1900)

/**
 * Converte uma data do arquivo para o número de série de data do Excel.
 * Aceita AAAAMMDD (DBF), AAAA-MM-DD e DD/MM/AAAA (CSV).
 * @param {string} texto
 */
export function converterData(texto) {
  if (texto === '') return { valor: null };
  let m = /^(\d{4})(\d{2})(\d{2})$/.exec(texto) || /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  let ano, mes, dia;
  if (m) [, ano, mes, dia] = m.map(Number);
  else if ((m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto))) [, dia, mes, ano] = m.map(Number);
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
