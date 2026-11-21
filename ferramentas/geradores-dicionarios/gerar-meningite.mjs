// Gera dicionarios/meningite.json a partir das fontes oficiais de docs/fontes/meningite.
// Colunas comuns (campos 1 a 30 e internos) são copiadas de dicionários já conferidos.
import { readFileSync, writeFileSync } from 'node:fs';
const raiz = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // pasta principal do projeto
const ler = (a) => JSON.parse(readFileSync(`${raiz}dicionarios/${a}.json`, 'utf8'));
const teta = ler('tetano-acidental');
const hans = ler('hanseniase');
const sifg = ler('sifilis-gestante');
const copia = (d, n) => structuredClone(d.colunas.find((x) => x.nome === n));
const REGRA = 'Códigos que o campo não comporta saem como "Inconsistência/Não Preenchido" (regra geral do Rubens, 16/11/2026).';
const ZEROS = 'O quadro escreve os códigos com dois dígitos (por exemplo, 01); o arquivo traz também a forma sem o zero (1), e as duas entram (pendência).';
const fora = (motivo) => ({ rotulo: 'Inconsistência/Não Preenchido', motivo: `Código sem fonte oficial: ${motivo}` });

const PACOTE = 'Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026)';
const fontes = {
  DICMENI: { documento: 'Dicionário de Dados – Sinan NET – versão 5.0 – Meningite (campos 31 a 60 e quadros I a XII)', orgao: 'Ministério da Saúde / SVS / DEVEP / CIEVS / GT-Sinan', data: `revisado em julho de 2010 (23 páginas). ${PACOTE}`, arquivo: 'docs/fontes/meningite/MENIN_DIC_DADOS.pdf' },
  FICHAMENI: { documento: 'Ficha de Investigação – Meningite – Sinan NET', orgao: 'Ministério da Saúde / SVS', data: `SVS 15/10/2007 (rodapé da ficha). ${PACOTE}`, arquivo: 'docs/fontes/meningite/MENIN_FICHA.pdf' },
  INSTMENI: { documento: 'Meningite – Instruções para preenchimento – Ficha de Investigação – Sinan NET', orgao: 'Ministério da Saúde / SVS', data: PACOTE, arquivo: 'docs/fontes/meningite/MENIN_INSTRUCIONAL.pdf' },
};
for (const [id, f] of Object.entries(teta.fontes)) if (!['DICTETA', 'FICHATETA', 'INSTTETA', 'DICLTA'].includes(id)) fontes[id] = f;

