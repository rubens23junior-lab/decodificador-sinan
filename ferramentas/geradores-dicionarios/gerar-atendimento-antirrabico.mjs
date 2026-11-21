// Gera dicionarios/atendimento-antirrabico.json.
// Não há dicionário de dados no pacote Docs_TAB_SINAN: fontes = ficha do Portal do Sinan (anti_rabico_v5.pdf)
// e o arquivo de definições do TabWin (AntirabNET.def), que liga as colunas aos campos e dá os códigos.
// Campos da notificação copiados da leptospirose (dicionário conferido).
// Atenção: depois da conferência do Rubens, as correções vão direto no JSON; não rodar de novo.
import { readFileSync, writeFileSync } from 'node:fs';
const raiz = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // pasta principal do projeto
const lept = JSON.parse(readFileSync(`${raiz}dicionarios/leptospirose.json`, 'utf8'));
const copia = (n) => structuredClone(lept.colunas.find((x) => x.nome === n));
const REGRA = 'Códigos que o campo não comporta saem como "Inconsistência/Não Preenchido" (regra geral do Rubens, 16/11/2026).';
const fora = (campo, comporta) => ({ rotulo: 'Inconsistência/Não Preenchido', motivo: `Código sem fonte oficial: o campo ${campo} da ficha só comporta ${comporta}` });
const cats = (pares) => pares.map(([k, r]) => ({ codigos: Array.isArray(k) ? k : [k], rotulo: r }));
const VAZIA = 'Vem em branco em todos os registros públicos de 2020 a 2024 (o DATASUS não divulga este campo); fica para arquivos exportados do próprio Sinan.';

const fontes = {
  FICHAANTR: { documento: 'Ficha de Investigação – Atendimento Anti-Rábico Humano – Sinan NET', orgao: 'Ministério da Saúde / SVS',
    data: 'SVS 27/09/2005 (rodapé). Baixada pelo Rubens do Portal do Sinan (portalsinan.saude.gov.br, documentos de agravos, "anti_rabico_v5.pdf") e colocada em docs/fontes em 21/11/2026. Não há dicionário de dados deste agravo no pacote Docs_TAB_SINAN.',
    arquivo: 'docs/fontes/atendimento-antirrabico/anti_rabico_v5.pdf' },
  TABANTR: { documento: 'Arquivo de definições do TabWin para atendimento anti-rábico humano (AntirabNET.def) e conversões (SIM_NAO, CANFELQUNET, SADSUSDENET, UNICMULTNET, FIM_ANIMAL, INSTBUTNET, LAB_SORO, HETEHOMO, PREXPOSINET, AT90AP90, MOTIVO)', orgao: 'Ministério da Saúde / GT-Sinan e UT-Sinan',
    data: 'Atualizado em 15/10/2007 e 24/09/2010 (cabeçalho do .def); UNICMULTNET revisado em 2019. Pacote TAB_SINANNET do DATASUS.', arquivo: 'docs/fontes/tabelas-apoio/TAB_SINANNET/AntirabNET.def' },
};
for (const [id, f] of Object.entries(lept.fontes)) if (!/LEPT$/.test(id)) fontes[id] = f;

const listas = {
  sn9: cats([['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']]),
  sn: cats([['1', 'Sim'], ['2', 'Não']]),
  localizacao: cats([['1', 'Sim'], ['2', 'Não'], ['3', 'Desconhecida']]),
  laboratorio: cats([['1', 'Instituto Butantan'], ['2', 'Instituto Vital Brasil'], ['3', 'Aventis Pasteur'], ['4', 'Outro']]),
};

