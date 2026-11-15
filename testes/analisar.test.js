import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analisarArquivo } from '../src/analisar.js';
import { processar } from '../src/processar.js';
import { criarDBF, criarDBC } from './auxiliares/ficticios.js';
import { dicionarioFicticio, tabelasFicticias, COLUNAS_ARQUIVO } from './auxiliares/dicionario-ficticio.js';

const CAMPOS = [...COLUNAS_ARQUIVO, 'EXTRA'].map((nome) => ({ nome, tipo: nome.startsWith('DT_') ? 'D' : 'C', tamanho: 8 }));
const REGISTROS = [
  ['X99', '20250115', '4025', '01', '1', '99', '990001', '', '', 'a'],
  ['X99', '20250301', '4030', '', '2', '99', '', '', '', 'b'],
  ['X99', '20241231', '', '', '', '98', '', '', '', 'c'],
  ['X99', '', '', '', '', '', '', '', '', 'd'],
];

test('análise: registros, colunas sem tradução, contagem por UF e intervalo de datas', () => {
  const a = analisarArquivo({ bytes: criarDBC(criarDBF(CAMPOS, REGISTROS)), nomeArquivo: 'f.dbc', dic: dicionarioFicticio() });
  assert.equal(a.formato, 'dbc');
  assert.equal(a.registros, 4);
  assert.deepEqual(a.semTraducao, ['EXTRA']);
  assert.deepEqual(a.contagens, { SG_UF: { 99: 2, 98: 1, '': 1 } });
  assert.deepEqual(a.intervalos, { DT_NOTIFIC: { menor: '20241231', maior: '20250301' } });
});

test('análise recusa arquivo de outro agravo', () => {
  const campos = ['TP_NOT', 'CS_SEXO'].map((nome) => ({ nome, tipo: 'C', tamanho: 1 }));
  assert.throws(() => analisarArquivo({ bytes: criarDBF(campos, [['2', 'F']]), nomeArquivo: 'x.dbf', dic: dicionarioFicticio() }), /não parece ser/);
});

test('destino personalizado recebe os pedaços de cada arquivo gerado', () => {
  const recebidos = {};
  const r = processar({
    bytes: criarDBF(CAMPOS, REGISTROS),
    nomeArquivo: 'f.dbf',
    dic: dicionarioFicticio(),
    tabelas: tabelasFicticias(),
    versaoFerramenta: 'teste',
    opcoes: { saida: 'csv' },
    criarDestino(nome) {
      recebidos[nome] = 0;
      return { escrever: (p) => (recebidos[nome] += p.length), concluir: () => ({ bytes: recebidos[nome] }) };
    },
  });
  assert.equal(r.arquivos.length, 2);
  assert.ok(r.arquivos.every((a) => a.bytes > 0 && a.bytes === recebidos[a.nome]));
});