// ---------- listas transcritas dos quadros do DICMENI
const doisDigitos = (c) => (/^0\d$/.test(c) ? [c, c.slice(1)] : [c]);
const quadro = (pag, linhas) => linhas.map(([c, r]) => ({ codigos: doisDigitos(c), rotulo: r }));
const listas = {
  sn9: [{ codigos: ['1'], rotulo: 'Sim' }, { codigos: ['2'], rotulo: 'Não' }, { codigos: ['9'], rotulo: 'Ignorado' }],
  // Quadro VII (p. 19): cultura
  quadro_vii: quadro(19, [['61', 'Não realizado'], ['62', 'Ignorado'], ['01', 'Neisseria meningitidis'], ['06', 'Haemophilus influenzae'], ['07', 'Streptococos pneumoniae'], ['28', 'Outras bactérias'], ['51', 'Nenhum agente']]),
  // Quadro VIII (p. 20): bacterioscopia
  quadro_viii: quadro(20, [['61', 'Não realizado'], ['62', 'Ignorado'], ['32', 'Bacilos Gram negativo'], ['31', 'Bacilos Gram positivo'], ['30', 'Bastonetes Gram negativo'], ['29', 'Bastonetes Gram positivo'], ['36', 'Cocobacilos'], ['34', 'Cocos Gram negativo'], ['33', 'Cocos Gram positivo'], ['35', 'Diplobacilos Gram negativo'], ['03', 'Diplococos Gram negativo'], ['08', 'Diplococos Gram positivo'], ['28', 'Outras Bactérias'], ['51', 'Nenhum agente']]),
  // Quadro IX (p. 20): CIE
  quadro_ix: quadro(20, [['61', 'Não realizado'], ['62', 'Ignorado'], ['01', 'Neisseria meningitidis'], ['06', 'Haemophilus influenzae'], ['51', 'Nenhum agente']]),
  // Quadro X (p. 21): aglutinação pelo látex
  quadro_x: quadro(21, [['61', 'Não realizado'], ['62', 'Ignorado'], ['01', 'Neisseria meningitidis'], ['43', 'Criptococos'], ['06', 'Haemophilus influenzae'], ['14', 'Streptococos (sp, piogens, alfa, hemolitico, fecalis, agalactiae)'], ['07', 'Streptococos pneumoniae'], ['28', 'Outras Bactérias'], ['51', 'Nenhum agente']]),
  // Quadro XI (p. 22): isolamento viral
  quadro_xi: quadro(22, [['75', 'Não identificado'], ['37', 'Caxumba'], ['38', 'Sarampo'], ['39', 'Herpes Simples'], ['40', 'Varicela/Catapora/Herpes Zoster'], ['41', 'Rubéola'], ['55', 'Influenza'], ['70', 'Adenovírus'], ['56', 'Echovírus'], ['63', 'Coxasackie'], ['59', 'Outros Enterovírus'], ['71', 'Vírus do Nilo Ocidental'], ['72', 'Dengue'], ['73', 'Outros Arbovírus'], ['74', 'Outros vírus']]),
  // Quadro XII (p. 23): PCR
  quadro_xii: quadro(23, [['62', 'Ignorado'], ['37', 'Caxumba'], ['38', 'Sarampo'], ['39', 'Herpes Simples'], ['40', 'Varicela/Catapora/Herpes Zoster'], ['41', 'Rubéola'], ['55', 'Influenza'], ['72', 'Dengue'], ['61', 'Não realizado'], ['75', 'Não identificado'], ['70', 'Adenovírus'], ['56', 'Echovírus'], ['63', 'Coxasackie'], ['59', 'Outros Enterovírus'], ['71', 'Vírus do Nilo Ocidental'], ['73', 'Outros Arbovírus'], ['74', 'Outros vírus'], ['01', 'Neisseria meningitidis'], ['06', 'Haemophilus influenzae'], ['07', 'Streptococos pneumoniae'], ['28', 'Outras bactérias'], ['43', 'Cryptococcus/Torula'], ['42', 'Outros fungos'], ['48', 'Toxoplasma (Gondii, sp)'], ['52', 'Outros Parasitas'], ['51', 'Nenhum agente']]),
};
const ORIGEM_QUADRO = { quadro_vii: 'Quadro VII, p. 19', quadro_viii: 'Quadro VIII, p. 20', quadro_ix: 'Quadro IX, p. 20', quadro_x: 'Quadro X, p. 21', quadro_xi: 'Quadro XI, p. 22', quadro_xii: 'Quadro XII, p. 23' };

