// Gera dicionarios/hiv-gestante.json a partir das fontes oficiais de docs/fontes/hiv-gestante.
// Colunas comuns (campos 1 a 30 e internos) são copiadas do dicionário de hepatites virais, já conferido.
// Atenção: depois da conferência do Rubens, as correções vão direto no JSON; não rodar de novo.
import { readFileSync, writeFileSync } from 'node:fs';
const raiz = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // pasta principal do projeto
const ler = (a) => JSON.parse(readFileSync(`${raiz}dicionarios/${a}.json`, 'utf8'));
const hepa = ler('hepatites-virais');
const copia = (n) => structuredClone(hepa.colunas.find((x) => x.nome === n));
const REGRA = 'Códigos que o campo não comporta saem como "Inconsistência/Não Preenchido" (regra geral do Rubens, 16/11/2026).';
const FORA_ARQ = 'Não vem nos arquivos públicos do DATASUS (HIVGBR22 a 24); incluída para arquivos exportados do próprio Sinan (regra do Rubens para colunas do dicionário oficial fora do arquivo, 19/11/2026).';
const fora = (campo, comporta) => ({ rotulo: 'Inconsistência/Não Preenchido', motivo: `Código sem fonte oficial: o campo ${campo} só comporta ${comporta}` });
const cats = (pares) => pares.map(([k, r]) => ({ codigos: [k], rotulo: r }));
const DEF = 'O arquivo de definições do TabWin (HivGestNET.def) liga esta coluna ao mesmo campo e usa os mesmos códigos.';

const fontes = {
  DICHIVG: { documento: 'Dicionário de Dados – Sinan NET – versão 5.0 – Gestante HIV (campos 31 a 47)', orgao: 'Ministério da Saúde / SVS / DEVEP / CIEVS / GT-Sinan',
    data: 'Sem data de revisão no documento. Colocado pelo Rubens em docs/fontes em 19/11/2026; é o mesmo arquivo (byte a byte) que HIVG_DIC_DADOS.pdf do pacote Docs_TAB_SINAN do DATASUS.',
    arquivo: 'docs/fontes/hiv-gestante/DIC_DADOS_Gestante_HIV_v5.pdf' },
  FICHAHIVG: { documento: 'Ficha de Investigação – Gestante HIV + – Sinan NET', orgao: 'Ministério da Saúde / SVS',
    data: 'SVS 17/07/2006 (rodapé). Colocada pelo Rubens em docs/fontes em 19/11/2026.', arquivo: 'docs/fontes/hiv-gestante/Gestante_HIV_v5.pdf' },
  INSTHIVG: { documento: 'Gestantes HIV – Instruções para preenchimento – Ficha de Investigação – Sinan NET', orgao: 'Ministério da Saúde / SVS',
    data: 'Sinan NET 17/07/2006 (rodapé). Colocado pelo Rubens em docs/fontes em 19/11/2026.', arquivo: 'docs/fontes/hiv-gestante/Gestante_HIV_v5_instr.pdf' },
  SINANNET_HIVG: { documento: 'Arquivo de definições do TabWin para investigação de gestante HIV+ (HivGestNET.def) e conversões EviHIV.cnv, sim_nao.cnv, Tipoparto.cnv, Evograv.cnv e ARVhoras.cnv', orgao: 'Ministério da Saúde / GT-Sinan',
    data: 'Elaborado em 16/10/2007 e atualizado em 24/09/2010 (cabeçalho do .def); Tipoparto e Evograv revisados pela UT-Sinan em 2019. Pacote TAB_SINANNET do DATASUS.', arquivo: 'docs/fontes/tabelas-apoio/TAB_SINANNET/HivGestNET.def' },
};
for (const [id, f] of Object.entries(hepa.fontes)) if (!/HEPA$/.test(id)) fontes[id] = f;

const listas = {
  sn9: cats([['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']]),
  uf_sigla: structuredClone(hepa.listas.uf_sigla),
};

