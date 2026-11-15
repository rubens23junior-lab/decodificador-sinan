import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc32 as crc32Node } from 'node:zlib';
import { crc32, criarZip, juntar } from '../src/saida/zip.js';
import { criarXlsx, criarPlanilhaEmFluxo, letraColuna, escaparXml, ESTILO } from '../src/saida/xlsx.js';
import { lerZip, lerXlsx } from '../ferramentas/ler-xlsx.js';

test('CRC-32 igual ao do Node, também quando calculado aos poucos', () => {
  const dados = new TextEncoder().encode('Notificação fictícia 123');
  assert.equal(crc32(dados), crc32Node(dados));
  assert.equal(crc32(dados.subarray(10), crc32(dados.subarray(0, 10))), crc32Node(dados));
});

test('ZIP compactado guarda e devolve os arquivos com nomes acentuados', () => {
  const grande = 'Sim;Não;'.repeat(5000);
  const zip = criarZip([
    { nome: 'a.txt', conteudo: 'um' },
    { nome: 'pasta/ção.txt', conteudo: new TextEncoder().encode(grande) },
  ]);
  assert.deepEqual(lerZip(zip), { 'a.txt': 'um', 'pasta/ção.txt': grande });
  assert.ok(zip.length < grande.length / 10, 'conteúdo repetitivo deve ser bem compactado');
});

test('letras das colunas do Excel', () => {
  assert.equal(letraColuna(0), 'A');
  assert.equal(letraColuna(25), 'Z');
  assert.equal(letraColuna(26), 'AA');
  assert.equal(letraColuna(120), 'DQ');
});

test('escapa caracteres especiais e remove caracteres de controle', () => {
  assert.equal(escaparXml('A < B & "C"\u0001'), 'A &lt; B &amp; &quot;C&quot;');
});

test('a planilha gerada é lida de volta com os mesmos valores', () => {
  const xlsx = criarXlsx([
    { nome: 'Conferência', linhas: [['Coluna', 'Rótulo'], ['CS_SEXO', { valor: 'Não & "sim" <x>', estilo: ESTILO.destaque }], ['', 'só B'], [3, 'Não & "sim" <x>']] },
    { nome: 'Resumo: teste/1', linhas: [['Registros']], cabecalho: false },
  ]);
  assert.deepEqual(lerXlsx(xlsx), {
    'Conferência': [['Coluna', 'Rótulo'], ['CS_SEXO', 'Não & "sim" <x>'], ['', 'só B'], ['3', 'Não & "sim" <x>']],
    'Resumo  teste 1': [['Registros']],
  });
});

test('estrutura: textos compartilhados, linha congelada, filtro e estilos', () => {
  const arquivos = lerZip(criarXlsx([{ nome: 'Dados', linhas: [['Sexo', 'Idade'], ['Feminino', 25], ['Feminino', 3]] }]));
  const aba = arquivos['xl/worksheets/sheet1.xml'];
  assert.match(arquivos['xl/sharedStrings.xml'], /uniqueCount="3"/, 'Feminino guardado uma vez só');
  assert.match(aba, /<c r="B2"><v>25<\/v><\/c>/);
  assert.match(aba, /state="frozen"/);
  assert.match(aba, /<autoFilter ref="A1:B3"\/>/);
  assert.match(aba, /<c r="A1" s="1" t="s">/);
});

test('planilha em fluxo: duas linhas de cabeçalho, datas e destaques', () => {
  const partes = [];
  const p = criarPlanilhaEmFluxo((x) => partes.push(x.slice()));
  p.iniciarAba('Dados', { linhasCabecalho: 2 });
  p.linha(['Data', 'Sexo'], ESTILO.cabecalho);
  p.linha(['DT_NOTIFIC', 'CS_SEXO'], ESTILO.cabecalhoOriginal);
  p.linha([45672, 'X'], [ESTILO.data, ESTILO.destaque]);
  p.fecharAba();
  p.finalizar();
  const arquivos = lerZip(juntar(partes));
  const aba = arquivos['xl/worksheets/sheet1.xml'];
  assert.match(aba, /ySplit="2" topLeftCell="A3"/);
  assert.match(aba, /<c r="A3" s="4"><v>45672<\/v><\/c>/);
  assert.match(aba, /<c r="B3" s="3" t="s">/);
  assert.match(aba, /<autoFilter ref="A2:B3"\/>/);
  assert.match(arquivos['xl/styles.xml'], /numFmtId="14"/);
});
