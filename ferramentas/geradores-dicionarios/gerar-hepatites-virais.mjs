// Gera dicionarios/hepatites-virais.json a partir das fontes oficiais de docs/fontes/hepatites-virais.
// Colunas comuns (campos 1 a 30 e internos) são copiadas de dicionários já conferidos.
// Atenção: depois da conferência do Rubens, as correções vão direto no JSON; não rodar de novo.
import { readFileSync, writeFileSync } from 'node:fs';
const raiz = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // pasta principal do projeto
const ler = (a) => JSON.parse(readFileSync(`${raiz}dicionarios/${a}.json`, 'utf8'));
const teta = ler('tetano-acidental');
const hans = ler('hanseniase');
const sifg = ler('sifilis-gestante');
const sifc = ler('sifilis-congenita');
const copia = (d, n) => structuredClone(d.colunas.find((x) => x.nome === n));
const REGRA = 'Códigos que o campo não comporta saem como "Inconsistência/Não Preenchido" (regra geral do Rubens, 16/11/2026).';
const ZEROS = 'O arquivo grava o código com dois dígitos (por exemplo, 01); as duas formas (01 e 1) entram, como na escolaridade e na meningite (regra do Rubens).';
const fora = (motivo) => ({ rotulo: 'Inconsistência/Não Preenchido', motivo: `Código sem fonte oficial: ${motivo}` });
const cats = (pares, fonte, local) => pares.map(([k, r]) => ({ codigos: [k], rotulo: r, ...(fonte ? { fonte, local } : {}) }));
const doisDigitos = (c) => (/^\d$/.test(c) ? [c, `0${c}`] : /^0\d$/.test(c) ? [c, c.slice(1)] : [c]);

const PACOTE = 'Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026)';
const fontes = {
  DICHEPA: { documento: 'Dicionário de Dados – Sinan NET – versão 5.0 – Hepatites Virais (campos 31 a 52 e campos ajustados)', orgao: 'Ministério da Saúde / Secretaria de Vigilância em Saúde e Ambiente / Departamento de Análise Epidemiológica e Vigilância de Doenças Não Transmissíveis / Coordenação-Geral de Informações e Análises Epidemiológicas', data: `sem data no documento (16 páginas); o cabeçalho usa o nome da Secretaria de Vigilância em Saúde e Ambiente, e o arquivo do pacote é de 26/03/2025. ${PACOTE}`, arquivo: 'docs/fontes/hepatites-virais/HEPANET_DIC_DADOS.pdf' },
  FICHAHEPA: { documento: 'Ficha de Investigação – Hepatites Virais – Sinan NET', orgao: 'Ministério da Saúde / SVS', data: `SVS 29/09/2006 (rodapé da ficha). ${PACOTE}`, arquivo: 'docs/fontes/hepatites-virais/HEPANET_FICHA.pdf' },
  INSTHEPA: { documento: 'Hepatites Virais – Instruções para preenchimento – Ficha de Investigação – Sinan NET', orgao: 'Ministério da Saúde / SVS', data: `16/06/2008 (rodapé). ${PACOTE}`, arquivo: 'docs/fontes/hepatites-virais/HEPANET_INSTRUCIONAL.pdf' },
};
for (const [id, f] of Object.entries(teta.fontes)) if (!['DICTETA', 'FICHATETA', 'INSTTETA', 'DICLTA'].includes(id)) fontes[id] = f;
fontes.CID10_TABWIN = sifc.fontes.CID10_TABWIN;
fontes.DATASUS_UF = sifc.fontes.DATASUS_UF;

// ---------- listas
const listas = {
  sn9: cats([['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']]),
  exposicao: cats([['1', 'Sim, há menos de seis meses'], ['2', 'Sim, há mais de seis meses'], ['3', 'Não'], ['9', 'Ignorado']]),
  vacina: cats([['1', 'Completa'], ['2', 'Incompleta'], ['3', 'Não vacinado'], ['9', 'Ignorado']]),
  sorologia_banco: cats([['1', 'Reagente'], ['2', 'Não reagente'], ['3', 'Inconclusivo'], ['4', 'Não realizado'], ['9', 'Ignorado']]),
  marcador: cats([['1', 'Reagente/Positivo'], ['2', 'Não reagente/Negativo'], ['3', 'Inconclusivo'], ['4', 'Não realizado']]),
  sim_nao: cats([['1', 'Sim'], ['2', 'Não']]),
  uf_sigla: structuredClone(sifc.listas.uf_sigla),
};

