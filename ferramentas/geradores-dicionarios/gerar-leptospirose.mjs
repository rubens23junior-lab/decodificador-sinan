// Gera dicionarios/leptospirose.json a partir das fontes oficiais de docs/fontes/leptospirose.
// Campos da notificação e internos copiados da meningite; autoctonia copiada da leishmaniose visceral (dicionários conferidos).
// Atenção: depois da conferência do Rubens, as correções vão direto no JSON; não rodar de novo.
import { readFileSync, writeFileSync } from 'node:fs';
const raiz = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // pasta principal do projeto
const ler = (a) => JSON.parse(readFileSync(`${raiz}dicionarios/${a}.json`, 'utf8'));
const meni = ler('meningite');
const lv = ler('leishmaniose-visceral');
const copia = (d, n) => structuredClone(d.colunas.find((x) => x.nome === n));
const REGRA = 'Códigos que o campo não comporta saem como "Inconsistência/Não Preenchido" (regra geral do Rubens, 16/11/2026).';
const fora = (campo, comporta) => ({ rotulo: 'Inconsistência/Não Preenchido', motivo: `Código sem fonte oficial: o campo ${campo} só comporta ${comporta}` });
const cats = (pares) => pares.map(([k, r]) => ({ codigos: Array.isArray(k) ? k : [k], rotulo: r }));
const PACOTE = 'Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026); copiado para o projeto em 20/11/2026';
const FORA_ARQ = 'Não vem nos arquivos públicos do DATASUS (LEPTBR22 a 24); incluída para arquivos exportados do próprio Sinan (regra do Rubens para colunas do dicionário oficial fora do arquivo, 19/11/2026).';

const fontes = {
  DICLEPT: { documento: 'Dicionário de Dados – Sinan NET – versão 5.0 – Leptospirose (campos 31 a 74 e informações complementares)', orgao: 'Ministério da Saúde / SVS / DEVEP / CIEVS / GT-Sinan',
    data: `Sem data impressa (18 páginas). ${PACOTE}.`, arquivo: 'docs/fontes/leptospirose/LEPTON_DIC_DADOS.pdf' },
  FICHALEPT: { documento: 'Ficha de Investigação – Leptospirose – Sinan NET', orgao: 'Ministério da Saúde / SVS', data: `SVS 02/02/2007 (rodapé). ${PACOTE}.`, arquivo: 'docs/fontes/leptospirose/LEPTON_FICHA.pdf' },
  INSTLEPT: { documento: 'Leptospirose – Instruções para preenchimento – Ficha de investigação – Sinan NET', orgao: 'Ministério da Saúde / SVS', data: `${PACOTE}.`, arquivo: 'docs/fontes/leptospirose/LEPTON_INSTRUCIONAL.pdf' },
};
for (const [id, f] of Object.entries(meni.fontes)) if (!/MENI$/.test(id)) fontes[id] = f;

const listas = {
  sn9: cats([['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']]),
  elisa: cats([['1', 'Reagente'], ['2', 'Não Reagente'], ['3', 'Inconclusivo'], ['4', 'Não realizado']]),
  micro: cats([['1', 'Reagente'], ['2', 'Não Reagente'], ['3', 'Não Realizada'], ['9', 'Ignorado']]),
  resultado: cats([['1', 'Positivo'], ['2', 'Negativo'], ['3', 'Inconclusivo'], ['4', 'Não realizado']]),
};

