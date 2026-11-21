// Gera dicionarios/hiv-crianca.json a partir das fontes oficiais de docs/fontes/hiv-crianca.
// Atenção: depois da conferência do Rubens, as correções vão direto no JSON; não rodar de novo.
import { writeFileSync } from 'node:fs';
import { raiz, hepa, copia, REGRA, fora, cats, PACOTE, listasComuns, fonteDef, notificacao, derivadas } from './hiv-comum.mjs';

const fontes = {
  DICHIVC: { documento: 'Dicionário de Dados – HIV criança', orgao: 'Ministério da Saúde / SVSA / DAENT / CGIAE / GT-Sinan',
    data: `Revisado em fevereiro/2024 (rodapé). ${PACOTE}.`, arquivo: 'docs/fontes/hiv-crianca/HIVCN_DIC_DADOS.pdf' },
  FICHAAIDSC: { documento: 'Ficha de Notificação/Investigação – Aids (pacientes menores que 13 anos) – Sinan NET', orgao: 'Ministério da Saúde / SVS',
    data: 'SVS 14/06/2006 (rodapé). Colocada pelo Rubens em docs/fontes em 19/11/2026.', arquivo: 'docs/fontes/hiv-crianca/Aids_crianca_v5.pdf' },
  INSTAIDSC: { documento: 'Aids (pacientes menores que 13 anos) – Instrumento para preenchimento – Ficha de investigação – Sinan NET', orgao: 'Ministério da Saúde / SVS',
    data: 'Colocado pelo Rubens em docs/fontes em 19/11/2026.', arquivo: 'docs/fontes/hiv-crianca/Aids_crianca_v5_instr.pdf' },
  SINANNET_AIDS: fonteDef,
};
for (const [id, f] of Object.entries(hepa.fontes)) if (!/HEPA$/.test(id)) fontes[id] = f;
const listas = listasComuns();
listas.resultado_acido_nucleico = cats([['6', 'Detectável'], ['7', 'Indetectável'], ['4', 'Não realizado'], ['9', 'Ignorado']]);

const col = notificacao('FICHAAIDSC', 'p. 1, campo 14', 'de HIV criança de 2022 a 2024 (20 notificações)');
col.ID_AGRAVO = { nome: 'ID_AGRAVO', fonte: 'FICHAAIDSC', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
  categorias: [{ codigos: ['B24', 'B 24', 'B 2 4'], rotulo: 'Doença pelo vírus da imunodeficiência humana [HIV] não especificada', fonte: 'CID10_TABWIN', local: 'CID10_01.CNV, código B24' }],
  observacao: "A ficha mostra 'AIDS (pacientes menores que 13 anos)' com o CID 'B 24'; no arquivo vem 'B24' (regra do Rubens: o CID como na ficha e sem espaços). Rótulo da CID-10 (tabela do TabWin), como o Rubens decidiu na meningite (19/11/2026). Atenção: o HIV adulto usa o mesmo CID; os dois arquivos são diferenciados pelas colunas." };
col.DT_DIAG = { nome: 'DT_DIAG', fonte: 'INSTAIDSC', local: 'p. 1, item 7', rotulo: 'Data do diagnóstico ou da evidência laboratorial e/ou clínica', tipo: 'data',
  observacao: 'Ficha, campo 7. Instrucional, item 7: "data do diagnóstico ou da evidência laboratorial e/ou clínica da doença de acordo com a definição de caso vigente no momento da notificação". Nome como na gestante HIV (decisão do Rubens, 20/11/2026).' };
col.SEM_DIAG = { nome: 'SEM_DIAG', fonte: 'DICHIVC', local: 'p. 2', rotulo: 'Semana epidemiológica do diagnóstico', tipo: 'texto',
  observacao: 'Vem em branco em todos os registros de 2022 a 2024; a semana calculada pela data do diagnóstico está na coluna extra logo depois (regra do Rubens, 18/11/2026).' };

const D = (nome, local, rotulo, tipo, extra = {}) => ({ nome, fonte: 'DICHIVC', local, rotulo, tipo, ...extra });
const sn = (nome, local, rotulo, campo, extra = {}) => D(nome, local, rotulo, 'categorico', { lista: 'sn9', fora_do_campo: fora(campo, '1, 2 e 9'), ...extra, observacao: [extra.observacao, REGRA].filter(Boolean).join(' ') });