const col = {};
for (const n of ['TP_NOT', 'DT_NOTIFIC', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_REGIONA', 'NU_IDADE_N', 'CS_SEXO', 'CS_GESTANT', 'CS_RACA', 'CS_ESCOL_N', 'SG_UF', 'ID_MN_RESI', 'ID_RG_RESI', 'ID_PAIS']) col[n] = copia(n);
for (const cat of col.CS_ESCOL_N.categorias) if (cat.fonte === 'FICHAHEPA') Object.assign(cat, { fonte: 'FICHAHIVG', local: 'p. 1, campo 14' });
col.CS_ESCOL_N.observacao = col.CS_ESCOL_N.observacao.replace('o 0 vem da ficha de tétano acidental (p. 1, campo 14)', 'o 0 vem da ficha de gestante HIV (p. 1, campo 14)');
col.CS_GESTANT.observacao = 'As formas com um e dois dígitos (01 e 1) entram, como na escolaridade e na meningite (regra do Rubens); 9, 09 e 99 = Ignorado (decisão do Rubens nas hepatites, 19/11/2026). Nos arquivos de 2022 a 2024 vem sempre com um dígito. ' + REGRA;

col.ID_AGRAVO = { nome: 'ID_AGRAVO', fonte: 'FICHAHIVG', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
  categorias: [{ codigos: ['Z21', 'Z 21', 'Z 2 1'], rotulo: 'Estado de infecção assintomática pelo vírus da imunodeficiência humana [HIV]', fonte: 'CID10_TABWIN', local: 'CID10_21.cnv, código Z21' }],
  observacao: "A ficha mostra 'GESTANTE HIV' com o CID 'Z 21'; no arquivo vem 'Z21' (regra do Rubens: o CID como na ficha e sem espaços). Rótulo da CID-10 (tabela do TabWin), como o Rubens decidiu na meningite (19/11/2026)." };
col.DT_DIAG = { nome: 'DT_DIAG', fonte: 'INSTHIVG', local: 'p. 1, item 7', rotulo: 'Data do diagnóstico', tipo: 'data',
  observacao: 'Ficha, campo 7 ("Data do Diagnóstico"). Instrucional, item 7: "data do diagnóstico ou da evidência laboratorial e/ou clínica da doença de acordo com a definição de caso vigente no momento da notificação". O DICHIVG diz que os campos 1 a 30 seguem a notificação, "exceto a data de diagnóstico".' };
col.SEM_DIAG = { nome: 'SEM_DIAG', fonte: 'INSTHIVG', local: 'p. 1, item 7 (Data do diagnóstico)', rotulo: 'Semana epidemiológica do diagnóstico', tipo: 'texto',
  observacao: 'Nenhum documento de gestante HIV descreve SEM_DIAG; é a semana epidemiológica do diagnóstico, gerada pelo Sinan na digitação (decisão do Rubens na hanseníase, 16/11/2026). Vem em branco em todos os registros de 2022 a 2024; a semana calculada pela data do diagnóstico está na coluna extra logo depois.' };

const c = (nome, local, rotulo, tipo, extra = {}) => ({ nome, fonte: 'DICHIVG', local, rotulo, tipo, ...extra });
col.ID_OCUPA_N = { ...copia('ID_OCUPA_N'), fonte: 'DICHIVG', local: 'p. 1, campo 31', observacao: copia('ID_OCUPA_N').observacao + ' ' + FORA_ARQ };
col.ANT_EVLABO = c('ANT_EVLABO', 'p. 1, campo 32', 'Evidência laboratorial do HIV', 'categorico', {
  categorias: cats([['1', 'Antes do pré-natal'], ['2', 'Durante o pré-natal'], ['3', 'Durante o parto'], ['4', 'Após o parto']]),
  fora_do_campo: fora(32, '1 a 4'), observacao: `Momento da coleta do material em que se evidenciou o diagnóstico laboratorial da infecção pelo HIV na gestante/parturiente. ${DEF} ${REGRA}` });
col.PRE_PRENAT = c('PRE_PRENAT', 'p. 1, campo 33', 'Fez/faz pré-natal', 'categorico', { lista: 'sn9', fora_do_campo: fora(33, '1, 2 e 9'), observacao: `${DEF} ${REGRA}` });
col.PRE_UFREL = c('PRE_UFREL', 'p. 2, campo 34', 'UF de realização do pré-natal', 'texto', {
  observacao: 'O DICHIVG fala em sigla da UF, e o arquivo traz a sigla (AC, AL...): fica só com a sigla, como veio (regra do Rubens para UF em sigla, 19/11/2026).' });
col.PRE_MUNIRE = c('PRE_MUNIRE', 'p. 2, campo 35', 'Município de realização do pré-natal', 'municipio');
col.PRE_UNIDRE = c('PRE_UNIDRE', 'p. 2, campo 36', 'Unidade de saúde de realização do pré-natal (CNES)', 'tabela', { tabela: 'cnes', observacao: `O DICHIVG descreve o código dos estabelecimentos de saúde do CNES; sai o nome do estabelecimento. ${FORA_ARQ}` });
col.PRE_SISPRE = c('PRE_SISPRE', 'p. 2, campo 37', 'Nº da gestante no SISPRENATAL', 'texto', { observacao: FORA_ARQ });
col.PRE_ANTRET = c('PRE_ANTRET', 'p. 2, campo 38', 'Uso de antirretrovirais para profilaxia', 'categorico', { lista: 'sn9', fora_do_campo: fora(38, '1, 2 e 9'),
  observacao: `O DICHIVG e a ficha escrevem "anti-retrovirais" (grafia antiga); o nome usa a grafia atual. ${DEF} ${REGRA}` });
col.PRE_DT_RET = c('PRE_DT_RET', 'p. 2, campo 39', 'Data do início do uso de antirretroviral para profilaxia', 'data');
col.PAR_UFPART = c('PAR_UFPART', 'p. 2, campo 40', 'UF do local do parto', 'categorico', { lista: 'uf_sigla',
  observacao: 'O arquivo traz quase sempre o código numérico da UF (IBGE) e, em poucos registros, a sigla (ES, MG). As duas formas saem como sigla, pela tabela de UFs do DATASUS (regra do Rubens para coluna mista, 19/11/2026).' });
col.PRE_MUNIPA = c('PRE_MUNIPA', 'p. 2, campo 41', 'Município do local do parto', 'municipio', {
  observacao: 'Apesar do nome começar com PRE_, é o município do parto: o DICHIVG lista a coluna logo depois de PAR_UFPART, no campo 41, e o HivGestNET.def a usa como "UF US Parto".' });
col.PAR_UNIDPA = c('PAR_UNIDPA', 'p. 2, campo 42', 'Local de realização do parto (CNES)', 'tabela', { tabela: 'cnes',
  observacao: `O DICHIVG descreve a "Tabela de códigos das Unidades de Saúde do Sistema de Nascidos Vivos"; o instrucional fala em código segundo cadastro do Sinan e o HivGestNET.def usa a tabela de unidades (UNIDINVEST.dbf). Sai o nome do estabelecimento pelo CNES. ${FORA_ARQ}` });
col.PAR_DT_PAR = c('PAR_DT_PAR', 'p. 2, campo 43', 'Data do parto', 'data');
col.PAR_TIPO = c('PAR_TIPO', 'p. 3, campo 44', 'Tipo do parto', 'categorico', {
  categorias: cats([['1', 'Vaginal'], ['2', 'Cesárea eletiva'], ['3', 'Cesárea de urgência'], ['4', 'Não se aplica']]), fora_do_campo: fora(44, '1 a 4'), observacao: `${DEF} ${REGRA}` });
col.PAR_ANTIDU = c('PAR_ANTIDU', 'p. 3, campo 45', 'Fez uso de profilaxia antirretroviral durante o parto', 'categorico', { lista: 'sn9', fora_do_campo: fora(45, '1, 2 e 9'), observacao: `${DEF} ${REGRA}` });
col.PAR_EVOLUC = c('PAR_EVOLUC', 'p. 3, campo 46', 'Evolução da gravidez', 'categorico', {
  categorias: cats([['1', 'Nascido vivo'], ['2', 'Natimorto'], ['3', 'Aborto'], ['4', 'Não se aplica']]), fora_do_campo: fora(46, '1 a 4'),
  observacao: `${DEF} Na ficha, "4 - não realizado" e "9 - ignorado" aparecem impressos ao lado do campo 46, mas pertencem ao campo 47 (o DICHIVG e o .def confirmam). ${REGRA}` });
col.PAR_INICPR = c('PAR_INICPR', 'p. 3, campo 47', 'Início da profilaxia antirretroviral na criança (horas)', 'categorico', {
  categorias: cats([['1', 'Nas primeiras 24h'], ['2', 'Após 24h do nascimento'], ['3', 'Não se aplica'], ['4', 'Não realizado'], ['9', 'Ignorado']]), fora_do_campo: fora(47, '1 a 4 e 9'),
  observacao: `Rótulos do DICHIVG. ${DEF} ${REGRA}` });

const ORDEM = 'TP_NOT ID_AGRAVO DT_NOTIFIC NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA DT_DIAG SEM_DIAG NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS ID_OCUPA_N ANT_EVLABO PRE_PRENAT PRE_UFREL PRE_MUNIRE PRE_UNIDRE PRE_SISPRE PRE_ANTRET PRE_DT_RET PAR_UFPART PRE_MUNIPA PAR_UNIDPA PAR_DT_PAR PAR_TIPO PAR_ANTIDU PAR_EVOLUC PAR_INICPR'.split(' ');
const colunas = ORDEM.map((n) => { if (!col[n]) throw new Error(n); return col[n]; });
for (const k of Object.keys(col)) if (!ORDEM.includes(k)) throw new Error('fora da ordem: ' + k);

const derivadas = structuredClone(hepa.derivadas).filter((d) => d.nome !== 'SEM_NOT_CALC');

const pendencias = [
  { coluna: 'Fontes', descricao: 'Fonte principal: o DICHIVG (dicionário de gestante HIV, sem data), que é o mesmo arquivo do pacote Docs_TAB_SINAN. A ficha e o instrucional são de 2006. O HivGestNET.def do TabWin confirma a ligação de cada coluna com o campo e os códigos. Confirmar.' },
  { coluna: 'PRE_MUNIPA', descricao: 'O nome começa com PRE_ (pré-natal), mas pelo DICHIVG (campo 41) e pelo HivGestNET.def é o município do parto. Ficou "Município do local do parto". Confirmar.' },
  { coluna: 'PRE_UFREL e PAR_UFPART', descricao: 'A UF do pré-natal vem sempre em sigla (fica como veio). A UF do parto vem em código numérico e, em poucos registros, em sigla (ES, MG): sai sempre a sigla (lista uf_sigla, como na sífilis congênita). Confirmar.' },
  { coluna: 'PAR_EVOLUC e PAR_INICPR', descricao: 'Na ficha, "4 - não realizado" e "9 - ignorado" estão impressos junto do campo 46 (evolução da gravidez), mas o DICHIVG e o .def os põem no campo 47 (início da profilaxia na criança). Seguiu-se o DICHIVG. Confirmar.' },
  { coluna: 'Grafia "anti-retroviral"', descricao: 'As fontes escrevem "anti-retroviral" (grafia anterior ao Acordo Ortográfico); os nomes das colunas usam "antirretroviral". Os rótulos das categorias não mudam. Confirmar.' },
  { coluna: 'CS_GESTANT', descricao: 'Em 2022, 67 notificações de gestante HIV vêm com "5 - Não" no campo Gestante (3 em 2023 e 4 em 2024). Saem como "Não", que é o que está gravado; não é erro de tradução.' },
  { coluna: 'SEM_DIAG', descricao: 'Vem em branco em todos os registros de 2022 a 2024. Foi criada a coluna extra com a semana calculada pela data do diagnóstico (regra do Rubens, 18/11/2026).' },
  { coluna: 'Colunas do DICHIVG fora do arquivo', descricao: 'Ocupação (ID_OCUPA_N), unidade do pré-natal (PRE_UNIDRE), nº no SISPRENATAL (PRE_SISPRE) e local do parto (PAR_UNIDPA) estão no DICHIVG, mas não vêm no arquivo público. Entraram no dicionário, pela regra do Rubens (19/11/2026).' },
];

const dic = {
  formato: hepa.formato,
  agravo: { nome: 'HIV em gestante', codigos: ['Z21', 'Z 21', 'Z 2 1'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos HIVGBRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: false, por: '', data: '', registro: '' },
  convencoes: hepa.convencoes, fontes, tabelas: hepa.tabelas, listas, colunas, derivadas, pendencias,
};
const usadas = new Set([...colunas.flatMap((x) => [x.fonte, ...(x.categorias || []).map((k) => k.fonte)]), ...Object.values(listas).flat().map((k) => k.fonte), ...Object.values(hepa.tabelas).map((t) => t.fonte)].filter(Boolean));
for (const f of usadas) if (!fontes[f]) throw new Error('fonte ' + f);
for (const k of Object.keys(fontes)) if (!usadas.has(k) && !['FICHAHIVG', 'SINANNET_HIVG'].includes(k)) delete fontes[k];
writeFileSync(`${raiz}dicionarios/hiv-gestante.json`, JSON.stringify(dic, null, 2) + '\n');
console.log(`hiv-gestante.json: ${colunas.length} colunas, ${derivadas.length} extras, ${pendencias.length} pendências; fontes: ${Object.keys(fontes).join(' ')}`);
