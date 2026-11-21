// Gera dicionarios/hanseniase.json.
// Colunas comuns da notificação: copiadas do dicionário de leishmaniose visceral (conferido pelo Rubens).
// Colunas próprias: transcritas do dicionário de dados de hanseníase (DICHANS), da ficha, do instrucional
// e, só onde indicado, das tabelas oficiais do TabWin (HansNET.def e .cnv do pacote TAB_SINANNET).
// Uso: node gerar-hanseniase.mjs <pasta do projeto>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.argv[2];
const lv = JSON.parse(readFileSync(join(raiz, 'dicionarios/leishmaniose-visceral.json'), 'utf8'));
const PACOTE = 'Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026)';

const fontes = {
  DICHANS: {
    documento: 'Dicionário de Dados – Sinan NET – versão 5.0 – Hanseníase (campos 31 a 43 e tela de acompanhamento)',
    orgao: 'Ministério da Saúde / SVS / DEVEP / CIEVS / GT-Sinan',
    data: `sem data impressa (8 páginas). ${PACOTE}`,
    arquivo: 'docs/fontes/hanseniase/HANSN_DIC_DADOS.pdf',
  },
  FICHAHANS: {
    documento: 'Ficha de Notificação/Investigação – Hanseníase – Sinan NET',
    orgao: 'Ministério da Saúde / SVS',
    data: `30/10/2007 (rodapé da ficha). ${PACOTE}`,
    arquivo: 'docs/fontes/hanseniase/HANSN_FICHA.pdf',
  },
  INSTHANS: {
    documento: 'Hanseníase – Instruções para preenchimento – Ficha de Investigação – Sinan NET',
    orgao: 'Ministério da Saúde / SVS',
    data: `sem data impressa. ${PACOTE}`,
    arquivo: 'docs/fontes/hanseniase/HANSN_INSTRUCIONAL.pdf',
  },
  TABHANS: {
    documento: 'Arquivo de definição do TabWin para hanseníase (HansNET.def) e tabela de conversão reacional.cnv',
    orgao: 'Ministério da Saúde / GT-Sinan (HansNET.def revisado em 18/08/2008 e atualizado em 24/09/2010; reacional.cnv revisado pela UT-Sinan em 2019)',
    data: 'Pacote TAB_SINANNET do TabWin, baixado pelo Rubens do site do DATASUS em 15/11/2026',
    arquivo: 'docs/fontes/tabelas-apoio/TAB_SINANNET/HansNET.def; docs/fontes/tabelas-apoio/TAB_SINANNET/reacional.cnv',
  },
};
for (const [k, v] of Object.entries(lv.fontes)) if (!/LV$|LTA$/.test(k)) fontes[k] = v;

const COMUNS = 'TP_NOT ID_AGRAVO DT_NOTIFIC NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA ID_UNIDADE ANO_NASC NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS NDUPLIC_N DT_DIGITA DT_TRANSUS DT_TRANSDM DT_TRANSSM DT_TRANSRM DT_TRANSRS DT_TRANSSE NU_LOTE_V NU_LOTE_H CS_FLXRET FLXRECEBI MIGRADO_W ID_OCUPA_N'.split(' ');
const comum = (nome) => structuredClone(lv.colunas.find((c) => c.nome === nome));

// Ajustes das colunas comuns que, em LV, apontavam para documentos de LV
const ajustes = {
  ID_AGRAVO: (c) => ({
    ...c, fonte: 'FICHAHANS', local: 'p. 1, campo 2 (Código CID10)',
    categorias: [{ codigos: ['A309', 'A30.9', 'A 30.9'], rotulo: 'Hanseníase' }],
    observacao: "A ficha de hanseníase mostra o CID 'A 3 0. 9'; o NOTIF2018 (p. 1, campo 2) diz que o ponto é retirado no banco. O arquivo de 2025 traz 'A309' em todos os registros.",
  }),
  CS_ESCOL_N: (c) => ({
    ...c,
    categorias: c.categorias.map((k) => (k.fonte === 'FICHALV' ? { ...k, fonte: 'FICHAHANS', local: 'p. 1, campo 14' } : k)),
    observacao: (c.observacao || '').replace(/ficha de LV/g, 'ficha de hanseníase'),
  }),
  ID_OCUPA_N: (c) => ({ ...c, fonte: 'DICHANS', local: 'p. 1, campo 32' }),
};