col.IDADE_MAE = D('IDADE_MAE', 'p. 3, campo 31', 'Idade da mãe (anos)', 'numero', { observacao: 'Idade em anos completos. Valores só com asteriscos ("***", 84 registros) valem como campo em branco (regra do Rubens, 16/11/2026).' });
col.ESC_MAE_N = D('ESC_MAE_N', 'p. 4, campo 32', 'Escolaridade da mãe', 'categorico', {
  categorias: structuredClone(col.CS_ESCOL_N.categorias).filter((k) => !k.codigos.includes('10')).map((k) => ({ codigos: k.codigos, rotulo: k.rotulo })),
  fora_do_campo: fora(32, '0 a 9'),
  observacao: `Rótulos iguais aos da escolaridade (campo 14), que o Rubens já conferiu; a ficha (campo 32) e o DICHIVC listam 0 a 9 para a mãe (o DICHIVC escreve "Ignorada"), sem o 10 (Não se aplica). ${REGRA}` });
col.RACA_MAE = D('RACA_MAE', 'p. 4, campo 33', 'Raça/cor da mãe', 'categorico', { categorias: structuredClone(col.CS_RACA.categorias), fora_do_campo: fora(33, '1 a 5 e 9'), observacao: REGRA });
col.ID_OCUP_MA = { ...copia('ID_OCUPA_N'), nome: 'ID_OCUP_MA', fonte: 'DICHIVC', local: 'p. 4, campo 34', rotulo: 'Ocupação da mãe (CBO)' };
col.TIPO_INVES = D('TIPO_INVES', 'p. 4, campo 35', 'Tipo de investigação', 'categorico', { categorias: cats([['2', 'Aids em menores de 13 anos']]), fora_do_campo: fora(35, '2'),
  observacao: `O DICHIVC e a ficha só listam o código 2. ${REGRA}` });
col.ANT_PERINA = D('ANT_PERINA', 'p. 4, campo 36', 'Transmissão vertical', 'categorico', { categorias: cats([['1', 'Sim'], ['2', 'Não foi transmissão vertical'], ['9', 'Ignorado']]), fora_do_campo: fora(36, '1, 2 e 9'), observacao: REGRA });
col.ANT_REL_N = D('ANT_REL_N', 'p. 4, campo 37', 'Transmissão sexual', 'categorico', {
  categorias: cats([['1', 'Relações sexuais com homens'], ['2', 'Relações sexuais com mulheres'], ['3', 'Relações sexuais com homens e mulheres'], ['4', 'Não foi transmissão sexual'], ['9', 'Ignorado']]),
  fora_do_campo: fora(37, '1 a 4 e 9'), observacao: `Rótulos da ficha (campo 37); no PDF do DICHIVC a linha do código 2 se perde na diagramação. ${REGRA}` });