const col = {};
for (const n of ['TP_NOT', 'DT_NOTIFIC', 'SEM_NOT', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_REGIONA', 'ID_UNIDADE', 'DT_SIN_PRI', 'SEM_PRI', 'ANO_NASC', 'NU_IDADE_N', 'CS_SEXO', 'CS_GESTANT', 'CS_RACA', 'CS_ESCOL_N', 'SG_UF', 'ID_MN_RESI', 'ID_RG_RESI', 'ID_PAIS', 'NDUPLIC_N', 'DT_DIGITA', 'DT_TRANSUS', 'DT_TRANSDM', 'DT_TRANSSM', 'DT_TRANSRM', 'DT_TRANSRS', 'DT_TRANSSE', 'NU_LOTE_V', 'NU_LOTE_H', 'CS_FLXRET', 'FLXRECEBI', 'MIGRADO_W']) col[n] = copia(meni, n);
for (const cat of col.CS_ESCOL_N.categorias) if (cat.fonte === 'FICHAMENI') Object.assign(cat, { fonte: 'FICHALEPT', local: 'p. 1, campo 14' });
col.CS_ESCOL_N.observacao = (col.CS_ESCOL_N.observacao || '').replace(/ficha de meningite/g, 'ficha de leptospirose');
col.ANO_NASC.observacao = 'O NOTIF2018 descreve a data de nascimento (DT_NASC); o arquivo público traz só o ano, na coluna ANO_NASC. Fica como veio.';
col.SEM_PRI.observacao = 'Formato AAAASS (ano e semana). Algumas semanas de anos muito antigos (por exemplo 194936) vêm da data dos primeiros sintomas digitada com o ano errado; ficam como vieram.';
col.NU_LOTE_I = { ...copia(meni, 'NU_LOTE_I'), fonte: 'NOTIF2018', local: 'p. 15, campos internos', observacao: 'Nenhum documento de leptospirose descreve esta coluna; nome como na meningite (DICMENI, p. 14). Fica como veio.' };

col.ID_AGRAVO = { nome: 'ID_AGRAVO', fonte: 'FICHALEPT', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
  categorias: [{ codigos: ['A279', 'A27.9', 'A 27.9', 'A 2 7. 9'], rotulo: 'Leptospirose não especificada', fonte: 'CID10_TABWIN', local: 'CID10_01.CNV, código A279' }],
  observacao: "A ficha mostra 'LEPTOSPIROSE' com o CID 'A 2 7. 9'; no arquivo vem 'A279' (regra do Rubens: o CID como na ficha e sem ponto e espaços). Rótulo da CID-10 (tabela do TabWin), como o Rubens decidiu na meningite (19/11/2026)." };

const D = (nome, local, rotulo, tipo, extra = {}) => ({ nome, fonte: 'DICLEPT', local, rotulo, tipo, ...extra });
const L = (nome, local, rotulo, lista, campo, comporta, obs) => D(nome, local, rotulo, 'categorico', { lista, fora_do_campo: fora(campo, comporta), observacao: [obs, REGRA].filter(Boolean).join(' ') });

col.DT_INVEST = D('DT_INVEST', 'p. 1, campo 31', 'Data da investigação', 'data');
col.ID_OCUPA_N = { ...copia(meni, 'ID_OCUPA_N'), fonte: 'DICLEPT', local: 'p. 1, campo 32' };
const RISCO = [['ANT_CB_LAM', 'água ou lama de enchente', 'p. 2'], ['ANT_CB_CRI', 'criação de animais', 'p. 2'], ['ANT_CB_CAI', 'caixa d´água', 'p. 2'], ['ANT_CB_FOS', 'fossa, caixa de gordura ou esgoto', 'p. 2'],
  ['ANT_CB_SIN', 'local com sinais de roedores', 'p. 2'], ['ANT_CB_PLA', 'plantio/colheita (lavoura)', 'p. 3'], ['ANT_CB_COR', 'rio, córrego, lagoa ou represa', 'p. 3'], ['ANT_CB_ROE', 'roedores diretamente', 'p. 3'],
  ['ANT_CB_GRA', 'armazenamento de grãos/alimentos', 'p. 3'], ['ANT_CB_TER', 'terreno baldio', 'p. 3'], ['ANT_CB_LIX', 'lixo/entulho', 'p. 3'], ['ANT_CB_OUT', 'outras', 'p. 3']];
for (const [n, r, p] of RISCO) col[n] = L(n, `${p}, campo 33`, `Situação de risco nos 30 dias antes dos primeiros sintomas: ${r}`, 'sn9', 33, '1, 2 e 9', 'Ficha, campo 33: "Situação de Risco Ocorrida nos 30 dias que Antecederam os Primeiros Sintomas - Contato/limpeza de".');
col.ANT_OU_DES = D('ANT_OU_DES', 'p. 3-4, campo 33', 'Situação de risco: outras (especificar)', 'texto', { observacao: 'Texto livre; fica como veio.' });
col.ANT_HUMANO = L('ANT_HUMANO', 'p. 4, campo 34', 'Casos anteriores de leptospirose no local provável de infecção nos últimos 2 meses: casos humanos', 'sn9', 34, '1, 2 e 9');
col.ANT_ANIMAI = L('ANT_ANIMAI', 'p. 4, campo 34', 'Casos anteriores de leptospirose no local provável de infecção nos últimos 2 meses: casos animais', 'sn9', 34, '1, 2 e 9');
col.CLI_DT_ATE = D('CLI_DT_ATE', 'p. 4, campo 35', 'Data de atendimento', 'data');
const SINAIS = [['CLI_FEBRE', 'febre', 'p. 4'], ['CLI_MIALGI', 'mialgia', 'p. 4'], ['CLI_CEFALE', 'cefaléia', 'p. 4'], ['CLI_PROST', 'prostração', 'p. 4'], ['CLI_CONGES', 'congestão conjuntival', 'p. 4'],
  ['CLI_PANTUR', 'dor na panturrilha', 'p. 4'], ['CLI_VOMITO', 'vômito', 'p. 4'], ['CLI_DIARRE', 'diarréia', 'p. 4'], ['CLI_ICTERI', 'icterícia', 'p. 4'], ['CLI_RENAL', 'insuficiência renal', 'p. 4-5'],
  ['CLI_RESPIR', 'alterações respiratórias', 'p. 5'], ['CLI_CARDIA', 'alterações cardíacas', 'p. 5'], ['CLI_HEMOPU', 'hemorragia pulmonar', 'p. 5'], ['CLI_HEMORR', 'outras hemorragias', 'p. 5'],
  ['CLI_MENING', 'meningismo', 'p. 5'], ['CLI_OUTROS', 'outros', 'p. 5']];
for (const [n, r, p] of SINAIS) col[n] = L(n, `${p}, campo 36`, `Sinais e sintomas: ${r}`, 'sn9', 36, '1, 2 e 9');
col.CLI_OTRDES = D('CLI_OTRDES', 'p. 5, campo 36', 'Sinais e sintomas: outros (especificar)', 'texto', { observacao: 'Texto livre; fica como veio.' });
col.ATE_HOSP = L('ATE_HOSP', 'p. 5, campo 37', 'Ocorreu hospitalização', 'sn9', 37, '1, 2 e 9');
col.ATE_DT_INT = D('ATE_DT_INT', 'p. 5, campo 38', 'Data da internação', 'data');
col.ATE_DT_ALT = D('ATE_DT_ALT', 'p. 5, campo 39', 'Data da alta', 'data');
col.ATE_UF = D('ATE_UF', 'p. 5, campo 40', 'UF do hospital', 'texto', { observacao: 'O DICLEPT fala em sigla da UF, e o arquivo traz a sigla: fica só com a sigla, como veio (regra do Rubens para UF em sigla, 19/11/2026).' });
col.ATE_MUNICI = D('ATE_MUNICI', 'p. 6, campo 41', 'Município do hospital', 'municipio');
const hospital = D('ATE_HOSPIT', 'p. 6, campo 42', 'Hospital (CNES)', 'tabela', { tabela: 'cnes', observacao: `O DICLEPT descreve o código da unidade (co_unidade_hospital); sai o nome do estabelecimento pelo CNES. ${FORA_ARQ}` });
col.LAB_DT_1 = D('LAB_DT_1', 'p. 6, campo 43', 'Sorologia IgM – Elisa: data da coleta da 1ª amostra', 'data');
col.LAB_ELIS_1 = L('LAB_ELIS_1', 'p. 6, campo 44', 'Sorologia IgM – Elisa: resultado da 1ª amostra', 'elisa', 44, '1 a 4');
col.LAB_DT_2 = D('LAB_DT_2', 'p. 6, campo 45', 'Sorologia IgM – Elisa: data da coleta da 2ª amostra', 'data');
col.LAB_ELIS_2 = L('LAB_ELIS_2', 'p. 6, campo 46', 'Sorologia IgM – Elisa: resultado da 2ª amostra', 'elisa', 46, '1 a 4');
const SOROVAR = 'Texto como veio: o arquivo traz o código e o nome do sorovar (por exemplo "10 - COPENHAGENI") e, às vezes, só o número; nenhum documento lista os códigos dos sorovares.';
const TITULO = 'O título é o denominador da diluição (por exemplo 100 = 1:100). Fica como veio.';
for (const [a, dt, pDt, campos, pS, pR] of [[1, 'DTMICRO1', 'p. 6', [47, 48, 49, 50], ['p. 6', 'p. 7'], 'p. 7'], [2, 'DTMICRO2', 'p. 7', [51, 52, 53, 54], ['p. 7', 'p. 7'], 'p. 7']]) {
  col[dt] = D(dt, `${pDt}, campo ${campos[0]}`, `Microaglutinação: data da coleta da ${a}ª amostra`, 'data');
  col[`MICRO${a}_S1`] = D(`MICRO${a}_S1`, `${pS[0]}, campo ${campos[1]}`, `Microaglutinação ${a}ª amostra: 1º sorovar`, 'texto', { observacao: SOROVAR });
  col[`MICRO${a}_T_1`] = D(`MICRO${a}_T_1`, `${pS[0]}, campo ${campos[1]}`, `Microaglutinação ${a}ª amostra: título do 1º sorovar`, 'texto', { observacao: TITULO });
  col[`MICRO${a}_S_2`] = D(`MICRO${a}_S_2`, `${pS[1]}, campo ${campos[2]}`, `Microaglutinação ${a}ª amostra: 2º sorovar`, 'texto', { observacao: SOROVAR });
  col[`MICRO${a}_T_2`] = D(`MICRO${a}_T_2`, `${pS[1]}, campo ${campos[2]}`, `Microaglutinação ${a}ª amostra: título do 2º sorovar`, 'texto', { observacao: TITULO });
  col[`LAB_MICR_${a}`] = L(`LAB_MICR_${a}`, `${pR}, campo ${campos[3]}`, `Resultado da microaglutinação: ${a}ª amostra`, 'micro', campos[3], '1, 2, 3 e 9',
    'Rótulos do DICLEPT e da ficha. O código 4 aparece em cerca de 285 (1ª amostra) e 598 (2ª amostra) registros e sai como inconsistência (pendência).');
}
col.DTISOLA = D('DTISOLA', 'p. 7, campo 55', 'Isolamento: data da coleta', 'data');
col.RES_ISOL = L('RES_ISOL', 'p. 7, campo 56', 'Isolamento: resultado', 'resultado', 56, '1 a 4');
col.DTIMUNO = D('DTIMUNO', 'p. 8, campo 57', 'Imunohistoquímica: data da coleta', 'data');
col.RES_IMUNO = L('RES_IMUNO', 'p. 8, campo 58', 'Imunohistoquímica: resultado', 'resultado', 58, '1 a 4');
col.DT_PCR = D('DT_PCR', 'p. 8, campo 59', 'RT-PCR: data da coleta', 'data');
col.RES_PCR = L('RES_PCR', 'p. 8, campo 60', 'RT-PCR: resultado', 'resultado', 60, '1 a 4');
col.CLASSI_FIN = D('CLASSI_FIN', 'p. 8, campo 61', 'Classificação final', 'categorico', { categorias: cats([['1', 'Confirmado'], ['2', 'Descartado']]), fora_do_campo: fora(61, '1 e 2'),
  observacao: `O DICLEPT e a ficha só listam 1 (Confirmado) e 2 (Descartado). O código 8 aparece em 2.688 registros (4%) e sai como "Inconsistência/Não Preenchido", pela regra geral do Rubens (como no tétano e na hanseníase). ${REGRA}` });
col.CRITERIO = D('CRITERIO', 'p. 8, campo 62', 'Critério de confirmação ou descarte', 'categorico', { categorias: cats([['1', 'Clínico-Laboratorial'], ['2', 'Clínico-Epidemiológico']]), fora_do_campo: fora(62, '1 e 2'),
  observacao: `Rótulos da ficha (o DICLEPT escreve "Clínico Laboratorial" e "Clínico Epidemiológico", sem hífen). ${REGRA}` });
col.TPAUTOCTO = { ...copia(lv, 'TPAUTOCTO'), fonte: 'DICLEPT', local: 'p. 8, campo 63', fora_do_campo: fora(63, '1, 2 e 3'), observacao: `Rótulos do DICLEPT, iguais aos da leishmaniose visceral. ${REGRA}` };
col.COUFINF = D('COUFINF', 'p. 9, campo 64', 'UF provável de infecção', 'texto', { observacao: 'O arquivo traz a sigla da UF: fica só com a sigla, como veio (regra do Rubens para UF em sigla, 19/11/2026).' });
col.COPAISINF = { ...copia(lv, 'COPAISINF'), fonte: 'DICLEPT', local: 'p. 10, campo 65', observacao: 'Sem tabela compatível: o código fica como veio (pendência). A tabela_codigos_paises.xlsx usa outra numeração (Brasil = 10). Nos arquivos vem "0" em cerca de 51 mil registros (80%), sobretudo nos que não têm a autoctonia preenchida.' };
col.COMUNINF = { ...copia(lv, 'COMUNINF'), fonte: 'DICLEPT', local: 'p. 11, campo 66' };
const extrasInf = [
  D('CODISINF', 'p. 11, campo 67', 'Distrito provável de infecção (código)', 'codigo', { observacao: FORA_ARQ }),
  D('CO_BAINFC', 'p. 12, campo 68', 'Bairro provável de infecção (código)', 'codigo', { observacao: FORA_ARQ }),
  D('NOBAIINF', 'p. 12, campo 68', 'Bairro provável de infecção (nome)', 'texto', { observacao: FORA_ARQ }),
  D('CON_AREA', 'p. 13, campo 69', 'Área provável de infecção', 'categorico', { categorias: cats([['1', 'Urbana'], ['2', 'Rural'], ['3', 'Peri-Urbana'], ['9', 'Ignorado']]), fora_do_campo: fora(69, '1, 2, 3 e 9'), observacao: `${FORA_ARQ} ${REGRA}` }),
];
col.CON_AMBIEN = D('CON_AMBIEN', 'p. 13, campo 70', 'Ambiente da infecção', 'categorico', { categorias: cats([['1', 'Domiciliar'], ['2', 'Trabalho'], ['3', 'Lazer'], ['4', 'Outro'], ['9', 'Ignorado']]), fora_do_campo: fora(70, '1 a 4 e 9'), observacao: REGRA });
col.DOENCA_TRA = L('DOENCA_TRA', 'p. 14, campo 71', 'Doença relacionada ao trabalho', 'sn9', 71, '1, 2 e 9');
col.EVOLUCAO = D('EVOLUCAO', 'p. 14, campo 72', 'Evolução do caso', 'categorico', { categorias: cats([['1', 'Cura'], ['2', 'Óbito por leptospirose'], ['3', 'Óbito por outras causas'], ['9', 'Ignorado']]), fora_do_campo: fora(72, '1, 2, 3 e 9'), observacao: REGRA });
col.DT_OBITO = D('DT_OBITO', 'p. 14, campo 73', 'Data do óbito', 'data');
col.DT_ENCERRA = D('DT_ENCERRA', 'p. 15, campo 74', 'Data do encerramento', 'data');
const COMPL = 'Informações complementares da ficha: data e endereço, se esteve em situação de risco nos 30 dias que antecederam os primeiros sintomas.';
for (const i of [1, 2, 3, 4]) {
  col[`DT_RISCO${i}`] = D(`DT_RISCO${i}`, 'p. 15, informações complementares', `Situação de risco ${i}: data`, 'data', { observacao: COMPL });
  col[`CO_MUN_R${i}`] = D(`CO_MUN_R${i}`, 'p. 16, informações complementares', `Situação de risco ${i}: município`, 'municipio', { observacao: COMPL });
  col[`CO_UF_R${i}`] = D(`CO_UF_R${i}`, `p. ${i === 4 ? 17 : 16}, informações complementares`, `Situação de risco ${i}: UF`, 'texto', { observacao: `${COMPL} O arquivo traz a sigla da UF: fica só com a sigla, como veio (regra do Rubens).` });
}
const extrasFim = [1, 2, 3, 4].flatMap((i) => [
  D(`NO_END_R${i}`, 'p. 17, informações complementares', `Situação de risco ${i}: endereço`, 'texto', { observacao: `${COMPL} ${FORA_ARQ}` }),
  D(`NO_LOC_R${i}`, `p. ${i === 1 ? 17 : 18}, informações complementares`, `Situação de risco ${i}: localidade`, 'texto', { observacao: `${COMPL} ${FORA_ARQ}` }),
]).concat([D('DS_OBS', 'p. 18', 'Observações', 'texto', { observacao: FORA_ARQ })]);

const ORDEM = 'TP_NOT ID_AGRAVO DT_NOTIFIC SEM_NOT NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA ID_UNIDADE DT_SIN_PRI SEM_PRI ANO_NASC NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS NDUPLIC_N DT_DIGITA DT_TRANSUS DT_TRANSDM DT_TRANSSM DT_TRANSRM DT_TRANSRS DT_TRANSSE NU_LOTE_V NU_LOTE_H CS_FLXRET FLXRECEBI MIGRADO_W DT_INVEST ID_OCUPA_N ANT_CB_LAM ANT_CB_CRI ANT_CB_CAI ANT_CB_FOS ANT_CB_SIN ANT_CB_PLA ANT_CB_COR ANT_CB_ROE ANT_CB_GRA ANT_CB_TER ANT_CB_LIX ANT_CB_OUT ANT_OU_DES ANT_HUMANO ANT_ANIMAI CLI_DT_ATE CLI_FEBRE CLI_MIALGI CLI_CEFALE CLI_PROST CLI_CONGES CLI_PANTUR CLI_VOMITO CLI_DIARRE CLI_ICTERI CLI_RENAL CLI_RESPIR CLI_CARDIA CLI_HEMOPU CLI_HEMORR CLI_MENING CLI_OUTROS CLI_OTRDES ATE_HOSP ATE_DT_INT ATE_DT_ALT ATE_UF ATE_MUNICI LAB_DT_1 LAB_ELIS_1 LAB_DT_2 LAB_ELIS_2 DTMICRO1 MICRO1_S1 MICRO1_T_1 MICRO1_S_2 MICRO1_T_2 LAB_MICR_1 DTMICRO2 MICRO2_S1 MICRO2_T_1 MICRO2_S_2 MICRO2_T_2 LAB_MICR_2 DTISOLA RES_ISOL DTIMUNO RES_IMUNO DT_PCR RES_PCR CLASSI_FIN CRITERIO TPAUTOCTO COUFINF COPAISINF COMUNINF CON_AMBIEN DOENCA_TRA EVOLUCAO DT_OBITO DT_ENCERRA DT_RISCO1 DT_RISCO2 DT_RISCO3 DT_RISCO4 CO_MUN_R1 CO_MUN_R2 CO_MUN_R3 CO_MUN_R4 CO_UF_R1 CO_UF_R2 CO_UF_R3 CO_UF_R4 NU_LOTE_I'.split(' ');
const colunas = [];
for (const n of ORDEM) {
  if (!col[n]) throw new Error(n);
  if (n === 'CON_AMBIEN') colunas.push(...extrasInf);
  colunas.push(col[n]);
  if (n === 'ATE_MUNICI') colunas.push(hospital);
  if (n === 'CO_UF_R4') colunas.push(...extrasFim);
}
for (const k of Object.keys(col)) if (!ORDEM.includes(k)) throw new Error('fora da ordem: ' + k);

const pendencias = [
  { coluna: 'Fontes', descricao: 'Fonte principal: o DICLEPT (dicionário de leptospirose do pacote Docs_TAB_SINAN, sem data), que descreve todas as colunas próprias do arquivo. A ficha é de 2007. Os campos da notificação e internos foram copiados da meningite e a autoctonia da leishmaniose visceral, já conferidas. Confirmar.' },
  { coluna: 'CLASSI_FIN', descricao: 'O código 8 aparece em 2.688 registros (4%); o DICLEPT e a ficha só listam 1 (Confirmado) e 2 (Descartado). Sai como "Inconsistência/Não Preenchido", pela regra geral (no tétano e na hanseníase foi assim). Confirmar.' },
  { coluna: 'LAB_MICR_1 e LAB_MICR_2', descricao: 'O resultado da microaglutinação só comporta 1, 2, 3 e 9, mas o código 4 aparece em cerca de 285 e 598 registros. Sai como inconsistência. Confirmar.' },
  { coluna: 'Sorovares e títulos (MICRO*)', descricao: 'Ficam como texto, como vieram: o arquivo traz o código e o nome do sorovar juntos (por exemplo "10 - COPENHAGENI") e, às vezes, só o número; o título vem como número (100 = 1:100) e às vezes com zeros ("0000"). Nenhum documento lista os códigos dos sorovares. Confirmar.' },
  { coluna: 'UFs em sigla', descricao: 'ATE_UF (hospital), COUFINF (infecção) e CO_UF_R1 a R4 (situações de risco) vêm em sigla e ficam como vieram (regra do Rubens). SG_UF_NOT e SG_UF vêm em código e saem com o nome da UF. Confirmar.' },
  { coluna: 'COPAISINF', descricao: 'Vem "0" em cerca de 51 mil registros (80%), quase sempre quando a autoctonia está em branco. Fica como código mantido como veio, como na leishmaniose visceral. Confirmar.' },
  { coluna: 'NU_LOTE_I', descricao: 'Não aparece no DICLEPT; nome como na meningite. Fica como veio. Confirmar.' },
  { coluna: 'Campos do DICLEPT fora do arquivo', descricao: 'Entraram, pela regra do Rubens: hospital (42), distrito e bairro prováveis de infecção (67 e 68), área provável de infecção (69), endereço e localidade das situações de risco e observações.' },
  { coluna: 'Arquivos', descricao: 'Vieram só 2022, 2023 e 2024 (15.192, 20.888 e 27.509 notificações); o arquivo de 2025 não foi baixado.' },
];

const dic = {
  formato: meni.formato,
  agravo: { nome: 'Leptospirose', codigos: ['A279', 'A27.9', 'A 27.9', 'A 2 7. 9'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos LEPTBRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: false, por: '', data: '', registro: '' },
  convencoes: meni.convencoes, fontes, tabelas: meni.tabelas, listas, colunas, derivadas: structuredClone(meni.derivadas), pendencias,
};
const usadas = new Set([...colunas.flatMap((x) => [x.fonte, ...(x.categorias || []).map((k) => k.fonte)]), ...Object.values(listas).flat().map((k) => k.fonte), ...Object.values(meni.tabelas).map((t) => t.fonte)].filter(Boolean));
for (const f of usadas) if (!fontes[f]) throw new Error('fonte ' + f);
for (const k of Object.keys(fontes)) if (!usadas.has(k) && !['FICHALEPT', 'INSTLEPT'].includes(k)) delete fontes[k];
writeFileSync(`${raiz}dicionarios/leptospirose.json`, JSON.stringify(dic, null, 2) + '\n');
console.log(`leptospirose.json: ${colunas.length} colunas, ${dic.derivadas.length} extras, ${pendencias.length} pendências; fontes: ${Object.keys(fontes).join(' ')}`);