const cat = (pares) => pares.map(([codigo, rotulo, extra]) => ({ codigos: [codigo], rotulo, ...(extra || {}) }));
const D = (local) => ({ fonte: 'DICHANS', local });

const proprias = {
  DT_DIAG: { ...{ fonte: 'FICHAHANS', local: 'p. 1, campo 7' }, rotulo: 'Data do diagnóstico', tipo: 'data',
    observacao: 'Na hanseníase, a ficha traz a data do diagnóstico no lugar da data dos primeiros sintomas (o DICHANS, p. 1, diz que os campos 1 a 30 seguem a notificação "exceto a data de diagnóstico"). Instrucional, item 7: data do diagnóstico ou da evidência laboratorial e/ou clínica.' },
  SEM_DIAG: { fonte: 'FICHAHANS', local: 'p. 1, campo 7 (Data do diagnóstico)', rotulo: 'Semana epidemiológica do diagnóstico', tipo: 'texto',
    observacao: 'Nenhum documento de hanseníase descreve SEM_DIAG. Nome dado por analogia com SEM_NOT e SEM_PRI (semana epidemiológica no formato aaaass). No arquivo de 2025, 481 registros têm valor e 30.838 vêm em branco. Pendência.' },
  NU_LESOES: { ...D('p. 2, campo 33'), rotulo: 'Nº de lesões cutâneas', tipo: 'numero',
    observacao: 'Número de lesões dermatológicas por ocasião do diagnóstico. O DICHANS diz que até a versão 1.3 era limitado a 20 lesões.' },
  FORMACLINI: { ...D('p. 2, campo 34'), rotulo: 'Forma clínica', tipo: 'categorico',
    categorias: cat([['1', 'I - Indeterminada'], ['2', 'T - Tuberculóide'], ['3', 'D - Dimorfa'], ['4', 'V - Virchowiana'],
      ['5', 'Não classificado', { fonte: 'FICHAHANS', local: 'p. 1, campo 34' }]]),
    observacao: 'Forma clínica inicial por ocasião do diagnóstico, segundo a classificação de Madri. No DICHANS, o "5- Não classificado" fica encostado na linha da classificação operacional; a ficha (campo 34) e o instrucional (item 34) mostram que ele é da forma clínica. O arquivo de 2025 também traz 0 (1.070), 6 (42) e 9 (15), que nenhuma fonte define: ficam como vieram (pendência).' },
  CLASSOPERA: { ...D('p. 2, campo 35'), rotulo: 'Classificação operacional', tipo: 'categorico',
    categorias: cat([['1', 'PB - Paucibacilar'], ['2', 'MB - Multibacilar']]),
    observacao: 'Classificação operacional por ocasião do diagnóstico, para eleição do esquema terapêutico. O arquivo de 2025 também traz 0 (23) e 9 (8), que nenhuma fonte define: ficam como vieram (pendência).' },
  NERVOSAFET: { ...D('p. 2, campo 36'), rotulo: 'Nº de nervos afetados', tipo: 'numero' },
  AVALIA_N: { ...D('p. 2, campo 37'), rotulo: 'Avaliação do grau de incapacidade física no diagnóstico', tipo: 'categorico',
    categorias: cat([['0', 'Grau zero'], ['1', 'Grau I'], ['2', 'Grau II'], ['3', 'Não avaliado']]) },
  MODOENTR: { ...D('p. 2, campo 38'), rotulo: 'Modo de entrada', tipo: 'categorico',
    categorias: cat([['1', 'Caso novo'], ['2', 'Transferencia do mesmo município (outra unidade)'], ['3', 'Transferência de outro município (mesma UF)'],
      ['4', 'Transferência de outro estado'], ['5', 'Transferencia de outro país'], ['6', 'Recidiva'], ['7', 'Outros reingressos'], ['9', 'Ignorado']]),
    observacao: 'Rótulos como estão no DICHANS (inclusive "Transferencia" sem acento nos códigos 2 e 5). O arquivo de 2025 também traz 0 (23 registros, que vêm com 0 em vários outros campos): fica como veio (pendência).' },
  MODODETECT: { ...D('p. 2, campo 39'), rotulo: 'Modo de detecção do caso novo', tipo: 'categorico',
    categorias: cat([['1', 'Encaminhamento'], ['2', 'Demanda espontânea'], ['3', 'Exame de coletividade'], ['4', 'Exame de contatos'], ['5', 'Outros modos'], ['9', 'Ignorado']]),
    observacao: 'Só é preenchido quando o modo de entrada é caso novo (DICHANS, p. 2: "campo habilitado para digitação quando campo (Modo de entrada) = 1"; instrucional, item 39). O arquivo de 2025 traz 0 em 6.916 registros, dos quais 6.743 não são caso novo (modo de entrada 2 a 9 ou 0). Nenhuma fonte define o 0: fica como veio (pendência).' },
  BACILOSCOP: { ...D('p. 2, campo 40'), rotulo: 'Baciloscopia', tipo: 'categorico',
    categorias: cat([['1', 'Positiva'], ['2', 'Negativa'], ['3', 'Não realizada'], ['9', 'Ignorado']]),
    observacao: 'O DICHANS anota "renomear de BACILOSCOP para BACILOSCO"; o arquivo público continua com BACILOSCOP. O arquivo de 2025 também traz 0 (1.130), que nenhuma fonte define: fica como veio (pendência).' },
  DTINICTRAT: { ...D('p. 3, campo 41'), rotulo: 'Data do início do tratamento', tipo: 'data' },
  ESQ_INI_N: { ...D('p. 3, campo 42'), rotulo: 'Esquema terapêutico inicial', tipo: 'categorico',
    categorias: cat([['1', 'PQT/ PB/ 6 doses'], ['2', 'PQT/ MB/ 12 doses'], ['3', 'Outros Esquemas Substitutos']]),
    observacao: 'Esquema terapêutico instituído por ocasião do diagnóstico. O arquivo de 2025 também traz 0 (130), que nenhuma fonte define: fica como veio (pendência).' },
  CONTREG: { ...D('p. 3, campo 43'), rotulo: 'Nº de contatos registrados', tipo: 'numero',
    observacao: 'Número de pessoas que residam ou tenham residido nos últimos 5 anos com o doente, a contar da data do diagnóstico.' },
  UFATUAL: { ...D('p. 3, acompanhamento, campo 1'), rotulo: 'UF de atendimento atual', tipo: 'texto',
    observacao: 'Sigla da UF onde está a unidade de saúde responsável pelo tratamento atual. No arquivo vem a sigla (por exemplo, SP), não o código numérico, por isso fica como veio.' },
  ID_MUNI_AT: { ...D('p. 4, acompanhamento, campo 2'), rotulo: 'Município de atendimento atual', tipo: 'municipio' },
  DT_NOTI_AT: { ...D('p. 4, acompanhamento, campo 4'), rotulo: 'Data de notificação atual', tipo: 'data' },
  ID_UNID_AT: { ...D('p. 5, acompanhamento, campo 5'), rotulo: 'Unidade de atendimento atual (CNES)', tipo: 'tabela', tabela: 'cnes',
    observacao: 'Nome do estabelecimento pela tabela do CNES. Códigos não encontrados ficam como vieram e vão para as Inconsistências.' },
  UFRESAT: { ...D('p. 5, acompanhamento, campo 6'), rotulo: 'UF de residência atual', tipo: 'uf',
    observacao: 'No arquivo vem o código numérico da UF (IBGE); o nome da UF vem da tabela do IBGE.' },
  MUNIRESAT: { ...D('p. 5, acompanhamento, campo 7'), rotulo: 'Município de residência atual', tipo: 'municipio' },
  DTULTCOMP: { ...D('p. 6, acompanhamento, campo 11'), rotulo: 'Data do último comparecimento', tipo: 'data' },
  CLASSATUAL: { ...D('p. 6, acompanhamento, campo 12'), rotulo: 'Classificação operacional atual', tipo: 'categorico',
    categorias: cat([['1', 'PB (Paucibacilar)'], ['2', 'MB (Multibacilar)']]),
    observacao: 'O arquivo de 2025 também traz 0 (23) e 9 (8), que nenhuma fonte define: ficam como vieram (pendência).' },
  AVAL_ATU_N: { ...D('p. 7, acompanhamento, campo 13'), rotulo: 'Avaliação de incapacidade física no momento da cura', tipo: 'categorico',
    categorias: cat([['0', 'Grau zero'], ['1', 'Grau I'], ['2', 'Grau II'], ['3', 'Não avaliado'], ['9', 'Ignorado']]) },
  ESQ_ATU_N: { ...D('p. 7, acompanhamento, campo 14'), rotulo: 'Esquema terapêutico atual', tipo: 'categorico',
    categorias: cat([['1', 'PQT/PB/06 doses'], ['2', 'PQT/MB/12 doses'], ['3', 'Outros Esquemas Substitutivos']]),
    observacao: 'O arquivo de 2025 também traz 0 (492), que nenhuma fonte define: fica como veio (pendência).' },
  DOSE_RECEB: { ...D('p. 7, acompanhamento, campo 15'), rotulo: 'Número de doses supervisionadas recebidas', tipo: 'numero' },
  EPIS_RACIO: { ...D('p. 7, acompanhamento, campo 16'), rotulo: 'Episódio reacional durante o tratamento', tipo: 'categorico',
    categorias: cat([['1', 'Reação tipo 1'], ['2', 'Reação tipo 2'], ['3', 'Reação tipo 1 e 2'],
      ['4', 'Sem reação', { fonte: 'TABHANS', local: 'reacional.cnv, linha 5 ("Sem Reação"), usada pelo HansNET.def para EPIS_RACIO' }]]),
    observacao: 'O DICHANS lista só 1 a 3. O código 4 (16.169 registros em 2025) vem da tabela oficial do TabWin (reacional.cnv, revisada pela UT-Sinan em 2019). O arquivo também traz 0 (11.890), que nenhuma fonte define: fica como veio (pendência).' },
  DTMUDESQ: { ...D('p. 7, acompanhamento, campo 17'), rotulo: 'Data de mudança do esquema terapêutico', tipo: 'data' },
  CONTEXAM: { ...D('p. 7, acompanhamento, campo 18'), rotulo: 'Número de contatos examinados', tipo: 'numero' },
  TPALTA_N: { ...D('p. 8, acompanhamento, campo 19'), rotulo: 'Tipo de saída', tipo: 'categorico',
    categorias: cat([['1', 'Cura'], ['2', 'Transf. p/ mesmo município'], ['3', 'Transf. p/ outro município'], ['4', 'Transf. p/ outro Estado'],
      ['5', 'Transf. p/ outro país'], ['6', 'Óbito'], ['7', 'Abandono'], ['8', 'Erro diagnóstico'], ['9', 'Transf. não especificada']]),
    observacao: 'O DICHANS explica que o 9 não existe para digitação: aparece em casos migrados do Sinan Windows ou notificados até a versão 1.3. Em branco: caso ainda sem saída.' },
  DTALTA_N: { ...D('p. 8, acompanhamento, campo 20'), rotulo: 'Data da alta', tipo: 'data' },
  IN_VINCULA: { ...D('p. 8, acompanhamento, Vinculação'), rotulo: 'Vinculação', tipo: 'categorico',
    categorias: cat([['0', 'Não Vinculada'], ['1', 'Vinculada']]),
    observacao: 'Indica se a notificação foi vinculada (a categoria 1 é atribuída pelo sistema após a vinculação de notificações de hanseníase ou tuberculose).' },
  NU_LOTE_IA: { ...D('p. 8, Transferência vertical da investigação e do acompanhamento'), rotulo: 'Lote da transferência vertical da investigação e do acompanhamento', tipo: 'texto' },
};