col.ANT_DROGA = sn('ANT_DROGA', 'p. 5, campo 38', 'Transmissão sanguínea: uso de drogas injetáveis', 38);
col.ANT_T_HEMO = sn('ANT_T_HEMO', 'p. 5, campo 38', 'Transmissão sanguínea: tratamento/hemotransfusão para hemofilia', 38);
col.ANT_TRANS_ = sn('ANT_TRANS_', 'p. 5, campo 38', 'Transmissão sanguínea: transfusão sanguínea', 38);
col.ANT_ACIDEN = sn('ANT_ACIDEN', 'p. 5, campo 38', 'Transmissão sanguínea: acidente com material biológico com posterior soroconversão até 6 meses', 38);
col.ANTDTTRANS = D('ANTDTTRANS', 'p. 5, campo 39', 'Data da transfusão/acidente', 'data');
col.ANTUFTRANS = D('ANTUFTRANS', 'p. 5, campo 40', 'UF da transfusão/acidente', 'texto', { observacao: 'Vem em branco em todos os registros de 2022 a 2024; se vier, fica como veio.' });
col.ANTMUNTRAN = D('ANTMUNTRAN', 'p. 5, campo 41', 'Município onde ocorreu a transfusão/acidente', 'municipio');
col.ANT_INVEST = D('ANT_INVEST', 'p. 5, campo 43', 'A transfusão/acidente com material biológico foi considerada causa da infecção pelo HIV', 'categorico', { lista: 'sn_nao_se_aplica', fora_do_campo: fora(43, '1, 2 e 3'), observacao: REGRA });
col.LAB_TRIAGE = D('LAB_TRIAGE', 'p. 5, campo 44', 'Evidência laboratorial: teste de triagem anti-HIV (após os 18 meses de vida)', 'categorico', { lista: 'resultado_teste', fora_do_campo: fora(44, '1 a 4 e 9 (DICHIVC)'), observacao: REGRA });
col.DT_TRIA_11 = D('DT_TRIA_11', 'p. 6, campo 44', 'Data da coleta do teste de triagem', 'data');
col.CONFIRMA = D('CONFIRMA', 'p. 6, campo 44', 'Evidência laboratorial: teste confirmatório anti-HIV (após os 18 meses de vida)', 'categorico', { lista: 'resultado_teste', fora_do_campo: fora(44, '1 a 4 e 9 (DICHIVC)'), observacao: REGRA });
col.DTCONFIRMA = D('DTCONFIRMA', 'p. 6, campo 44', 'Data da coleta do teste confirmatório', 'data');
for (const i of [1, 2, 3]) col[`TPRAPIDO${i}`] = D(`TPRAPIDO${i}`, 'p. 6, campo 44', `Evidência laboratorial: teste rápido ${i}`, 'categorico', { lista: 'resultado_teste', fora_do_campo: fora(44, '1 a 4 e 9 (DICHIVC)'), observacao: REGRA });
col.DTRAPIDO1 = D('DTRAPIDO1', 'p. 6, campo 44', 'Data de realização dos testes rápidos', 'data');
for (const [i, p, pd] of [[1, 'p. 6', 'p. 6'], [2, 'p. 6', 'p. 7'], [3, 'p. 7', 'p. 7']]) {
  col[`LAB_PCR_${i}`] = D(`LAB_PCR_${i}`, `${p}, campo 44`, `Evidência laboratorial: ${i}º teste de detecção de ácido nucléico (antes dos 18 meses de vida)`, 'categorico', { lista: 'resultado_acido_nucleico', fora_do_campo: fora(44, '4, 6, 7 e 9 (DICHIVC)'), observacao: REGRA });
  col[`DT_PCR_${i}`] = D(`DT_PCR_${i}`, `${pd}, campo 44`, `Data da coleta do ${i}º teste de detecção de ácido nucléico`, 'data');
}
const CDC = [
  ['CLI_PAROTI', 'p. 7', 'Aumento crônico de parótida'],
  ['CLI_DERMA', 'p. 7', 'Dermatite persistente'],
  ['CLI_ESPLEN', 'p. 7', 'Esplenomegalia'],
  ['CLI_HEPATO', 'p. 7', 'Hepatomegalia'],
  ['CLI_OTITE', 'p. 7', 'Infecções persistentes ou recorrentes de VAS (Otite ou Sinusite)'],
  ['CLI_LINFA', 'p. 7', 'Linfadenopatia >= 0.5 cm em mais de 2 sítios'],
  ['CLI_ANEMIA', 'p. 7', 'Anemia por mais de 30 dias'],
  ['CLICDCCA_N', 'p. 7', 'Candidose de esôfago'],
  ['CLI_PULMAO', 'p. 8', 'Candidose de traquéia, brônquios ou pulmões'],
  ['CLI_CANDIA', 'p. 8', 'Candidose oral resistente ao tratamento'],
  ['CLI_CDC_CI', 'p. 8', 'Citomegalovirose (qualquer outro local que não fígado, baço ou linfonodo > 1 mês de idade)'],
  ['CLI_CDCCRE', 'p. 8', 'Criptococose extrapulmonar'],
  ['CLI_CDC_CR', 'p. 8', 'Criptosporidiose com diarréia > 1 mês'],
  ['CLI_CRONIC', 'p. 8', 'Diarréia recorrente ou crônica'],
  ['CLI_CDC_EN', 'p. 8', 'Encefalopatia pelo HIV'],
  ['CLI_FEBRE', 'p. 8', 'Febre persistente > 1 mês'],
  ['CLI_CDC_GE', 'p. 8', 'Gengivo-estomatite herpética recorrente (mais de 2 episódios em 1 ano)'],
  ['CLI_HEPATI', 'p. 8', 'Hepatite por HIV'],
  ['CLI_HERPEG', 'p. 9', 'Herpes simples em brônquios, pulmões ou trato gastrintestinal', 'Ligação pelo AidsCriNET.def ("Herpes Simp bronquios"); no PDF do DICHIVC a ordem das três colunas de herpes não bate com a dos campos (pendência).'],
  ['CLI_CDC_HE', 'p. 9', 'Herpes simples mucocutâneo > 1 mês em crianças > 1 mês idade', 'Ligação pelo AidsCriNET.def ("Herpes Simpl muco"); ver a pendência das colunas de herpes.'],
  ['CLI_HERPES', 'p. 9', 'Herpes zoster (ao menos 2 episódios distintos ou em mais de um dermátomo)', 'Ligação pelo AidsCriNET.def ("Herpes Zoster"); ver a pendência das colunas de herpes.'],
  ['CLI_CDC_HI', 'p. 9', 'Histoplasmose disseminada'],
  ['CLI_CDC_IN', 'p. 9', 'Infecções bacterianas de repetição/múltiplas (sepse, pneumonia, meningite, ósteoartrites, abcessos em órgãos internos)'],
  ['CLI_INFCIT', 'p. 9', 'Infecção por citomegalovírus < 1 mês de idade'],
  ['CLI_CDC_IS', 'p. 9', 'Isosporidiose intestinal crônica, por um período superior a 1 mês'],
  ['CLI_LEIOMI', 'p. 9', 'Leiomiossarcoma'],
  ['CLI_CDC_LE', 'p. 9', 'Leucoencefalopatia multifocal progressiva'],
  ['CLI_LINFO', 'p. 9', 'Linfopenia por mais de 30 dias'],
  ['CLI_CDCLIH', 'p. 9', 'Linfoma não Hodgkin e outros linfomas'],
  ['CLI_CDC_LI', 'p. 10', 'Linfoma primário de cérebro'],
  ['CLI_MIOCAR', 'p. 10', 'Miocardiopatia'],
  ['CLI_CDC_MI', 'p. 10', 'Micobacteriose disseminada (exceto tuberculose e hanseníase)'],
  ['CLI_CDC_ME', 'p. 10', 'Meningite bacteriana, pneumonia ou sepse (único episódio)', 'Nome do DICHIVC; a ficha escreve "penoumonia".'],
  ['CLI_NEFRO', 'p. 10', 'Nefropatia'],
  ['CLI_NOCAR', 'p. 10', 'Nocardiose', 'Nome da ficha; o DICHIVC escreve "Norcardiose".'],
  ['CLI_CDC_PN', 'p. 10', 'Pneumonia linfóide intersticial'],
  ['CLI_CDC_PC', 'p. 10', 'Pneumonia por Pneumocystis carinii'],
  ['CLI_CDC_SA', 'p. 10', 'Salmonelose (sepse recorrente não-tifóide)'],
  ['CLI_CDC_SK', 'p. 10', 'Sarcoma de Kaposi'],
  ['CLI_CDC_SI', 'p. 10', 'Síndrome da emaciação (Aids Wasting Syndrome)'],
  ['CLI_CDC_TO', 'p. 11', 'Toxoplasmose cerebral em crianças com mais de 1 mês de idade'],
  ['CLI_TOX1M', 'p. 11', 'Toxoplasmose iniciada antes de 1 mês de idade'],
  ['CLI_TUPULM', 'p. 11', 'Trombocitopenia por mais de 30 dias', 'Apesar do nome da coluna, é a trombocitopenia: o DICHIVC e o AidsCriNET.def concordam.'],
  ['CLI_TUBERC', 'p. 11', 'Tuberculose pulmonar'],
  ['CLI_DISSEM', 'p. 11', 'Tuberculose disseminada ou extrapulmonar'],
  ['CLI_VARICE', 'p. 11', 'Varicela disseminada'],
  ['CRI_1500', 'p. 11', 'Achados laboratoriais: contagem de linfócitos T CD4+ < 1.500 células por mm3 (<25%)'],
  ['CRI_1000', 'p. 11', 'Achados laboratoriais: contagem de linfócitos T CD4+ < 1.000 células por mm3 (<25%)'],
  ['CRI_500', 'p. 11', 'Achados laboratoriais: contagem de linfócitos T CD4+ < 500 células por mm3 (<25%)'],
];
for (const [n, p, r, obs] of CDC) col[n] = sn(n, `${p}, campo 45`, `Critério CDC adaptado: ${r}`, 45, { observacao: ['Nome como na ficha (campo 45).', obs].filter(Boolean).join(' ') });
col.EVO_DIAG = sn('EVO_DIAG', 'p. 12, campo 46', 'Critério óbito: declaração de óbito com menção de aids, ou HIV e causa de morte associada à imunodeficiência, sem classificação por outro critério após investigação', 46, { observacao: 'Nome como na ficha (campo 46); o AidsCriNET.def também lê EVO_DIAG como critério óbito.' });
col.TRA_UF = D('TRA_UF', 'p. 12, campo 47', 'UF onde se realiza o tratamento', 'uf', { observacao: 'No arquivo vem o código numérico da UF (IBGE); o nome da UF vem da tabela do IBGE.' });
col.TRA_MUNICI = D('TRA_MUNICI', 'p. 12, campo 48', 'Município onde se realiza o tratamento', 'municipio');
col.EVOLUCAO = D('EVOLUCAO', 'p. 12, campo 50', 'Evolução do caso', 'categorico', {
  categorias: [...cats([['1', 'Vivo'], ['2', 'Óbito por Aids'], ['3', 'Óbito por outras causas']]), { codigos: ['4'], rotulo: 'Transferência para outro município', fonte: 'FICHAAIDSC', local: 'p. 2, campo 50' }, ...cats([['9', 'Ignorado']])],
  fora_do_campo: fora(50, '1 a 4 e 9'),
  observacao: `O DICHIVC lista 1, 2, 3 e 9; o código 4 (Transferência para outro município) vem da ficha (campo 50) e também está no EvoAIDScri.cnv do TabWin (revisado em 2019). Aparece em 1 registro (pendência). ${REGRA}` });