const col = {};
for (const n of ['TP_NOT', 'DT_NOTIFIC', 'SEM_NOT', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_REGIONA', 'ID_UNIDADE', 'DT_SIN_PRI', 'SEM_PRI', 'ANO_NASC', 'NU_IDADE_N', 'CS_SEXO', 'CS_GESTANT', 'CS_RACA', 'CS_ESCOL_N', 'SG_UF', 'ID_MN_RESI', 'ID_RG_RESI', 'ID_PAIS', 'DT_DIGITA']) col[n] = copia(n);
for (const cat of col.CS_ESCOL_N.categorias) if (cat.fonte === 'FICHALEPT') Object.assign(cat, { fonte: 'FICHAANTR', local: 'p. 1, campo 14' });
col.CS_ESCOL_N.observacao = (col.CS_ESCOL_N.observacao || '').replace(/ficha de leptospirose/g, 'ficha de atendimento anti-rábico');
col.TP_NOT.observacao = 'Vem em branco em todos os registros públicos de 2020 a 2024.';
col.DT_SIN_PRI = { ...col.DT_SIN_PRI, fonte: 'FICHAANTR', local: 'p. 1, campo 7', rotulo: 'Data do atendimento', observacao: 'Na ficha de atendimento anti-rábico humano, o campo 7 é a "Data do Atendimento" (no lugar da data dos primeiros sintomas); o TabWin chama a semana dessa data de "Sem.Atendimento".' };
col.SEM_PRI = { ...col.SEM_PRI, fonte: 'TABANTR', local: 'AntirabNET.def, "Sem.Atendimento"', rotulo: 'Semana epidemiológica do atendimento', observacao: 'Formato AAAASS (ano e semana) da data do atendimento. Fica como veio.' };

col.ID_AGRAVO = { nome: 'ID_AGRAVO', fonte: 'FICHAANTR', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
  categorias: [{ codigos: ['W64', 'W 64', 'W 6 4'], rotulo: 'Exposição a outras forças mecânicas animadas e às não especificadas', fonte: 'CID10_TABWIN', local: 'CID10_20.CNV, código W64' }],
  observacao: "A ficha mostra 'ATENDIMENTO ANTI-RÁBICO HUMANO' com o CID 'W 64'; no arquivo vem 'W64' (regra do Rubens: o CID como na ficha e sem espaços). Rótulo da CID-10 (tabela do TabWin), como o Rubens decidiu na meningite (19/11/2026)." };

const D = (nome, local, rotulo, tipo, extra = {}) => ({ nome, fonte: 'FICHAANTR', local, rotulo, tipo, ...extra });
const L = (nome, local, rotulo, lista, campo, comporta, obs) => D(nome, local, rotulo, 'categorico', { lista, fora_do_campo: fora(campo, comporta), observacao: [obs, REGRA].filter(Boolean).join(' ') });
const C = (nome, local, rotulo, pares, campo, comporta, obs) => D(nome, local, rotulo, 'categorico', { categorias: cats(pares), fora_do_campo: fora(campo, comporta), observacao: [obs, REGRA].filter(Boolean).join(' ') });
const DEF = (txt) => `O AntirabNET.def chama a coluna de "${txt}".`;

col.ID_OCUPA_N = { ...copia('ID_OCUPA_N'), fonte: 'FICHAANTR', local: 'p. 1, campo 31' };
for (const [n, r, t] of [['ANT_CONTAT', 'contato indireto', 'Tipo exp Contatindireto'], ['ANT_ARRANH', 'arranhadura', 'Tipo exp Arranhadura'], ['ANT_LAMBED', 'lambedura', 'Tipo exp Lambedura'], ['ANT_MORDED', 'mordedura', 'Tipo exp Mordedura'], ['ANT_OUTRO_', 'outro', 'Tipo exp Outro']])
  col[n] = L(n, 'p. 1, campo 32', `Tipo de exposição ao vírus rábico: ${r}`, 'sn9', 32, '1, 2 e 9', DEF(t));
for (const [n, r, t] of [['ANT_MUCOSA', 'mucosa', 'Local Mucosa'], ['ANT_CABECA', 'cabeça/pescoço', 'Local Cabeça/pescoço'], ['ANT_MAOS', 'mãos/pés', 'Local Mãos/pés'], ['ANT_TRONCO', 'tronco', 'Local Tronco'], ['ANT_MEMBRO', 'membros superiores', 'Local Membros superiores'], ['ANT_MEMB_1', 'membros inferiores', 'Local Membros inferiores']])
  col[n] = L(n, 'p. 1, campo 33', `Localização: ${r}`, 'localizacao', 33, '1, 2 e 3', `${DEF(t)} Categorias da ficha (1 Sim, 2 Não, 3 Desconhecida); o .def usa o SIM_NAO.CNV. O código 9 aparece em cerca de 90 registros e sai como inconsistência.`);
col.FERIMENTO = C('FERIMENTO', 'p. 1, campo 34', 'Ferimento', [['1', 'Único'], ['2', 'Múltiplo'], ['3', 'Sem ferimento'], ['9', 'Ignorado']], 34, '1, 2, 3 e 9');
for (const [n, r, t] of [['ANT_PROFUN', 'profundo', 'ferimento profundo'], ['ANT_SUPERF', 'superficial', 'ferimento Superficial'], ['ANT_DILACE', 'dilacerante', 'ferimento Dilacerante']])
  col[n] = L(n, 'p. 1, campo 35', `Tipo de ferimento: ${r}`, 'sn9', 35, '1, 2 e 9', DEF(t));
col.ANT_DT_EXP = D('ANT_DT_EXP', 'p. 1, campo 36', 'Data da exposição', 'data');
col.PRE_EXPOS = L('PRE_EXPOS', 'p. 1, campo 37', 'Antecedentes de tratamento anti-rábico: pré-exposição', 'sn9', 37, '1, 2 e 9', DEF('Antec trat Pré-exp'));
col.POS_EXPOS = L('POS_EXPOS', 'p. 1, campo 37', 'Antecedentes de tratamento anti-rábico: pós-exposição', 'sn9', 37, '1, 2 e 9', DEF('Antec trat Pós-exp'));
col.TRA_ANTIGO = C('TRA_ANTIGO', 'p. 1, campo 38', 'Se houve tratamento anterior, quando foi concluído', [['1', 'Até 90 dias'], ['2', 'Após 90 dias']], 38, '1 e 2', DEF('Antec trat quando?'));
col.DOSES = D('DOSES', 'p. 1, campo 39', 'Nº de doses aplicadas (tratamento anterior)', 'numero', { observacao: 'Número; fica como veio.' });
col.ANIMAL = C('ANIMAL', 'p. 1, campo 40', 'Espécie do animal agressor', [['1', 'Canina'], ['2', 'Felina'], ['3', 'Quiróptera (Morcego)'], ['4', 'Primata (Macaco)'], ['5', 'Raposa'], ['6', 'Herbívoro doméstico'], ['7', 'Outra']], 40, '1 a 7');
col.HERBIV_DES = D('HERBIV_DES', 'p. 1, campo 40', 'Espécie do animal agressor: herbívoro doméstico (especificar)', 'texto', { observacao: 'Texto livre; fica como veio (às vezes vem um número, sem documento que o explique).' });
col.OUTRO_DES = D('OUTRO_DES', 'p. 1, campo 40', 'Espécie do animal agressor: outra (especificar)', 'texto', { observacao: 'Texto livre; fica como veio.' });
col.CONDIC_ANI = C('CONDIC_ANI', 'p. 1, campo 41', 'Condição do animal para fins de conduta do tratamento', [['1', 'Sadio'], ['2', 'Suspeito'], ['3', 'Raivoso'], ['4', 'Morto/Desaparecido']], 41, '1 a 4');
col.OBSERVACAO = L('OBSERVACAO', 'p. 1, campo 42', 'Animal passível de observação (somente para cão ou gato)', 'sn', 42, '1 e 2', DEF('Passível observação'));
col.TRAT_ATUAL = C('TRAT_ATUAL', 'p. 1, campo 43', 'Tratamento indicado', [['1', 'Pré Exposição'], ['2', 'Dispensa de Tratamento'], ['3', 'Observação do animal (se cão ou gato)'], ['4', 'Observação + Vacina'], ['5', 'Vacina'], ['6', 'Soro + Vacina'], ['7', 'Esquema de Reexposição']], 43, '1 a 7');
col.LAB_VACINA = L('LAB_VACINA', 'p. 1, campo 44', 'Laboratório produtor da vacina', 'laboratorio', 44, '1 a 4', VAZIA);
col.LAB_VAC_DE = D('LAB_VAC_DE', 'p. 1, campo 44', 'Laboratório produtor da vacina: outro (especificar)', 'texto', { observacao: VAZIA });
col.LOTE_VAC = D('LOTE_VAC', 'p. 1, campo 45', 'Número do lote da vacina', 'texto', { observacao: VAZIA });
col.DT_VENCIM = D('DT_VENCIM', 'p. 1, campo 46', 'Data do vencimento da vacina', 'data');
for (const i of [1, 2, 3, 4, 5]) {
  col[`DT_DOSE_${i}`] = D(`DT_DOSE_${i}`, 'p. 2, campo 47', `Data da aplicação da vacina: ${i}ª dose (dia/mês)`, 'texto', {
    observacao: `A ficha pede só o dia e o mês ("dd/mm"); fica como veio.${i === 5 ? ' Nos arquivos públicos de 2020 a 2024 a 5ª dose é sempre igual à 4ª, registro a registro: parece cópia na geração do arquivo (pendência).' : ''}` });
  col[`DT_VAC_${i}`] = D(`DT_VAC_${i}`, 'não aparece na fonte', `DT_VAC_${i} (sem descrição nas fontes)`, 'texto', {
    observacao: `Nem a ficha nem o AntirabNET.def descrevem esta coluna; pelo nome, parece a data da ${i}ª dose em outro formato. ${VAZIA}` });
}
col.FIM_ANIMAL = C('FIM_ANIMAL', 'p. 2, campo 48', 'Condição final do animal (após período de observação)', [['1', 'Negativo para Raiva (Clínica)'], ['2', 'Negativo para Raiva (Laboratório)'], ['3', 'Positivo para Raiva (Clínica)'], ['4', 'Positivo para Raiva (Laboratório)'], ['5', 'Morto/Sacrificado/Sem Diagnóstico'], ['9', 'Ignorado']], 48, '1 a 5 e 9');
col.TRA_INTERR = L('TRA_INTERR', 'p. 2, campo 49', 'Houve interrupção do tratamento', 'sn', 49, '1 e 2');
col.TRA_MOTIVO = C('TRA_MOTIVO', 'p. 2, campo 50', 'Motivo da interrupção', [['1', 'Indicação da Unidade de Saúde'], ['2', 'Abandono'], ['3', 'Transferência']], 50, '1, 2 e 3');
col.BUSCA_ATIV = L('BUSCA_ATIV', 'p. 2, campo 51', 'Se houve abandono do tratamento, a unidade de saúde procurou o paciente', 'sn', 51, '1 e 2', DEF('US procurou paciente?'));
col.REACAO_VAC = L('REACAO_VAC', 'p. 2, campo 52', 'Evento adverso à vacina', 'sn9', 52, '1, 2 e 9');
col.TRA_INDI_N = L('TRA_INDI_N', 'p. 2, campo 53', 'Indicação do soro anti-rábico', 'sn9', 53, '1, 2 e 9');
col.TRA_PESO = D('TRA_PESO', 'p. 2, campo 54', 'Peso do paciente (kg)', 'numero', { observacao: VAZIA });
col.TRA_QTD_SO = D('TRA_QTD_SO', 'p. 2, campo 55', 'Quantidade de soro aplicada (ml)', 'numero', { observacao: VAZIA });
col.TIP_SORO = C('TIP_SORO', 'p. 2, campo 55', 'Tipo de soro', [['1', 'Heterólogo'], ['2', 'Homólogo']], 55, '1 e 2');
col.TRA_INFILT = L('TRA_INFILT', 'p. 2, campo 56', 'Infiltração de soro no(s) local(is) do(s) ferimento(s): total', 'sn', 56, '1 e 2', `${DEF('Infil soro Total')} A ficha escreve "Infriltração".`);
col.TRA_INFI_1 = L('TRA_INFI_1', 'p. 2, campo 56', 'Infiltração de soro no(s) local(is) do(s) ferimento(s): parcial', 'sn', 56, '1 e 2', DEF('Infil soro Parcial'));
col.LAB_SORO = L('LAB_SORO', 'p. 2, campo 57', 'Laboratório produtor do soro anti-rábico', 'laboratorio', 57, '1 a 4', VAZIA);
col.LAB_SOR_DE = D('LAB_SOR_DE', 'p. 2, campo 57', 'Laboratório produtor do soro: outro (especificar)', 'texto', { observacao: VAZIA });
col.TRA_NUM_PA = D('TRA_NUM_PA', 'p. 2, campo 58', 'Número da partida do soro', 'texto', { observacao: VAZIA });
col.REACAO_SOR = L('REACAO_SOR', 'p. 2, campo 59', 'Evento adverso ao soro anti-rábico', 'sn9', 59, '1, 2 e 9');
col.DT_ENCERRA = D('DT_ENCERRA', 'p. 2, campo 60', 'Data do encerramento do caso', 'data');

const ORDEM = 'TP_NOT ID_AGRAVO DT_NOTIFIC SEM_NOT NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA ID_UNIDADE DT_SIN_PRI SEM_PRI ANO_NASC NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS ID_OCUPA_N ANT_CONTAT ANT_ARRANH ANT_LAMBED ANT_MORDED ANT_OUTRO_ ANT_MUCOSA ANT_CABECA ANT_MAOS ANT_TRONCO ANT_MEMBRO ANT_MEMB_1 FERIMENTO ANT_PROFUN ANT_SUPERF ANT_DILACE ANT_DT_EXP PRE_EXPOS POS_EXPOS TRA_ANTIGO DOSES ANIMAL HERBIV_DES OUTRO_DES CONDIC_ANI OBSERVACAO TRAT_ATUAL LAB_VACINA LAB_VAC_DE LOTE_VAC DT_VENCIM DT_DOSE_1 DT_DOSE_2 DT_DOSE_3 DT_DOSE_4 DT_DOSE_5 DT_VAC_1 DT_VAC_2 DT_VAC_3 DT_VAC_4 DT_VAC_5 FIM_ANIMAL TRA_INTERR TRA_MOTIVO BUSCA_ATIV REACAO_VAC TRA_INDI_N TRA_PESO TRA_QTD_SO TIP_SORO TRA_INFILT TRA_INFI_1 LAB_SORO LAB_SOR_DE TRA_NUM_PA REACAO_SOR DT_ENCERRA DT_DIGITA'.split(' ');
const colunas = ORDEM.map((n) => { if (!col[n]) throw new Error(n); return col[n]; });
for (const k of Object.keys(col)) if (!ORDEM.includes(k)) throw new Error('fora da ordem: ' + k);

const pendencias = [
  { coluna: 'Fontes', descricao: 'Não há dicionário de dados do atendimento anti-rábico no pacote Docs_TAB_SINAN. Fontes: a ficha do Portal do Sinan (SVS 27/09/2005) e o AntirabNET.def do TabWin, que liga cada coluna ao campo e dá os códigos. Os campos da notificação vieram da leptospirose, já conferida. Confirmar.' },
  { coluna: 'Localização (ANT_MUCOSA a ANT_MEMB_1)', descricao: 'A ficha (campo 33) usa 1 Sim, 2 Não e 3 Desconhecida; o .def lê com o SIM_NAO.CNV. Seguiu-se a ficha. O código 9 aparece em cerca de 90 registros por coluna e sai como inconsistência. Confirmar.' },
  { coluna: 'DT_DOSE_5', descricao: 'Nos arquivos públicos de 2020 a 2024 a 5ª dose é sempre igual à 4ª, registro a registro (3.444 registros conferidos em 2024, nenhuma diferença). Parece cópia na geração do arquivo. Fica como veio. Confirmar.' },
  { coluna: 'DT_VAC_1 a DT_VAC_5', descricao: 'Colunas sem descrição na ficha e no .def; pelo nome, parecem as datas das doses em outro formato. Vêm sempre vazias. Ficaram como texto mantido como veio. Confirmar.' },
  { coluna: 'Campos sempre vazios', descricao: 'TP_NOT, laboratório e lote da vacina, laboratório e partida do soro, peso e quantidade de soro vêm em branco em todos os registros públicos de 2020 a 2024 (o DATASUS não divulga). Ficam no dicionário para arquivos exportados do próprio Sinan. Confirmar.' },
  { coluna: 'DT_SIN_PRI e SEM_PRI', descricao: 'Nesta ficha o campo 7 é a data do atendimento (não a dos primeiros sintomas); os nomes foram ajustados. Confirmar.' },
  { coluna: 'Arquivos', descricao: 'Vieram 2020 a 2024 (575.884, 637.187, 688.125, 755.150 e 779.311 notificações; 3,4 milhões no total).' },
];

const dic = {
  formato: lept.formato,
  agravo: { nome: 'Atendimento antirrábico humano', codigos: ['W64', 'W 64', 'W 6 4'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos ANTRBRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: false, por: '', data: '', registro: '' },
  convencoes: lept.convencoes, fontes, tabelas: lept.tabelas, listas, colunas, derivadas: structuredClone(lept.derivadas), pendencias,
};
const usadas = new Set([...colunas.flatMap((x) => [x.fonte, ...(x.categorias || []).map((k) => k.fonte)]), ...Object.values(listas).flat().map((k) => k.fonte), ...Object.values(lept.tabelas).map((t) => t.fonte)].filter(Boolean));
for (const f of usadas) if (!fontes[f]) throw new Error('fonte ' + f);
for (const k of Object.keys(fontes)) if (!usadas.has(k)) delete fontes[k];
writeFileSync(`${raiz}dicionarios/atendimento-antirrabico.json`, JSON.stringify(dic, null, 2) + '\n');
console.log(`atendimento-antirrabico.json: ${colunas.length} colunas, ${dic.derivadas.length} extras, ${pendencias.length} pendências; fontes: ${Object.keys(fontes).join(' ')}`);
