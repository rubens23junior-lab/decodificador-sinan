import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verificarDicionario, verificarTabela, verificarTabelaMunicipios, compararColunas } from '../src/dicionario/verificar.js';

// Dicionário fictício mínimo e correto; cada teste estraga uma parte.
function dicionarioFicticio() {
  return {
    formato: 1,
    agravo: { nome: 'Agravo fictício' },
    versao: 'teste',
    conferencia: { conferido: true, por: 'Pessoa fictícia', data: '2026-01-01' },
    fontes: { F1: { documento: 'Documento fictício', orgao: 'Órgão', data: '2026', arquivo: 'x.pdf' } },
    listas: { sn: [{ codigos: ['1'], rotulo: 'Sim' }, { codigos: ['2'], rotulo: 'Não' }] },
    colunas: [
      { nome: 'CS_SEXO', rotulo: 'Sexo', tipo: 'categorico', fonte: 'F1', local: 'p. 1',
        categorias: [{ codigos: ['M'], rotulo: 'Masculino' }, { codigos: ['F'], rotulo: 'Feminino' }] },
      { nome: 'FEBRE', rotulo: 'Febre', tipo: 'categorico', fonte: 'F1', local: 'p. 1', lista: 'sn' },
      { nome: 'DT_NOTIFIC', rotulo: 'Data', tipo: 'data', fonte: 'F1', local: 'p. 1' },
    ],
  };
}

test('dicionário correto não tem erros nem avisos', () => {
  assert.deepEqual(verificarDicionario(dicionarioFicticio()), { erros: [], avisos: [] });
});

test('aponta código repetido na mesma coluna', () => {
  const dic = dicionarioFicticio();
  dic.colunas[0].categorias.push({ codigos: ['M'], rotulo: 'Outro' });
  const { erros } = verificarDicionario(dic);
  assert.ok(erros.some((e) => /CS_SEXO: o código "M" aparece repetido/.test(e)), erros.join('\n'));
});

test('aponta código repetido entre formas equivalentes ("1" e "01")', () => {
  const dic = dicionarioFicticio();
  dic.listas.sn = [{ codigos: ['1', '01'], rotulo: 'Sim' }, { codigos: ['01'], rotulo: 'Não' }];
  const { erros } = verificarDicionario(dic);
  assert.ok(erros.some((e) => /"01" aparece repetido/.test(e)), erros.join('\n'));
});

test('aponta rótulo faltando', () => {
  const dic = dicionarioFicticio();
  dic.colunas[0].categorias[1].rotulo = '  ';
  const { erros } = verificarDicionario(dic);
  assert.ok(erros.some((e) => /CS_SEXO, categoria 2: falta o rótulo/.test(e)), erros.join('\n'));
});

test('aponta coluna categórica sem categorias e lista inexistente', () => {
  const dic = dicionarioFicticio();
  delete dic.colunas[0].categorias;
  dic.colunas[1].lista = 'nao_existe';
  const { erros } = verificarDicionario(dic);
  assert.ok(erros.some((e) => /CS_SEXO: não tem nenhuma categoria/.test(e)));
  assert.ok(erros.some((e) => /lista "nao_existe" não existe/.test(e)));
});

test('aponta fonte inexistente, tipo desconhecido e coluna repetida', () => {
  const dic = dicionarioFicticio();
  dic.colunas[2].fonte = 'F9';
  dic.colunas[2].tipo = 'outro';
  dic.colunas.push({ ...dic.colunas[1] });
  const { erros } = verificarDicionario(dic);
  assert.ok(erros.some((e) => /fonte "F9" não está na lista/.test(e)));
  assert.ok(erros.some((e) => /tipo "outro" desconhecido/.test(e)));
  assert.ok(erros.some((e) => /FEBRE: coluna repetida/.test(e)));
});

test('aponta limite de idade que não é número inteiro', () => {
  const dic = dicionarioFicticio();
  dic.colunas.push({ nome: 'NU_IDADE_N', rotulo: 'Idade', tipo: 'idade', fonte: 'F1', local: 'p. 1',
    unidades: [{ codigos: ['4'], rotulo: 'ano', plural: 'anos', maximo: 'cento e dez' }] });
  const { erros } = verificarDicionario(dic);
  assert.ok(erros.some((e) => /"maximo" precisa ser um número inteiro/.test(e)), erros.join('\n'));
});

test('dicionário não conferido gera aviso; conferido sem data gera erro', () => {
  const dic = dicionarioFicticio();
  dic.conferencia = { conferido: false, por: null, data: null };
  assert.ok(verificarDicionario(dic).avisos.some((a) => /não conferido/.test(a)));
  dic.conferencia = { conferido: true, por: 'X', data: null };
  assert.ok(verificarDicionario(dic).erros.some((e) => /sem "por" e "data"/.test(e)));
});

test('compara colunas do arquivo com as do dicionário, sem diferenciar maiúsculas', () => {
  const r = compararColunas(dicionarioFicticio(), ['cs_sexo', 'FEBRE', 'COLUNA_NOVA']);
  assert.deepEqual(r, { semTraducao: ['COLUNA_NOVA'], ausentesNoArquivo: ['DT_NOTIFIC'] });
});

