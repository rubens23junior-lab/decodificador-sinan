// Gera dicionarios/tetano-acidental.json.
// Colunas da notificação (campos 1 a 30 e internos): copiadas do dicionário de LV (conferido).
// Colunas próprias e as de conclusão (classificação, autoctonia, evolução): transcritas do
// dicionário de dados de tétano acidental (DICTETA), da ficha e do instrucional.
// Uso: node gerar-tetano-acidental.mjs <pasta do projeto>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.argv[2];
const lv = JSON.parse(readFileSync(join(raiz, 'dicionarios/leishmaniose-visceral.json'), 'utf8'));
const PACOTE = 'Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026)';

const fontes = {
  DICTETA: {
    documento: 'Dicionário de Dados – Sinan NET – versão 5.0 – Tétano Acidental (campos 31 a 55)',
    orgao: 'Ministério da Saúde / SVS / DEVEP / CIEVS / GT-Sinan',
    data: `revisado em fevereiro de 2012 (10 páginas). ${PACOTE}`,
    arquivo: 'docs/fontes/tetano-acidental/TETACN_DIC_DADOS.pdf',
  },
  FICHATETA: {
    documento: 'Ficha de Investigação – Tétano Acidental – Sinan NET',
    orgao: 'Ministério da Saúde / SVS',
    data: `27/09/2005 (rodapé da ficha). ${PACOTE}`,
    arquivo: 'docs/fontes/tetano-acidental/TETACN_FICHA.pdf',
  },
  INSTTETA: {
    documento: 'Tétano Acidental – Instruções para preenchimento – Ficha de Investigação – Sinan NET',
    orgao: 'Ministério da Saúde / SVS',
    data: `27/09/2005 (rodapé). ${PACOTE}`,
    arquivo: 'docs/fontes/tetano-acidental/TETACN_INSTRUCIONAL.pdf',
  },
};
for (const [k, v] of Object.entries(lv.fontes)) if (!/LV$/.test(k)) fontes[k] = v; // DICLTA fica: é a fonte de NU_LOTE_I

const DA_LV = 'TP_NOT DT_NOTIFIC SEM_NOT NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA ID_UNIDADE DT_SIN_PRI SEM_PRI ANO_NASC NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS NU_LOTE_I DT_DIGITA DT_TRANSUS DT_TRANSDM DT_TRANSSM DT_TRANSRM DT_TRANSRS DT_TRANSSE NU_LOTE_V NU_LOTE_H ID_OCUPA_N DT_INVEST TPAUTOCTO COUFINF COPAISINF COMUNINF DT_OBITO DT_ENCERRA'.split(' ');
const daLv = (nome) => structuredClone(lv.colunas.find((c) => c.nome === nome));
const D = (local) => ({ fonte: 'DICTETA', local });

// Colunas que vêm da LV, mas cuja fonte passa a ser o dicionário de tétano
const repontar = {
  DT_INVEST: 'p. 1, campo 31', ID_OCUPA_N: 'p. 1, campo 32', TPAUTOCTO: 'p. 5, campo 47', COUFINF: 'p. 6, campo 48',
  COPAISINF: 'p. 7, campo 49', COMUNINF: 'p. 7, campo 50', DT_OBITO: 'p. 9, campo 54', DT_ENCERRA: 'p. 10, campo 55',
};
const ajustes = {
  SG_UF: (c) => ({ ...c, tipo: 'texto', observacao: 'No arquivo de tétano acidental (TETABR24) a UF de residência vem como sigla (por exemplo, MG) em 179 registros e em branco nos outros 434, e não como código numérico; por isso fica como veio, sem conversão (como a UF de atendimento atual na hanseníase).' }),
  CS_ESCOL_N: (c) => ({
    ...c,
    categorias: c.categorias.map((k, i) => (i === 0 ? { ...k, codigos: ['0', '00', '43'], fonte: 'FICHATETA', local: 'p. 1, campo 14' } : k)),
    observacao: (c.observacao || '').replace(/ficha de LV/g, 'ficha de tétano acidental') + ' O 43 = Analfabeto segue a decisão do Rubens na conferência de hanseníase (16/11/2026).',
  }),
};

const cat = (pares) => pares.map(([codigo, rotulo, extra]) => ({ codigos: [codigo], rotulo, ...(extra || {}) }));
const SIM_NAO_IGN = [['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']];

