// Gera dicionarios/hiv-adulto.json a partir das fontes oficiais de docs/fontes/hiv-adulto.
// Atenção: depois da conferência do Rubens, as correções vão direto no JSON; não rodar de novo.
import { writeFileSync } from 'node:fs';
import { raiz, hepa, copia, REGRA, fora, cats, PACOTE, listasComuns, fonteDef, notificacao, derivadas } from './hiv-comum.mjs';

const fontes = {
  DICHIVA: { documento: 'Dicionário de Dados – HIV adulto', orgao: 'Ministério da Saúde / SVSA / DAENT / CGIAE / GT-Sinan',
    data: `Revisado em fevereiro/2024 (rodapé). ${PACOTE}.`, arquivo: 'docs/fontes/hiv-adulto/HIVAN_DIC_DADOS.pdf' },
  FICHAAIDSA: { documento: 'Ficha de Notificação/Investigação – Aids (pacientes com 13 anos ou mais) – Sinan NET', orgao: 'Ministério da Saúde / SVS',
    data: 'SVS 08/06/2006 (rodapé). Colocada pelo Rubens em docs/fontes em 19/11/2026.', arquivo: 'docs/fontes/hiv-adulto/Aids_adulto_v5.pdf' },
  INSTAIDSA: { documento: 'Aids (pacientes maiores que 13 anos) – Instrumento para preenchimento – Ficha de investigação – Sinan', orgao: 'Ministério da Saúde / SVS',
    data: 'Colocado pelo Rubens em docs/fontes em 19/11/2026.', arquivo: 'docs/fontes/hiv-adulto/Aids_adulto_v5_instr.pdf' },
  SINANNET_AIDS: fonteDef,
};
for (const [id, f] of Object.entries(hepa.fontes)) if (!/HEPA$/.test(id)) fontes[id] = f;
const listas = listasComuns();

const col = notificacao('FICHAAIDSA', 'p. 1, campo 14', 'de HIV adulto de 2023 e 2024 (18.798 notificações)');
col.ID_AGRAVO = { nome: 'ID_AGRAVO', fonte: 'FICHAAIDSA', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
  categorias: [{ codigos: ['B24', 'B 24', 'B 2 4'], rotulo: 'Doença pelo vírus da imunodeficiência humana [HIV] não especificada', fonte: 'CID10_TABWIN', local: 'CID10_01.CNV, código B24' }],
  observacao: "A ficha mostra 'AIDS' com o CID 'B 24'; no arquivo vem 'B24' (regra do Rubens: o CID como na ficha e sem espaços). Rótulo da CID-10 (tabela do TabWin), como o Rubens decidiu na meningite (19/11/2026). Atenção: o HIV criança usa o mesmo CID; os dois arquivos são diferenciados pelas colunas." };
col.DT_DIAG = { nome: 'DT_DIAG', fonte: 'INSTAIDSA', local: 'p. 1, item 7', rotulo: 'Data do diagnóstico ou da evidência laboratorial e/ou clínica', tipo: 'data',
  observacao: 'Ficha, campo 7 ("Data do Diagnóstico"). Instrucional, item 7: "data do diagnóstico ou da evidência laboratorial e/ou clínica da doença de acordo com a definição de caso vigente no momento da notificação". Nome como na gestante HIV (decisão do Rubens, 20/11/2026).' };
col.SEM_DIAG = { nome: 'SEM_DIAG', fonte: 'DICHIVA', local: 'p. 2', rotulo: 'Semana epidemiológica do diagnóstico', tipo: 'texto',
  observacao: 'Vem em branco em todos os registros de 2023 e 2024; a semana calculada pela data do diagnóstico está na coluna extra logo depois (regra do Rubens, 18/11/2026).' };

const D = (nome, local, rotulo, tipo, extra = {}) => ({ nome, fonte: 'DICHIVA', local, rotulo, tipo, ...extra });
const sn = (nome, local, rotulo, campo, extra = {}) => D(nome, local, rotulo, 'categorico', { lista: 'sn9', fora_do_campo: fora(campo, '1, 2 e 9'), ...extra, observacao: [extra.observacao, REGRA].filter(Boolean).join(' ') });
const FICHA = (campo) => `Nome como na ficha (campo ${campo}).`;