test('tabela de municípios: aponta código e UF inconsistentes', () => {
  const tabela = {
    fonte: { documento: 'Tabela fictícia' },
    total_municipios: 2,
    ufs: { 99: 'UF fictícia' },
    municipios: {
      990001: { nome: 'Cidade A', uf: '99', codigo_ibge: '9900011' },
      990002: { nome: 'Cidade B', uf: '98', codigo_ibge: '9900032' },
    },
  };
  const { erros } = verificarTabelaMunicipios(tabela);
  assert.ok(erros.some((e) => /990002: UF "98"/.test(e)));
  assert.ok(erros.some((e) => /990002: código IBGE "9900032" não corresponde/.test(e)));
});

test('coluna do tipo tabela e coluna extra precisam de tabela e origem existentes', () => {
  const dic = dicionarioFicticio();
  dic.tabelas = { cnes: { arquivo: 'tabelas/cnes.json.gz', fonte: 'F1' } };
  dic.colunas.push({ nome: 'ID_UNIDADE', rotulo: 'Unidade', tipo: 'tabela', tabela: 'cnes', fonte: 'F1', local: 'p. 1' });
  dic.derivadas = [{ nome: 'REGIAO', rotulo: 'Região', de: 'ID_UNIDADE', tabela: 'cnes', depois_de: 'ID_UNIDADE' }];
  assert.deepEqual(verificarDicionario(dic).erros, []);

  dic.colunas.at(-1).tabela = 'cbo';
  dic.derivadas = [{ nome: 'FEBRE', rotulo: '', de: 'NAO_EXISTE', tabela: 'xyz' }];
  const { erros } = verificarDicionario(dic);
  assert.ok(erros.some((e) => /ID_UNIDADE: a tabela "cbo" não está/.test(e)));
  assert.ok(erros.some((e) => /FEBRE: o nome repete uma coluna/.test(e)));
  assert.ok(erros.some((e) => /falta o nome legível/.test(e)));
  assert.ok(erros.some((e) => /coluna de origem "NAO_EXISTE"/.test(e)));
  assert.ok(erros.some((e) => /tabela "xyz"/.test(e)));
});

test('coluna de município exige a tabela do IBGE', () => {
  const dic = dicionarioFicticio();
  dic.colunas.push({ nome: 'ID_MUNICIP', rotulo: 'Município', tipo: 'municipio', fonte: 'F1', local: 'p. 1' });
  assert.ok(verificarDicionario(dic).erros.some((e) => /precisa da tabela "ibge_municipios"/.test(e)));
});

test('tabela de apoio: total, fonte e rótulos', () => {
  const fonte = { documento: 'Tabela fictícia', orgao: 'Órgão', data: '2026', arquivo: 'x.csv' };
  assert.deepEqual(verificarTabela({ fonte, total: 2, valores: { 1: 'A', 2: { nome: 'B' } } }).erros, []);
  const { erros } = verificarTabela({ fonte: { documento: 'X' }, total: 3, valores: { 1: '', 2: 'B' } });
  assert.ok(erros.some((e) => /sem "orgao"/.test(e)));
  assert.ok(erros.some((e) => /anuncia 3 códigos, mas tem 2/.test(e)));
  assert.ok(erros.some((e) => /1 códigos sem rótulo/.test(e)));
});

test('os dicionários do projeto não têm erros', () => {
  const dengue = JSON.parse(readFileSync(new URL('../dicionarios/dengue.json', import.meta.url), 'utf8'));
  assert.deepEqual(verificarDicionario(dengue).erros, []);
  const municipios = JSON.parse(readFileSync(new URL('../dicionarios/tabelas/ibge-municipios.json', import.meta.url), 'utf8'));
  assert.deepEqual(verificarTabelaMunicipios(municipios).erros, []);
});

test('coluna extra em conferência é verificada como as demais e não pode repetir nome', () => {
  const dic = dicionarioFicticio();
  dic.tabelas = { cnes: { arquivo: 'tabelas/cnes.json.gz', fonte: 'F1' } };
  dic.colunas.push({ nome: 'ID_UNIDADE', rotulo: 'Unidade', tipo: 'tabela', tabela: 'cnes', fonte: 'F1', local: 'p. 1' });
  dic.derivadas = [{ nome: 'REGIAO', rotulo: 'Região', de: 'ID_UNIDADE', tabela: 'cnes' }];
  dic.derivadas_em_conferencia = [{ nome: 'MACRO', rotulo: 'Macro', de: 'ID_UNIDADE', tabela: 'cnes' }];
  assert.deepEqual(verificarDicionario(dic).erros, []);

  dic.derivadas_em_conferencia = [{ nome: 'REGIAO', rotulo: 'Região', de: 'ID_UNIDADE', tabela: 'xyz' }];
  const { erros } = verificarDicionario(dic);
  assert.ok(erros.some((e) => /REGIAO: o nome repete outra coluna extra/.test(e)));
  assert.ok(erros.some((e) => /tabela "xyz"/.test(e)));
});
