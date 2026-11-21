// Gera dicionarios/animais-peconhentos.json a partir das fontes oficiais de docs/fontes/animais-peconhentos.
// Campos da notificação e internos copiados da meningite (dicionário conferido).
// Atenção: depois da conferência do Rubens, as correções vão direto no JSON; não rodar de novo.
import { readFileSync, writeFileSync } from 'node:fs';
const raiz = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // pasta principal do projeto
const meni = JSON.parse(readFileSync(`${raiz}dicionarios/meningite.json`, 'utf8'));
const copia = (n) => structuredClone(meni.colunas.find((x) => x.nome === n));
const REGRA = 'Códigos que o campo não comporta saem como "Inconsistência/Não Preenchido" (regra geral do Rubens, 16/11/2026).';
const fora = (campo, comporta) => ({ rotulo: 'Inconsistência/Não Preenchido', motivo: `Código sem fonte oficial: o campo ${campo} só comporta ${comporta}` });
const cats = (pares) => pares.map(([k, r]) => ({ codigos: Array.isArray(k) ? k : [k], rotulo: r }));
const PACOTE = 'Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026); copiado para o projeto em 20/11/2026';
const FORA_ARQ = 'Não vem nos arquivos públicos do DATASUS (ANIMBR21 a 24); incluída para arquivos exportados do próprio Sinan (regra do Rubens para colunas do dicionário oficial fora do arquivo, 19/11/2026).';

const fontes = {
  DICANIM: { documento: 'Dicionário de Dados – Sinan NET – versão 5.0 – Acidente por animais peçonhentos (campos 31 a 59)', orgao: 'Ministério da Saúde / SVS / DEVEP / CIEVS / GT-Sinan',
    data: `Revisado em julho/2010 (rodapé). ${PACOTE}.`, arquivo: 'docs/fontes/animais-peconhentos/ANIMPN_DIC_DADOS.pdf' },
  FICHAANIM: { documento: 'Ficha de Investigação – Acidentes por animais peçonhentos – Sinan NET', orgao: 'Ministério da Saúde / SVS', data: `SVS 19/01/2006 (rodapé). ${PACOTE}.`, arquivo: 'docs/fontes/animais-peconhentos/ANIMPN_FICHA.pdf' },
  INSTANIM: { documento: 'Acidentes por animais peçonhentos – Instruções para preenchimento – Ficha de investigação – Sinan NET', orgao: 'Ministério da Saúde / SVS', data: `${PACOTE}.`, arquivo: 'docs/fontes/animais-peconhentos/ANIMPN_INSTRUCIONAL.pdf' },
  TABANIM: { documento: 'Arquivo de definições do TabWin para acidentes por animais peçonhentos (AnimaispNET.DEF)', orgao: 'Ministério da Saúde / GT-Sinan',
    data: 'Atualizado em 09/04/2008 ("corrigido nomes dos campos NU_AMPO_5 e 7") e em 25/08/2010 (cabeçalho do .def). Pacote TAB_SINANNET do DATASUS.', arquivo: 'docs/fontes/tabelas-apoio/TAB_SINANNET/AnimaispNET.DEF' },
};
for (const [id, f] of Object.entries(meni.fontes)) if (!/MENI$/.test(id)) fontes[id] = f;

const listas = { sn9: cats([['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']]) };