col.ID_OCUPA_N = { ...copia('ID_OCUPA_N'), fonte: 'DICHIVA', local: 'p. 4, campo 31', rotulo: 'Ocupação (CBO)' };
col.ANT_TRASMI = D('ANT_TRASMI', 'p. 4, campo 32', 'Transmissão vertical', 'categorico', { categorias: cats([['1', 'Sim'], ['2', 'Não foi transmissão vertical'], ['9', 'Ignorado']]), fora_do_campo: fora(32, '1, 2 e 9'), observacao: REGRA });
col.ANTRELSE_N = D('ANTRELSE_N', 'p. 4, campo 33', 'Transmissão sexual', 'categorico', {
  categorias: cats([['1', 'Relações sexuais com homens'], ['2', 'Relações sexuais com mulheres'], ['3', 'Relações sexuais com homens e mulheres'], ['4', 'Não foi transmissão sexual'], ['9', 'Ignorado']]),
  fora_do_campo: fora(33, '1 a 4 e 9'), observacao: `Rótulos da ficha (campo 33), iguais aos do DICHIVA, que escreve "Homens" e "Mulheres" com maiúscula. ${REGRA}` });
col.ANT_DROGA = sn('ANT_DROGA', 'p. 4, campo 34', 'Transmissão sanguínea: uso de drogas injetáveis', 34);
col.ANT_HEMOLF = sn('ANT_HEMOLF', 'p. 4, campo 34', 'Transmissão sanguínea: tratamento/hemotransfusão para hemofilia', 34);
col.ANTTRANS_M = sn('ANTTRANS_M', 'p. 4, campo 34', 'Transmissão sanguínea: transfusão sanguínea', 34);
col.ANT_ACIDEN = sn('ANT_ACIDEN', 'p. 4, campo 34', 'Transmissão sanguínea: acidente com material biológico com posterior soroconversão até 6 meses', 34);
col.ANTDTTRANS = D('ANTDTTRANS', 'p. 5, campo 35', 'Data da transfusão/acidente', 'data');
col.ANTUFTRANS = D('ANTUFTRANS', 'p. 5, campo 36', 'UF da transfusão/acidente', 'texto', { observacao: 'O AidsNET.def lê a coluna como sigla da UF (UFsigla.CNV). Vem em branco em todos os registros de 2023 e 2024; se vier, fica como veio (regra do Rubens para UF em sigla, 19/11/2026).' });
col.ANTMUNTRAN = D('ANTMUNTRAN', 'p. 5, campo 37', 'Município onde foi realizada a transfusão/acidente', 'municipio');
col.ANT_INVEST = D('ANT_INVEST', 'p. 5, campo 39', 'A transfusão/acidente com material biológico foi considerada causa da infecção pelo HIV', 'categorico', { lista: 'sn_nao_se_aplica', fora_do_campo: fora(39, '1, 2 e 3'),
  observacao: `Ficha, campo 39: "Após investigação realizada conforme algoritmo do PN DST/AIDS, a transfusão/acidente com material biológico foi considerada causa da infecção pelo HIV?". ${REGRA}` });
col.LAB_TRIAGE = D('LAB_TRIAGE', 'p. 5, campo 40', 'Evidência laboratorial de infecção pelo HIV: teste de triagem', 'categorico', { lista: 'resultado_teste', fora_do_campo: fora(40, '1 a 4 e 9 (DICHIVA)'),
  observacao: `O DICHIVA lista 1 a 4 e 9 para o teste de triagem; a ficha (campo 40) lista também 5 - Indeterminado, que o dicionário só dá ao teste confirmatório. ${REGRA}` });
col.DTTRIAGEM = D('DTTRIAGEM', 'p. 5, campo 40', 'Data da coleta do teste de triagem', 'data');
col.LAB_CONFIR = D('LAB_CONFIR', 'p. 5, campo 40', 'Evidência laboratorial de infecção pelo HIV: teste confirmatório', 'categorico', {
  categorias: cats([['1', 'Positivo/reagente'], ['2', 'Negativo/não reagente'], ['3', 'Inconclusivo'], ['4', 'Não realizado'], ['5', 'Indeterminado'], ['9', 'Ignorado']]), fora_do_campo: fora(40, '1 a 5 e 9'),
  observacao: `Rótulos da ficha (campo 40); o DICHIVA escreve "Positivo / Reagente". ${REGRA}` });