col.EVO_DT_OBI = D('EVO_DT_OBI', 'p. 12, campo 51', 'Data do óbito', 'data');
col.CRITERIO = D('CRITERIO', 'p. 12, campo interno', 'Critério de definição de caso', 'categorico', {
  categorias: cats([['100', 'CDC adaptado'], ['600', 'Critério óbito'], ['900', 'Descartado'], ['901', 'HIV+']]),
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: o DICHIVC só lista 100, 600, 900 e 901' },
  observacao: `Campo interno, preenchido pelo sistema. Rótulos do DICHIVC. A conversão do TabWin (CritaidsC.cnv) tem outros códigos antigos. Nos arquivos de 2022 a 2024 vem sempre 901 (HIV+). ${REGRA}` });
col.ANT_CAT_EX = D('ANT_CAT_EX', 'p. 12, campo interno', 'Categoria de exposição', 'categorico', { lista: 'categoria_exposicao',
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: fora da lista de categorias de exposição do DICHIVC' },
  observacao: `Campo interno: o sistema atribui a categoria pelos campos de transmissão. Mesma lista do HIV adulto; o 69 vem do ClascatN.cnv, porque o dicionário repete nele o rótulo do 68. ${REGRA}` });

const CLIS = CDC.map((x) => x[0]).join(' ');
const ORDEM = `TP_NOT ID_AGRAVO DT_NOTIFIC NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA DT_DIAG SEM_DIAG NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS IDADE_MAE ESC_MAE_N RACA_MAE ID_OCUP_MA TIPO_INVES ANT_PERINA ANT_REL_N ANT_DROGA ANT_T_HEMO ANT_TRANS_ ANT_ACIDEN ANTDTTRANS ANTUFTRANS ANTMUNTRAN ANT_INVEST LAB_TRIAGE DT_TRIA_11 CONFIRMA DTCONFIRMA TPRAPIDO1 TPRAPIDO2 TPRAPIDO3 DTRAPIDO1 LAB_PCR_1 DT_PCR_1 LAB_PCR_2 DT_PCR_2 LAB_PCR_3 DT_PCR_3 ${CLIS} EVO_DIAG TRA_UF TRA_MUNICI EVOLUCAO EVO_DT_OBI CRITERIO ANT_CAT_EX`.split(' ');
const colunas = ORDEM.map((n) => { if (!col[n]) throw new Error(n); return col[n]; });
for (const k of Object.keys(col)) if (!ORDEM.includes(k)) throw new Error('fora da ordem: ' + k);