// Ordem: a do arquivo público HANSBR25
const ORDEM = 'TP_NOT ID_AGRAVO DT_NOTIFIC NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA ID_UNIDADE DT_DIAG SEM_DIAG ANO_NASC NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS NDUPLIC_N DT_DIGITA DT_TRANSUS DT_TRANSDM DT_TRANSSM DT_TRANSRM DT_TRANSRS DT_TRANSSE NU_LOTE_V NU_LOTE_H CS_FLXRET FLXRECEBI MIGRADO_W ID_OCUPA_N NU_LESOES FORMACLINI AVALIA_N CLASSOPERA MODOENTR MODODETECT BACILOSCOP DTINICTRAT ESQ_INI_N CONTREG NERVOSAFET UFATUAL ID_MUNI_AT DT_NOTI_AT ID_UNID_AT UFRESAT MUNIRESAT DTULTCOMP CLASSATUAL AVAL_ATU_N ESQ_ATU_N DOSE_RECEB EPIS_RACIO DTMUDESQ CONTEXAM DTALTA_N TPALTA_N IN_VINCULA NU_LOTE_IA'.split(' ');

const colunas = ORDEM.map((nome) => {
  if (COMUNS.includes(nome)) { const c = comum(nome); return ajustes[nome] ? ajustes[nome](c) : c; }
  const p = proprias[nome];
  if (!p) throw new Error(`Sem definição: ${nome}`);
  const { fonte, local, rotulo, tipo, ...resto } = p;
  return { nome, fonte, local, rotulo, tipo, ...resto };
});
for (const c of colunas) {
  const usadas = [c.fonte, ...(c.categorias || []).map((k) => k.fonte)].filter(Boolean);
  for (const f of usadas) if (!fontes[f]) throw new Error(`${c.nome}: fonte ${f} não declarada`);
}

