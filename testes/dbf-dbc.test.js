import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerCabecalhoDBF, criarLeitorRegistrosDBF } from '../src/leitura/dbf.js';
import { lerArquivo, ErroLeitura } from '../src/leitura/index.js';
import { criarDBF, criarDBC, CAMPOS_FICTICIOS, REGISTROS_FICTICIOS } from './auxiliares/ficticios.js';

function lerTudo(bytes, formato) {
  const registros = [];
  let colunas;
  const resumo = lerArquivo(bytes, {
    formato,
    aoCabecalho: (c) => (colunas = c),
    aoRegistro: (v) => registros.push(v),
  });
  return { colunas, registros, resumo };
}

test('lê o cabeçalho do DBF: nomes, tipos e tamanhos das colunas', () => {
  const cab = lerCabecalhoDBF(criarDBF(CAMPOS_FICTICIOS, REGISTROS_FICTICIOS));
  assert.equal(cab.numRegistros, 4);
  assert.deepEqual(
    cab.campos.map((c) => [c.nome, c.tipo, c.tamanho]),
    [['DT_NOTIFIC', 'D', 8], ['NU_IDADE_N', 'N', 4], ['CS_SEXO', 'C', 1], ['NM_TESTE', 'C', 20]],
  );
});

test('lê os registros do DBF com acentos corretos (windows-1252) e campos em branco', () => {
  const { registros, resumo } = lerTudo(criarDBF(CAMPOS_FICTICIOS, REGISTROS_FICTICIOS), 'dbf');
  assert.deepEqual(registros, REGISTROS_FICTICIOS);
  assert.equal(resumo.lidos, 4);
  assert.equal(resumo.codificacao, 'windows-1252');
});

test('registros marcados como excluídos são pulados e contados', () => {
  const { registros, resumo } = lerTudo(criarDBF(CAMPOS_FICTICIOS, REGISTROS_FICTICIOS, { excluidos: [1] }), 'dbf');
  assert.equal(registros.length, 3);
  assert.equal(resumo.excluidos, 1);
  assert.ok(!registros.some((r) => r[3] === 'Conceição'));
});

test('o resultado é o mesmo quando os bytes chegam em pedaços de qualquer tamanho', () => {
  const dbf = criarDBF(CAMPOS_FICTICIOS, REGISTROS_FICTICIOS);
  const cab = lerCabecalhoDBF(dbf);
  for (const tamanho of [1, 7, 34, 1000]) {
    const registros = [];
    const leitor = criarLeitorRegistrosDBF(cab, { aoRegistro: (v) => registros.push(v) });
    for (let pos = cab.tamCabecalho; pos < dbf.length; pos += tamanho) {
      leitor.empurrar(dbf.subarray(pos, pos + tamanho));
    }
    leitor.finalizar();
    assert.deepEqual(registros, REGISTROS_FICTICIOS, `pedaços de ${tamanho} bytes`);
  }
});

test('DBF sem a marca de fim de arquivo também é lido', () => {
  const { registros } = lerTudo(criarDBF(CAMPOS_FICTICIOS, REGISTROS_FICTICIOS, { marcaFim: false }), 'dbf');
  assert.equal(registros.length, 4);
});

test('DBF cortado no meio gera erro claro em português', () => {
  const dbf = criarDBF(CAMPOS_FICTICIOS, REGISTROS_FICTICIOS);
  assert.throws(() => lerTudo(dbf.subarray(0, dbf.length - 40), 'dbf'), (erro) => {
    assert.ok(erro instanceof ErroLeitura);
    assert.match(erro.message, /anuncia 4 registros/);
    return true;
  });
});

test('arquivo que não é DBF gera erro claro', () => {
  assert.throws(() => lerTudo(new Uint8Array(10), 'dbf'), ErroLeitura);
});

test('DBC fictício: lê o mesmo conteúdo do DBF de origem', () => {
  const dbf = criarDBF(CAMPOS_FICTICIOS, REGISTROS_FICTICIOS);
  const { colunas, registros, resumo } = lerTudo(criarDBC(dbf), 'dbc');
  assert.deepEqual(colunas.map((c) => c.nome), ['DT_NOTIFIC', 'NU_IDADE_N', 'CS_SEXO', 'NM_TESTE']);
  assert.deepEqual(registros, REGISTROS_FICTICIOS);
  assert.equal(resumo.lidos, 4);
});

test('DBC com muitos registros (várias janelas de descompactação)', () => {
  const muitos = Array.from({ length: 3000 }, (_, i) => ['20240101', String(4000 + (i % 99)), i % 2 ? 'M' : 'F', `Pessoa ${i}`]);
  const { registros } = lerTudo(criarDBC(criarDBF(CAMPOS_FICTICIOS, muitos)), 'dbc');
  assert.deepEqual(registros, muitos);
});

test('DBC cortado gera erro claro em português', () => {
  const dbc = criarDBC(criarDBF(CAMPOS_FICTICIOS, REGISTROS_FICTICIOS));
  assert.throws(() => lerTudo(dbc.subarray(0, dbc.length - 30), 'dbc'), (erro) => {
    assert.ok(erro instanceof ErroLeitura);
    assert.match(erro.message, /descompactar/);
    return true;
  });
});
