// Descompactador do formato "PKWare Data Compression Library implode",
// usado dentro dos arquivos DBC do DATASUS.
//
// Adaptação para JavaScript do programa blast.c, de Mark Adler
// (contrib/blast do zlib), distribuído sob a licença zlib:
//
//   Copyright (C) 2003, 2012, 2013 Mark Adler
//   This software is provided 'as-is', without any express or implied
//   warranty. In no event will the author be held liable for any damages
//   arising from the use of this software.
//   Permission is granted to anyone to use this software for any purpose,
//   including commercial applications, and to alter it and redistribute it
//   freely, subject to the following restrictions:
//   1. The origin of this software must not be misrepresented; you must not
//      claim that you wrote the original software. If you use this software
//      in a product, an acknowledgment in the product documentation would be
//      appreciated but is not required.
//   2. Altered source versions must be plainly marked as such, and must not be
//      misrepresented as being the original software.
//   3. This notice may not be removed or altered from any source distribution.
//
// Versão alterada: traduzida de C para JavaScript, com mensagens em português.

const MAXBITS = 13; // tamanho máximo de um código
const MAXWIN = 4096; // tamanho máximo da janela de cópia

// Tabelas fixas do formato, copiadas do blast.c.
const LITLEN = [
  11, 124, 8, 7, 28, 7, 188, 13, 76, 4, 10, 8, 12, 10, 12, 10, 8, 23, 8,
  9, 7, 6, 7, 8, 7, 6, 55, 8, 23, 24, 12, 11, 7, 9, 11, 12, 6, 7, 22, 5,
  7, 24, 6, 11, 9, 6, 7, 22, 7, 11, 38, 7, 9, 8, 25, 11, 8, 11, 9, 12,
  8, 12, 5, 38, 5, 38, 5, 11, 7, 5, 6, 21, 6, 10, 53, 8, 7, 24, 10, 27,
  44, 253, 253, 253, 252, 252, 252, 13, 12, 45, 12, 45, 12, 61, 12, 45,
  44, 173,
];
const LENLEN = [2, 35, 36, 53, 38, 23];
const DISTLEN = [2, 20, 53, 230, 247, 151, 248];
const BASE = [3, 2, 4, 5, 6, 7, 8, 9, 10, 12, 16, 24, 40, 72, 136, 264];
const EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8];

export class ErroDescompactacao extends Error {}

// Monta uma tabela de Huffman a partir da lista compacta de tamanhos.
function construir(rep, numSimbolos) {
  const count = new Int16Array(MAXBITS + 1);
  const symbol = new Int16Array(numSimbolos);
  const length = [];
  for (const valor of rep) {
    const repeticoes = (valor >> 4) + 1;
    for (let i = 0; i < repeticoes; i++) length.push(valor & 15);
  }
  for (const tam of length) count[tam]++;
  const offs = new Int16Array(MAXBITS + 1);
  for (let tam = 1; tam < MAXBITS; tam++) offs[tam + 1] = offs[tam] + count[tam];
  for (let s = 0; s < length.length; s++) {
    if (length[s] !== 0) symbol[offs[length[s]]++] = s;
  }
  return { count, symbol };
}

const LITCODE = construir(LITLEN, 256);
const LENCODE = construir(LENLEN, 16);
const DISTCODE = construir(DISTLEN, 64);

/**
 * Descompacta um fluxo "implode".
 * @param {Uint8Array} entrada bytes compactados
 * @param {(pedaco: Uint8Array) => void} aoSair recebe a saída em pedaços de até
 *   4096 bytes. O pedaço é reaproveitado depois: use ou copie antes de retornar.
 * @param {(lidos: number) => void} [aoProgresso] chamado periodicamente com o
 *   número de bytes da entrada já lidos.
 * @returns {number} total de bytes descompactados
 */
export function descompactar(entrada, aoSair, aoProgresso) {
  let pos = 0;
  let bitbuf = 0;
  let bitcnt = 0;
  const out = new Uint8Array(MAXWIN);
  let next = 0;
  let first = true;
  let total = 0;
  let proximoAviso = 1 << 20;

  function faltouEntrada() {
    throw new ErroDescompactacao('O arquivo compactado terminou antes do esperado. Ele pode estar incompleto ou corrompido.');
  }

  function bits(need) {
    let val = bitbuf;
    while (bitcnt < need) {
      if (pos >= entrada.length) faltouEntrada();
      val |= entrada[pos++] << bitcnt;
      bitcnt += 8;
    }
    bitbuf = val >> need;
    bitcnt -= need;
    return val & ((1 << need) - 1);
  }

  function decode(h) {
    let buf = bitbuf;
    let left = bitcnt;
    let code = 0;
    let firstCode = 0;
    let index = 0;
    let len = 1;
    let nextCount = 1;
    for (;;) {
      while (left--) {
        code |= (buf & 1) ^ 1; // os códigos vêm invertidos
        buf >>= 1;
        const count = h.count[nextCount++];
        if (code < firstCode + count) {
          bitbuf = buf;
          bitcnt = (bitcnt - len) & 7;
          return h.symbol[index + (code - firstCode)];
        }
        index += count;
        firstCode += count;
        firstCode <<= 1;
        code <<= 1;
        len++;
      }
      left = MAXBITS + 1 - len;
      if (left === 0) break;
      if (pos >= entrada.length) faltouEntrada();
      buf = entrada[pos++];
      if (left > 8) left = 8;
    }
    throw new ErroDescompactacao('Código inválido no arquivo compactado.');
  }

  function despejar() {
    aoSair(out.subarray(0, next));
    total += next;
    next = 0;
    first = false;
    if (aoProgresso && pos >= proximoAviso) {
      aoProgresso(pos);
      proximoAviso = pos + (1 << 20);
    }
  }

  const lit = bits(8);
  if (lit > 1) throw new ErroDescompactacao('Cabeçalho do conteúdo compactado inválido.');
  const dict = bits(8);
  if (dict < 4 || dict > 6) throw new ErroDescompactacao('Tamanho de dicionário inválido no arquivo compactado.');

  for (;;) {
    if (bits(1)) {
      // cópia de um trecho já escrito
      const simbolo = decode(LENCODE);
      let len = BASE[simbolo] + bits(EXTRA[simbolo]);
      if (len === 519) break; // código de fim
      const deslocamento = len === 2 ? 2 : dict;
      let dist = (decode(DISTCODE) << deslocamento) + bits(deslocamento) + 1;
      if (first && dist > next) throw new ErroDescompactacao('Distância inválida no arquivo compactado.');
      do {
        let to = next;
        let from = to - dist;
        let copy = MAXWIN;
        if (next < dist) {
          from += copy;
          copy = dist;
        }
        copy -= next;
        if (copy > len) copy = len;
        len -= copy;
        next += copy;
        while (copy--) out[to++] = out[from++];
        if (next === MAXWIN) despejar();
      } while (len !== 0);
    } else {
      // byte literal
      out[next++] = lit ? decode(LITCODE) : bits(8);
      if (next === MAXWIN) despejar();
    }
  }
  if (next > 0) despejar();
  if (aoProgresso) aoProgresso(pos);
  return total;
}