const col = {};
// ---------- comuns, copiadas de dicionários conferidos
for (const n of ['TP_NOT', 'DT_NOTIFIC', 'SEM_NOT', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_REGIONA', 'NU_IDADE_N', 'CS_SEXO', 'CS_GESTANT', 'CS_RACA', 'CS_ESCOL_N', 'ID_MN_RESI', 'ID_RG_RESI', 'ID_PAIS']) col[n] = copia(teta, n);
for (const cat of col.CS_ESCOL_N.categorias) if (cat.fonte === 'FICHATETA') Object.assign(cat, { fonte: 'FICHAHEPA', local: 'p. 1, campo 14' });
col.SG_UF = copia(sifg, 'SG_UF'); // UF de residência em código numérico
col.SEM_NOT.observacao = 'Formato AAAASS (ano e semana). Nos arquivos de 2021 a 2023, os 1.119 registros do Espírito Santo (UF 32) trazem só "20", e uns poucos de outras UFs vêm com 4 ou 5 dígitos; ficam como vieram. A semana calculada pela data da notificação está na coluna extra logo depois (pendência).';
for (const cat of col.CS_GESTANT.categorias) cat.codigos = doisDigitos(cat.codigos[0]);
col.CS_GESTANT.fora_do_campo = fora('o campo 12 só comporta 1 a 6 e 9');
col.CS_GESTANT.observacao = `Nos arquivos de hepatites o código vem com dois dígitos (06, 02, 01...). ${ZEROS} O "99" (3.129 registros de 2021 a 2023) não é a forma com zero de nenhum código e sai como "Inconsistência/Não Preenchido" (pendência). ${REGRA}`;

// ---------- próprias das hepatites
const c = (nome, local, rotulo, tipo, extra = {}) => ({ nome, fonte: 'DICHEPA', local, rotulo, tipo, ...extra });
const lst = (nome, local, rotulo, lista, campo, comporta, obs) => c(nome, local, rotulo, 'categorico', { lista, fora_do_campo: fora(`o campo ${campo} só comporta ${comporta}`), observacao: [obs, REGRA].filter(Boolean).join(' ') });

col.ID_AGRAVO = { nome: 'ID_AGRAVO', fonte: 'FICHAHEPA', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
  categorias: [{ codigos: ['B19', 'B 19', 'B 1 9', 'B19.'], rotulo: 'Hepatite viral não especificada', fonte: 'CID10_TABWIN', local: 'CID10_01.CNV, código B19' }],
  observacao: "A ficha mostra 'HEPATITES VIRAIS' com o CID 'B 19'; no arquivo vem 'B19' (regra do Rubens: o CID como na ficha e sem espaços). Rótulo da CID-10 (tabela do TabWin), como o Rubens decidiu na meningite (19/11/2026). Atenção: o B19 é o código usado em todas as notificações de hepatites virais, inclusive as de vírus A, B ou C; o tipo de hepatite está nas colunas de suspeita, classificação e etiologia (pendência)." };
col.DT_DIAG = { nome: 'DT_DIAG', fonte: 'INSTHEPA', local: 'p. 1, item 7', rotulo: 'Data do diagnóstico', tipo: 'data',
  observacao: 'Instrucional, item 7: "data do diagnóstico ou da evidência laboratorial e/ou clínica da doença de acordo com a definição de caso vigente no momento da notificação" (campo obrigatório). Na ficha, campo 7, com o título "Data dos Primeiros Sintomas"; o arquivo traz DT_DIAG, como na hanseníase.' };
col.SEM_DIAG = { nome: 'SEM_DIAG', fonte: 'INSTHEPA', local: 'p. 1, item 7 (Data do diagnóstico)', rotulo: 'Semana epidemiológica do diagnóstico do caso notificado', tipo: 'texto',
  observacao: 'Nenhum documento de hepatites descreve SEM_DIAG; é a semana epidemiológica do diagnóstico, gerada pelo Sinan na digitação (decisão do Rubens na hanseníase, 16/11/2026). Nos arquivos de 2021 a 2023, os 1.119 registros do Espírito Santo trazem só "20". A semana calculada pela data do diagnóstico está na coluna extra logo depois (pendência).' };
col.DT_INVEST = c('DT_INVEST', 'p. 1, campo 31', 'Data da investigação', 'data');
col.ID_OCUPA_N = Object.assign(copia(teta, 'ID_OCUPA_N'), { fonte: 'DICHEPA', local: 'p. 2, campo 32' });
col.HEPATITE_N = c('HEPATITE_N', 'p. 2, campo 33', 'Suspeita de', 'categorico', {
  categorias: cats([['1', 'Hepatite A'], ['2', 'Hepatite B/C'], ['3', 'Não especificada']]), fora_do_campo: fora('o campo 33 só comporta 1, 2 e 3'), observacao: REGRA });
col.HEPATITA = lst('HEPATITA', 'p. 2, campo 34', 'Tomou vacina para hepatite A', 'vacina', 34, '1, 2, 3 e 9');
col.HEPATITB = lst('HEPATITB', 'p. 2, campo 34', 'Tomou vacina para hepatite B', 'vacina', 34, '1, 2, 3 e 9');
col.INSTITUCIO = c('INSTITUCIO', 'p. 3, campo 35', 'Institucionalizado em', 'categorico', {
  categorias: cats([['1', 'Creche'], ['2', 'Escola'], ['3', 'Asilo'], ['4', 'Empresa'], ['5', 'Penitenciária'], ['6', 'Hospital/Clínica'], ['7', 'Outras'], ['8', 'Não institucionalizado'], ['9', 'Ignorado']]),
  fora_do_campo: fora('o campo 35 só comporta 1 a 9'), observacao: REGRA });
col.HIV = lst('HIV', 'p. 3, campo 36', 'Agravos associados: HIV/AIDS', 'sn9', 36, '1, 2 e 9', 'O código 3 aparece em 2 registros (2021 a 2023).');
col.OUTRA_DST = lst('OUTRA_DST', 'p. 3, campo 36', 'Agravos associados: outras DSTs', 'sn9', 36, '1, 2 e 9', 'O código 3 aparece em 1 registro (2021 a 2023).');
const contato = [['SEXUAL', 'sexual', 3], ['DOMICILI', 'domiciliar (não sexual)', 4], ['OCUPACIO', 'ocupacional', 4]];
for (const [n, nome, pag] of contato) col[n] = lst(n, `p. ${pag}, campo 37`, `Contato com paciente portador de HBV ou HCV: ${nome}`, 'exposicao', 37, '1, 2, 3 e 9',
  'A ficha escreve "portador de HBV ou HBC"; o DICHEPA, "portador de VHB ou VHC".');
const expos = [['MEDICAMENT', 'medicamentos injetáveis', 4], ['TATU_PIER', 'tatuagem/piercing', 5], ['MATBIOLOGI', 'acidente com material biológico', 5], ['INAL_CRACK', 'drogas inaláveis ou crack', 5], ['ACUPUNTURA', 'acupuntura', 5], ['TRANSFUSAO', 'transfusão de sangue/derivados', 5],
  ['INJETAVEIS', 'drogas injetáveis', 6], ['CIRURGICO', 'tratamento cirúrgico', 6], ['AGUA_ALIME', 'água/alimento contaminado', 6], ['DENTARIO', 'tratamento dentário', 6], ['TRESMAIS', 'três ou mais parceiros sexuais', 6], ['HEMODIALIS', 'hemodiálise', 6],
  ['TRANSPLA', 'transplante', 7], ['OUTRAS', 'outras', 7]];
for (const [n, nome, pag] of expos) col[n] = lst(n, `p. ${pag}, campo 38`, `Exposição: ${nome}`, 'exposicao', 38, '1, 2, 3 e 9',
  'No texto do DICHEPA as colunas da tabela aparecem desalinhadas; a ligação entre o nome da coluna e a exposição segue a ordem da página (pendência).');
col.DT_ACIDENT = c('DT_ACIDENT', 'p. 7, campo 39', 'Data do acidente, transfusão ou transplante', 'data');
for (const [k, uf, mun, pag] of [['1', 'CO_UF_EXP', 'CO_MUN_EXP', 8], ['2', 'CO_UF_EX2', 'CO_MUN_EX2', 9], ['3', 'CO_UF_EX3', 'CO_MUN_EX3', 10]]) {
  col[uf] = c(uf, `p. ${pag}, campo 40`, `Local de exposição ${k}: UF`, 'categorico', { lista: 'uf_sigla',
    observacao: `O DICHEPA descreve "Tabela com códigos e siglas padronizados pelo IBGE". ${k === '1' ? 'No arquivo a UF vem quase sempre em código numérico (35), mas às vezes em sigla (ES, BA, MG...).' : 'No arquivo a UF vem em código numérico.'} Pela regra do Rubens (19/11/2026), a coluna que mistura sigla e código sai só com a sigla: a sigla fica como veio e o código numérico sai com a sigla correspondente, pela tabela de UFs do DATASUS (tb_uf.csv). As três UFs de exposição seguem a mesma regra (pendência).` });
  col[mun] = c(mun, `p. ${pag}, campo 40`, `Local de exposição ${k}: município`, 'municipio');
}
col.BANCOSANGU = c('BANCOSANGU', 'p. 11, campo 42', 'Paciente encaminhado de', 'categorico', {
  categorias: cats([['1', 'Banco de sangue'], ['2', 'Centro de Testagem e Aconselhamento (CTA)'], ['3', 'Não se aplica']]), fora_do_campo: fora('o campo 42 só comporta 1, 2 e 3'), observacao: REGRA });
col.DT_COLETA = c('DT_COLETA', 'p. 11, campo 43', 'Data da coleta da amostra no banco de sangue ou CTA', 'data');
for (const [n, nome] of [['RES_HBSAG', 'HBsAg'], ['RE_ANTIHBC', 'Anti-HBc total'], ['RE_ANTIHCV', 'Anti-HCV']])
  col[n] = lst(n, 'p. 11, campo 44', `Sorologia do banco de sangue ou CTA: ${nome}`, 'sorologia_banco', 44, '1, 2, 3, 4 e 9', 'O código 5 aparece em 33 a 40 registros (2021 a 2023).');
col.COLETAMARC = c('COLETAMARC', 'p. 11, campo 45', 'Data da coleta da sorologia', 'data');
const marcadores = [['ANTIHAVIGM', 'Anti-HAV IgM', 12], ['ANTIHBS', 'Anti-HBs', 12], ['ANTIHDVIGM', 'Anti-HDV IgM', 12], ['AGHBS', 'HBsAg', 12], ['AGHBE', 'HBeAg', 12],
  ['ANTIHEVIGM', 'Anti-HEV IgM', 13], ['ANTIHBCIGM', 'Anti-HBc IgM', 13], ['ANTIHBE', 'Anti-HBe', 13], ['ANTIHCV', 'Anti-HCV', 13],
  ['HBC_TOTAL', 'Anti-HBc total', 14], ['ANTIHDV', 'Anti-HDV total', 14], ['TP_SOROHCV', 'HCV-RNA', 14]];
for (const [n, nome, pag] of marcadores) col[n] = lst(n, `p. ${pag}, campo 46`, `Resultado sorológico/virológico: ${nome}`, 'marcador', 46, '1, 2, 3 e 4',
  `Rótulos da ficha (campo 46). O DICHEPA escreve "Reagente" e "Não reagente" em alguns marcadores (por exemplo, Anti-HDV IgM) e "Reagente/Positivo" nos outros.${n === 'TP_SOROHCV' ? ' O nome da coluna (TP_SOROHCV) não diz HCV-RNA; a ligação segue a ordem da página do DICHEPA (pendência).' : ''}`);
col.GEN_VHC = c('GEN_VHC', 'p. 14, campo 47', 'Genótipo para HCV', 'categorico', {
  categorias: cats([['1', 'Genótipo 1'], ['2', 'Genótipo 2'], ['3', 'Genótipo 3'], ['4', 'Genótipo 4'], ['5', 'Genótipo 5'], ['6', 'Genótipo 6'], ['7', 'Não se aplica'], ['9', 'Ignorado']]),
  fora_do_campo: fora('o campo 47 só comporta 1 a 7 e 9'), observacao: REGRA });
col.FONTE = c('FONTE', 'p. 15, campo 51', 'Provável fonte/mecanismo de infecção', 'categorico', {
  categorias: [['01', 'Sexual'], ['02', 'Transfusional'], ['03', 'Uso de drogas'], ['04', 'Vertical'], ['05', 'Acidente de trabalho'], ['06', 'Hemodiálise'], ['07', 'Domiciliar'], ['08', 'Tratamento cirúrgico'], ['09', 'Tratamento dentário'], ['10', 'Pessoa/pessoa'], ['11', 'Alimento/água contaminada'], ['12', 'Outros'], ['99', 'Ignorado']]
    .map(([k, r]) => ({ codigos: doisDigitos(k), rotulo: r })),
  fora_do_campo: fora('o campo 51 só comporta 01 a 12 e 99'), observacao: `A ficha escreve 01 a 12 e 99; o DICHEPA, 1 a 12 e 99. ${ZEROS} ${REGRA}` });
col.DT_ENCERRA = c('DT_ENCERRA', 'p. 15, campo 52', 'Data do encerramento', 'data');
col.DSFONTE = c('DSFONTE', 'p. 15, campo 51', 'Provável fonte/mecanismo de infecção: outros (especificar)', 'texto', { observacao: 'Texto livre; fica como veio.' });
col.CLASSI_FIN = { nome: 'CLASSI_FIN', fonte: 'FICHAHEPA', local: 'p. 2, campo 48', rotulo: 'Classificação final', tipo: 'categorico',
  categorias: cats([['1', 'Confirmação laboratorial'], ['2', 'Confirmação clínico-epidemiológica'], ['3', 'Descartado'], ['4', 'Cicatriz sorológica'], ['8', 'Inconclusivo']]),
  fora_do_campo: fora('o campo 48 só comporta 1, 2, 3, 4 e 8'),
  observacao: `Categorias da ficha (campo 48) e do instrucional (item 48). O DICHEPA não descreve CLASSI_FIN; descreve a "classificação final ajustada" (CLASSI_FIN_AJ), com as mesmas categorias (pendência). ${REGRA}` };
col.FORMA = { nome: 'FORMA', fonte: 'FICHAHEPA', local: 'p. 2, campo 49', rotulo: 'Forma clínica', tipo: 'categorico',
  categorias: [['1', 'Hepatite aguda'], ['2', 'Hepatite crônica/Portador assintomático'], ['3', 'Hepatite fulminante'], ['4', 'Inconclusivo']].map(([k, r]) => ({ codigos: doisDigitos(k), rotulo: r })),
  fora_do_campo: fora('o campo 49 só comporta 1 a 4'),
  observacao: `Categorias da ficha (campo 49) e do instrucional (item 49, "opções de 1 a 4"). O arquivo grava 01 a 04; ${ZEROS} O "99" (18.135 registros de 2021 a 2023) não está em nenhuma fonte e sai como "Inconsistência/Não Preenchido" (pendência). O DICHEPA descreve a "forma clínica ajustada" (FORMA_AJ), com as mesmas categorias. ${REGRA}` };
for (const [n, v, pag] of [['HAV', 'A', 15], ['HBV', 'B', 16], ['HCV', 'C', 16], ['HDV', 'D', 16], ['HEV', 'E', 16]])
  col[n] = c(n, `p. ${pag} (VIRUS_${v})`, `Etiologia pelo vírus ${v}`, 'categorico', { lista: 'sim_nao', fora_do_campo: fora(`o campo VIRUS_${v} do DICHEPA só comporta 1 e 2`),
    observacao: `Nenhuma fonte descreve a coluna ${n}. O DICHEPA descreve VIRUS_${v}, "Etiologia pelo vírus ${v} (de acordo com o algoritmo do DATHI)", com 1 = Sim e 2 = Não; a ligação de ${n} com VIRUS_${v} é uma interpretação, pelo nome e pela ordem (pendência). No arquivo vem só "1" ou em branco. ${REGRA}` });

// ---------- descritas no DICHEPA, mas que não vêm no arquivo público (como na meningite, decisão do Rubens de 19/11/2026)
const NAO_PUB = 'Não vem nos arquivos públicos do DATASUS (HEPABR21 a 23); incluída para arquivos exportados do próprio Sinan, como o Rubens decidiu na meningite (19/11/2026) (pendência).';
col.CLASSI_FIN_AJ = c('CLASSI_FIN_AJ', 'p. 15', 'Classificação final ajustada (algoritmo do DATHI)', 'categorico', {
  categorias: cats([['1', 'Confirmação laboratorial'], ['2', 'Confirmação clínico-epidemiológica'], ['3', 'Descartado'], ['4', 'Cicatriz sorológica'], ['8', 'Inconclusivo']]),
  fora_do_campo: fora('o DICHEPA só lista 1, 2, 3, 4 e 8'), observacao: `DICHEPA: "diagnóstico fechado (de acordo com o algoritmo do DATHI)". ${NAO_PUB} ${REGRA}` });
col.FORMA_AJ = c('FORMA_AJ', 'p. 15', 'Forma clínica ajustada (algoritmo do DATHI)', 'categorico', {
  categorias: cats([['1', 'Hepatite aguda'], ['2', 'Hepatite crônica/Portador assintomático'], ['3', 'Hepatite fulminante'], ['4', 'Inconclusivo']]),
  fora_do_campo: fora('o DICHEPA só lista 1 a 4'), observacao: `DICHEPA: "forma clínica da hepatite (de acordo com o algoritmo do DATHI)". ${NAO_PUB} ${REGRA}` });
for (const [v, pag] of [['A', 15], ['B', 16], ['C', 16], ['D', 16], ['E', 16]])
  col[`VIRUS_${v}`] = c(`VIRUS_${v}`, `p. ${pag}`, `Etiologia pelo vírus ${v} (algoritmo do DATHI)`, 'categorico', { lista: 'sim_nao', fora_do_campo: fora('o DICHEPA só lista 1 e 2'), observacao: `${NAO_PUB} ${REGRA}` });

const ORDEM = 'TP_NOT ID_AGRAVO DT_NOTIFIC SEM_NOT NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA DT_DIAG SEM_DIAG NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS DT_INVEST ID_OCUPA_N HEPATITE_N HEPATITA HEPATITB INSTITUCIO HIV OUTRA_DST SEXUAL DOMICILI OCUPACIO MEDICAMENT TATU_PIER MATBIOLOGI INAL_CRACK ACUPUNTURA TRANSFUSAO INJETAVEIS CIRURGICO AGUA_ALIME DENTARIO TRESMAIS HEMODIALIS TRANSPLA OUTRAS DT_ACIDENT CO_UF_EXP CO_MUN_EXP CO_UF_EX2 CO_MUN_EX2 CO_UF_EX3 CO_MUN_EX3 BANCOSANGU RES_HBSAG RE_ANTIHBC RE_ANTIHCV DT_COLETA ANTIHAVIGM ANTIHBS ANTIHDVIGM AGHBS AGHBE ANTIHEVIGM ANTIHBCIGM ANTIHBE ANTIHCV HBC_TOTAL ANTIHDV TP_SOROHCV GEN_VHC COLETAMARC FONTE DT_ENCERRA DSFONTE CLASSI_FIN FORMA HAV HBV HCV HDV HEV CLASSI_FIN_AJ FORMA_AJ VIRUS_A VIRUS_B VIRUS_C VIRUS_D VIRUS_E'.split(' ');
for (const n of ORDEM) if (!col[n]) throw new Error(`falta ${n}`);
if (Object.keys(col).length !== ORDEM.length) throw new Error('colunas a mais');

const semCalc = (nome, rotulo, de, depois, texto) => ({ nome, rotulo, de, calculo: 'semana_epidemiologica', depois_de: depois,
  observacao: `Coluna extra (regra do Rubens, 18/11/2026, para semanas que vêm incompletas): semana epidemiológica (AAAASS) calculada da ${texto}, pelo calendário epidemiológico (semana de domingo a sábado; a semana 1 é a que contém 4 de janeiro). Regra conferida contra cerca de 2,5 milhões de semanas gravadas pelo Sinan nos arquivos públicos, todas iguais. A coluna ${depois} continua como veio.` });

const dic = {
  formato: teta.formato,
  agravo: { nome: 'Hepatites virais', codigos: col.ID_AGRAVO.categorias[0].codigos, coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos HEPABRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: false, por: '', data: '', registro: '' },
  convencoes: teta.convencoes,
  fontes,
  tabelas: teta.tabelas,
  listas,
  derivadas: [...structuredClone(teta.derivadas),
    semCalc('SEM_NOT_CALC', 'Semana epidemiológica da notificação (calculada pela data da notificação)', 'DT_NOTIFIC', 'SEM_NOT', 'data da notificação'),
    semCalc('SEM_DIAG_CALC', 'Semana epidemiológica do diagnóstico (calculada pela data do diagnóstico)', 'DT_DIAG', 'SEM_DIAG', 'data do diagnóstico')],
  colunas: ORDEM.map((n) => col[n]),
  pendencias: [
    { coluna: 'Nomes do arquivo × DICHEPA', descricao: 'O DICHEPA (mais recente que a ficha) descreve CLASSI_FIN_AJ, FORMA_AJ e VIRUS_A a VIRUS_E, "de acordo com o algoritmo do DATHI". O arquivo público traz CLASSI_FIN, FORMA e HAV, HBV, HCV, HDV e HEV. CLASSI_FIN e FORMA seguem a ficha (campos 48 e 49), com as mesmas categorias. HAV a HEV foram ligados a VIRUS_A a VIRUS_E pelo nome e pela ordem (1 = Sim); no arquivo só aparecem "1" e branco. Confirmar.' },
    { coluna: 'Colunas do DICHEPA fora do arquivo', descricao: 'CLASSI_FIN_AJ, FORMA_AJ e VIRUS_A a VIRUS_E não vêm no arquivo público e entraram para arquivos exportados do próprio Sinan, como o Rubens decidiu na meningite. Confirmar ou retirar.' },
    { coluna: 'ID_AGRAVO', descricao: 'B19 sai como "Hepatite viral não especificada", rótulo da CID-10, como o Rubens decidiu na meningite. Atenção: todas as notificações de hepatites (A, B, C...) usam o B19, e o rótulo "não especificada" pode confundir. Alternativa: "Hepatites virais", nome da ficha. Decidir.' },
    { coluna: 'FORMA 99', descricao: 'A forma clínica vem com 2 dígitos (01 a 04) e "99" em 18.135 registros (20%) de 2021 a 2023. A ficha e o instrucional só têm 1 a 4. O 99 sai como "Inconsistência/Não Preenchido" pela regra geral. Confirmar.' },
    { coluna: 'CS_GESTANT', descricao: 'Nas hepatites a gestante vem com 2 dígitos (06, 02, 01) e "99" (3.129 registros). As formas com zero entram (regra do zero à esquerda); o 99 sai como "Inconsistência/Não Preenchido". Confirmar.' },
    { coluna: 'Códigos com e sem zero à esquerda', descricao: 'FONTE (01 a 12), FORMA (01 a 04) e CS_GESTANT vêm com 2 dígitos. As duas formas entram, como na escolaridade e na meningite. Confirmar.' },
    { coluna: 'Códigos fora do campo', descricao: 'Saem como "Inconsistência/Não Preenchido" pela regra geral: o 3 em HIV (2 registros) e em OUTRA_DST (1); o 5 nas sorologias do banco de sangue (33 a 40 registros cada). Confirmar.' },
    { coluna: 'UF do local de exposição', descricao: 'CO_UF_EXP mistura código (35) e sigla (ES, BA, MG, PA, RO, RJ: 89 registros). Pela regra do Rubens (19/11/2026), sai só com a sigla, e o código vira sigla. CO_UF_EX2 e CO_UF_EX3 só têm código, mas seguem a mesma regra, para as três UFs de exposição saírem iguais. Confirmar.' },
    { coluna: 'Semana incompleta (SEM_NOT e SEM_DIAG)', descricao: 'Os 1.119 registros do Espírito Santo (351, 359 e 409 em 2021, 2022 e 2023) trazem só "20" nas duas semanas, e uns 8 registros de outras UFs vêm com 4 ou 5 dígitos. As colunas ficam como vieram, e foram criadas duas colunas extras com a semana calculada pela data (notificação e diagnóstico), pela regra da semana calculada. Confirmar.' },
    { coluna: 'Leitura do DICHEPA', descricao: 'No texto do PDF, as colunas da tabela vêm desalinhadas em várias páginas (exposições, marcadores, sorologias do banco de sangue). A ligação entre o nome da coluna (DBF) e o campo segue a ordem da página e foi conferida pela ficha. Os pontos menos seguros: TP_SOROHCV = HCV-RNA e a ordem das exposições do campo 38. Conferir no PDF.' },
    { coluna: 'Campo 50 (classificação etiológica)', descricao: 'A ficha tem o campo 50 (01 Vírus A a 99 Ignorado), mas o arquivo público não traz essa coluna; não entrou no dicionário.' },
  ],
};
writeFileSync(`${raiz}dicionarios/hepatites-virais.json`, JSON.stringify(dic, null, 2).replace(/\n/g, '\r\n') + '\r\n');
console.log('ok', dic.colunas.length, 'colunas');