const pendencias = [
  { coluna: 'FORMACLINI, CLASSOPERA, CLASSATUAL, MODOENTR, MODODETECT, BACILOSCOP, ESQ_INI_N, ESQ_ATU_N, EPIS_RACIO',
    descricao: 'O arquivo de 2025 traz o código 0 nessas colunas (de 23 a 11.890 registros), e FORMACLINI também traz 6 (42) e 9 (15); CLASSOPERA e CLASSATUAL trazem 9 (8). Nenhuma fonte de hanseníase define esses códigos. No TabWin (HansNET.def), as tabelas Formacl, Classop, Modoentr, Mododete, Posneg e Esqueter juntam tudo o que não está listado numa linha "Ign/Branco" (",0-9"), sem dar nome ao 0. Pela regra do projeto, ficam como vieram, destacados. Decidir se fica assim.' },
  { coluna: 'MODODETECT',
    descricao: 'O 0 (6.916 registros) aparece quase só em quem não é caso novo (6.743), quando o campo não se aplica. Mesmo assim, nenhuma fonte diz o que é o 0. Decidir se fica como veio.' },
  { coluna: 'EPIS_RACIO',
    descricao: 'O código 4 = "Sem reação" vem da tabela do TabWin (reacional.cnv, UT-Sinan 2019), não do dicionário de dados, que lista só 1 a 3. Confirmar.' },
  { coluna: 'SEM_DIAG',
    descricao: 'Nenhum documento de hanseníase descreve SEM_DIAG. Nome dado por analogia com as outras semanas epidemiológicas: "Semana epidemiológica do diagnóstico". Confirmar.' },
  { coluna: 'FORMACLINI, CLASSOPERA, CLASSATUAL, ESQ_INI_N, ESQ_ATU_N, MODOENTR',
    descricao: 'Rótulos transcritos como estão no DICHANS, com siglas ("I - Indeterminada", "PB - Paucibacilar", "PQT/ PB/ 6 doses") e grafias da fonte ("Transferencia" sem acento; "Substitutos" no esquema inicial e "Substitutivos" no atual). Confirmar se ficam assim.' },
  { coluna: 'UFATUAL',
    descricao: 'O arquivo traz a sigla da UF (SP, MG...), e não o código numérico como nas outras colunas de UF; por isso fica como veio, sem conversão.' },
  { coluna: 'ID_UNIDADE e ID_UNID_AT',
    descricao: 'No arquivo de 2025, 1.930 códigos de unidade notificadora (e muitos da unidade de atendimento atual) vêm com menos de 7 dígitos, sem os zeros à esquerda (por exemplo 5428 em vez de 0005428). Completando com zeros até 7 dígitos, 1.926 deles são encontrados na tabela do CNES. O DICHANS dá 7 posições ao campo (varchar(7)). Hoje a ferramenta não completa os zeros, e esses códigos ficam como vieram, nas Inconsistências. O mesmo acontece, em menor número, em LV (8) e malária (12). Decidir se a ferramenta deve completar os zeros (mudança que valeria para todos os agravos).' },
  { coluna: 'NU_PRONTUA, NU_NOT_AT, DISTRIT_AT, BAIRROAT, NOBAIRROAT',
    descricao: 'Estão no DICHANS, mas não vêm no arquivo público (são campos que identificam a pessoa ou o endereço). Não entram no dicionário.' },
];


