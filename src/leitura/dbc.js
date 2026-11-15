// Leitura de arquivos DBC, o formato compactado em que o DATASUS distribui
// os dados públicos do SINAN.
//
// Um DBC é um DBF em que:
//   1. o cabeçalho do DBF vem primeiro, sem compressão;
//   2. seguem 4 bytes de verificação;
//   3. o restante (os registros) vem compactado no formato "PKWare implode".

import { descompactar, ErroDescompactacao } from './blast.js';
import { lerCabecalhoDBF, criarLeitorRegistrosDBF } from './dbf.js';
import { ErroLeitura } from './erros.js';

const TAMANHO_VERIFICACAO = 4;

/**
 * Lê um DBC inteiro, entregando um registro por vez.
 * @param {Uint8Array} bytes conteúdo do arquivo
 * @param {object} opcoes
 * @param {string} [opcoes.codificacao]
 * @param {(campos: object[]) => void} [opcoes.aoCabecalho]
 * @param {(valores: string[]) => void} opcoes.aoRegistro
 * @param {(fracao: number) => void} [opcoes.aoProgresso] fração lida, de 0 a 1
 */
export function lerDBC(bytes, { codificacao, aoCabecalho, aoRegistro, aoProgresso }) {
  const cabecalho = lerCabecalhoDBF(bytes);
  if (aoCabecalho) aoCabecalho(cabecalho.campos, cabecalho);

  const inicio = cabecalho.tamCabecalho + TAMANHO_VERIFICACAO;
  if (bytes.length <= inicio) {
    throw new ErroLeitura('O arquivo DBC não tem conteúdo depois do cabeçalho. Ele pode estar incompleto.');
  }
  const compactado = bytes.subarray(inicio);
  const leitor = criarLeitorRegistrosDBF(cabecalho, { codificacao, aoRegistro });

  try {
    descompactar(
      compactado,
      (pedaco) => leitor.empurrar(pedaco),
      aoProgresso ? (lidos) => aoProgresso(lidos / compactado.length) : undefined,
    );
  } catch (erro) {
    if (erro instanceof ErroDescompactacao) {
      throw new ErroLeitura(`Não foi possível descompactar o arquivo DBC. ${erro.message}`);
    }
    throw erro;
  }
  return { cabecalho, ...leitor.finalizar() };
}
