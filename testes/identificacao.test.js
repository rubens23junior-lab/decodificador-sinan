// Testes do bloco comum de identificação, da opção de incluir os dados que
// identificam a pessoa e da recusa de arquivos de ficha antiga.
// Todos os dados são fictícios.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comBlocoComum } from '../src/dicionario/bloco.js';
import { verificarBlocoComum, verificarDicionario } from '../src/dicionario/verificar.js';
import { analisarArquivo } from '../src/analisar.js';
import { processar } from '../src/processar.js';
import { criarDBF } from './auxiliares/ficticios.js';
import { dicionarioFicticio, tabelasFicticias, COLUNAS_ARQUIVO } from './auxiliares/dicionario-ficticio.js';

function blocoFicticio({ conferido = true } = {}) {
  return {
    formato: 1,
    nome: 'Bloco fictício',
    versao: 'teste',
    conferencia: { conferido, por: 'Pessoa fictícia', data: '2026-01-01' },
    fontes: { BF: { documento: 'Documento fictício do bloco', orgao: 'Órgão', data: '2026', arquivo: 'y.pdf' } },
    colunas: [
      { nome: 'NM_PACIENT', rotulo: 'Nome do paciente', tipo: 'texto', fonte: 'BF', local: 'p. 1', identifica: true },
      { nome: 'CS_ZONA', rotulo: 'Zona de residência', tipo: 'categorico', fonte: 'BF', local: 'p. 2', categorias: [{ codigos: ['1'], rotulo: 'Urbana' }] },
      { nome: 'FEBRE', rotulo: 'Febre (versão do bloco)', tipo: 'texto', fonte: 'BF', local: 'p. 3' },
    ],
  };
}

const CAMPOS = [...COLUNAS_ARQUIVO, 'NM_PACIENT', 'CS_ZONA'].map((nome) => ({ nome, tipo: nome.startsWith('DT_') ? 'D' : 'C', tamanho: 20 }));
const REGISTRO = ['X99', '20250115', '4025', '01', '1', '99', '990001', '1234567', '', 'Fulano Ficticio', '1'];

test('o bloco comum entra no dicionário sem trocar o que o agravo já tem', () => {
  const dic = comBlocoComum(dicionarioFicticio(), blocoFicticio());
  const nomes = dic.colunas.map((c) => c.nome);
  assert.ok(nomes.includes('NM_PACIENT') && nomes.includes('CS_ZONA'));
  assert.equal(dic.colunas.find((c) => c.nome === 'FEBRE').rotulo, 'Febre', 'a coluna do agravo prevalece');
  assert.ok(dic.fontes.BF && dic.fontes.F);
  assert.deepEqual(verificarDicionario(dic).erros, []);
});

test('bloco comum não conferido fica fora', () => {
  const dic = comBlocoComum(dicionarioFicticio(), blocoFicticio({ conferido: false }));
  assert.ok(!dic.colunas.some((c) => c.nome === 'NM_PACIENT'));
});

test('verificação do bloco comum aponta fonte não declarada', () => {
  const b = blocoFicticio();
  b.colunas[0].fonte = 'XX';
  assert.match(verificarBlocoComum(b).erros.join(' '), /fonte "XX"/);
  assert.deepEqual(verificarBlocoComum(blocoFicticio()).erros, []);
});

function processarFicticio(opcoes) {
  const dic = comBlocoComum(dicionarioFicticio(), blocoFicticio());
  return processar({ bytes: criarDBF(CAMPOS, [REGISTRO]), nomeArquivo: 'f.dbf', dic, tabelas: tabelasFicticias(), versaoFerramenta: 'teste', opcoes: { saida: 'csv', ...opcoes } });
}
const texto = (r) => new TextDecoder().decode(Buffer.concat(r.arquivos[0].partes.map((p) => Buffer.from(p))));

test('por padrão, os dados que identificam a pessoa ficam fora da planilha', () => {
  const r = processarFicticio({});
  const csv = texto(r);
  assert.ok(!csv.includes('Fulano Ficticio'));
  assert.ok(!csv.includes('Nome do paciente'));
  assert.ok(csv.includes('Zona de residência') && csv.includes('Urbana'), 'a zona não identifica e é traduzida');
});

test('com a opção marcada, os dados que identificam a pessoa vão para a planilha', () => {
  const csv = texto(processarFicticio({ incluirIdentificacao: true }));
  assert.ok(csv.includes('Nome do paciente') && csv.includes('Fulano Ficticio'));
});