const col = {};
for (const n of ['TP_NOT', 'DT_NOTIFIC', 'SEM_NOT', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_REGIONA', 'DT_SIN_PRI', 'SEM_PRI', 'ANO_NASC', 'NU_IDADE_N', 'CS_SEXO', 'CS_GESTANT', 'CS_RACA', 'CS_ESCOL_N', 'SG_UF', 'ID_MN_RESI', 'ID_RG_RESI', 'ID_PAIS', 'DT_DIGITA']) col[n] = copia(n);
for (const cat of col.CS_ESCOL_N.categorias) if (cat.fonte === 'FICHAMENI') Object.assign(cat, { fonte: 'FICHAANIM', local: 'p. 1, campo 14' });
col.ANO_NASC.observacao = 'O NOTIF2018 descreve a data de nascimento (DT_NASC); o arquivo público traz só o ano, na coluna ANO_NASC. Fica como veio.';
col.DT_SIN_PRI = { ...col.DT_SIN_PRI, observacao: 'Ficha, campo 7. Nos acidentes por animais peçonhentos, corresponde à data do acidente/primeiros sintomas.' };

col.ID_AGRAVO = { nome: 'ID_AGRAVO', fonte: 'FICHAANIM', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
  categorias: [{ codigos: ['X29', 'X 29', 'X 2 9'], rotulo: 'Contato com animais ou plantas venenosos, sem especificação', fonte: 'CID10_TABWIN', local: 'CID10_20.CNV, código X29' }],
  observacao: "A ficha mostra 'ACIDENTES POR ANIMAIS PEÇONHENTOS' com o CID 'X 29'; no arquivo vem 'X29' (regra do Rubens: o CID como na ficha e sem espaços). Rótulo da CID-10 (tabela do TabWin), como o Rubens decidiu na meningite (19/11/2026)." };

const D = (nome, local, rotulo, tipo, extra = {}) => ({ nome, fonte: 'DICANIM', local, rotulo, tipo, ...extra });
const L = (nome, local, rotulo, lista, campo, comporta, obs) => D(nome, local, rotulo, 'categorico', { lista, fora_do_campo: fora(campo, comporta), observacao: [obs, REGRA].filter(Boolean).join(' ') });
const C = (nome, local, rotulo, pares, campo, comporta, obs) => D(nome, local, rotulo, 'categorico', { categorias: cats(pares), fora_do_campo: fora(campo, comporta), observacao: [obs, REGRA].filter(Boolean).join(' ') });

col.DT_INVEST = D('DT_INVEST', 'p. 1, campo 31', 'Data da investigação', 'data');
col.ID_OCUPA_N = { ...copia('ID_OCUPA_N'), fonte: 'DICANIM', local: 'p. 2, campo 32' };
col.ANT_DT_ACI = D('ANT_DT_ACI', 'p. 2, campo 33', 'Data do acidente', 'data');
col.ANT_UF = D('ANT_UF', 'p. 2, campo 34', 'UF de ocorrência do acidente', 'uf', { observacao: 'No arquivo vem o código numérico da UF (IBGE); o nome da UF vem da tabela do IBGE.' });
col.ANT_MUNIC_ = D('ANT_MUNIC_', 'p. 2-3, campo 35', 'Município de ocorrência do acidente', 'municipio');
const localidade = D('ANT_LOCALI', 'p. 3, campo 36', 'Localidade da ocorrência do acidente', 'texto', { observacao: FORA_ARQ });
const zona = C('ANT_ZONA', 'p. 3, campo 37', 'Zona de ocorrência', [['1', 'Urbana'], ['2', 'Rural'], ['3', 'Periurbana'], ['9', 'Ignorado']], 37, '1, 2, 3 e 9', FORA_ARQ);
col.ANT_TEMPO_ = C('ANT_TEMPO_', 'p. 3, campo 38', 'Tempo decorrido picada/atendimento', [['1', '0 - 1h'], ['2', '1 - 3h'], ['3', '3 - 6h'], ['4', '6 - 12h'], ['5', '12 e 24h'], ['6', '24 e +h'], ['9', 'Ignorado']], 38, '1 a 6 e 9', 'Rótulos do DICANIM, como escritos na fonte.');
col.ANT_LOCA_1 = C('ANT_LOCA_1', 'p. 3, campo 39', 'Local da picada', [[['01', '1'], 'Cabeça'], [['02', '2'], 'Braço'], [['03', '3'], 'Ante-Braço'], [['04', '4'], 'Mão'], [['05', '5'], 'Dedo da Mão'], [['06', '6'], 'Tronco'], [['07', '7'], 'Coxa'], [['08', '8'], 'Perna'], [['09', '9'], 'Pé'], ['10', 'Dedo do Pé'], ['99', 'Ignorado']], 39, '01 a 10 e 99',
  'O DICANIM diz que o código tem 2 dígitos; a forma sem o zero também entra (regra do Rubens). O DICANIM escreve "tronco" com minúscula.');
col.MCLI_LOCAL = L('MCLI_LOCAL', 'p. 3, campo 40', 'Manifestações locais', 'sn9', 40, '1, 2 e 9');
for (const [n, r, p] of [['CLI_DOR', 'dor', 'p. 3-4'], ['CLI_EDEMA', 'edema', 'p. 4'], ['CLI_EQUIMO', 'equimose', 'p. 4'], ['CLI_NECROS', 'necrose', 'p. 4'], ['CLI_LOCAL_', 'outras', 'p. 4']]) col[n] = L(n, `${p}, campo 41`, `Manifestações locais: ${r}`, 'sn9', 41, '1, 2 e 9');
col.CLI_LOCA_1 = D('CLI_LOCA_1', 'p. 4, campo 41', 'Manifestações locais: outras (especificar)', 'texto', { observacao: 'Texto livre; fica como veio.' });
col.MCLI_SIST = L('MCLI_SIST', 'p. 4, campo 42', 'Manifestações sistêmicas', 'sn9', 42, '1, 2 e 9');
for (const [n, r] of [['CLI_NEURO', 'neuroparalíticas (ptose palpebral, turvação visual)'], ['CLI_HEMORR', 'hemorrágicas (gengivorragia, outros sangramentos)'], ['CLI_VAGAIS', 'vagais (vômitos/diarréia)'], ['CLI_MIOLIT', 'miolíticas/hemolíticas (mialgia, anemia, urina escura)'], ['CLI_RENAL', 'renais (oligúria/anúria)'], ['CLI_OUTR_2', 'outras']]) col[n] = L(n, 'p. 5, campo 43', `Manifestações sistêmicas: ${r}`, 'sn9', 43, '1, 2 e 9');
col.CLI_OUTR_3 = D('CLI_OUTR_3', 'p. 6, campo 43', 'Manifestações sistêmicas: outras (especificar)', 'texto', { observacao: 'Texto livre; fica como veio.' });
col.CLI_TEMPO_ = C('CLI_TEMPO_', 'p. 6, campo 44', 'Tempo de coagulação', [['1', 'Normal'], ['2', 'Alterado'], ['9', 'Não realizado']], 44, '1, 2 e 9', 'Aqui o 9 é "Não realizado" (DICANIM e Tempcoa.cnv do TabWin), e não "Ignorado".');
col.TP_ACIDENT = C('TP_ACIDENT', 'p. 6, campo 45', 'Tipo de acidente', [['1', 'Serpente'], ['2', 'Aranha'], ['3', 'Escorpião'], ['4', 'Lagarta'], ['5', 'Abelha'], ['6', 'Outros'], ['9', 'Ignorado']], 45, '1 a 6 e 9');
col.ANI_TIPO_1 = D('ANI_TIPO_1', 'p. 7, campo 45', 'Tipo de acidente: outros (especificar)', 'texto', { observacao: 'Texto livre (outro animal responsável pela agressão); fica como veio.' });
col.ANI_SERPEN = C('ANI_SERPEN', 'p. 7, campo 46', 'Serpente: tipo de acidente', [['1', 'Botrópico'], ['2', 'Crotálico'], ['3', 'Elapídico'], ['4', 'Laquético'], ['5', 'Serpente não peçonhenta'], ['9', 'Ignorado']], 46, '1 a 5 e 9');
col.ANI_ARANHA = C('ANI_ARANHA', 'p. 7, campo 47', 'Aranha: tipo de acidente', [['1', 'Foneutrismo'], ['2', 'Loxoscelismo'], ['3', 'Latrodectismo'], ['4', 'Outra aranha'], ['9', 'Ignorado']], 47, '1 a 4 e 9');
col.ANI_LAGART = C('ANI_LAGART', 'p. 7, campo 48', 'Lagarta: tipo de acidente', [['1', 'Lonomia'], ['2', 'Outra lagarta'], ['9', 'Ignorado']], 48, '1, 2 e 9');
col.TRA_CLASSI = C('TRA_CLASSI', 'p. 7, campo 49', 'Classificação do caso', [['1', 'Leve'], ['2', 'Moderado'], ['3', 'Grave'], ['9', 'Ignorado']], 49, '1, 2, 3 e 9', 'Gravidade do envenenamento. O LEVEMODE.CNV do TabWin tem também 8 (Inconclusivo), que o DICANIM não lista; nos arquivos não aparece.');
col.CON_SOROTE = L('CON_SOROTE', 'p. 7, campo 50', 'Soroterapia', 'sn9', 50, '1, 2 e 9');
const SOROS = [['NU_AMPOLAS', 'antibotrópico (SAB)'], ['NU_AMPOL_1', 'anticrotálico (SAC)'], ['NU_AMPOL_8', 'antiaracnídico (SAAr)'], ['NU_AMPOL_6', 'antibotrópico-laquético (SABL)'], ['NU_AMPOL_4', 'antielapídico (SAEL)'],
  ['NU_AMPO_7', 'antiloxoscélico (SALox)', 'NU_AMPOL_7'], ['NU_AMPO_5', 'antibotrópico-crotálico (SABC)', 'NU_AMPOL_5'], ['NU_AMPOL_9', 'antiescorpiônico (SAEsc)'], ['NU_AMPOL_3', 'antilonômico (SALon)']];
for (const [n, r, dic] of SOROS) col[n] = D(n, 'p. 7-9, campo 51', `Número de ampolas de soro ${r}`, 'numero', {
  observacao: ['Ligação de cada coluna com o soro pelo AnimaispNET.DEF do TabWin, na mesma ordem do DICANIM e da ficha. O DICANIM escreve "antibrotópico".', dic && `No DICANIM a coluna se chama ${dic}; o .def registra a correção do nome para ${n} (09/04/2008).`].filter(Boolean).join(' ') });
col.COM_LOC = L('COM_LOC', 'p. 9, campo 52', 'Complicações locais', 'sn9', 52, '1, 2 e 9');
for (const [n, r, obs] of [['COM_SECUND', 'infecção secundária'], ['COM_NECROS', 'necrose extensa'], ['COM_COMPOR', 'síndrome comportamental', 'Rótulo como no DICANIM e no AnimaispNET.DEF ("Síndrome Comportamental"); no DICANIM a coluna se chama COM_COMPAR, e na clínica dos acidentes o termo usual é "síndrome compartimental" (pendência).'], ['COM_DEFICT', 'déficit funcional'], ['COM_APUTAC', 'amputação']]) col[n] = L(n, 'p. 9, campo 53', `Complicações locais: ${r}`, 'sn9', 53, '1, 2 e 9', obs);
col.COM_SISTEM = L('COM_SISTEM', 'p. 9, campo 54', 'Complicações sistêmicas', 'sn9', 54, '1, 2 e 9');
for (const [n, r] of [['COM_RENAL', 'insuficiência renal'], ['COM_EDEMA', 'insuficiência respiratória/edema pulmonar agudo'], ['COM_SEPTIC', 'septicemia'], ['COM_CHOQUE', 'choque']]) col[n] = L(n, 'p. 9-10, campo 55', `Complicações sistêmicas: ${r}`, 'sn9', 55, '1, 2 e 9');
col.DOENCA_TRA = L('DOENCA_TRA', 'p. 10, campo 56', 'Acidente relacionado ao trabalho', 'sn9', 56, '1, 2 e 9');
col.EVOLUCAO = C('EVOLUCAO', 'p. 10, campo 57', 'Evolução do caso', [['1', 'Cura'], ['2', 'Óbito por acidente por animais peçonhentos'], ['3', 'Óbito por outras causas'], ['9', 'Ignorado']], 57, '1, 2, 3 e 9');
col.DT_OBITO = D('DT_OBITO', 'p. 10, campo 58', 'Data do óbito', 'data');
col.DT_ENCERRA = D('DT_ENCERRA', 'p. 11, campo 59', 'Data do encerramento', 'data');
const lote = D('NU_LOTE_I', 'p. 11', 'Transferência vertical da investigação (lote)', 'texto', { observacao: FORA_ARQ });

const ORDEM = 'TP_NOT ID_AGRAVO DT_NOTIFIC SEM_NOT NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA DT_SIN_PRI SEM_PRI ANO_NASC NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS DT_INVEST ID_OCUPA_N ANT_DT_ACI ANT_UF ANT_MUNIC_ ANT_TEMPO_ ANT_LOCA_1 MCLI_LOCAL CLI_DOR CLI_EDEMA CLI_EQUIMO CLI_NECROS CLI_LOCAL_ CLI_LOCA_1 MCLI_SIST CLI_NEURO CLI_HEMORR CLI_VAGAIS CLI_MIOLIT CLI_RENAL CLI_OUTR_2 CLI_OUTR_3 CLI_TEMPO_ TP_ACIDENT ANI_TIPO_1 ANI_SERPEN ANI_ARANHA ANI_LAGART TRA_CLASSI CON_SOROTE NU_AMPOLAS NU_AMPOL_1 NU_AMPOL_8 NU_AMPOL_6 NU_AMPOL_4 NU_AMPO_7 NU_AMPO_5 NU_AMPOL_9 NU_AMPOL_3 COM_LOC COM_SECUND COM_NECROS COM_COMPOR COM_DEFICT COM_APUTAC COM_SISTEM COM_RENAL COM_EDEMA COM_SEPTIC COM_CHOQUE DOENCA_TRA EVOLUCAO DT_OBITO DT_ENCERRA DT_DIGITA'.split(' ');
const colunas = [];
for (const n of ORDEM) {
  if (!col[n]) throw new Error(n);
  colunas.push(col[n]);
  if (n === 'ANT_MUNIC_') colunas.push(localidade, zona);
  if (n === 'DT_ENCERRA') colunas.push(lote);
}
for (const k of Object.keys(col)) if (!ORDEM.includes(k)) throw new Error('fora da ordem: ' + k);

const pendencias = [
  { coluna: 'Fontes', descricao: 'Fonte principal: o DICANIM (dicionário de acidentes por animais peçonhentos, revisado em julho/2010, do pacote Docs_TAB_SINAN). A ficha é de 2006. O AnimaispNET.DEF do TabWin confirma as colunas. Os campos da notificação foram copiados da meningite, já conferida. Confirmar.' },
  { coluna: 'Ampolas de soro (NU_AMPOL*)', descricao: 'Os nomes das colunas não dizem qual é o soro. A ligação foi feita pelo AnimaispNET.DEF, que dá o soro de cada coluna, na mesma ordem do DICANIM e da ficha: NU_AMPOLAS antibotrópico, NU_AMPOL_1 anticrotálico, NU_AMPOL_8 antiaracnídico, NU_AMPOL_6 antibotrópico-laquético, NU_AMPOL_4 antielapídico, NU_AMPO_7 antiloxoscélico, NU_AMPO_5 antibotrópico-crotálico, NU_AMPOL_9 antiescorpiônico e NU_AMPOL_3 antilonômico. São números e ficam como vieram. Confirmar.' },
  { coluna: 'COM_COMPOR', descricao: 'O DICANIM e o .def chamam esta complicação local de "Síndrome Comportamental"; na clínica dos acidentes o termo usual é "síndrome compartimental". Ficou como na fonte. No DICANIM a coluna se chama COM_COMPAR. Decidir se o nome deve ser corrigido.' },
  { coluna: 'CLI_TEMPO_', descricao: 'No tempo de coagulação o código 9 quer dizer "Não realizado", e não "Ignorado" (DICANIM e TabWin). Vem 9 em cerca de 914 mil registros (73%). Confirmar.' },
  { coluna: 'ANT_LOCA_1', descricao: 'O local da picada vem com 2 dígitos (01 a 10 e 99); as formas sem zero também entram. Confirmar.' },
  { coluna: 'Campos do DICANIM fora do arquivo', descricao: 'Entraram, pela regra do Rubens: localidade da ocorrência (36), zona de ocorrência (37) e o lote da transferência vertical. As observações não são exportadas para o DBF (DICANIM).' },
  { coluna: 'Arquivos', descricao: 'Vieram 2021 a 2024 (262.723, 298.821, 352.994 e 346.576 notificações). O arquivo de 2025 não foi baixado.' },
];

const dic = {
  formato: meni.formato,
  agravo: { nome: 'Acidentes por animais peçonhentos', codigos: ['X29', 'X 29', 'X 2 9'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos ANIMBRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: false, por: '', data: '', registro: '' },
  convencoes: meni.convencoes, fontes, tabelas: meni.tabelas, listas, colunas, derivadas: structuredClone(meni.derivadas), pendencias,
};
const usadas = new Set([...colunas.flatMap((x) => [x.fonte, ...(x.categorias || []).map((k) => k.fonte)]), ...Object.values(listas).flat().map((k) => k.fonte), ...Object.values(meni.tabelas).map((t) => t.fonte)].filter(Boolean));
for (const f of usadas) if (!fontes[f]) throw new Error('fonte ' + f);
for (const k of Object.keys(fontes)) if (!usadas.has(k) && !['FICHAANIM', 'INSTANIM', 'TABANIM'].includes(k)) delete fontes[k];
writeFileSync(`${raiz}dicionarios/animais-peconhentos.json`, JSON.stringify(dic, null, 2) + '\n');
console.log(`animais-peconhentos.json: ${colunas.length} colunas, ${dic.derivadas.length} extras, ${pendencias.length} pendências; fontes: ${Object.keys(fontes).join(' ')}`);
