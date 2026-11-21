// Gera dicionarios/tetano-neonatal.json.
// Colunas da notificação (campos 1 a 30 e internos): as mesmas do dicionário de tétano acidental
// (que as copiou da LV). Todas as colunas próprias do neonatal e as da conclusão são transcritas
// do dicionário de dados de tétano neonatal (DICTETN), da ficha e do instrucional.
// Uso: node gerar-tetano-neonatal.mjs <pasta do projeto> <ordem das colunas do arquivo, separada por espaço>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.argv[2];
const ORDEM = process.argv[3].split(' ');
const ta = JSON.parse(readFileSync(join(raiz, 'dicionarios/tetano-acidental.json'), 'utf8'));
const PACOTE = 'Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026)';

const fontes = {
  DICTETN: {
    documento: 'Dicionário de Dados – Sinan NET – versão 5.0 – Tétano Neonatal (campos 31 a 62)',
    orgao: 'Ministério da Saúde / SVS / DEVEP / CIEVS / GT-Sinan',
    data: `revisado em abril de 2012 (16 páginas). ${PACOTE}`,
    arquivo: 'docs/fontes/tetano-neonatal/TETANN_DIC_DADOS.pdf',
  },
  FICHATETN: {
    documento: 'Ficha de Investigação – Tétano Neonatal – Sinan NET',
    orgao: 'Ministério da Saúde / SVS',
    data: `27/09/2005 (rodapé da ficha). ${PACOTE}`,
    arquivo: 'docs/fontes/tetano-neonatal/TETANN_FICHA.pdf',
  },
  INSTTETN: {
    documento: 'Tétano Neonatal – Instruções para preenchimento – Ficha de Investigação – Sinan NET',
    orgao: 'Ministério da Saúde / SVS',
    data: `27/09/2005 (rodapé). ${PACOTE}`,
    arquivo: 'docs/fontes/tetano-neonatal/TETANN_INSTRUCIONAL.pdf',
  },
};
for (const [k, v] of Object.entries(ta.fontes)) if (!/TETA$/.test(k)) fontes[k] = v;

// Da notificação, iguais ao acidental (campos 1 a 30 e internos)
const NOTIFICACAO = 'TP_NOT DT_NOTIFIC SEM_NOT NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA ID_UNIDADE DT_SIN_PRI SEM_PRI ANO_NASC NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS NU_LOTE_I DT_DIGITA DT_TRANSUS DT_TRANSDM DT_TRANSSM DT_TRANSRM DT_TRANSRS DT_TRANSSE NU_LOTE_V NU_LOTE_H'.split(' ');
// Mesma estrutura do acidental, mas com a fonte e o local do neonatal
const REPONTAR = {
  DT_INVEST: 'p. 1, campo 31', TPAUTOCTO: 'p. 10, campo 53', COUFINF: 'p. 11, campo 54', COPAISINF: 'p. 12, campo 55',
  COMUNINF: 'p. 13, campo 56', DT_OBITO: 'p. 15, campo 61', DT_ENCERRA: 'p. 16, campo 62',
};
const doTa = (nome) => structuredClone(ta.colunas.find((c) => c.nome === nome));
const cat = (pares) => pares.map(([codigo, rotulo, extra]) => ({ codigos: [codigo], rotulo, ...(extra || {}) }));
const D = (local) => ({ fonte: 'DICTETN', local });
const SNI = [['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']];
const sinal = (local, nome) => ({ ...D(local), rotulo: `Sinais e sintomas – ${nome}`, tipo: 'categorico', categorias: cat(SNI) });
const medida = (nome) => ({ ...D('p. 8-9, campo 50'), rotulo: `Medidas adotadas – ${nome}`, tipo: 'categorico', categorias: cat(SNI) });