const pendencias = [
  { coluna: 'Fontes', descricao: 'Fonte principal: o DICHIVC (dicionário de HIV criança, revisado em fevereiro/2024), que descreve exatamente as 103 colunas do arquivo. A ficha e o instrucional são de aids criança (2006); o AidsCriNET.def do TabWin confirma a ligação das colunas e os códigos. O PDF do DICHIVC desalinha as linhas da tabela; os nomes dos sinais vieram da ficha, conferidos com o dicionário e com o .def. Confirmar.' },
  { coluna: 'CLI_HERPEG, CLI_CDC_HE e CLI_HERPES', descricao: 'No PDF do DICHIVC as três colunas de herpes aparecem numa ordem que não bate com a dos campos. Seguiu-se o AidsCriNET.def, que dá um nome a cada coluna: CLI_HERPEG = herpes simples em brônquios, pulmões ou trato gastrintestinal; CLI_CDC_HE = herpes simples mucocutâneo; CLI_HERPES = herpes zoster. Confirmar.' },
  { coluna: 'EVOLUCAO', descricao: 'O DICHIVC lista 1, 2, 3 e 9; a ficha (campo 50) e o TabWin têm também 4 - Transferência para outro município, que aparece em 1 registro. O 4 entrou pela ficha. Confirmar.' },
  { coluna: 'CS_ESCOL_N e ESC_MAE_N', descricao: 'A escolaridade da criança vem "99" em 20 notificações: 9, 09 e 99 = Ignorado (regra do Rubens). A da mãe vem com um dígito (0 a 9), sem o 10. Confirmar.' },
  { coluna: 'ANT_CAT_EX e CRITERIO', descricao: 'Mesma lista de categorias de exposição do HIV adulto (o 69 pelo ClascatN.cnv). O critério só lista 100, 600, 900 e 901 no DICHIVC; vem sempre 901 (HIV+). Confirmar.' },
  { coluna: 'Arquivos pequenos', descricao: 'São só 373 notificações (186 em 2022, 186 em 2023 e 1 em 2024; nenhuma se repete entre 2022 e 2023). Para a amostra, os três anos serão juntados, como no tétano neonatal.' },
  { coluna: 'Campos da ficha fora do dicionário', descricao: 'A ficha de aids criança tem a instituição da transfusão (campo 42) e a unidade de tratamento (campo 49), mas o DICHIVC de 2024 e o arquivo público não trazem essas colunas. Não entraram.' },
];

const dic = {
  formato: hepa.formato,
  agravo: { nome: 'HIV em criança', codigos: ['B24', 'B 24', 'B 2 4'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos HIVCBRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: false, por: '', data: '', registro: '' },
  convencoes: hepa.convencoes, fontes, tabelas: hepa.tabelas, listas, colunas, derivadas: derivadas(), pendencias,
};
const usadas = new Set([...colunas.flatMap((x) => [x.fonte, ...(x.categorias || []).map((k) => k.fonte)]), ...Object.values(listas).flat().map((k) => k.fonte), ...Object.values(hepa.tabelas).map((t) => t.fonte)].filter(Boolean));
for (const f of usadas) if (!fontes[f]) throw new Error('fonte ' + f);
for (const k of Object.keys(fontes)) if (!usadas.has(k) && !['SINANNET_AIDS'].includes(k)) delete fontes[k];
writeFileSync(`${raiz}dicionarios/hiv-crianca.json`, JSON.stringify(dic, null, 2) + '\n');
console.log(`hiv-crianca.json: ${colunas.length} colunas, ${dic.derivadas.length} extras, ${pendencias.length} pendências; fontes: ${Object.keys(fontes).join(' ')}`);