// ---- DECISOES_RUBENS: decisões da conferência de 16/11/2026 (planilha conferencia-hanseniase.xlsx)
const DATA_DEC = '16/11/2026';
const ROT_FORA = 'Inconsistência/Não Preenchido';
const col = (n) => colunas.find((c) => c.nome === n);
const fora = (n, motivo) => {
  col(n).fora_do_campo = { rotulo: ROT_FORA, motivo };
  col(n).observacao = (col(n).observacao || '').replace(/: ficam? como (veio|vieram)( \(pendência\))?\./, '.') +
    ` Decisão do Rubens (${DATA_DEC}): códigos que o campo não comporta saem como "${ROT_FORA}", destacados e listados nas Inconsistências (o código original continua na coluna ao lado).`;
};
const rot = (n, codigo, rotulo) => { col(n).categorias.find((k) => k.codigos.includes(codigo)).rotulo = rotulo; };

col('ID_AGRAVO').categorias[0].codigos = ['A309', 'A30.9'];
col('ID_AGRAVO').observacao += ` Decisão do Rubens (${DATA_DEC}): A30.9 e A309 = Hanseníase.`;
Object.assign(col('DT_DIAG'), { fonte: 'INSTHANS', local: 'p. 1, item 7' });
col('DT_DIAG').observacao = 'Instrucional, item 7: "data do diagnóstico ou da evidência laboratorial e/ou clínica da doença de acordo com a definição de caso vigente no momento da notificação" (campo obrigatório). Na ficha, campo 7, no lugar da data dos primeiros sintomas.';
Object.assign(col('SEM_DIAG'), { rotulo: 'Semana epidemiológica do diagnóstico do caso notificado',
  observacao: `Nenhum documento de hanseníase descreve SEM_DIAG. Decisão do Rubens (${DATA_DEC}): é a semana epidemiológica do diagnóstico do caso notificado; não aparece na ficha de papel porque é gerada automaticamente pelo Sinan na digitação. No arquivo de 2025, 481 registros têm valor e 30.838 vêm em branco.` });
{
  const esc = col('CS_ESCOL_N');
  esc.categorias[0].codigos = ['0', '00', '43'];
  esc.observacao += ` Decisão do Rubens (${DATA_DEC}): 0, 00 e 43 = Analfabeto; 1 e 01 = 1ª a 4ª série incompleta do EF, e assim por diante.`;
}

