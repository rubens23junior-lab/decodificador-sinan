// Gera arquivos de exemplo FICTÍCIOS de dengue, em exemplos/, para
// demonstração e testes. Nenhum dado é de pessoa real: os valores são
// sorteados (com semente fixa) entre os códigos do próprio dicionário.
// Alguns valores inválidos entram de propósito, para mostrar o destaque e a
// aba de inconsistências.
//
// Uso: node ferramentas/gerar-exemplos.js

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { criarDBF, criarDBC } from '../testes/auxiliares/ficticios.js';
import { categoriasDaColuna } from '../src/dicionario/tipos.js';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const dic = JSON.parse(readFileSync(join(raiz, 'dicionarios/dengue.json'), 'utf8'));
const ibge = JSON.parse(readFileSync(join(raiz, 'dicionarios/tabelas/ibge-municipios.json'), 'utf8'));
const cnes = Object.keys(JSON.parse(gunzipSync(readFileSync(join(raiz, 'dicionarios/tabelas/cnes.json.gz'))).toString('utf8')).valores);
const cbo = Object.keys(JSON.parse(readFileSync(join(raiz, 'dicionarios/tabelas/cbo.json'), 'utf8')).valores);

// Sorteio com semente fixa, para gerar sempre os mesmos arquivos.
let semente = 20261101;
const acaso = () => ((semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648);
const escolher = (lista) => lista[Math.floor(acaso() * lista.length)];

const UFS = ['33', '35', '31', '41', '29'];
const municipiosPorUf = Object.fromEntries(UFS.map((uf) => [uf, Object.keys(ibge.municipios).filter((c) => ibge.municipios[c].uf === uf)]));
const unidades = Array.from({ length: 30 }, () => escolher(cnes));
const ocupacoes = Array.from({ length: 30 }, () => escolher(cbo));
const TOTAL = 300;

function data(ano) {
  const d = new Date(Date.UTC(ano, 0, 1) + Math.floor(acaso() * 364) * 86400000);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

const registros = [];
for (let r = 0; r < TOTAL; r++) {
  const uf = escolher(UFS);
  const ufRes = acaso() < 0.9 ? uf : escolher(UFS);
  const linha = dic.colunas.map((col) => {
    const vazio = acaso() < 0.15;
    switch (col.nome) {
      case 'ID_AGRAVO': return 'A90';
      case 'TP_NOT': return '2';
      case 'NU_ANO': return '2025';
      case 'SEM_NOT': case 'SEM_PRI': return `2025${String(1 + Math.floor(acaso() * 52)).padStart(2, '0')}`;
      case 'ANO_NASC': return String(1940 + Math.floor(acaso() * 80));
      case 'SG_UF_NOT': return uf;
      case 'SG_UF': return ufRes;
      case 'ID_MUNICIP': return escolher(municipiosPorUf[uf]);
      case 'ID_MN_RESI': return escolher(municipiosPorUf[ufRes]);
      case 'ID_UNIDADE': return escolher(unidades);
      case 'ID_OCUPA_N': return vazio ? '' : escolher(ocupacoes);
      case 'ID_PAIS': return '1';
      default: break;
    }
    if (vazio) return '';
    if (col.tipo === 'data') return data(2025);
    if (col.tipo === 'idade') return `4${String(1 + Math.floor(acaso() * 89)).padStart(3, '0')}`;
    if (col.tipo === 'uf') return escolher(UFS);
    if (col.tipo === 'municipio') return escolher(municipiosPorUf[escolher(UFS)]);
    if (col.tipo === 'categorico') return escolher(categoriasDaColuna(dic, col)).codigos[0];
    return '';
  });
  registros.push(linha);
}

// Valores inválidos de propósito (aparecem destacados e nas inconsistências).
const idx = (nome) => dic.colunas.findIndex((c) => c.nome === nome);
registros[3][idx('CS_SEXO')] = 'X';
registros[7][idx('DT_SIN_PRI')] = '20250230';
registros[11][idx('NU_IDADE_N')] = '5099';
registros[15][idx('ID_MN_RESI')] = '999999';
registros[19][idx('FEBRE')] = '9';
registros[23][idx('ID_UNIDADE')] = 'ABC1234';

const tamanho = (col) => (col.tipo === 'data' ? 8 : col.nome === 'ID_UNIDADE' || col.nome === 'FLXRECEBI' ? 7 : col.tipo === 'municipio' || col.nome === 'ID_OCUPA_N' || col.nome.startsWith('SEM_') ? 6 : 4);
const campos = dic.colunas.map((col) => ({ nome: col.nome, tipo: col.tipo === 'data' ? 'D' : col.tipo === 'idade' ? 'N' : 'C', tamanho: tamanho(col) }));
const dbf = criarDBF(campos, registros);

const pasta = join(raiz, 'exemplos');
mkdirSync(pasta, { recursive: true });
writeFileSync(join(pasta, 'exemplo_dengue_FICTICIO.dbc'), criarDBC(dbf));
writeFileSync(join(pasta, 'exemplo_dengue_FICTICIO.dbf'), dbf);
const csv = [campos.map((c) => c.nome).join(';'), ...registros.map((l) => l.join(';'))].join('\r\n') + '\r\n';
writeFileSync(join(pasta, 'exemplo_dengue_FICTICIO.csv'), '﻿' + csv, 'utf8');
console.log(`Gerados em exemplos/: ${TOTAL} notificações fictícias em DBC, DBF e CSV.`);