const proprias = {
  ID_AGRAVO: { fonte: 'FICHATETN', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
    categorias: [{ codigos: ['A33', 'A 33', 'A 3 3'], rotulo: 'Tétano Neonatal' }],
    observacao: "A ficha mostra o CID 'A 3 3'. Decisão do Rubens (16/11/2026): 'A 3 3' e 'A33' = Tétano Neonatal." },
  ID_OCUPA_N: { ...doTa('ID_OCUPA_N'), ...D('p. 1, campo 32'), rotulo: 'Ocupação da mãe (CBO)',
    observacao: 'No tétano neonatal, a ocupação é a da mãe do recém-nascido (DICTETN, campo 32). Nome da ocupação pela CBO 2002; os códigos especiais do Sinan são procurados na tabela de ocupações do Sinan NET (OCUPANET).' },
  DT_NASC: { fonte: 'NOTIF2018', local: 'p. 3, campo 9 (Data de nascimento)', rotulo: 'Data de nascimento', tipo: 'data',
    observacao: 'Os arquivos de 2015 a 2019 trazem a data de nascimento completa (DT_NASC); a partir de 2020 o arquivo traz só o ano (ANO_NASC). No tétano neonatal, é a data de nascimento do recém-nascido.' },
  NUM_CON_N: { ...D('p. 2, campo 33'), rotulo: 'Número de consultas de pré-natal', tipo: 'categorico',
    categorias: cat([['1', 'Uma'], ['2', 'Duas'], ['3', 'De 3 a 5'], ['4', '6 e mais'], ['5', 'Nenhuma'], ['9', 'Ignorado']]) },
  CS_VACTETA: { ...D('p. 2, campo 34'), rotulo: 'Antecedentes vacinais contra tétano (mãe)', tipo: 'categorico',
    categorias: cat([['1', 'Vacinada (comprovado pelo cartão)'], ['2', 'Não vacinada'], ['9', 'Ignorado']]) },
  DT_1_DOSE: { ...D('p. 2, campo 35'), rotulo: 'Data da 1ª dose (mãe)', tipo: 'data' },
  DT_2_DOSE: { ...D('p. 3, campo 36'), rotulo: 'Data da 2ª dose (mãe)', tipo: 'data' },
  DT_3_DOSE: { ...D('p. 3, campo 37'), rotulo: 'Data da 3ª dose (mãe)', tipo: 'data' },
  DT_REFORCO: { ...D('p. 3, campo 38'), rotulo: 'Data do último reforço (mãe)', tipo: 'data' },
  IDADE_MAE: { ...D('p. 4, campo 39'), rotulo: 'Idade da mãe', tipo: 'numero',
    observacao: 'Idade da mãe por ocasião do nascimento do último recém-nascido (number(3) no DICTETN). Fica como veio.' },
  NU_GESTA: { ...D('p. 4, campo 40'), rotulo: 'Número de gestações (incluindo a atual)', tipo: 'categorico',
    categorias: cat([['1', 'Uma'], ['2', 'Duas'], ['3', 'Três'], ['4', 'Quatro'], ['5', 'Cinco e mais'], ['9', 'Ignorado']]) },
  ESCOLMAE_N: { ...D('p. 4, campo 41'), rotulo: 'Escolaridade da mãe', tipo: 'categorico',
    categorias: doTa('CS_ESCOL_N').categorias.map((k, i) => (i === 0 ? { ...k, fonte: 'FICHATETN', local: 'p. 1, campo 41' } : { codigos: k.codigos, rotulo: k.rotulo })),
    observacao: 'Mesmas categorias da escolaridade da notificação (campo 14), que o DICTETN e a ficha repetem no campo 41. As formas com um e dois dígitos e o 43 = Analfabeto seguem as decisões do Rubens para a escolaridade.' },
  CS_NASCIDO: { ...D('p. 5, campo 42'), rotulo: 'Local de ocorrência do parto', tipo: 'categorico',
    categorias: cat([['1', 'Hospital'], ['2', 'Domicílio'], ['3', 'Casa de parto'], ['4', 'Outro'], ['9', 'Ignorado']]) },
  NO_OUPARTO: { ...D('p. 5, campo 42 (se outro, especificar)'), rotulo: 'Local de ocorrência do parto – outro (especificar)', tipo: 'texto',
    observacao: 'Texto livre; fica como veio.' },
  CS_ATEND_N: { ...D('p. 5, campo 43'), rotulo: 'Parto atendido por', tipo: 'categorico',
    categorias: cat([['1', 'Médico'], ['2', 'Enfermeiro'], ['3', 'Auxiliar de enfermagem'], ['4', 'Parteira treinada'], ['5', 'Parteira não treinada'], ['6', 'Outros'], ['9', 'Ignorado']]),
    observacao: 'O DICTETN lista 9 = ignorado; a ficha escreve "6-Outro".' },
  NO_ATENOUT: { ...D('p. 6, campo 43 (se outro, especificar)'), rotulo: 'Parto atendido por – outro (especificar)', tipo: 'texto',
    observacao: 'Texto livre; fica como veio.' },
  CS_SUGOU: { ...D('p. 6, campo 44'), rotulo: 'Sugou normalmente após o nascimento', tipo: 'categorico', categorias: cat(SNI) },
  CS_MAMAR: sinal('p. 6, campo 45', 'dificuldade de mamar'),
  CS_TRISMO: sinal('p. 6, campo 45', 'trismo'),
  CS_NUCA: sinal('p. 6, campo 45', 'rigidez de nuca'),
  CS_CHORO: sinal('p. 6, campo 45', 'choro excessivo'),
  CS_RISO: { ...sinal('p. 6, campo 45', 'contratura labial'),
    observacao: 'No tétano neonatal, CS_RISO é a contratura labial (DICTETN, campo 45, st_sinais_riso), e não o riso sardônico do tétano acidental.' },
  CS_ABDOMEN: sinal('p. 6, campo 45', 'rigidez abdominal'),
  CS_INF_COT: sinal('p. 7, campo 45', 'processo inflamatório no coto umbilical'),
  CS_OPISTOT: sinal('p. 7, campo 45', 'opistótono'),
  CS_MEMBROS: sinal('p. 7, campo 45', 'rigidez de membros'),
  CS_CRISE: sinal('p. 7, campo 45', 'crises de contraturas'),
  CS_OUTROS: sinal('p. 7, campo 45', 'outros'),
  NM_OUT_SIN: { ...D('p. 7, campo 45 (se outros, especificar)'), rotulo: 'Sinais e sintomas – outros (especificar)', tipo: 'texto',
    observacao: 'Texto livre; fica como veio.' },
  DT_TRISMO: { ...D('p. 7, campo 46'), rotulo: 'Data do trismo', tipo: 'data' },
  CS_ORIGEM: { ...D('p. 8, campo 47'), rotulo: 'Origem do caso', tipo: 'categorico',
    categorias: cat([['1', 'Notificação'], ['2', 'Busca ativa'], ['3', 'Declaração de óbito']]) },
  CS_HOSPITA: { ...D('p. 8, campo 48'), rotulo: 'Ocorreu hospitalização', tipo: 'categorico', categorias: cat(SNI) },
  CS_COBERTU: { ...D('p. 8, campo 49'), rotulo: 'Local de residência coberto pelo', tipo: 'categorico',
    categorias: cat([['1', 'PACS'], ['2', 'PSF'], ['3', 'PACS/PSF'], ['4', 'Nenhum'], ['5', 'Outro'], ['9', 'Ignorado']]),
    observacao: 'Se o local de residência da mãe está coberto por programa da Atenção Básica (PACS: Programa de Agentes Comunitários de Saúde; PSF: Programa Saúde da Família).' },
  NO_COBOUTR: { ...D('p. 8, campo 49 (se outros, especificar)'), rotulo: 'Local de residência coberto – outro (especificar)', tipo: 'texto',
    observacao: 'Texto livre; fica como veio.' },
  CS_VACINAC: medida('atualização do esquema vacinal da mãe'),
  CS_CADASTR: medida('cadastro e capacitação de parteiras atuantes'),
  CS_DIVULGA: medida('divulgação do problema para autoridades e profissionais de saúde'),
  CS_BUSCAAT: medida('busca ativa de outros casos de tétano neonatal'),
  CS_ORIENTA: medida('orientação às parturientes quanto aos cuidados com o coto umbilical'),
  CS_ANALISE: medida('análise da cobertura vacinal da área e vacinação discriminada em mulheres em idade fértil'),
  CS_OUTRAS: medida('outras'),
  NO_OUTRAS: { ...D('p. 9, campo 50 (se outras, especificar)'), rotulo: 'Medidas adotadas – outras (especificar)', tipo: 'texto',
    observacao: 'Texto livre; fica como veio.' },
  CLASSI_FIN: { ...D('p. 9, campo 51'), rotulo: 'Classificação final', tipo: 'categorico',
    categorias: cat([['1', 'Confirmado'], ['2', 'Descartado']]),
    fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: o campo 51 da ficha (classificação final) só comporta 1 e 2' },
    observacao: 'O DICTETN e a ficha listam só 1 e 2. Como no tétano acidental (decisão do Rubens, 16/11/2026), outros códigos saem como "Inconsistência/Não Preenchido", destacados e listados nas Inconsistências.' },
  DS_INF_LOC: { ...D('p. 10, campo 52'), rotulo: 'Local provável da fonte de infecção', tipo: 'categorico',
    categorias: cat([['1', 'Hospital'], ['2', 'Domicílio'], ['3', 'Casa de parto'], ['4', 'Outro local'], ['9', 'Ignorado']]),
    observacao: 'Apesar do nome da coluna ("DS_"), é o código do local (tp_local_infeccao no DICTETN).' },
  DS_INF_OUT: { ...D('p. 10, campo 52 (se outros, especificar)'), rotulo: 'Local provável da fonte de infecção – outro (especificar)', tipo: 'texto',
    observacao: 'Texto livre; fica como veio.' },
  COUNIDINF: { ...D('p. 13, campo 57'), rotulo: 'Unidade de saúde provável da infecção (CNES)', tipo: 'tabela', tabela: 'cnes',
    observacao: 'Unidade de saúde onde provavelmente ocorreu a infecção, quando o local provável é hospital ou casa de parto. Nome pela tabela do CNES.' },
  EVOLUCAO: { ...D('p. 15, campo 60'), rotulo: 'Evolução do caso', tipo: 'categorico',
    categorias: cat([['1', 'Cura'], ['2', 'Óbito por TNN'], ['3', 'Óbito por outras causas'], ['9', 'Ignorado']]),
    observacao: 'Rótulos do DICTETN, conforme a conferência do Rubens (16/11/2026); TNN = tétano neonatal. A ficha escreve "Óbito por tétano neonatal".' },
};