const col = {};
// ---------- comuns, copiadas de dicionários conferidos
for (const n of ['TP_NOT', 'DT_NOTIFIC', 'SEM_NOT', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_REGIONA', 'ID_UNIDADE', 'DT_SIN_PRI', 'SEM_PRI', 'ANO_NASC', 'NU_IDADE_N', 'CS_SEXO', 'CS_GESTANT', 'CS_RACA', 'CS_ESCOL_N', 'ID_MN_RESI', 'ID_RG_RESI', 'ID_PAIS', 'DT_DIGITA', 'DT_TRANSUS', 'DT_TRANSDM', 'DT_TRANSSM', 'DT_TRANSRM', 'DT_TRANSRS', 'DT_TRANSSE', 'NU_LOTE_V', 'NU_LOTE_H']) col[n] = copia(teta, n);
for (const cat of col.CS_ESCOL_N.categorias) if (cat.fonte === 'FICHATETA') Object.assign(cat, { fonte: 'FICHAMENI', local: 'p. 1, campo 14' });
col.SG_UF = copia(sifg, 'SG_UF'); // no arquivo de meningite a UF de residência vem em código numérico
for (const n of ['NDUPLIC_N', 'CS_FLXRET', 'FLXRECEBI', 'MIGRADO_W']) col[n] = copia(hans, n);

// ---------- próprias da meningite
const c = (nome, local, rotulo, tipo, extra = {}) => ({ nome, fonte: 'DICMENI', local, rotulo, tipo, ...extra });
const sn = (nome, local, rotulo, campo, obs) => c(nome, local, rotulo, 'categorico', { lista: 'sn9', fora_do_campo: fora(`o campo ${campo} só comporta 1, 2 e 9`), observacao: [obs, REGRA].filter(Boolean).join(' ') });

col.ID_AGRAVO = { nome: 'ID_AGRAVO', fonte: 'FICHAMENI', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
  categorias: [{ codigos: ['G039', 'G03.9', 'G 0 3.9', 'G 03.9'], rotulo: 'Meningite' }],
  observacao: "A ficha mostra 'MENINGITE' com o CID 'G 0 3. 9'; no arquivo vem 'G039' (regra do Rubens: o CID como na ficha e sem espaços nem ponto). Nome como na ficha, como o Rubens decidiu na sífilis adquirida (18/11/2026); na CID-10 o G03.9 é 'Meningite não especificada' (pendência)." };
col.CS_MENING = { nome: 'CS_MENING', fonte: 'FICHAMENI', local: 'p. 1, campo 2 (Agravo/doença)', rotulo: 'Tipo de meningite notificada', tipo: 'categorico',
  categorias: [{ codigos: ['1'], rotulo: 'Doença meningocócica' }, { codigos: ['2'], rotulo: 'Outras meningites' }],
  fora_do_campo: fora('o campo 2 da ficha só comporta 1 e 2'),
  observacao: `Na ficha, ao lado do agravo: "1 - DOENÇA MENINGOCÓCICA" e "2 - OUTRAS MENINGITES". O NOTIF2018 (campo "Suspeita do agravo", b) Meningite) escreve "Doenças Meningocócicas" e "Outras Meningites". ${REGRA}` };
col.DT_INVEST = c('DT_INVEST', 'p. 1, campo 31', 'Data da investigação', 'data');
col.ID_OCUPA_N = Object.assign(copia(teta, 'ID_OCUPA_N'), { fonte: 'DICMENI', local: 'p. 1, campo 32' });

const vacinas = [
  ['ANT_AC', 'ANT_DOSE_3', 'ANT_DTUL_3', 'polissacarídica A/C', 2],
  ['ANT_BC', 'ANT_DOSES_', 'ANT_DTULT_', 'polissacarídica B/C', 2],
  ['ANT_CONJ_C', 'ANT_DOSE_C', 'ANT_DTUL_C', 'conjugada meningo C', 2],
  ['ANT_BCG', 'ANT_DOSE_4', 'ANT_DTUL_4', 'BCG', 2],
  ['ANT_TRIPLI', 'ANT_DOSE_5', 'ANT_DTUL_5', 'tríplice viral', 3],
  ['ANT_HEMO_T', 'ANT_DOSE_T', 'ANT_DTUL_T', 'hemófilo (tetravalente ou Hib)', 3],
  ['ANT_PNEUMO', 'ANT_DOSE_7', 'ANT_DTUL_7', 'pneumococo', 3],
];
for (const [v, d, dt, nome, pag] of vacinas) {
  col[v] = sn(v, `p. ${pag}, campo 33`, `Vacinação: ${nome}`, 33);
  col[d] = c(d, `p. ${pag}, campo 33`, `Vacinação: ${nome} – número de doses`, 'numero', { observacao: 'Número como veio no arquivo; valores fora do esperado (por exemplo, negativos) não são alterados.' });
  col[dt] = c(dt, `p. ${pag}, campo 33`, `Vacinação: ${nome} – data da última dose`, 'data');
}
col.ANT_OUTRA = sn('ANT_OUTRA', 'p. 3, campo 33', 'Vacinação: outra', 33);
col.ANT_OU_DE = c('ANT_OU_DE', 'p. 3, campo 33', 'Vacinação: outra (especificar)', 'texto', { observacao: 'Texto livre; fica como veio.' });
col.ANT_DTUL_8 = c('ANT_DTUL_8', 'p. 3, campo 33', 'Vacinação: outra – data da última dose', 'data');

const doencas = [['ANT_AIDS', 'AIDS/HIV', 3], ['ANT_IMUNO', 'outras doenças imunodepressoras', 4], ['ANT_IRA', 'IRA', 4], ['ANT_TUBE', 'tuberculose', 4], ['ANT_TRAUMA', 'traumatismo', 4], ['ANT_INF_HO', 'infecção hospitalar', 4], ['ANT_OUTRO', 'outra', 4]];
for (const [n, nome, pag] of doencas) col[n] = sn(n, `p. ${pag}, campo 34`, `Doença pré-existente: ${nome}`, 34);
col.ANT_TRAUMA.observacao = `O DICMENI escreve "1. Sim 3. Não 9. Ignorado" para traumatismo; a ficha (campo 34) e o arquivo usam 2 = Não, como nas outras doenças pré-existentes (pendência). ${REGRA}`;
col.ANT_TRAUMA.fonte = 'FICHAMENI'; col.ANT_TRAUMA.local = 'p. 1, campo 34';
col.ANT_OUTR_D = c('ANT_OUTR_D', 'p. 4, campo 34', 'Doença pré-existente: outra (especificar)', 'texto', { observacao: 'Texto livre; fica como veio.' });
col.ANT_CONT_N = c('ANT_CONT_N', 'p. 4, campo 35', 'Contato com caso suspeito ou confirmado de meningite (até 15 dias antes dos sintomas)', 'categorico', {
  categorias: [['1', 'Domicílio'], ['2', 'Vizinhança'], ['3', 'Trabalho'], ['4', 'Creche/escola'], ['5', 'Posto de Saúde/Hospital'], ['6', 'Outro Estado/Município'], ['7', 'Sem história de contato'], ['8', 'Outro país'], ['9', 'Ignorado']].map(([k, r]) => ({ codigos: [k], rotulo: r })),
  fora_do_campo: fora('o campo 35 só comporta 1 a 9'), observacao: REGRA });
col.ANT_SECUND = sn('ANT_SECUND', 'p. 5, campo 39', 'Caso secundário', 39);

const sinais = [['CLI_CEFALE', 'cefaleia'], ['CLI_FEBRE', 'febre'], ['CLI_VOMITO', 'vômitos'], ['CLI_CONVUL', 'convulsões'], ['CLI_RIGIDE', 'rigidez de nuca'], ['CLI_KERNIG', 'Kernig/Brudzinski'], ['CLI_ABAULA', 'abaulamento de fontanela'], ['CLI_COMA', 'coma'], ['CLI_PETEQU', 'petéquias/sufusões hemorrágicas']];
for (const [n, nome] of sinais) col[n] = sn(n, 'p. 5, campo 40', `Sinais e sintomas: ${nome}`, 40);
col.CLI_OUTRAS = sn('CLI_OUTRAS', 'p. 6, campo 40', 'Sinais e sintomas: outros', 40);
col.CLI_ESPECI = c('CLI_ESPECI', 'p. 6, campo 40', 'Sinais e sintomas: outros (especificar)', 'texto', { observacao: 'Texto livre; fica como veio.' });

col.ATE_HOSPIT = sn('ATE_HOSPIT', 'p. 6, campo 41', 'Ocorreu hospitalização', 41);
col.ATE_INTERN = c('ATE_INTERN', 'p. 6, campo 42', 'Data da internação', 'data');
col.ATE_UF_HOS = c('ATE_UF_HOS', 'p. 6, campo 43', 'UF do hospital', 'texto', { observacao: 'O DICMENI descreve a sigla da UF do hospital; no arquivo vem a sigla (por exemplo, SP), que fica como veio (regra aprovada em hanseníase e tétano).' });
col.ATE_MUNICI = c('ATE_MUNICI', 'p. 6, campo 44', 'Município do hospital', 'municipio');
col.LAB_PUNCAO = sn('LAB_PUNCAO', 'p. 6, campo 46', 'Punção lombar', 46);
col.LAB_DTPUNC = c('LAB_DTPUNC', 'p. 7, campo 47', 'Data da punção', 'data');
col.LAB_ASPECT = c('LAB_ASPECT', 'p. 7, campo 48', 'Aspecto do líquor', 'categorico', {
  categorias: [['1', 'Límpido'], ['2', 'Purulento'], ['3', 'Hemorrágico'], ['4', 'Turvo'], ['5', 'Xantocrômico'], ['6', 'Outro'], ['9', 'Ignorado']].map(([k, r]) => ({ codigos: [k], rotulo: r })),
  fora_do_campo: fora('o campo 48 só comporta 1 a 6 e 9'), observacao: REGRA });

const exames = [
  ['LAB_CTLIQU', 'Cultura – líquor', 'quadro_vii', 7], ['LAB_CTLESA', 'Cultura – lesão petequial', 'quadro_vii', 7], ['LAB_CTSANG', 'Cultura – sangue/soro', 'quadro_vii', 7], ['LAB_CTESCA', 'Cultura – escarro', 'quadro_vii', 7],
  ['LAB_BCLIQU', 'Bacterioscopia – líquor', 'quadro_viii', 7], ['LAB_BCLESA', 'Bacterioscopia – lesão petequial', 'quadro_viii', 8], ['LAB_BCSANG', 'Bacterioscopia – sangue/soro', 'quadro_viii', 8], ['LAB_BCESCA', 'Bacterioscopia – escarro', 'quadro_viii', 8],
  ['LAB_CILIQU', 'CIE – líquor', 'quadro_ix', 8], ['LAB_CISANG', 'CIE – sangue/soro', 'quadro_ix', 8],
  ['LAB_AGLIQU', 'Aglutinação pelo látex – líquor', 'quadro_x', 8], ['LAB_AGSANG', 'Aglutinação pelo látex – sangue/soro', 'quadro_x', 8],
  ['LAB_ISLIQU', 'Isolamento viral – líquor', 'quadro_xi', 8], ['LAB_ISFEZE', 'Isolamento viral – fezes', 'quadro_xi', 8],
  ['LAB_PCLIQU', 'PCR – líquor', 'quadro_xii', 8], ['LAB_PCLESA', 'PCR – lesão petequial', 'quadro_xii', 9], ['LAB_PCSANG', 'PCR – sangue/soro', 'quadro_xii', 9], ['LAB_PCESCA', 'PCR – escarro', 'quadro_xii', 9],
];
for (const [n, rot, lista, pag] of exames) {
  col[n] = c(n, `p. ${pag}, campo 49; categorias no ${ORIGEM_QUADRO[lista]}`, `Resultado laboratorial: ${rot}`, 'categorico', {
    lista, fora_do_campo: fora(`o campo 49 só comporta os códigos do ${ORIGEM_QUADRO[lista].split(',')[0]}`),
    observacao: `Categorias do ${ORIGEM_QUADRO[lista]}, pelo título do quadro. ${ZEROS} ${REGRA}` });
}

col.CLASSI_FIN = c('CLASSI_FIN', 'p. 9, campo 50', 'Classificação do caso', 'categorico', {
  categorias: [{ codigos: ['1'], rotulo: 'Confirmado' }, { codigos: ['2'], rotulo: 'Descartado' }],
  fora_do_campo: fora('o campo 50 só comporta 1 e 2 (ver pendência sobre o código 8 no Anexo I do NOTIF2018)'),
  observacao: `O código 8 aparece em 1.599 registros de 2022 a 2025. O DICMENI só lista 1 e 2; o Anexo I do NOTIF2018 (p. 22) tem uma linha de meningite que parece citar "8 - Inconclusivo", mas a leitura do texto do PDF mistura as colunas (pendência). ${REGRA}` });
const diag = [['01', 'Meningococcemia'], ['02', 'Meningite Meningocócica'], ['03', 'Meningite Meningocócica com Meningococcemia'], ['04', 'Meningite Tuberculosa'], ['05', 'Meningite por outras bactérias'], ['06', 'Meningite não especificada'], ['07', 'Meningite Asséptica'], ['08', 'Meningite por outra etiologia'], ['09', 'Meningite por Hemófilo'], ['10', 'Meningite por Pneumococo']];
col.CON_DIAGES = c('CON_DIAGES', 'p. 9-10, campo 51', 'Se confirmado, especifique', 'categorico', {
  categorias: diag.map(([k, r]) => ({ codigos: doisDigitos(k), rotulo: r })),
  fora_do_campo: fora('o campo 51 só comporta 01 a 10'),
  observacao: `O DICMENI manda gravar sempre 2 dígitos (01 a 09 com zero à esquerda); a forma sem o zero também entra. Valores como "00", "%" e "X" saem como "Inconsistência/Não Preenchido". ${REGRA}` });
const quadroII = [['09', 'Shigella sp'], ['10', 'Staphylococcus (aureus, sp, epidermidis)'], ['11', 'Salmonella sp'], ['12', 'Escherichia coli'], ['13', 'Klebsiella (sp, pneumoniae)'], ['14', 'Streptococcus (sp, pyogenes, agalactiae)'], ['15', 'Enterococcus'], ['16', 'Pseudomonas (aeruginosa, sp)'], ['18', 'Serratia (marcescens, sp)'], ['19', 'Alcaligenes (sp, faecalis)'], ['20', 'Proteus (sp, vulgaris, mirabilis)'], ['21', 'Listeria monocytogenes'], ['22', 'Enterobacter (sp, cloacae)'], ['23', 'Acinetobacter (sp, baumannii)'], ['26', 'Neisseria sp'], ['28', 'Outras Bactérias'], ['45', 'Treponema Pallidum'], ['46', 'Rickettsiae'], ['49', 'Leptospira'], ['81', 'Bactéria não especificada']];
col.CLA_ME_BAC = c('CLA_ME_BAC', 'p. 10, campo 51 (5 - meningite por outras bactérias); categorias no Quadro II, p. 16', 'Meningite por outras bactérias: bactéria', 'categorico', {
  categorias: quadroII.map(([k, r]) => ({ codigos: doisDigitos(k), rotulo: r })), fora_do_campo: fora('o Quadro II não tem este código'), observacao: `${ZEROS} ${REGRA}` });
const quadroIII = [['75', 'Não identificado'], ['37', 'Caxumba'], ['38', 'Sarampo'], ['39', 'Herpes simples'], ['40', 'Varicela/Catapora/ Herpes Zoster'], ['41', 'Rubéola'], ['55', 'Influenza'], ['70', 'Adenovirus'], ['56', 'Echovirus'], ['63', 'Coxasackie'], ['59', 'Outros Enterovirus'], ['71', 'Virus do Nilo Ocidental'], ['72', 'Dengue'], ['73', 'Outros Arbovirus'], ['74', 'Outros vírus']];
col.CLA_ME_ASS = c('CLA_ME_ASS', 'p. 10, campo 51 (7 - meningite asséptica); categorias no Quadro III, p. 17', 'Meningite asséptica: agente', 'categorico', {
  categorias: quadroIII.map(([k, r]) => ({ codigos: [k], rotulo: r })), fora_do_campo: fora('o Quadro III não tem este código'), observacao: REGRA });
const quadroIV = [['42', 'Outros fungos'], ['43', 'Cryptococcus/Torula'], ['44', 'Candida albicans, sp'], ['47', 'Tripanossoma cruzi'], ['48', 'Toxoplasma (Gondii, sp)'], ['50', 'Cisticerco'], ['52', 'Outros Parasitas'], ['76', 'Plasmodium sp'], ['77', 'Taenia Solium'], ['64', 'Aspergillus']];
col.CLA_ME_ETI = c('CLA_ME_ETI', 'p. 10, campo 51 (8 - meningite por outra etiologia); categorias no Quadro IV, p. 18', 'Meningite por outra etiologia: agente', 'categorico', {
  categorias: quadroIV.map(([k, r]) => ({ codigos: [k], rotulo: r })), fora_do_campo: fora('o Quadro IV não tem este código'), observacao: REGRA });
const quadroV = [['01', 'Cultura'], ['02', 'CIE'], ['03', 'Ag. Látex'], ['04', 'Clínico'], ['05', 'Bacterioscopia'], ['06', 'Quimiocitológico'], ['07', 'Clínico Epidemiológico'], ['08', 'Isolamento Viral'], ['09', 'PCR'], ['10', 'Outros']];
col.CRITERIO = c('CRITERIO', 'p. 10, campo 52; categorias no Quadro V, p. 18', 'Critério de confirmação', 'categorico', {
  categorias: quadroV.map(([k, r]) => ({ codigos: doisDigitos(k), rotulo: r })), fora_do_campo: fora('o Quadro V só comporta 01 a 10'),
  observacao: `Rótulos do Quadro V; a ficha (campo 52) escreve "6 - Quimiocitológico do líquor". ${ZEROS} ${REGRA}` });
const quadroVI = [['01', 'A'], ['02', 'B'], ['03', 'C'], ['04', 'D'], ['05', 'X'], ['06', 'Y'], ['07', 'Z'], ['08', 'W 135'], ['09', '29 E']];
col.CLA_SOROGR = c('CLA_SOROGR', 'p. 11, campo 53; categorias no Quadro VI, p. 19', 'Se N. meningitidis, sorogrupo', 'categorico', {
  categorias: quadroVI.map(([k, r]) => ({ codigos: doisDigitos(k), rotulo: r })), fora_do_campo: fora('o Quadro VI só comporta 01 a 09'), observacao: `${ZEROS} ${REGRA}` });
col.MED_NUCOMU = c('MED_NUCOMU', 'p. 11, campo 54', 'Número de comunicantes', 'numero');
col.MED_QUIMIO = sn('MED_QUIMIO', 'p. 11, campo 55', 'Realizada quimioprofilaxia dos comunicantes', 55);
col.MED_DT_QUI = c('MED_DT_QUI', 'p. 12, campo 56', 'Data da quimioprofilaxia', 'data');
col.DOENCA_TRA = sn('DOENCA_TRA', 'p. 12, campo 57', 'Doença relacionada ao trabalho', 57);
col.EVOLUCAO = c('EVOLUCAO', 'p. 12-13, campo 58', 'Evolução do caso', 'categorico', {
  categorias: [['1', 'Alta'], ['2', 'Óbito por meningite'], ['3', 'Óbito por outra causa'], ['9', 'Ignorado']].map(([k, r]) => ({ codigos: [k], rotulo: r })),
  fora_do_campo: fora('o campo 58 só comporta 1, 2, 3 e 9'), observacao: REGRA });
col.MED_DT_EVO = c('MED_DT_EVO', 'p. 13, campo 59', 'Data da evolução', 'data');
col.DT_ENCERRA = c('DT_ENCERRA', 'p. 13, campo 60', 'Data do encerramento', 'data');
const quimio = [['LAB_HEMA', 'hemácias (mm³)', 13], ['LAB_NEUTRO', 'neutrófilos (%)', 13], ['LAB_GLICO', 'glicose (mg)', 14], ['LAB_LEUCO', 'leucócitos (mm³)', 14], ['LAB_EOSI', 'eosinófilos (%)', 14], ['LAB_PROT', 'proteínas (mg)', 14], ['LAB_MONO', 'monócitos (%)', 14], ['LAB_LINFO', 'linfócitos (%)', 14], ['LAB_CLOR', 'cloreto (mg)', 14]];
for (const [n, nome, pag] of quimio) col[n] = c(n, `p. ${pag}, exame quimiocitológico`, `Exame quimiocitológico: ${nome}`, 'numero', { observacao: 'Unidade como na ficha (exame quimiocitológico). Número como veio no arquivo.' });
col.NU_LOTE_I = c('NU_LOTE_I', 'p. 14', 'Transferência vertical da investigação (lote)', 'texto');

const ORDEM = 'TP_NOT ID_AGRAVO CS_MENING DT_NOTIFIC SEM_NOT NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA ID_UNIDADE DT_SIN_PRI SEM_PRI ANO_NASC NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS NDUPLIC_N DT_DIGITA DT_TRANSUS DT_TRANSDM DT_TRANSSM DT_TRANSRM DT_TRANSRS DT_TRANSSE NU_LOTE_V NU_LOTE_H CS_FLXRET FLXRECEBI MIGRADO_W DT_INVEST ID_OCUPA_N ANT_AC ANT_DOSE_3 ANT_DTUL_3 ANT_BC ANT_DOSES_ ANT_DTULT_ ANT_CONJ_C ANT_DOSE_C ANT_DTUL_C ANT_BCG ANT_DOSE_4 ANT_DTUL_4 ANT_TRIPLI ANT_DOSE_5 ANT_DTUL_5 ANT_HEMO_T ANT_DOSE_T ANT_DTUL_T ANT_PNEUMO ANT_DOSE_7 ANT_DTUL_7 ANT_OUTRA ANT_OU_DE ANT_DTUL_8 ANT_AIDS ANT_IMUNO ANT_IRA ANT_TUBE ANT_TRAUMA ANT_INF_HO ANT_OUTRO ANT_OUTR_D ANT_CONT_N ANT_SECUND CLI_CEFALE CLI_FEBRE CLI_VOMITO CLI_CONVUL CLI_RIGIDE CLI_KERNIG CLI_ABAULA CLI_COMA CLI_PETEQU CLI_OUTRAS CLI_ESPECI ATE_HOSPIT ATE_INTERN ATE_UF_HOS ATE_MUNICI LAB_PUNCAO LAB_DTPUNC LAB_ASPECT LAB_CTLIQU LAB_CTLESA LAB_CTSANG LAB_CTESCA LAB_BCLIQU LAB_BCLESA LAB_BCSANG LAB_BCESCA LAB_CILIQU LAB_CISANG LAB_AGLIQU LAB_AGSANG LAB_ISLIQU LAB_ISFEZE LAB_PCLIQU LAB_PCLESA LAB_PCSANG LAB_PCESCA CLASSI_FIN CON_DIAGES CLA_ME_BAC CLA_ME_ASS CLA_ME_ETI CRITERIO CLA_SOROGR MED_NUCOMU MED_QUIMIO MED_DT_QUI DOENCA_TRA EVOLUCAO MED_DT_EVO DT_ENCERRA LAB_HEMA LAB_NEUTRO LAB_GLICO LAB_LEUCO LAB_EOSI LAB_PROT LAB_MONO LAB_LINFO LAB_CLOR NU_LOTE_I'.split(' ');
for (const n of ORDEM) if (!col[n]) throw new Error(`falta ${n}`);
if (Object.keys(col).length !== ORDEM.length) throw new Error('colunas a mais');

const dic = {
  formato: teta.formato,
  agravo: { nome: 'Meningite', codigos: col.ID_AGRAVO.categorias[0].codigos, coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos MENIBRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: false, por: '', data: '', registro: '' },
  convencoes: teta.convencoes,
  fontes,
  tabelas: teta.tabelas,
  listas,
  derivadas: teta.derivadas,
  colunas: ORDEM.map((n) => col[n]),
  pendencias: [
    { coluna: 'Códigos com e sem zero à esquerda', descricao: 'Os quadros do DICMENI escrevem os códigos com 2 dígitos (01, 06, 07...), e o campo 51 manda gravar sempre 2 dígitos. O arquivo traz as duas formas: por exemplo, na cultura do líquor, "7" em 1.904 registros e "07" em 72. As duas formas entram, como na escolaridade (regra do Rubens). Vale para os exames do campo 49, CON_DIAGES, CRITERIO, CLA_SOROGR e CLA_ME_BAC. Confirmar.' },
    { coluna: 'Código 0 nos exames (campo 49)', descricao: 'O código "0" aparece em cerca de 260 registros de cada exame (2022 a 2025) e não está em nenhum quadro. Sai como "Inconsistência/Não Preenchido" pela regra geral. Confirmar.' },
    { coluna: 'CLASSI_FIN', descricao: 'O código 8 aparece em 1.599 registros (2022 a 2025). O DICMENI (campo 50) só lista 1 Confirmado e 2 Descartado. O Anexo I do NOTIF2018 (p. 22) tem uma linha de meningite, mas a extração do texto mistura as colunas da tabela; ela parece listar "8 - Inconclusivo (**) ????????". Por enquanto o 8 sai como "Inconsistência/Não Preenchido". Conferir no PDF do NOTIF2018 (p. 22) e decidir.' },
    { coluna: 'ANT_TRAUMA', descricao: 'O DICMENI (p. 4) escreve "1. Sim 3. Não 9. Ignorado" para traumatismo. A ficha (campo 34) e o arquivo usam 2 = Não, como nas outras doenças pré-existentes. Ficou 1 Sim, 2 Não e 9 Ignorado, pela ficha. Confirmar.' },
    { coluna: 'CON_DIAGES', descricao: 'Além de 01 a 10, aparecem "00" (2.003 registros) e sinais como "%", "%%", "X", "7.", "VI" (poucos). Saem como "Inconsistência/Não Preenchido" pela regra geral. Confirmar.' },
    { coluna: 'ID_AGRAVO', descricao: 'G039 sai como "Meningite", nome da ficha, como o Rubens decidiu na sífilis adquirida. Na CID-10 o G03.9 é "Meningite não especificada". Confirmar.' },
    { coluna: 'Quadros de exames', descricao: 'Na extração do texto, a referência de cada exame ao quadro aparece desalinhada (por exemplo, o látex é citado como Quadro IX e X). As categorias seguem o título de cada quadro: VII cultura, VIII bacterioscopia, IX CIE, X látex, XI isolamento viral, XII PCR. Confirmar.' },
    { coluna: 'ATE_HOSP_1, ANT_NOMECO, ANT_TELECO, ANT_ENDECO', descricao: 'Estão no DICMENI (nome do hospital, nome, telefone e endereço do contato), mas não vêm no arquivo público. Não entram no dicionário.' },
    { coluna: 'Doses de vacina', descricao: 'Os números de doses vêm como número, com alguns valores estranhos (por exemplo, -1, 93, 99). Ficam como vieram. Confirmar.' },
  ],
};
writeFileSync(`${raiz}dicionarios/meningite.json`, JSON.stringify(dic, null, 2) + '\n');
console.log('ok', dic.colunas.length, 'colunas');
