import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarDecodificador, ErroDecodificacao } from '../src/decodificacao/decodificador.js';
import { dicionarioFicticio, tabelasFicticias, COLUNAS_ARQUIVO } from './auxiliares/dicionario-ficticio.js';

const REGISTRO = ['X99', '20250115', '4025', '01', '1', '99', '990001', '1234567', '0042'];

function preparar(opcoes) {
  const dec = criarDecodificador(dicionarioFicticio(), tabelasFicticias(), opcoes);
  const colunas = dec.prepararColunas(COLUNAS_ARQUIVO);
  return { dec, colunas };
}

test('monta o cabeçalho: nome legível, código ao lado e coluna extra na posição pedida', () => {
  const { colunas } = preparar();
  assert.deepEqual(colunas.map((c) => c.cabecalho), [
    'Agravo', 'ID_AGRAVO', 'Data da notificação', 'Idade', 'NU_IDADE_N', 'Escolaridade', 'CS_ESCOL', 'Febre', 'FEBRE',
    'UF de residência', 'SG_UF', 'Município de residência', 'ID_MN_RESI', 'Unidade', 'ID_UNIDADE', 'Regional (código)', 'Região de residência',
  ]);
  assert.equal(colunas[2].tipoCelula, 'data');
  assert.equal(colunas[16].original, 'REGIAO_RES (calculada de ID_MN_RESI)');
});

test('sem as colunas originais e só com as colunas escolhidas', () => {
  const { colunas } = preparar({ manterOriginais: false, colunas: ['CS_ESCOL', 'FEBRE', 'REGIAO_RES', 'ID_REGIONA'] });
  assert.deepEqual(colunas.map((c) => c.cabecalho), ['Escolaridade', 'Febre', 'Regional (código)', 'Região de residência']);
});

test('categoria conhecida vira o rótulo (inclusive formas equivalentes como "01")', () => {
  const { dec } = preparar({ manterOriginais: false });
  const { valores, alertas } = dec.decodificar(REGISTRO);
  assert.deepEqual(valores, ['Fictício', 45672, '25 anos', 'Nível um', 'Sim', 'Estado Fictício', 'Vila Alfa (Estado Fictício)', 'Posto Fictício', '0042', 'Região Norte Fictícia (99001)']);
  assert.equal(alertas, null);
  assert.deepEqual(dec.listarInconsistencias(), []);
});

test('categoria desconhecida fica como veio, com alerta, e vai para as inconsistências', () => {
  const { dec } = preparar({ manterOriginais: false });
  const r = REGISTRO.slice();
  r[4] = '7';
  dec.decodificar(r);
  const { valores, alertas } = dec.decodificar(r);
  assert.equal(valores[4], '7');
  assert.deepEqual(alertas, [4]);
  assert.deepEqual(dec.listarInconsistencias(), [
    { coluna: 'FEBRE', rotulo: 'Febre', valor: '7', motivo: 'Código não encontrado no dicionário', quantidade: 2 },
  ]);
});

test('campo em branco continua em branco (nunca vira "Ignorado")', () => {
  const { dec } = preparar();
  const { valores, alertas } = dec.decodificar(['X99', '', '', '', '', '', '', '', '']);
  assert.deepEqual(valores.slice(0, 2), ['Fictício', 'X99']); // agravo preenchido, com o código ao lado
  assert.ok(valores.slice(2).every((v) => v === null), JSON.stringify(valores));
  assert.equal(alertas, null);
});

test('data e idade inválidas não quebram: ficam como vieram e são registradas', () => {
  const { dec } = preparar({ manterOriginais: false });
  const r = REGISTRO.slice();
  r[1] = '20250230';
  r[2] = '9999';
  const { valores, alertas } = dec.decodificar(r);
  assert.equal(valores[1], '20250230');
  assert.equal(valores[2], '9999');
  assert.deepEqual(alertas, [1, 2]);
  const motivos = dec.listarInconsistencias().map((i) => `${i.coluna}: ${i.motivo}`);
  assert.deepEqual(motivos, ['DT_NOTIFIC: Data inexistente no calendário', 'NU_IDADE_N: Unidade de idade desconhecida (1º dígito)']);
});