fora('FORMACLINI', 'Código sem fonte oficial: o campo 34 da ficha (forma clínica) só comporta 1 a 5');
fora('CLASSOPERA', 'Código sem fonte oficial: o campo 35 da ficha (classificação operacional) só comporta 1 e 2');
fora('CLASSATUAL', 'Código que não condiz com o preenchimento correto: a classificação operacional atual só comporta 1 (PB) e 2 (MB)');
rot('MODOENTR', '2', 'Transferência do mesmo município (outra unidade)');
rot('MODOENTR', '5', 'Transferência de outro país');
col('MODOENTR').observacao = `Rótulos do DICHANS, com a acentuação corrigida por decisão do Rubens (${DATA_DEC}; a fonte escreve "Transferencia" nos códigos 2 e 5).`;
fora('MODOENTR', 'Código que não condiz com o que comporta o campo 38 da ficha de notificação de hanseníase (1 a 7 e 9)');
fora('MODODETECT', 'Preenchimento inadequado: o campo 39 da ficha só comporta 1 a 5 e 9');
fora('BACILOSCOP', 'Erro de preenchimento: o campo 40 da ficha só comporta 1, 2, 3 e 9');
for (const n of ['ESQ_INI_N', 'ESQ_ATU_N']) {
  rot(n, '1', 'Poliquimioterapia Paucibacilar - 6 doses');
  rot(n, '2', 'Poliquimioterapia Multibacilar - 12 doses');
  col(n).observacao = (col(n).observacao || '') + ` Rótulos 1 e 2 por decisão do Rubens (${DATA_DEC}): a fonte escreve "PQT/ PB/ 6 doses" e "PQT/ MB/ 12 doses" (PQT = poliquimioterapia). O 3 fica como na fonte: "Substitutos" no esquema inicial e "Substitutivos" no atual.`;
}
rot('ESQ_INI_N', '3', 'Outros Esquemas Substitutos');
rot('ESQ_ATU_N', '3', 'Outros Esquemas Substitutivos');
fora('ESQ_INI_N', 'Código sem fonte oficial: o campo 42 da ficha (esquema terapêutico inicial) só comporta 1 a 3');
fora('ESQ_ATU_N', 'Código sem fonte oficial: o esquema terapêutico atual só comporta 1 a 3');
fora('EPIS_RACIO', 'Código sem fonte oficial: o episódio reacional só comporta 1 a 3 (dicionário de dados) e 4 (tabela do TabWin)');
col('EPIS_RACIO').observacao += ` O código 4 ("Sem reação") foi confirmado pelo Rubens (${DATA_DEC}), com a origem indicada: não está no dicionário de dados nem na ficha, só na tabela oficial do TabWin (reacional.cnv, revisada pela UT-Sinan em 2019, usada pelo HansNET.def).`;