const colunas = ORDEM.map((nome) => {
  let c;
  if (proprias[nome]) {
    const { nome: _n, fonte, local, rotulo, tipo, ...resto } = proprias[nome];
    c = { nome, fonte, local, rotulo, tipo, ...resto };
  } else if (nome === 'SG_UF') {
    // no acidental a UF de residência vem em sigla; no neonatal vem como código: usa a definição da LV
    c = structuredClone(JSON.parse(readFileSync(join(raiz, 'dicionarios/leishmaniose-visceral.json'), 'utf8')).colunas.find((x) => x.nome === 'SG_UF'));
  } else if (NOTIFICACAO.includes(nome)) {
    c = doTa(nome);
  } else if (REPONTAR[nome]) {
    c = { ...doTa(nome), fonte: 'DICTETN', local: REPONTAR[nome] };
  } else {
    throw new Error(`Sem definição: ${nome}`);
  }
  return c;
});
// a escolaridade da notificação passa a apontar para a ficha do neonatal no código 0
{
  const esc = colunas.find((c) => c.nome === 'CS_ESCOL_N');
  esc.categorias = esc.categorias.map((k) => (k.fonte === 'FICHATETA' ? { ...k, fonte: 'FICHATETN', local: 'p. 1, campo 14' } : k));
  esc.observacao = (esc.observacao || '').replace(/tétano acidental/g, 'tétano neonatal');
}
for (const c of colunas) {
  for (const f of [c.fonte, ...(c.categorias || []).map((k) => k.fonte)].filter(Boolean)) {
    if (!fontes[f]) throw new Error(`${c.nome}: fonte ${f} não declarada`);
  }
}
const usadas = new Set([...colunas.flatMap((c) => [c.fonte, ...(c.categorias || []).map((k) => k.fonte)]), ...Object.values(ta.tabelas).map((t) => t.fonte)].filter(Boolean));
for (const k of Object.keys(fontes)) if (!usadas.has(k) && k !== 'INSTTETN') delete fontes[k];

