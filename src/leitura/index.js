// Entrada única para a leitura de arquivos. Reconhece o formato e entrega,
// para qualquer formato, a mesma coisa: a lista de colunas e um registro por
// vez (lista de textos, na ordem das colunas).
//
// Para acrescentar um formato, basta incluir uma entrada em FORMATOS com a
// função "ler" e as extensões aceitas.

import { lerCabecalhoDBF, criarLeitorRegistrosDBF } from './dbf.js';
import { lerDBC } from './dbc.js';
import { criarLeitorCSV } from './csv.js';
import { ErroLeitura } from './erros.js';

export { ErroLeitura };

const PEDACO = 1 << 20; // 1 MB por vez, para poder informar o progresso

function lerDBF(bytes, { codificacao, aoCabecalho, aoRegistro, aoProgresso }) {
  const cabecalho = lerCabecalhoDBF(bytes);
  if (aoCabecalho) aoCabecalho(cabecalho.campos, cabecalho);
  const leitor = criarLeitorRegistrosDBF(cabecalho, { codificacao, aoRegistro });
  for (let pos = cabecalho.tamCabecalho; pos < bytes.length; pos += PEDACO) {
    leitor.empurrar(bytes.subarray(pos, Math.min(pos + PEDACO, bytes.length)));
    if (aoProgresso) aoProgresso(Math.min(pos + PEDACO, bytes.length) / bytes.length);
  }
  return { cabecalho, ...leitor.finalizar() };
}

function lerCSV(bytes, { codificacao, aoCabecalho, aoRegistro, aoProgresso }) {
  const decodificador = new TextDecoder(codificacao);
  const leitor = criarLeitorCSV({
    aoCabecalho: aoCabecalho
      ? (nomes, separador) => aoCabecalho(nomes.map((nome) => ({ nome, tipo: null, tamanho: null })), { separador })
      : undefined,
    aoRegistro,
  });
  for (let pos = 0; pos < bytes.length; pos += PEDACO) {
    const fim = Math.min(pos + PEDACO, bytes.length);
    leitor.empurrar(decodificador.decode(bytes.subarray(pos, fim), { stream: fim < bytes.length }));
    if (aoProgresso) aoProgresso(fim / bytes.length);
  }
  return leitor.finalizar();
}

export const FORMATOS = {
  dbc: { nome: 'DBC (DATASUS, compactado)', extensoes: ['.dbc'], codificacaoPadrao: 'windows-1252', ler: lerDBC },
  dbf: { nome: 'DBF', extensoes: ['.dbf'], codificacaoPadrao: 'windows-1252', ler: lerDBF },
  csv: { nome: 'CSV', extensoes: ['.csv', '.txt'], codificacaoPadrao: null, ler: lerCSV },
};

/**
 * Reconhece o formato pela extensão do nome; sem extensão conhecida, tenta
 * pelo conteúdo.
 * @param {string} nomeArquivo
 * @param {Uint8Array} bytes
 * @returns {'dbc'|'dbf'|'csv'}
 */
export function detectarFormato(nomeArquivo, bytes) {
  const nome = nomeArquivo.toLowerCase();
  for (const [formato, def] of Object.entries(FORMATOS)) {
    if (def.extensoes.some((ext) => nome.endsWith(ext))) return formato;
  }
  // Sem extensão conhecida: um DBF tem exatamente o tamanho que o cabeçalho
  // anuncia; um DBC tem o mesmo cabeçalho, seguido de 4 bytes e dos dois
  // bytes de início do conteúdo compactado (0 ou 1, depois 4, 5 ou 6).
  try {
    const c = lerCabecalhoDBF(bytes);
    const esperado = c.tamCabecalho + c.numRegistros * c.tamRegistro;
    if (bytes.length === esperado || bytes.length === esperado + 1) return 'dbf';
    const ini = c.tamCabecalho + 4;
    if (bytes[ini] <= 1 && bytes[ini + 1] >= 4 && bytes[ini + 1] <= 6) return 'dbc';
  } catch {
    // não é DBF nem DBC
  }
  const amostra = bytes.subarray(0, 4096);
  if (!amostra.includes(0)) return 'csv';
  throw new ErroLeitura(
    'Não foi possível reconhecer o formato do arquivo. A ferramenta aceita arquivos DBC, DBF e CSV.',
  );
}

/**
 * Detecta a codificação de um texto: UTF-8 se o início for UTF-8 válido;
 * caso contrário, windows-1252 (padrão dos sistemas antigos no Windows).
 * @param {Uint8Array} bytes
 */
export function detectarCodificacao(bytes) {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, 1 << 20), { stream: true });
    return 'utf-8';
  } catch {
    return 'windows-1252';
  }
}

/**
 * Lê um arquivo inteiro.
 * @param {Uint8Array} bytes conteúdo do arquivo
 * @param {object} opcoes
 * @param {'dbc'|'dbf'|'csv'} opcoes.formato
 * @param {string} [opcoes.codificacao] se omitida, usa a do formato ou detecta
 * @param {(colunas: {nome: string, tipo: string|null, tamanho: number|null}[], info: object) => void} [opcoes.aoCabecalho]
 * @param {(valores: string[]) => void} opcoes.aoRegistro
 * @param {(fracao: number) => void} [opcoes.aoProgresso]
 * @returns {{formato: string, codificacao: string, lidos: number, excluidos: number}}
 */
export function lerArquivo(bytes, { formato, codificacao, aoCabecalho, aoRegistro, aoProgresso }) {
  const def = FORMATOS[formato];
  if (!def) throw new ErroLeitura(`Formato não suportado: ${formato}.`);
  const cod = codificacao || def.codificacaoPadrao || detectarCodificacao(bytes);
  const resultado = def.ler(bytes, { codificacao: cod, aoCabecalho, aoRegistro, aoProgresso });
  return { formato, codificacao: cod, lidos: resultado.lidos, excluidos: resultado.excluidos ?? 0 };
}