const proprias = {
  ID_AGRAVO: { fonte: 'FICHATETA', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
    categorias: [{ codigos: ['A35', 'A 35', 'A 3 5'], rotulo: 'Tétano acidental' }],
    observacao: "A ficha mostra o CID 'A 3 5'. O arquivo de 2024 traz 'A35' em todos os registros. Decisão do Rubens (16/11/2026): 'A 3 5' e 'A35' = Tétano acidental (regra que vale para os próximos agravos: o CID como na ficha e sem espaços)." },
  TP_CAUSA: { ...D('p. 2, campo 33'), rotulo: 'Possível causa', tipo: 'categorico',
    categorias: cat([['1', 'Injeção'], ['2', 'Laceração'], ['3', 'Queimadura'], ['4', 'Cirúrgico'], ['5', 'Perfuração'], ['6', 'Escoriação'], ['7', 'Abortamento Séptico'], ['8', 'Outros'], ['9', 'Ignorado']]),
    observacao: 'Possível porta de entrada: injeção nos últimos 21 dias ou as demais opções nos últimos 30 dias. A ficha escreve "Cirúrgica" no código 4; o rótulo segue o DICTETA ("Cirúrgico").' },
  TP_CAUSOUT: { ...D('p. 2, campo 33 (Outros – descrição)'), rotulo: 'Possível causa – outros (descrição)', tipo: 'texto',
    observacao: 'Texto livre, preenchido quando a possível causa é 8 (Outros). Fica como veio.' },
  TP_LOCALLE: { ...D('p. 2, campo 34'), rotulo: 'Local da lesão', tipo: 'categorico',
    categorias: cat([['1', 'Membros inferiores'], ['2', 'Membros superiores'], ['3', 'Tronco'], ['4', 'Cabeça/Pescoço'], ['5', 'Cavidade oral'], ['9', 'Ignorado']]) },
  NU_DOSE: { ...D('p. 2-3, campo 35'), rotulo: 'Número de doses aplicadas (vacina antes da lesão)', tipo: 'categorico',
    categorias: cat([['1', 'Uma'], ['2', 'Duas'], ['3', 'Três'], ['4', 'Três mais 1 reforço'], ['5', 'Três mais 2 reforços'], ['6', 'Nunca vacinado'], ['9', 'Ignorado']]),
    observacao: 'Doses recebidas antes da lesão de uma ou mais destas vacinas: DTP, DT, dT, TT ou tetravalente.' },
  DT_ULT_DOS: { ...D('p. 3, campo 36'), rotulo: 'Data da última dose', tipo: 'data' },
  TP_PROFILA: { ...D('p. 3, campo 37'), rotulo: 'Tratamento específico e outras medidas (profilaxia pós-ferimento)', tipo: 'categorico',
    categorias: cat([['1', 'Soro antitetânico'], ['2', 'Imunoglobulina'], ['3', 'Vacina'], ['4', 'Antibiótico'], ['5', 'Nenhum']]) },
  CS_TRISMO: { ...D('p. 3, campo 38'), rotulo: 'Manifestações clínicas – trismo', tipo: 'categorico', categorias: cat(SIM_NAO_IGN) },
  CS_RISO: { ...D('p. 3, campo 38'), rotulo: 'Manifestações clínicas – riso sardônico', tipo: 'categorico', categorias: cat(SIM_NAO_IGN) },
  CS_OPISTOT: { ...D('p. 3, campo 38'), rotulo: 'Manifestações clínicas – opistótono', tipo: 'categorico', categorias: cat(SIM_NAO_IGN) },
  CS_NUCA: { ...D('p. 3, campo 38'), rotulo: 'Manifestações clínicas – rigidez de nuca', tipo: 'categorico', categorias: cat(SIM_NAO_IGN) },
  CS_ABDOMIN: { ...D('p. 3, campo 38'), rotulo: 'Manifestações clínicas – rigidez abdominal', tipo: 'categorico', categorias: cat(SIM_NAO_IGN) },
  CS_MEMBROS: { ...D('p. 4, campo 38'), rotulo: 'Manifestações clínicas – rigidez de membros', tipo: 'categorico', categorias: cat(SIM_NAO_IGN) },
  CS_CRISES: { ...D('p. 4, campo 38'), rotulo: 'Manifestações clínicas – crises de contraturas', tipo: 'categorico', categorias: cat(SIM_NAO_IGN) },
  CS_SIN_OUT: { ...D('p. 4, campo 38'), rotulo: 'Manifestações clínicas – outras', tipo: 'categorico', categorias: cat(SIM_NAO_IGN) },
  NM_SIN_OUT: { ...D('p. 4, campo 38 (Outros – especificar)'), rotulo: 'Manifestações clínicas – outras (especificar)', tipo: 'texto',
    observacao: 'Texto livre, preenchido quando "outras manifestações" é 1 (Sim). Fica como veio.' },
  TP_ORIGEM: { ...D('p. 4, campo 39'), rotulo: 'Origem do caso', tipo: 'categorico',
    categorias: cat([['1', 'Notificação'], ['2', 'Busca ativa'], ['3', 'Declaração de óbito']]) },
  CS_HOSPITA: { ...D('p. 4, campo 40'), rotulo: 'Ocorreu hospitalização', tipo: 'categorico', categorias: cat(SIM_NAO_IGN, ) ,
    observacao: 'As categorias 1 Sim, 2 Não e 9 Ignorado estão na ficha (campo 40) e no instrucional (item 40); no DICTETA aparecem deslocadas na tabela.' },
  DT_INTERNA: { ...D('p. 4, campo 41'), rotulo: 'Data da internação', tipo: 'data' },
  SG_UF_INTE: { ...D('p. 4, campo 42'), rotulo: 'UF de hospitalização', tipo: 'uf',
    observacao: 'O DICTETA e o instrucional falam em sigla da UF, mas o arquivo traz o código numérico (IBGE); o nome da UF vem da tabela do IBGE.' },
  NM_MUNIC_H: { ...D('p. 4, campo 43'), rotulo: 'Município de hospitalização', tipo: 'municipio',
    observacao: 'Apesar do nome da coluna ("NM_"), o arquivo traz o código do município (6 dígitos, IBGE); o DICTETA define o campo como co_municipio_hospital varchar2(6).' },
  TP_IDENTFI: { ...D('p. 5, campo 44'), rotulo: 'Medidas de controle – identificar população suscetível', tipo: 'categorico', categorias: cat(SIM_NAO_IGN) },
  TP_VACINA: { ...D('p. 5, campo 44'), rotulo: 'Medidas de controle – vacinação da população suscetível', tipo: 'categorico', categorias: cat(SIM_NAO_IGN) },
  TP_ANALISE: { ...D('p. 5, campo 44'), rotulo: 'Medidas de controle – análise de cobertura vacinal por faixa etária', tipo: 'categorico', categorias: cat(SIM_NAO_IGN) },
  CLASSI_FIN: { ...D('p. 5, campo 45'), rotulo: 'Classificação final', tipo: 'categorico',
    categorias: cat([['1', 'Confirmado'], ['2', 'Descartado']]),
    fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: o campo 45 da ficha (classificação final) só comporta 1 e 2' },
    observacao: 'O DICTETA, a ficha e o instrucional listam só 1 e 2. O arquivo de 2024 traz 50 registros com 8, e o Anexo I do NOTIF2018 não tem linha de tétano acidental. Decisão do Rubens (16/11/2026): códigos que o campo não comporta saem como "Inconsistência/Não Preenchido", destacados e listados nas Inconsistências (o código original continua na coluna ao lado), como na hanseníase.' },
  CS_LOCAL: { ...D('p. 5, campo 46'), rotulo: 'Local provável da fonte de infecção', tipo: 'categorico',
    categorias: cat([['1', 'Domicílio'], ['2', 'Trabalho'], ['3', 'Via pública'], ['4', 'Escola'], ['5', 'Campo'], ['6', 'Unidade de saúde'], ['7', 'Outro local'], ['9', 'Ignorado']]) },
  EVOLUCAO: { ...D('p. 9, campo 53'), rotulo: 'Evolução do caso', tipo: 'categorico',
    categorias: cat([['1', 'Cura'], ['2', 'Óbito por tétano acidental'], ['3', 'Óbito por outras causas'], ['9', 'Ignorado']]) },
};