col.DT_CONFIRM = D('DT_CONFIRM', 'p. 5, campo 40', 'Data da coleta do teste confirmatório', 'data');
for (const [n, i, p] of [['TPRAPIDO1', 1, 'p. 5'], ['TPRAPIDO2', 2, 'p. 6'], ['TPRAPIDO3', 3, 'p. 6']]) {
  col[n] = D(n, `${p}, campo 40`, `Evidência laboratorial de infecção pelo HIV: teste rápido ${i}`, 'categorico', { lista: 'resultado_teste', fora_do_campo: fora(40, '1 a 4 e 9 (DICHIVA)'), observacao: REGRA });
}
col.DT_RAPIDO = D('DT_RAPIDO', 'p. 6, campo 40', 'Data da coleta dos testes rápidos', 'data');
const RJ = [
  ['ANT_SARCOM', 'p. 6', 'Sarcoma de Kaposi (10)'],
  ['ANT_TUBERC', 'p. 6', 'Tuberculose disseminada/extra-pulmonar/não cavitária (10)'],
  ['ANT_CANDID', 'p. 6', 'Candidose oral ou leucoplasia pilosa (5)'],
  ['ANT_PULMON', 'p. 6', 'Tuberculose pulmonar cavitária ou não especificada (5)'],
  ['ANT_HERPES', 'p. 6', 'Herpes zoster em indivíduo menor ou igual a 60 anos (5)'],
  ['ANT_DISFUN', 'p. 7', 'Disfunção do sistema nervoso central (5)'],
  ['ANT_DIARRE', 'p. 7', 'Diarréia igual ou maior a 1 mês (2)'],
  ['ANT_FEBRE', 'p. 7', 'Febre maior ou igual a 38ºC por tempo maior ou igual a 1 mês (2)'],
  ['ANT_CAQUEX', 'p. 7', 'Caquexia ou perda de peso maior que 10% (2)'],
  ['ANT_ASTERI', 'p. 7', 'Astenia maior ou igual a 1 mês (2)'],
  ['ANT_DERMAT', 'p. 7', 'Dermatite persistente (2)'],
  ['ANT_ANEMIA', 'p. 7', 'Anemia e/ou linfopenia e/ou trombocitopenia (2)'],
  ['ANT_TOSSE', 'p. 7', 'Tosse persistente ou qualquer pneumonia (2)'],
  ['ANT_LINFO', 'p. 8', 'Linfadenopatia maior ou igual a 1cm, maior ou igual a 2 sítios extra-inguinais e por tempo maior ou igual a 1 mês (2)'],
];
for (const [n, p, r] of RJ) col[n] = sn(n, `${p}, campo 41`, `Critério Rio de Janeiro/Caracas: ${r}`, 41, { observacao: `${FICHA(41)} O número entre parênteses é a pontuação do critério.` });
const CDC = [
  ['ANT_CANCER', 'p. 8', 'Câncer cervical invasivo'],
  ['ANT_ESOF_N', 'p. 8', 'Candidose de esôfago'],
  ['ANT_PULM_N', 'p. 8', 'Candidose de traquéia, brônquios ou pulmão'],
  ['ANT_CITO', 'p. 8', 'Citomegalovirose (exceto fígado, baço ou linfonodos)'],
  ['ANT_CRIPTO', 'p. 8', 'Criptococose extrapulmonar'],
  ['ANT_CRIP_1', 'p. 8', 'Criptosporidiose intestinal crônica > 1 mês'],
  ['ANT_H_SIMP', 'p. 8', 'Herpes simples mucocutâneo > 1 mês'],
  ['ANT_HISTO', 'p. 8', 'Histoplasmose disseminada'],
  ['ANT_ISOPOR', 'p. 8', 'Isosporidiose intestinal crônica > 1 mês'],
  ['ANT_LEUCO', 'p. 9', 'Leucoencefalopatia multifocal progressiva'],
  ['ANT_LINFOM', 'p. 9', 'Linfoma não Hodgkin e outros linfomas'],
  ['ANT_LINFO_', 'p. 9', 'Linfoma primário do cérebro'],
  ['ANT_MICRO', 'p. 9', 'Micobacteriose disseminada exceto tuberculose e hanseníase'],
  ['ANT_PNEUMO', 'p. 9', 'Pneumonia por Pneumocystis carinii'],
  ['ANT_CHAGAS', 'p. 9', 'Reativação de doença de Chagas (meningoencefalite e/ou miocardite)'],
  ['ANT_SALMO', 'p. 9', 'Salmonelose (sepse recorrente não-tifóide)'],
  ['ANT_TOXO', 'p. 9', 'Toxoplasmose cerebral'],
  ['ANT_CONTAG', 'p. 9', 'Contagem de linfócitos T CD4+ menor que 350 cel/mm3'],
];
for (const [n, p, r] of CDC) col[n] = sn(n, `${p}, campo 42`, `Critério CDC adaptado: ${r}`, 42, { observacao: FICHA(42) });
col.DEF_DIAGNO = sn('DEF_DIAGNO', 'p. 9, campo 43', 'Critério óbito: declaração de óbito com menção de aids, ou HIV e causa de morte associada à imunodeficiência, sem classificação por outro critério após investigação', 43, { observacao: FICHA(43) });
col.TRA_UF = D('TRA_UF', 'p. 10, campo 44', 'UF onde se realiza o tratamento', 'texto', { observacao: 'O arquivo traz a sigla da UF (ES, RJ): fica só com a sigla, como veio (regra do Rubens para UF em sigla, 19/11/2026). Vem preenchida em poucos registros.' });
col.TRA_MUNICI = D('TRA_MUNICI', 'p. 10, campo 45', 'Município onde se realiza o tratamento', 'municipio');
col.EVOLUCAO = D('EVOLUCAO', 'p. 10, campo 47', 'Evolução do caso', 'categorico', { categorias: cats([['1', 'Vivo'], ['2', 'Óbito por Aids'], ['3', 'Óbito por outras causas'], ['9', 'Ignorado']]), fora_do_campo: fora(47, '1, 2, 3 e 9'), observacao: REGRA });
col.DT_OBITO = D('DT_OBITO', 'p. 10, campo 48', 'Data do óbito', 'data');
col.CRITERIO = D('CRITERIO', 'p. 10, campo interno', 'Critério de definição de caso', 'categorico', {
  categorias: cats([['100', 'CDC adaptado'], ['300', 'Rio de Janeiro/Caracas'], ['600', 'Critério óbito'], ['900', 'Descartado'], ['901', 'HIV+']]),
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: o DICHIVA só lista 100, 300, 600, 900 e 901' },
  observacao: `Campo interno, preenchido pelo sistema. Rótulos do DICHIVA. A conversão do TabWin (Critaids.cnv) tem outros códigos antigos (120, 123, 130, 140, 200, 400 e 500), que não estão no dicionário de 2024. Nos arquivos de 2023 e 2024 vem sempre 901 (HIV+). ${REGRA}` });
