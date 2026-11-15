import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarLeitorCSV, detectarSeparador } from '../src/leitura/csv.js';
import { lerArquivo, ErroLeitura } from '../src/leitura/index.js';
import { paraWindows1252 } from './auxiliares/ficticios.js';

function lerTexto(texto, tamanhoPedaco = texto.length || 1) {
  const registros = [];
  let nomes;
  const leitor = criarLeitorCSV({ aoCabecalho: (n) => (nomes = n), aoRegistro: (v) => registros.push(v) });
  for (let i = 0; i < texto.length; i += tamanhoPedaco) leitor.empurrar(texto.slice(i, i + tamanhoPedaco));
  const resumo = leitor.finalizar();
  return { nomes, registros, resumo };
}

test('detecta ponto e vírgula e vírgula como separador', () => {
  assert.equal(detectarSeparador('CS_SEXO;CS_RACA;NU_IDADE_N'), ';');
  assert.equal(detectarSeparador('CS_SEXO,CS_RACA,NU_IDADE_N'), ',');
  assert.equal(detectarSeparador('"A,B";C;D'), ';');
});

test('lê CSV com ponto e vírgula', () => {
  const { nomes, registros, resumo } = lerTexto('CS_SEXO;NU_IDADE_N\nF;4025\nM;3009\n');
  assert.deepEqual(nomes, ['CS_SEXO', 'NU_IDADE_N']);
  assert.deepEqual(registros, [['F', '4025'], ['M', '3009']]);
  assert.equal(resumo.separador, ';');
});

test('lê CSV com vírgula, aspas, separador e quebra de linha dentro de aspas', () => {
  const texto = 'A,B,C\r\n"x,y","linha 1\nlinha 2","diz ""oi"""\r\n1,,3';
  const { registros } = lerTexto(texto);
  assert.deepEqual(registros, [['x,y', 'linha 1\nlinha 2', 'diz "oi"'], ['1', '', '3']]);
});

test('campo em branco continua em branco e linhas vazias são ignoradas', () => {
  const { registros } = lerTexto('A;B\n;\n\nX;\n');
  assert.deepEqual(registros, [['', ''], ['X', '']]);
});

test('o resultado não depende de como o texto chega em pedaços', () => {
  const texto = '﻿A;B\r\n"um;dois";"três ""3"""\r\nfim;ok\r\n';
  const esperado = lerTexto(texto).registros;
  for (const tamanho of [1, 2, 3, 5, 11]) {
    assert.deepEqual(lerTexto(texto, tamanho).registros, esperado, `pedaços de ${tamanho}`);
  }
  assert.deepEqual(esperado, [['um;dois', 'três "3"'], ['fim', 'ok']]);
});

test('remove a marca BOM do início do arquivo', () => {
  assert.deepEqual(lerTexto('﻿CS_SEXO;X\nF;1').nomes, ['CS_SEXO', 'X']);
});

test('linha com número de colunas diferente do cabeçalho gera erro claro', () => {
  assert.throws(() => lerTexto('A;B\n1;2;3\n'), (erro) => {
    assert.ok(erro instanceof ErroLeitura);
    assert.match(erro.message, /linha 2 do CSV tem 3 colunas/);
    return true;
  });
});

test('aspas abertas até o fim geram erro claro', () => {
  assert.throws(() => lerTexto('A;B\n"1;2\n'), ErroLeitura);
});

test('arquivo vazio gera erro claro', () => {
  assert.throws(() => lerTexto(''), ErroLeitura);
});

test('CSV em codificação antiga (windows-1252) sai com acentos corretos', () => {
  const bytes = paraWindows1252('MUNICIPIO;SITUACAO\nSão João;Não se aplica\n');
  const registros = [];
  const resumo = lerArquivo(bytes, { formato: 'csv', aoRegistro: (v) => registros.push(v) });
  assert.equal(resumo.codificacao, 'windows-1252');
  assert.deepEqual(registros, [['São João', 'Não se aplica']]);
});

test('CSV em UTF-8 é reconhecido e sai com acentos corretos', () => {
  const bytes = new TextEncoder().encode('MUNICIPIO;SITUACAO\nSão João;Não se aplica\n');
  const registros = [];
  const resumo = lerArquivo(bytes, { formato: 'csv', aoRegistro: (v) => registros.push(v) });
  assert.equal(resumo.codificacao, 'utf-8');
  assert.deepEqual(registros, [['São João', 'Não se aplica']]);
});