// Ordem: a do arquivo público TETABR24
const ORDEM = 'TP_NOT ID_AGRAVO DT_NOTIFIC SEM_NOT NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA ID_UNIDADE DT_SIN_PRI SEM_PRI ANO_NASC NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS DT_INVEST ID_OCUPA_N TP_CAUSA TP_CAUSOUT TP_LOCALLE NU_DOSE DT_ULT_DOS TP_PROFILA CS_TRISMO CS_RISO CS_OPISTOT CS_NUCA CS_ABDOMIN CS_MEMBROS CS_CRISES CS_SIN_OUT NM_SIN_OUT TP_ORIGEM CS_HOSPITA DT_INTERNA SG_UF_INTE NM_MUNIC_H TP_IDENTFI TP_VACINA TP_ANALISE CLASSI_FIN CS_LOCAL TPAUTOCTO COUFINF COPAISINF COMUNINF EVOLUCAO DT_OBITO DT_ENCERRA NU_LOTE_I DT_DIGITA DT_TRANSUS DT_TRANSDM DT_TRANSSM DT_TRANSRM DT_TRANSRS DT_TRANSSE NU_LOTE_V NU_LOTE_H'.split(' ');

const colunas = ORDEM.map((nome) => {
  if (proprias[nome]) {
    const { fonte, local, rotulo, tipo, ...resto } = proprias[nome];
    return { nome, fonte, local, rotulo, tipo, ...resto };
  }
  if (!DA_LV.includes(nome)) throw new Error(`Sem definição: ${nome}`);
  let c = daLv(nome);
  if (!c) throw new Error(`LV não tem ${nome}`);
  if (repontar[nome]) c = { ...c, fonte: 'DICTETA', local: repontar[nome] };
  if (ajustes[nome]) c = ajustes[nome](c);
  return c;
});
for (const c of colunas) {
  for (const f of [c.fonte, ...(c.categorias || []).map((k) => k.fonte)].filter(Boolean)) {
    if (!fontes[f]) throw new Error(`${c.nome}: fonte ${f} não declarada`);
  }
}
// tira fontes que nenhuma coluna usa (exceto as das tabelas)
const usadas = new Set([...colunas.flatMap((c) => [c.fonte, ...(c.categorias || []).map((k) => k.fonte)]), ...Object.values(lv.tabelas).map((t) => t.fonte)].filter(Boolean));
for (const k of Object.keys(fontes)) if (!usadas.has(k) && k !== 'INSTTETA') delete fontes[k];