test('município: IBGE primeiro, complemento do DATASUS depois; código sem tabela é registrado', () => {
  const { dec } = preparar({ manterOriginais: false, colunas: ['ID_MN_RESI', 'REGIAO_RES', 'ID_REGIONA'] });
  assert.deepEqual(dec.decodificar(['X99', '', '', '', '', '', '990000', '', '']).valores, [
    'Municipio Ignorado - Ficticio', null, null,
  ]);
  const { valores, alertas } = dec.decodificar(['X99', '', '', '', '', '', '123456', '', '']);
  assert.deepEqual(valores, ['123456', null, null]);
  assert.deepEqual(alertas, [0]);
  const colunas = dec.listarInconsistencias().map((i) => i.coluna);
  assert.deepEqual(colunas, ['ID_MN_RESI', 'REGIAO_RES', 'REGIAO_RES']);
});

test('filtros por valor (UF) e por período de data', () => {
  const { dec } = preparar({ filtros: [{ coluna: 'SG_UF', valores: ['99'] }, { coluna: 'DT_NOTIFIC', de: '20250101', ate: '20250131' }] });
  assert.equal(dec.aceita(REGISTRO), true);
  assert.equal(dec.aceita(REGISTRO.map((v, i) => (i === 5 ? '11' : v))), false);
  assert.equal(dec.aceita(REGISTRO.map((v, i) => (i === 1 ? '20250201' : v))), false);
  assert.equal(dec.aceita(REGISTRO.map((v, i) => (i === 1 ? '' : v))), false);
});

test('arquivo de outro agravo (colunas diferentes) é recusado com mensagem clara', () => {
  const dec = criarDecodificador(dicionarioFicticio(), tabelasFicticias());
  assert.throws(() => dec.prepararColunas(['TP_NOT', 'OUTRA', 'MAIS_UMA', 'CS_SEXO']), (e) => {
    assert.ok(e instanceof ErroDecodificacao);
    assert.match(e.message, /não parece ser de Agravo Fictício/);
    assert.match(e.message, /Nenhuma planilha foi gerada/);
    return true;
  });
});

test('arquivo com as mesmas colunas mas de outro agravo é recusado após a amostra', () => {
  const { dec } = preparar();
  const outro = REGISTRO.map((v, i) => (i === 0 ? 'Y11' : v));
  assert.throws(() => {
    for (let i = 0; i < 1000; i++) dec.decodificar(outro);
  }, /agravo não é X99/);
});

test('aceita mais de uma forma do código do agravo (ex.: com e sem ponto)', () => {
  const dic = dicionarioFicticio();
  dic.agravo.codigos = ['X99', 'X9.9'];
  const dec = criarDecodificador(dic, tabelasFicticias());
  dec.prepararColunas(COLUNAS_ARQUIVO);
  const comPonto = REGISTRO.map((v, i) => (i === 0 ? 'X9.9' : v));
  assert.doesNotThrow(() => {
    for (let i = 0; i < 1000; i++) dec.decodificar(i % 2 ? comPonto : REGISTRO);
  });
});

test('dicionário não conferido não pode ser usado', () => {
  const dic = dicionarioFicticio();
  dic.conferencia.conferido = false;
  assert.throws(() => criarDecodificador(dic, tabelasFicticias()), /ainda não foi conferido/);
});

test('coluna do arquivo sem tradução é mantida e registrada', () => {
  const dec = criarDecodificador(dicionarioFicticio(), tabelasFicticias(), { manterOriginais: false });
  const colunas = dec.prepararColunas([...COLUNAS_ARQUIVO, 'NOVA_COL']);
  assert.equal(colunas.at(-1).cabecalho, 'NOVA_COL');
  assert.deepEqual(dec.decodificar([...REGISTRO, 'abc']).valores.at(-1), 'abc');
  assert.deepEqual(dec.listarInconsistencias().map((i) => [i.coluna, i.motivo]), [['NOVA_COL', 'Coluna sem tradução no dicionário']]);
});

test('coluna extra ainda em conferência não entra na planilha', () => {
  const dic = dicionarioFicticio();
  dic.derivadas_em_conferencia = [{ nome: 'MACRO_RES', rotulo: 'Macrorregião de residência', de: 'ID_MN_RESI', tabela: 'regioes', depois_de: 'ID_REGIONA' }];
  const colunas = criarDecodificador(dic, tabelasFicticias()).prepararColunas(COLUNAS_ARQUIVO);
  assert.ok(!colunas.some((c) => c.cabecalho === 'Macrorregião de residência'));
  assert.equal(colunas.at(-1).cabecalho, 'Região de residência');
});
