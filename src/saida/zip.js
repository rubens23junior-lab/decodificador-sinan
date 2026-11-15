// Montagem de arquivos ZIP em fluxo, com compressão "deflate". Um arquivo
// .xlsx é um ZIP com arquivos XML dentro.
//
// O conteúdo de cada arquivo interno é enviado aos poucos e compactado na
// hora; a saída também sai em pedaços (aoSaida), para que planilhas grandes
// não precisem ficar inteiras na memória antes de compactar.
//
// Limite: o ZIP clássico vai até 4 GB por arquivo interno e 65.535 arquivos.

import { Deflate } from 'fflate';

export class ErroZip extends Error {}

const TABELA_CRC = (() => {
  const tabela = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabela[n] = c >>> 0;
  }
  return tabela;
})();

/**
 * CRC-32 padrão do ZIP. Para calcular aos poucos, passe o resultado anterior.
 * @param {Uint8Array} bytes
 * @param {number} [anterior]
 */
export function crc32(bytes, anterior = 0) {
  let c = (anterior ^ 0xffffffff) >>> 0;
  for (let i = 0; i < bytes.length; i++) c = TABELA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dataHoraDos(data) {
  const hora = (data.getHours() << 11) | (data.getMinutes() << 5) | (data.getSeconds() >> 1);
  const dia = ((data.getFullYear() - 1980) << 9) | ((data.getMonth() + 1) << 5) | data.getDate();
  return { hora, dia };
}

const LIMITE_4GB = 0xffffffff;

/**
 * Cria um gravador de ZIP em fluxo.
 * @param {(pedaco: Uint8Array) => void} aoSaida recebe os bytes do ZIP, em ordem
 * @param {{data?: Date, nivel?: number}} [opcoes]
 */
export function criarZipEmFluxo(aoSaida, { data = new Date(), nivel = 6 } = {}) {
  const codificador = new TextEncoder();
  const { hora, dia } = dataHoraDos(data);
  const central = [];
  let deslocamento = 0;
  let atual = null;

  function emitir(bytes) {
    deslocamento += bytes.length;
    aoSaida(bytes);
  }

  return {
    /** Começa um arquivo interno. */
    abrir(nome) {
      if (atual) throw new ErroZip('Feche o arquivo interno anterior antes de abrir outro.');
      const nomeBytes = codificador.encode(nome);
      const cab = new DataView(new ArrayBuffer(30));
      cab.setUint32(0, 0x04034b50, true);
      cab.setUint16(4, 20, true);
      cab.setUint16(6, 0x0808, true); // nomes em UTF-8 + tamanhos no descritor final
      cab.setUint16(8, 8, true); // deflate
      cab.setUint16(10, hora, true);
      cab.setUint16(12, dia, true);
      cab.setUint16(26, nomeBytes.length, true);
      atual = { nomeBytes, inicio: deslocamento, crc: 0, tamanho: 0, compactado: 0 };
      emitir(new Uint8Array(cab.buffer));
      emitir(nomeBytes);
      const registro = atual;
      atual.deflate = new Deflate({ level: nivel }, (pedaco) => {
        registro.compactado += pedaco.length;
        if (pedaco.length) emitir(pedaco);
      });
    },

    /** Acrescenta conteúdo (texto ou bytes) ao arquivo interno aberto. */
    escrever(conteudo) {
      const bytes = typeof conteudo === 'string' ? codificador.encode(conteudo) : conteudo;
      atual.crc = crc32(bytes, atual.crc);
      atual.tamanho += bytes.length;
      if (atual.tamanho > LIMITE_4GB) {
        throw new ErroZip('O conteúdo ficou maior que 4 GB, o limite de um arquivo Excel. Use filtros ou a saída em CSV.');
      }
      atual.deflate.push(bytes, false);
    },

    /** Termina o arquivo interno aberto. */
    fechar() {
      atual.deflate.push(new Uint8Array(0), true);
      if (atual.compactado > LIMITE_4GB || deslocamento > LIMITE_4GB) {
        throw new ErroZip('A planilha compactada ficou maior que 4 GB. Use filtros ou a saída em CSV.');
      }
      const desc = new DataView(new ArrayBuffer(16));
      desc.setUint32(0, 0x08074b50, true);
      desc.setUint32(4, atual.crc, true);
      desc.setUint32(8, atual.compactado, true);
      desc.setUint32(12, atual.tamanho, true);
      emitir(new Uint8Array(desc.buffer));
      central.push(atual);
      atual = null;
    },

    /** Grava um arquivo interno inteiro de uma vez. */
    arquivo(nome, conteudo) {
      this.abrir(nome);
      this.escrever(conteudo);
      this.fechar();
    },

    /** Escreve o diretório central e o fim do ZIP. */
    finalizar() {
      if (atual) throw new ErroZip('Há um arquivo interno ainda aberto.');
      const inicioCentral = deslocamento;
      for (const a of central) {
        const r = new DataView(new ArrayBuffer(46));
        r.setUint32(0, 0x02014b50, true);
        r.setUint16(4, 20, true);
        r.setUint16(6, 20, true);
        r.setUint16(8, 0x0808, true);
        r.setUint16(10, 8, true);
        r.setUint16(12, hora, true);
        r.setUint16(14, dia, true);
        r.setUint32(16, a.crc, true);
        r.setUint32(20, a.compactado, true);
        r.setUint32(24, a.tamanho, true);
        r.setUint16(28, a.nomeBytes.length, true);
        r.setUint32(42, a.inicio, true);
        emitir(new Uint8Array(r.buffer));
        emitir(a.nomeBytes);
      }
      const fim = new DataView(new ArrayBuffer(22));
      fim.setUint32(0, 0x06054b50, true);
      fim.setUint16(8, central.length, true);
      fim.setUint16(10, central.length, true);
      fim.setUint32(12, deslocamento - inicioCentral, true);
      fim.setUint32(16, inicioCentral, true);
      emitir(new Uint8Array(fim.buffer));
    },
  };
}

/**
 * Monta um ZIP pequeno inteiro na memória.
 * @param {{nome: string, conteudo: Uint8Array|string}[]} arquivos
 */
export function criarZip(arquivos, opcoes) {
  const partes = [];
  const zip = criarZipEmFluxo((p) => partes.push(p.slice()), opcoes);
  for (const a of arquivos) zip.arquivo(a.nome, a.conteudo);
  zip.finalizar();
  return juntar(partes);
}

/** Junta pedaços de bytes num só. */
export function juntar(partes) {
  const saida = new Uint8Array(partes.reduce((s, p) => s + p.length, 0));
  let pos = 0;
  for (const p of partes) {
    saida.set(p, pos);
    pos += p.length;
  }
  return saida;
}
