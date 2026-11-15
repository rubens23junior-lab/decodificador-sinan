// Leitura de arquivos DBF (dBase), formato em que o SINAN exporta os dados.
//
// O leitor trabalha em fluxo: recebe o conteúdo em pedaços e entrega um
// registro por vez, para que arquivos com milhões de linhas não precisem
// ficar inteiros na memória. Os valores saem como texto, do jeito que estão
// no arquivo (sem os espaços das pontas); a conversão de datas e códigos é feita
// depois, na decodificação.

import { ErroLeitura } from './erros.js';

const FIM_CABECALHO = 0x0d;
const FIM_ARQUIVO = 0x1a;
const REGISTRO_EXCLUIDO = 0x2a; // '*'

// Codificações em que cada byte vira exatamente um caractere.
const CODIFICACOES_UM_BYTE = new Set(['windows-1252', 'iso-8859-1', 'latin1']);

/**
 * Lê o cabeçalho de um DBF.
 * @param {Uint8Array} bytes início do arquivo (pelo menos o cabeçalho inteiro)
 */
export function lerCabecalhoDBF(bytes) {
  if (bytes.length < 32) {
    throw new ErroLeitura('O arquivo é pequeno demais para ser um DBF.');
  }
  const visao = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const numRegistros = visao.getUint32(4, true);
  const tamCabecalho = visao.getUint16(8, true);
  const tamRegistro = visao.getUint16(10, true);
  const data = new Date(1900 + bytes[1], bytes[2] - 1, bytes[3]);

  if (tamCabecalho < 33 || tamRegistro < 1) {
    throw new ErroLeitura('O cabeçalho do arquivo não é de um DBF válido.');
  }
  if (bytes.length < tamCabecalho) {
    throw new ErroLeitura('O arquivo terminou no meio do cabeçalho. Ele pode estar incompleto.');
  }

  const campos = [];
  let deslocamento = 1; // o 1º byte de cada registro marca se ele foi excluído
  for (let pos = 32; pos + 32 <= tamCabecalho && bytes[pos] !== FIM_CABECALHO; pos += 32) {
    let fimNome = pos;
    while (fimNome < pos + 11 && bytes[fimNome] !== 0) fimNome++;
    const nome = String.fromCharCode(...bytes.subarray(pos, fimNome)).trim();
    const campo = {
      nome,
      tipo: String.fromCharCode(bytes[pos + 11]),
      tamanho: bytes[pos + 16],
      decimais: bytes[pos + 17],
      deslocamento,
    };
    campos.push(campo);
    deslocamento += campo.tamanho;
  }

  if (campos.length === 0) {
    throw new ErroLeitura('O arquivo DBF não tem nenhuma coluna.');
  }
  if (deslocamento !== tamRegistro) {
    throw new ErroLeitura('O cabeçalho do DBF é inconsistente: a soma das colunas não bate com o tamanho do registro.');
  }

  return { numRegistros, tamCabecalho, tamRegistro, data, campos };
}

/**
 * Cria um leitor que recebe os bytes dos registros em pedaços.
 * @param {ReturnType<typeof lerCabecalhoDBF>} cabecalho
 * @param {object} opcoes
 * @param {string} [opcoes.codificacao] codificação dos textos (padrão windows-1252)
 * @param {(valores: string[]) => void} opcoes.aoRegistro recebe os valores de cada registro
 */
export function criarLeitorRegistrosDBF(cabecalho, { codificacao = 'windows-1252', aoRegistro }) {
  const { tamRegistro, campos, numRegistros } = cabecalho;
  const decodificador = new TextDecoder(codificacao);
  const umByte = CODIFICACOES_UM_BYTE.has(codificacao.toLowerCase());
  const pendente = new Uint8Array(tamRegistro);
  let ocupado = 0;
  let lidos = 0;
  let excluidos = 0;
  let encerrado = false;

  function processar(registro) {
    if (registro[0] === REGISTRO_EXCLUIDO) {
      excluidos++;
      return;
    }
    const valores = new Array(campos.length);
    if (umByte) {
      const texto = decodificador.decode(registro);
      for (let i = 0; i < campos.length; i++) {
        const c = campos[i];
        valores[i] = texto.substring(c.deslocamento, c.deslocamento + c.tamanho).trim();
      }
    } else {
      for (let i = 0; i < campos.length; i++) {
        const c = campos[i];
        valores[i] = decodificador.decode(registro.subarray(c.deslocamento, c.deslocamento + c.tamanho)).trim();
      }
    }
    lidos++;
    aoRegistro(valores);
  }

  return {
    /** @param {Uint8Array} pedaco */
    empurrar(pedaco) {
      let i = 0;
      while (i < pedaco.length && !encerrado) {
        if (lidos + excluidos >= numRegistros || (ocupado === 0 && pedaco[i] === FIM_ARQUIVO)) {
          encerrado = true;
          break;
        }
        if (ocupado === 0 && pedaco.length - i >= tamRegistro) {
          processar(pedaco.subarray(i, i + tamRegistro));
          i += tamRegistro;
          continue;
        }
        const n = Math.min(tamRegistro - ocupado, pedaco.length - i);
        pendente.set(pedaco.subarray(i, i + n), ocupado);
        ocupado += n;
        i += n;
        if (ocupado === tamRegistro) {
          processar(pendente);
          ocupado = 0;
        }
      }
    },
    finalizar() {
      if (lidos + excluidos < numRegistros) {
        throw new ErroLeitura(
          `O arquivo terminou antes do esperado: o cabeçalho anuncia ${numRegistros} registros, mas foram encontrados ${lidos + excluidos}. Ele pode estar incompleto.`,
        );
      }
      return { lidos, excluidos };
    },
  };
}
