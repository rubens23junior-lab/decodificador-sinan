import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processar } from '../src/processar.js';
import { juntar } from '../src/saida/zip.js';
import { lerXlsx, lerZip } from '../ferramentas/ler-xlsx.js';
import { criarDBF, criarDBC } from './auxiliares/ficticios.js';
import { dicionarioFicticio, tabelasFicticias, COLUNAS_ARQUIVO } from './auxiliares/dicionario-ficticio.js';

const CAMPOS = COLUNAS_ARQUIVO.map((nome) => ({ nome, tipo: nome.startsWith('DT_') ? 'D' : 'C', tamanho: nome === 'ID_UNIDADE' ? 7 : 8 }));
const REGISTROS = [
  ['X99', '20250115', '4025', '01', '1', '99', '990001', '1234567', '0042'],
  ['X99', '20250230', '3009', '9', '7', '99', '990000', '', ''],
  ['X99', '', '', '', '', '', '', '', ''],
];
const AGORA = new Date(2026, 10, 1, 10, 30);

function rodar(bytes, nome, opcoes) {
  return processar({ bytes, nomeArquivo: nome, dic: dicionarioFicticio(), tabelas: tabelasFicticias(), opcoes, versaoFerramenta: '0.0.0-teste', agora: AGORA });
}

test('gera a planilha com as abas Dados, Inconsistências, Dicionário usado e Resumo', () => {
  const r = rodar(criarDBF(CAMPOS, REGISTROS), 'ficticio.dbf');
  assert.equal(r.arquivos.length, 1);
  assert.equal(r.arquivos[0].nome, 'agravo_ficticio_decodificado_2026-11-01.xlsx');
  const abas = lerXlsx(juntar(r.arquivos[0].partes));
  assert.deepEqual(Object.keys(abas), ['Dados', 'Inconsistências', 'Dicionário usado', 'Resumo']);

  const dados = abas['Dados'];
  assert.equal(dados.length, 4); // cabeçalho + 3 registros
  assert.deepEqual(dados[1].slice(0, 9), ['Fictício', 'X99', '45672', '25 anos', '4025', 'Nível um', '01', 'Sim', '1']);
  assert.equal(dados[2][2], '20250230', 'data inválida fica como veio');
  assert.equal(dados[2][7], '7', 'código desconhecido fica como veio');
  assert.equal(dados[2][11], 'Municipio Ignorado - Ficticio');
  assert.deepEqual(dados[3].slice(2), [], 'registro em branco continua em branco');

  const inc = abas['Inconsistências'].slice(1).map((l) => `${l[0]}|${l[2]}|${l[4]}`);
  assert.deepEqual(inc, ['DT_NOTIFIC|20250230|1', 'FEBRE|7|1', 'REGIAO_RES|990000|1']);

  const resumo = Object.fromEntries(abas['Resumo'].slice(1).map((l) => [l[0], l[1]]));
  assert.equal(resumo['Registros lidos'], '3');
  assert.equal(resumo['Registros incluídos na planilha'], '3');
  assert.equal(resumo['Versão da ferramenta'], '0.0.0-teste');
  assert.match(abas['Dicionário usado'][3][1], /Pessoa fictícia/);
});

test('células com problema ficam destacadas e datas têm formato de data', () => {
  const r = rodar(criarDBF(CAMPOS, REGISTROS), 'ficticio.dbf');
  const aba = lerZip(juntar(r.arquivos[0].partes))['xl/worksheets/sheet1.xml'];
  assert.match(aba, /<c r="C2" s="4"><v>45672<\/v><\/c>/);
  assert.match(aba, /<c r="C3" s="3" t="s">/);
  assert.match(aba, /<c r="H3" s="3" t="s">/);
});

test('mesma saída a partir de um DBC', () => {
  const r = rodar(criarDBC(criarDBF(CAMPOS, REGISTROS)), 'FICTICIO.DBC');
  assert.equal(lerXlsx(juntar(r.arquivos[0].partes))['Dados'].length, 4);
});

test('opções: sem colunas originais, com 2ª linha de cabeçalho, com filtro', () => {
  const r = rodar(criarDBF(CAMPOS, REGISTROS), 'f.dbf', {
    manterOriginais: false,
    cabecalhoOriginal: true,
    filtros: [{ coluna: 'DT_NOTIFIC', de: '20250101', ate: '20251231' }],
  });
  const dados = lerXlsx(juntar(r.arquivos[0].partes))['Dados'];
  assert.deepEqual(dados[0].slice(0, 3), ['Agravo', 'Data da notificação', 'Idade']);
  assert.deepEqual(dados[1].slice(0, 3), ['ID_AGRAVO', 'DT_NOTIFIC', 'NU_IDADE_N']);
  // Data em branco fica fora do período; data inválida (30/02/2025) cai dentro do período e entra, destacada.
  assert.equal(dados.length, 4, '2 linhas de cabeçalho + 2 registros');
  assert.equal(r.lidos, 3);
  assert.equal(r.incluidos, 2);
});

