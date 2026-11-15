import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectarFormato, ErroLeitura } from '../src/leitura/index.js';
import { criarDBF, criarDBC, CAMPOS_FICTICIOS, REGISTROS_FICTICIOS } from './auxiliares/ficticios.js';

const dbf = criarDBF(CAMPOS_FICTICIOS, REGISTROS_FICTICIOS);
const dbc = criarDBC(dbf);

test('reconhece o formato pela extensão, sem diferenciar maiúsculas', () => {
  assert.equal(detectarFormato('DENGBR24.DBC', dbc), 'dbc');
  assert.equal(detectarFormato('dengue.dbf', dbf), 'dbf');
  assert.equal(detectarFormato('dengue.csv', new Uint8Array()), 'csv');
});

test('sem extensão conhecida, reconhece pelo conteúdo', () => {
  assert.equal(detectarFormato('arquivo', dbf), 'dbf');
  assert.equal(detectarFormato('arquivo', dbc), 'dbc');
  assert.equal(detectarFormato('arquivo', new TextEncoder().encode('A;B\n1;2\n')), 'csv');
});

test('conteúdo irreconhecível gera erro claro', () => {
  assert.throws(() => detectarFormato('foto.jpg', Uint8Array.from([0xff, 0xd8, 0, 0, 1])), ErroLeitura);
});