test('a análise informa as colunas de identificação do arquivo', () => {
  const dic = comBlocoComum(dicionarioFicticio(), blocoFicticio());
  const a = analisarArquivo({ bytes: criarDBF(CAMPOS, [REGISTRO]), nomeArquivo: 'f.dbf', dic });
  assert.deepEqual(a.identificacao, ['NM_PACIENT']);
});

function dicComEstrutura() {
  const dic = dicionarioFicticio();
  dic.colunas.push({ nome: 'NOVA_FICHA', rotulo: 'Campo da ficha nova', tipo: 'texto', fonte: 'F', local: 'p' });
  dic.colunas.push({ nome: 'NU_ANO', rotulo: 'Ano', tipo: 'texto', fonte: 'F', local: 'p' });
  dic.estrutura = { exige_uma_de: ['NOVA_FICHA'], marcas_sem_codigo_do_agravo: ['VELHA_A', 'VELHA_B'], mensagem: 'Notificações fictícias{anos}, ficha antiga.' };
  return dic;
}

test('arquivo da ficha antiga é recusado com os anos das notificações', () => {
  const campos = [...COLUNAS_ARQUIVO, 'NU_ANO'].map((nome) => ({ nome, tipo: 'C', tamanho: 10 }));
  const regs = [['X99', '20100105', '', '', '', '', '', '', '', '2010'], ['X99', '20110105', '', '', '', '', '', '', '', '2011']];
  assert.throws(() => analisarArquivo({ bytes: criarDBF(campos, regs), nomeArquivo: 'v.dbf', dic: dicComEstrutura(), dicionarios: { a: dicComEstrutura() } }),
    /Notificações fictícias de 2010 a 2011, ficha antiga\./);
});

test('arquivo da ficha antiga sem coluna do agravo é reconhecido pelas marcas', () => {
  const campos = ['DT_NOTIFIC', 'NU_ANO', 'VELHA_A', 'VELHA_B', 'OUTRA'].map((nome) => ({ nome, tipo: 'C', tamanho: 10 }));
  assert.throws(() => analisarArquivo({ bytes: criarDBF(campos, [['20030105', '2003', '1', '2', 'x']]), nomeArquivo: 'w.dbf', dic: dicComEstrutura(), dicionarios: { a: dicComEstrutura() } }),
    /Notificações fictícias de 2003, ficha antiga\./);
});

test('arquivo com a coluna da ficha nova continua aceito', () => {
  const campos = [...COLUNAS_ARQUIVO, 'NU_ANO', 'NOVA_FICHA'].map((nome) => ({ nome, tipo: 'C', tamanho: 10 }));
  const a = analisarArquivo({ bytes: criarDBF(campos, [['X99', '20250105', '', '', '', '', '', '', '', '2025', 'sim']]), nomeArquivo: 'n.dbf', dic: dicComEstrutura() });
  assert.equal(a.registros, 1);
});

test('verificação do dicionário aponta estrutura mal escrita', () => {
  const dic = dicComEstrutura();
  dic.estrutura.mensagem = 'sem marca';
  assert.match(verificarDicionario(dic).erros.join(' '), /\{anos\}/);
});

test('campos que só existem nas exportações não aparecem como ausentes num arquivo público', () => {
  const dic = comBlocoComum(dicionarioFicticio(), blocoFicticio());
  dic.colunas.push({ nome: 'SO_EXPORT', rotulo: 'Campo de exportação', tipo: 'texto', fonte: 'F', local: 'p', so_em_exportacoes: true });
  const campos = COLUNAS_ARQUIVO.map((nome) => ({ nome, tipo: 'C', tamanho: 10 }));
  const a = analisarArquivo({ bytes: criarDBF(campos, [['X99', '20250105', '', '', '', '', '', '', '']]), nomeArquivo: 'p.dbf', dic });
  assert.deepEqual(a.ausentesNoArquivo, []);
  assert.deepEqual(a.identificacao, []);
});

test('o bloco comum não faz um arquivo público de agravo pequeno ser recusado', () => {
  // Bloco com muitas colunas, maior que o próprio dicionário fictício.
  const bloco = blocoFicticio();
  for (let i = 0; i < 30; i++) bloco.colunas.push({ nome: `EXTRA_${i}`, rotulo: `Extra ${i}`, tipo: 'texto', fonte: 'BF', local: 'p' });
  const dic = comBlocoComum(dicionarioFicticio(), bloco);
  const campos = COLUNAS_ARQUIVO.map((nome) => ({ nome, tipo: 'C', tamanho: 10 }));
  const a = analisarArquivo({ bytes: criarDBF(campos, [['X99', '20250105', '', '', '', '', '', '', '']]), nomeArquivo: 'p.dbf', dic });
  assert.equal(a.registros, 1);
});