const pendencias = [
  { coluna: 'CLASSI_FIN',
    descricao: 'Resolvida (Rubens, 16/11/2026): o 8 (50 registros em 2024), sem fonte de tétano acidental nem linha no Anexo I do NOTIF2018, sai como "Inconsistência/Não Preenchido", destacado e listado nas Inconsistências, como na hanseníase.' },
  { coluna: 'CS_ESCOL_N',
    descricao: 'O 43 = Analfabeto foi aplicado como na hanseníase (decisão do Rubens, 16/11/2026). Aprovado pelo Rubens (16/11/2026).' },
  { coluna: 'TP_CAUSA',
    descricao: 'O código 4 é "Cirúrgico" no DICTETA e "Cirúrgica" na ficha. Ficou como no dicionário de dados. Aprovado pelo Rubens (16/11/2026).' },
  { coluna: 'SG_UF_INTE e NM_MUNIC_H',
    descricao: 'As fontes falam em sigla da UF e nome do município, mas o arquivo traz códigos do IBGE; por isso são traduzidos pelas tabelas do IBGE. Aprovado pelo Rubens (16/11/2026).' },
  { coluna: 'SG_UF',
    descricao: 'Nos arquivos de 2023, 2024 e 2025 a UF de residência vem como sigla ou em branco, nunca como código (2024: 179 e 434). Fica como veio, sem conversão. O município de residência (ID_MN_RESI) está preenchido nos 613 registros, e a ferramenta mostra a UF junto com o nome do município.' },
  { coluna: 'TP_CAUSOUT e NM_SIN_OUT',
    descricao: 'Texto livre digitado pela unidade; fica como veio, sem tradução.' },
  { coluna: 'CODISINF, CO_BAINFC, NOBAIINF',
    descricao: 'Distrito e bairro prováveis de infecção estão no DICTETA (campos 51 e 52), mas não vêm no arquivo público. Não entram no dicionário.' },
];

const dic = {
  formato: lv.formato,
  agravo: { nome: 'Tétano acidental', codigos: ['A35', 'A 35', 'A 3 5'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos TETABRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: true, por: 'Rubens Araujo da Silva Junior', data: '2026-11-16', registro: 'docs/conferencia/conferencia-tetano-acidental.xlsx (conferência na planilha em 16/11/2026, com as correções pedidas por ele aplicadas no mesmo dia)' },
  convencoes: lv.convencoes,
  fontes,
  tabelas: lv.tabelas,
  regras_tabelas: lv.regras_tabelas,
  listas: lv.listas,
  colunas,
  derivadas: lv.derivadas,
  pendencias,
};
writeFileSync(join(raiz, 'dicionarios/tetano-acidental.json'), JSON.stringify(dic, null, 2) + '\n');
console.log(`tetano-acidental.json: ${colunas.length} colunas, ${pendencias.length} pendências, fontes: ${Object.keys(fontes).join(' ')}`);