const pendencias = [
  { coluna: 'Arquivo real',
    descricao: 'Os arquivos de 2015 a 2025 somam 16 notificações. Não há células suficientes para uma amostra de 100; a proposta é conferir todas as células traduzidas dessas 16 notificações (censo).' },
  { coluna: 'DT_NASC e anos antigos',
    descricao: 'Os arquivos de 2015 a 2019 trazem DT_NASC (data de nascimento completa) no lugar de ANO_NASC e não trazem CS_SEXO nem CS_GESTANT; DT_NASC foi incluída como data, pela definição do NOTIF2018 (campo 9). Somando 2015 a 2025, são só 16 notificações.' },
  { coluna: 'CLASSI_FIN',
    descricao: 'Aplicada a mesma regra do tétano acidental (decisão do Rubens, 16/11/2026): códigos fora de 1 e 2 saem como "Inconsistência/Não Preenchido". Aprovado pelo Rubens (16/11/2026).' },
  { coluna: 'ID_OCUPA_N',
    descricao: 'No neonatal, a ocupação é a da mãe; o nome legível ficou "Ocupação da mãe (CBO)". Aprovado pelo Rubens (16/11/2026).' },
  { coluna: 'CS_RISO',
    descricao: 'No neonatal, CS_RISO é "contratura labial", e não "riso sardônico" como no acidental. Aprovado pelo Rubens (16/11/2026).' },
  { coluna: 'EVOLUCAO',
    descricao: 'Os rótulos 2 e 3 estão cortados no DICTETN; o texto completo veio da ficha ("Óbito por tétano neonatal" e "Óbito por outras causas"). Aprovado pelo Rubens (16/11/2026).' },
  { coluna: 'NO_OUPARTO, NO_ATENOUT, NM_OUT_SIN, NO_COBOUTR, NO_OUTRAS, DS_INF_OUT',
    descricao: 'Texto livre digitado pela unidade; fica como veio, sem tradução.' },
  { coluna: 'CODISINF, CO_BAINFC, NOBAIINF',
    descricao: 'Distrito e bairro prováveis de infecção estão no DICTETN (campos 58 e 59), mas não vêm no arquivo público. Não entram no dicionário.' },
];

const dic = {
  formato: ta.formato,
  agravo: { nome: 'Tétano neonatal', codigos: ['A33', 'A 33', 'A 3 3'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos TETNBRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: true, por: 'Rubens Araujo da Silva Junior', data: '2026-11-16', registro: 'docs/conferencia/conferencia-tetano-neonatal.xlsx (conferência na planilha em 16/11/2026, com as correções pedidas por ele aplicadas no mesmo dia)' },
  convencoes: ta.convencoes,
  fontes,
  tabelas: ta.tabelas,
  regras_tabelas: ta.regras_tabelas,
  listas: ta.listas,
  colunas,
  derivadas: ta.derivadas,
  pendencias,
};
writeFileSync(join(raiz, 'dicionarios/tetano-neonatal.json'), JSON.stringify(dic, null, 2) + '\n');
console.log(`tetano-neonatal.json: ${colunas.length} colunas, ${pendencias.length} pendências, fontes: ${Object.keys(fontes).join(' ')}`);