const tabelasHans = structuredClone(lv.tabelas);
tabelasHans.cnes.completar_zeros = 7;
const regrasHans = { ...lv.regras_tabelas, cnes: 'Procura o código no CNES; se ele tiver menos de 7 dígitos e não for encontrado, procura também com zeros à esquerda (decisão do Rubens, 16/11/2026, por causa dos códigos que vêm sem os zeros).' };

pendencias.length = 0;
pendencias.push(
  { coluna: 'FORMACLINI, CLASSOPERA, CLASSATUAL, MODOENTR, MODODETECT, BACILOSCOP, ESQ_INI_N, ESQ_ATU_N, EPIS_RACIO',
    descricao: `Resolvida (Rubens, ${DATA_DEC}): os códigos que o campo não comporta (0 e, na forma clínica, 6 e 9; 9 na classificação operacional) saem como "${ROT_FORA}", destacados e listados nas Inconsistências com o motivo; o código original fica na coluna ao lado. No arquivo de 2025: EPIS_RACIO 0 = 11.890; MODODETECT 0 = 6.916 (preenchimento inadequado; 6.743 não são caso novo); BACILOSCOP 0 = 1.130; FORMACLINI 0/6/9 = 1.070/42/15; ESQ_ATU_N 0 = 492; ESQ_INI_N 0 = 130; MODOENTR 0 = 23; CLASSOPERA e CLASSATUAL 0/9 = 23/8.` },
  { coluna: 'ID_UNIDADE e ID_UNID_AT',
    descricao: `Resolvida (Rubens, ${DATA_DEC}): o código do CNES com menos de 7 dígitos é procurado também com zeros à esquerda. Decisão aplicada a todos os agravos.` },
);
const dic = {
  formato: lv.formato,
  agravo: { nome: 'Hanseníase', codigos: ['A309', 'A30.9', 'A 30.9'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos HANSBRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: true, por: 'Rubens Araujo da Silva Junior', data: '2026-11-16', registro: 'docs/conferencia/conferencia-hanseniase.xlsx (conferência na planilha em 16/11/2026, com as correções pedidas por ele aplicadas no mesmo dia)' },
  convencoes: lv.convencoes,
  fontes,
  tabelas: tabelasHans,
  regras_tabelas: regrasHans,
  listas: lv.listas,
  colunas,
  derivadas: lv.derivadas,
  pendencias,
};
writeFileSync(join(raiz, 'dicionarios/hanseniase.json'), JSON.stringify(dic, null, 2) + '\n');
console.log(`hanseniase.json: ${colunas.length} colunas, ${pendencias.length} pendências, fontes: ${Object.keys(fontes).join(' ')}`);
