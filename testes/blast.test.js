import { test } from 'node:test';
import assert from 'node:assert/strict';
import { descompactar, ErroDescompactacao } from '../src/leitura/blast.js';
import { compactarSoLiterais } from './auxiliares/ficticios.js';

function descompactarTudo(entrada) {
  const partes = [];
  descompactar(entrada, (pedaco) => partes.push(Uint8Array.from(pedaco)));
  return Buffer.concat(partes);
}

test('descompacta o exemplo de referência do blast.c (com repetições)', () => {
  const entrada = Uint8Array.from([0x00, 0x04, 0x82, 0x24, 0x25, 0x8f, 0x80, 0x7f]);
  assert.equal(descompactarTudo(entrada).toString('latin1'), 'AIAIAIAIAIAIA');
});

test('descompacta conteúdo maior que a janela de 4096 bytes', () => {
  const original = new Uint8Array(10000);
  for (let i = 0; i < original.length; i++) original[i] = (i * 7) % 256;
  assert.deepEqual(new Uint8Array(descompactarTudo(compactarSoLiterais(original))), original);
});

test('arquivo compactado cortado gera erro claro', () => {
  const compactado = compactarSoLiterais(new Uint8Array(100).fill(65));
  assert.throws(() => descompactarTudo(compactado.subarray(0, 50)), ErroDescompactacao);
});

test('cabeçalho de compressão inválido gera erro', () => {
  assert.throws(() => descompactarTudo(Uint8Array.from([0x02, 0x06, 0, 0])), ErroDescompactacao);
  assert.throws(() => descompactarTudo(Uint8Array.from([0x00, 0x07, 0, 0])), ErroDescompactacao);
});