col.ANT_REL_CA = D('ANT_REL_CA', 'p. 10, campo interno', 'Categoria de exposição', 'categorico', { lista: 'categoria_exposicao',
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: fora da lista de categorias de exposição do DICHIVA' },
  observacao: `Campo interno: o sistema atribui a categoria pelos campos de transmissão. Rótulos do DICHIVA; o 69 vem do ClascatN.cnv, porque o dicionário repete nele o rótulo do 68 (pendência). ${REGRA}` });

const ORDEM = 'TP_NOT ID_AGRAVO DT_NOTIFIC NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA DT_DIAG SEM_DIAG NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS ID_OCUPA_N ANT_TRASMI ANTRELSE_N ANT_DROGA ANT_HEMOLF ANTTRANS_M ANT_ACIDEN ANTDTTRANS ANTUFTRANS ANTMUNTRAN ANT_INVEST LAB_TRIAGE DTTRIAGEM LAB_CONFIR DT_CONFIRM TPRAPIDO1 TPRAPIDO2 TPRAPIDO3 DT_RAPIDO ANT_SARCOM ANT_TUBERC ANT_CANDID ANT_PULMON ANT_HERPES ANT_DISFUN ANT_DIARRE ANT_FEBRE ANT_CAQUEX ANT_ASTERI ANT_DERMAT ANT_ANEMIA ANT_TOSSE ANT_LINFO ANT_CANCER ANT_ESOF_N ANT_PULM_N ANT_CITO ANT_CRIPTO ANT_CRIP_1 ANT_H_SIMP ANT_HISTO ANT_ISOPOR ANT_LEUCO ANT_LINFOM ANT_LINFO_ ANT_MICRO ANT_PNEUMO ANT_CHAGAS ANT_SALMO ANT_TOXO ANT_CONTAG DEF_DIAGNO TRA_UF TRA_MUNICI EVOLUCAO DT_OBITO CRITERIO ANT_REL_CA'.split(' ');
const colunas = ORDEM.map((n) => { if (!col[n]) throw new Error(n); return col[n]; });
for (const k of Object.keys(col)) if (!ORDEM.includes(k)) throw new Error('fora da ordem: ' + k);