test('saída em CSV: dados em CSV e abas de apoio num Excel separado', () => {
  const r = rodar(criarDBF(CAMPOS, REGISTROS), 'f.dbf', { saida: 'csv', manterOriginais: false });
  assert.deepEqual(r.arquivos.map((a) => a.nome), ['agravo_ficticio_decodificado_2026-11-01.csv', 'agravo_ficticio_decodificado_2026-11-01_apoio.xlsx']);
  const texto = new TextDecoder('utf-8', { ignoreBOM: true }).decode(juntar(r.arquivos[0].partes));
  const linhas = texto.split('\r\n');
  assert.ok(texto.startsWith('﻿Agravo;Data da notificação;Idade;'));
  assert.equal(linhas[1], 'Fictício;15/01/2025;25 anos;Nível um;Sim;Estado Fictício;Vila Alfa (Estado Fictício);Posto Fictício;0042;Região Norte Fictícia (99001)');
  assert.equal(linhas[2].split(';')[1], '20250230');
  assert.deepEqual(Object.keys(lerXlsx(juntar(r.arquivos[1].partes))), ['Inconsistências', 'Dicionário usado', 'Resumo']);
});

test('formato para análise no Excel: nomes do SINAN, código em _cod, idade_anos numérica e uma linha de cabeçalho', () => {
  const r = rodar(criarDBF(CAMPOS, REGISTROS), 'f.dbf', { formatoAnalise: true, cabecalhoOriginal: true });
  const abas = lerXlsx(juntar(r.arquivos[0].partes));
  const dados = abas['Dados'];
  assert.deepEqual(dados[0], ['id_agravo', 'id_agravo_cod', 'dt_notific', 'nu_idade_n', 'nu_idade_n_cod', 'idade_anos', 'cs_escol', 'cs_escol_cod',
    'febre', 'febre_cod', 'sg_uf', 'sg_uf_cod', 'id_mn_resi', 'id_mn_resi_cod', 'id_unidade', 'id_unidade_cod', 'id_regiona', 'regiao_res']);
  assert.equal(dados.length, 4, 'uma linha de cabeçalho só, mesmo com a 2ª linha pedida');
  assert.deepEqual(dados[1].slice(3, 6), ['25 anos', '4025', '25']);
  assert.deepEqual(dados[2].slice(3, 6), ['9 meses', '3009', '0']);
  assert.equal(dados[3][5], undefined, 'idade em branco: idade_anos vazia');
  const aba = lerZip(juntar(r.arquivos[0].partes))['xl/worksheets/sheet1.xml'];
  assert.match(aba, /<c r="F2"[^>]*><v>25<\/v><\/c>/, 'idade_anos é número, não texto');
  const resumo = Object.fromEntries(abas['Resumo'].slice(1).map((l) => [l[0], l[1]]));
  assert.match(resumo['Formato para análise (R, Stata, Python)'], /^Sim/);
  assert.deepEqual(abas['Inconsistências'].slice(1).map((l) => l[0]), ['DT_NOTIFIC', 'FEBRE', 'REGIAO_RES'], 'idade_anos não duplica inconsistências');
});

test('formato para análise no CSV: sem BOM, vírgula, ponto decimal e datas aaaa-mm-dd', () => {
  const r = rodar(criarDBF(CAMPOS, REGISTROS), 'f.dbf', { saida: 'csv', manterOriginais: false, formatoAnalise: true });
  const bytes = juntar(r.arquivos[0].partes);
  assert.notEqual(bytes[0], 0xef, 'sem a marca BOM');
  const linhas = new TextDecoder().decode(bytes).split('\r\n');
  assert.equal(linhas[0], 'id_agravo,dt_notific,nu_idade_n,idade_anos,cs_escol,febre,sg_uf,id_mn_resi,id_unidade,id_regiona,regiao_res');
  assert.equal(linhas[1], 'Fictício,2025-01-15,25 anos,25,Nível um,Sim,Estado Fictício,Vila Alfa (Estado Fictício),Posto Fictício,0042,Região Norte Fictícia (99001)');
  assert.equal(linhas[2].split(',')[1], '20250230', 'data inválida continua como veio');
});

test('arquivo de outro agravo: erro claro e nenhuma planilha', () => {
  const campos = ['TP_NOT', 'CS_SEXO', 'OUTRA'].map((nome) => ({ nome, tipo: 'C', tamanho: 2 }));
  assert.throws(() => rodar(criarDBF(campos, [['2', 'F', 'x']]), 'outro.dbf'), /não parece ser de Agravo Fictício.*Nenhuma planilha/s);
});