const pendencias = [
  { coluna: 'Fontes', descricao: 'Fonte principal: o DICHIVA (dicionário de HIV adulto, revisado em fevereiro/2024), que descreve exatamente as 76 colunas do arquivo. A ficha e o instrucional são de aids adulto (2006); o AidsNET.def do TabWin confirma a ligação das colunas e os códigos. O PDF do DICHIVA desalinha as linhas da tabela; os nomes dos sinais vieram da ficha, conferidos com o dicionário e com o .def. Confirmar.' },
  { coluna: 'CS_ESCOL_N', descricao: 'Em 18.798 notificações (24%) a escolaridade vem "99", que não está na ficha. Seguiu-se a regra do Rubens das hepatites (19/11/2026): 9, 09 e 99 = Ignorado. Confirmar.' },
  { coluna: 'ID_OCUPA_N', descricao: 'Em 767 notificações (497 em 2023 e 270 em 2024) a ocupação vem com ponto, como "5161.1", "6220.2" e "9999.9". Parece o código da CBO dividido por 100 (5161.1 × 100 = 516110, Cabeleireiro; 9999.9 = 999990), mas nenhum documento explica. Saem como vieram, nas Inconsistências. Decidir se o programa deve converter (multiplicar por 100) ou manter como inconsistência.' },
  { coluna: 'LAB_TRIAGE e testes rápidos', descricao: 'A ficha (campo 40) lista 1 a 5 e 9 para todos os testes; o DICHIVA dá o 5 (Indeterminado) só ao teste confirmatório. Seguiu-se o DICHIVA; nos arquivos não aparece 5 nesses testes. Confirmar.' },
  { coluna: 'CRITERIO', descricao: 'O DICHIVA lista 100, 300, 600, 900 e 901; a conversão do TabWin tem também códigos antigos (120 a 500). Nos arquivos vem sempre 901 (HIV+). Ficaram só os do DICHIVA. Confirmar.' },
  { coluna: 'ANT_REL_CA', descricao: 'O DICHIVA repete no código 69 o rótulo do 68 ("Transfusão/Droga/Homo/Hemofílico"). O 69 ficou "Transfusão/Drogas/Bissexual/Hemofílico", como no ClascatN.cnv do TabWin (revisado em 2019). Nos arquivos não aparece 69. Confirmar.' },
  { coluna: 'ANTUFTRANS e TRA_UF', descricao: 'UF em sigla, que fica como veio (regra do Rubens). ANTUFTRANS vem em branco em todos os registros; TRA_UF vem em 1.215 registros (ES e RJ). Confirmar.' },
  { coluna: 'SEM_DIAG', descricao: 'Vem em branco em todos os registros. Foi criada a coluna extra com a semana calculada pela data do diagnóstico (regra do Rubens, 18/11/2026).' },
  { coluna: 'Campos da ficha fora do dicionário', descricao: 'A ficha de aids adulto tem a instituição da transfusão (campo 38) e a unidade de tratamento (campo 46), mas o DICHIVA de 2024 e o arquivo público não trazem essas colunas. Não entraram.' },
];

const dic = {
  formato: hepa.formato,
  agravo: { nome: 'HIV em adulto', codigos: ['B24', 'B 24', 'B 2 4'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos HIVABRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: false, por: '', data: '', registro: '' },
  convencoes: hepa.convencoes, fontes, tabelas: hepa.tabelas, listas, colunas, derivadas: derivadas(), pendencias,
};
const usadas = new Set([...colunas.flatMap((x) => [x.fonte, ...(x.categorias || []).map((k) => k.fonte)]), ...Object.values(listas).flat().map((k) => k.fonte), ...Object.values(hepa.tabelas).map((t) => t.fonte)].filter(Boolean));
for (const f of usadas) if (!fontes[f]) throw new Error('fonte ' + f);
for (const k of Object.keys(fontes)) if (!usadas.has(k) && !['SINANNET_AIDS'].includes(k)) delete fontes[k];
writeFileSync(`${raiz}dicionarios/hiv-adulto.json`, JSON.stringify(dic, null, 2) + '\n');
console.log(`hiv-adulto.json: ${colunas.length} colunas, ${dic.derivadas.length} extras, ${pendencias.length} pendências; fontes: ${Object.keys(fontes).join(' ')}`);
