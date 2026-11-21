// Gera dicionarios/surto-dta.json a partir das fontes oficiais de docs/fontes/surto-dta.
// Colunas comuns são copiadas de dicionários já conferidos.
// Atenção: depois da conferência do Rubens, as correções vão direto no JSON; não rodar de novo.
//
// Os arquivos públicos de surto de DTA mudam de forma conforme o ano: em 2022 a 2024 algumas
// colunas vêm com o texto já escrito ("Sim", "Indireta"), às vezes com o acento estragado
// ("NÆo" em 2022 e 2023, "NÃ£o" em 2024); em 2025 vêm com o código. Cada forma que aparece
// no arquivo entra como mais um código da mesma categoria (plano aprovado pelo Rubens, 19/11/2026).
import { readFileSync, writeFileSync } from 'node:fs';
const raiz = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // pasta principal do projeto
const ler = (a) => JSON.parse(readFileSync(`${raiz}dicionarios/${a}.json`, 'utf8'));
const teta = ler('tetano-acidental');
const hepa = ler('hepatites-virais');
const cid10 = JSON.parse(readFileSync(`${raiz}dicionarios/tabelas/cid10.json`, 'utf8')).valores;
const copia = (d, n) => structuredClone(d.colunas.find((x) => x.nome === n));
const REGRA = 'Códigos que o campo não comporta saem como "Inconsistência/Não Preenchido" (regra geral do Rubens, 16/11/2026).';
const FORMAS = 'Em 2022 a 2024 o arquivo traz o texto já escrito, às vezes com o acento estragado pela conversão de codificação ("NÆo" em 2022 e 2023, "NÃ£o" em 2024); em 2025 traz o código. Cada forma que aparece no arquivo entra como mais um código da mesma categoria (plano aprovado pelo Rubens, 19/11/2026).';
const ZEROS = 'O arquivo grava o código com dois dígitos (01 a 11); a forma sem o zero também entra, como na escolaridade e na meningite (regra do Rubens).';
const fora = (motivo) => ({ rotulo: 'Inconsistência/Não Preenchido', motivo: `Código sem fonte oficial: ${motivo}` });
const cats = (pares) => pares.map(([k, r]) => ({ codigos: [].concat(k), rotulo: r }));
const doisDigitos = (c) => (/^0\d$/.test(c) ? [c, c.slice(1)] : [c]);

const PACOTE = 'Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026)';
const fontes = {
  DICSDTA: { documento: 'Dicionário de Dados – Sinan NET – versão 5.0 – Surto/DTA', orgao: 'Ministério da Saúde / SVS / DEVEP / CIEVS / GT-Sinan', data: `revisado em fevereiro de 2012 (rodapé). ${PACOTE}`, arquivo: 'docs/fontes/surto-dta/SDTA_DIC_DADOS.pdf' },
  FICHASDTA: { documento: 'Ficha de Investigação de Surto – DTA – Sinan NET', orgao: 'Ministério da Saúde / SVS', data: `SVS 08/06/2006 (rodapé da ficha). ${PACOTE}`, arquivo: 'docs/fontes/surto-dta/SDTA_FICHA.pdf' },
  AJUSTESDTA: { documento: 'Dicionário de dados – Surto DTA: substituição do campo 56 (DS_ETIOLOG) por AGENTE_ET1, AGENTE_ET2 e AGENTE_ET3, e do campo 57 (DS_ALICAUS) por ALIMENTO_C, conforme a Nota Técnica nº 45/2024-CGZV/DEDT/SVSA/MS', orgao: 'Ministério da Saúde / SVSA', data: `2024 (Nota Técnica nº 45/2024). ${PACOTE}`, arquivo: 'docs/fontes/surto-dta/AJUSTE-DICIONARIO-DE-DADOS-DA-FICHA-DE-SURTO-DTA.pdf' },
  SINANNET_SDTA: { documento: 'Definições do TabWin para Surto de DTA (DTANet.def) e tabelas de conversão do mesmo pacote (OCORRENCIA.CNV, MODOTRANS.CNV, MODOIND.CNV, Locproducao.cnv, sim_nao.cnv, Confdescsurto.cnv)', orgao: 'Ministério da Saúde / GT-Sinan / DATASUS', data: 'Pacote TAB_SINANNET baixado pelo Rubens em 15/11/2026 da página de transferência de arquivos do DATASUS; MODOTRANS, MODOIND e Locproducao revisados pela UT-Sinan em 2019', arquivo: 'docs/fontes/tabelas-apoio/TAB_SINANNET/DTANet.def' },
};
for (const [id, f] of Object.entries(teta.fontes)) if (!['DICTETA', 'FICHATETA', 'INSTTETA', 'DICLTA'].includes(id)) fontes[id] = f;
fontes.CID10_TABWIN = hepa.fontes.CID10_TABWIN;

// ---------- listas
const listas = {
  sn9_texto: cats([[['1', 'Sim'], 'Sim'], [['2', 'Não', 'NÆo', 'NÃ£o'], 'Não'], [['9', 'Ignorado'], 'Ignorado']]),
  sn9: cats([['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']]),
  horas_dias: cats([['1', 'Horas'], ['2', 'Dias']]),
  local_producao: [['01', 'Ambulantes'], ['02', 'Comemorações'], ['03', 'Creche / Escola'], ['04', 'Hospital / Unidade de Saúde'], ['05', 'Indústria'], ['06', 'Lanchonete / Confeitaria / Padaria'], ['07', 'Produção Agropecuária'], ['08', 'Refeitório'], ['09', 'Residência'], ['10', 'Restaurante'], ['11', 'Outros'], ['99', 'Ignorado']]
    .map(([k, r]) => ({ codigos: doisDigitos(k), rotulo: r })),
};

const col = {};
const c = (nome, fonte, local, rotulo, tipo, extra = {}) => ({ nome, fonte, local, rotulo, tipo, ...extra });
const num = (nome, local, rotulo, obs) => c(nome, 'DICSDTA', local, rotulo, 'numero', obs ? { observacao: obs } : {});

// ---------- notificação (campos 1 a 8)
col.TP_NOT = copia(teta, 'TP_NOT');
col.TP_NOT.observacao = 'Nos arquivos de surto de DTA vem sempre 3 (Surto). A ficha só tem "3 - Surto".';
const agravos = ['A08', 'A080', 'A084', 'A09', 'B571', 'T659', 'B19', 'A051', 'B58', 'B15', 'B09', 'A05', 'H10', 'A279', 'A009', 'B01', 'A369', 'A90', 'B084', 'B019'];
const comPonto = (k) => (k.length > 3 ? `${k.slice(0, 3)}.${k.slice(3)}` : k);
col.ID_AGRAVO = c('ID_AGRAVO', 'DICSDTA', 'p. 1, campo 2', 'Agravo (CID-10)', 'categorico', {
  categorias: agravos.map((k) => ({ codigos: [...new Set([k, comPonto(k)])], rotulo: cid10[comPonto(k)], fonte: 'CID10_TABWIN', local: `${comPonto(k)} na tabela CID-10 do projeto` })),
  observacao: 'O DICSDTA descreve "Código CID-10 e Síndromes"; ao exportar, o ponto é retirado. Nos arquivos de 2022 a 2025 aparecem 22 códigos diferentes (sobretudo A08 e A09). Nomes da CID-10 (tabela do TabWin), como o Rubens decidiu na meningite. Os códigos que apareceram nos arquivos e estão na CID-10 foram listados aqui; R699 e N199 não existem na CID-10 (R69 e N19 não têm subcategorias) e ficam como vieram, destacados (pendência). Código novo, que não estiver na lista, também fica como veio.' });
for (const n of ['DT_NOTIFIC', 'SEM_NOT', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_REGIONA', 'ID_UNIDADE', 'ID_PAIS']) col[n] = copia(teta, n);
col.DT_SIN_PRI = c('DT_SIN_PRI', 'DICSDTA', 'p. 2, campo 7', 'Data dos primeiros sintomas do 1º caso suspeito', 'data');
col.SEM_PRI = c('SEM_PRI', 'DICSDTA', 'p. 2, campo interno', 'Semana epidemiológica dos primeiros sintomas do caso índice', 'texto', {
  observacao: 'Nos arquivos de 2022 a 2025 não vem a semana: em 2024 e 2025 vem "0" em todos os registros; em 2022 e 2023, em branco. A semana calculada pela data dos primeiros sintomas está na coluna extra logo depois (regra da semana calculada, 18/11/2026).' });
col.QT_TOTAL_C = num('QT_TOTAL_C', 'p. 2, campo 8', 'Nº de casos suspeitos/expostos até a data da notificação');
col.CS_LOCAL = c('CS_LOCAL', 'FICHASDTA', 'p. 1, campo 9', 'Local inicial de ocorrência do surto', 'categorico', {
  categorias: cats([['1', 'Residência'], ['2', 'Hospital / Unidade de Saúde'], ['3', 'Creche / Escola'], ['4', 'Asilo'], ['5', 'Outras Instituições (alojamento, trabalho)'], ['6', 'Restaurante / Padaria (similares)'], ['7', 'Eventos'], ['8', 'Casos dispersos no bairro'], ['9', 'Casos dispersos pelo município'], ['10', 'Casos dispersos em mais de um município'], ['11', 'Outros']]),
  fora_do_campo: fora('o campo 9 só comporta 1 a 11'), observacao: `Rótulos da ficha (campo 9); o DICSDTA e a tabela OCORRENCIA.CNV do TabWin têm os mesmos códigos. ${REGRA}` });

// ---------- ocorrência (campos 10 a 23)
col.SG_UF = Object.assign(copia(hepa, 'SG_UF'), { fonte: 'DICSDTA', local: 'p. 3, campo 10', rotulo: 'UF de ocorrência', observacao: 'No surto, o campo 10 é a UF de ocorrência do surto (DICSDTA). No arquivo vem o código numérico da UF; o nome vem da tabela do IBGE.' });
col.ID_MUNI_RE = c('ID_MUNI_RE', 'DICSDTA', 'p. 3, campo 11', 'Município de ocorrência', 'municipio', { observacao: 'No surto, o campo 11 é o município de ocorrência do surto (DICSDTA).' });
col.ID_RG_RESI = Object.assign(copia(teta, 'ID_RG_RESI'), { fonte: 'DICSDTA', local: 'p. 3, campo interno', rotulo: 'Regional de saúde de ocorrência (código)',
  observacao: 'O DICSDTA descreve o código da regional de saúde do município de ocorrência. Nos arquivos de 2022 a 2025, porém, a coluna traz em todos os registros o mesmo código de 6 dígitos do município de ocorrência (ID_MUNI_RE). Fica como veio (pendência).' });

// ---------- datas internas
col.DT_DIGITA = c('DT_DIGITA', 'DICSDTA', 'p. 1, campo interno', 'Data da digitação', 'texto', { observacao: 'Nos arquivos de 2022 a 2025 não vem a data: em 2024 e 2025 vem "0" em todos os registros; em 2022 e 2023, em branco. Fica como veio (pendência).' });
const transf = [['DTTRANSUS', 'unidade de saúde'], ['DTTRANSDM', 'distrito municipal'], ['DTTRANSRM', 'regional municipal'], ['DTTRANSSM', 'secretaria municipal de saúde'], ['DTTRANSRS', 'regional de saúde'], ['DTTRANSSE', 'secretaria estadual de saúde']];
for (const [n, nome] of transf) col[n] = c(n, 'DICSDTA', 'p. 5-6, campos internos', `Data de transferência da ${nome}`, n === 'DTTRANSRM' ? 'texto' : 'data',
  { observacao: n === 'DTTRANSRM' ? 'Nos arquivos de 2022 a 2025 não vem a data: em 2024 e 2025 vem "0"; em 2022 e 2023, em branco. Fica como veio (pendência).' : 'Em 2022 e 2023 a data vem como texto no formato americano (mês/dia/ano, por exemplo 4/11/2022), que o programa não converte: sai como veio e vai para as Inconsistências (pendência). Em 2024 e 2025 vem como data.' });
col.DT_INVEST = c('DT_INVEST', 'DICSDTA', 'p. 4, campo 24', 'Data da investigação', 'data');

// ---------- transmissão (campos 25 e 26)
col.CS_TRANS = c('CS_TRANS', 'DICSDTA', 'p. 4, campo 25', 'Modo provável da transmissão', 'categorico', {
  categorias: cats([['1', 'Direta (pessoa a pessoa)'], [['2', 'Indireta'], 'Indireta (veículo comum ou vetor)'], ['9', 'Ignorado']]),
  fora_do_campo: fora('o campo 25 só comporta 1, 2 e 9'), observacao: `Rótulos do DICSDTA e da ficha (campo 25). ${FORMAS} Nos arquivos de 2022 a 2025 vem sempre "Indireta" ou 2. ${REGRA}` });
col.TP_INDIRET = c('TP_INDIRET', 'DICSDTA', 'p. 5, campo 26', 'Se indireta, veículo de transmissão provável', 'categorico', {
  categorias: cats([[['1', 'Alimento/\u00a0gua', 'Alimento/Ã¡gua'], 'Alimento/água'], ['2', 'Recursos hídricos contaminados (poço, rio, reservatório de água)'], ['3', 'Vetor'], ['4', 'Produto (medicamentos, agrotóxico, imunobiológicos, sangue, etc.)'], ['5', 'Fômite (faca, lençóis, etc.)'], ['6', 'Outro'], ['9', 'Ignorado']]),
  fora_do_campo: fora('o campo 26 só comporta 1 a 6 e 9'),
  observacao: `Rótulos do DICSDTA (campo 26); a ficha só mostra "1 - Alimento/Água". ${FORMAS} Em 2022 e 2023 o texto vem "Alimento/ gua" (o "Á" virou um espaço especial); em 2024, "Alimento/Ã¡gua". Nos arquivos de 2022 a 2025 vem sempre alimento/água. ${REGRA}` });

// ---------- investigação: números (campos 27 a 33)
col.NU_ENTR = num('NU_ENTR', 'p. 6, campo 27', 'Número de entrevistados');
col.NU_ENT_DOE = num('NU_ENT_DOE', 'p. 6, campo 28', 'Número de doentes entrevistados');
col.NU_TOT = num('NU_TOT', 'p. 6, campo 29', 'Número total de doentes');
col.NU_TOT_HOS = num('NU_TOT_HOS', 'p. 6, campo 30', 'Número total de hospitalizados');
col.NU_OBITO = num('NU_OBITO', 'p. 7, campo 31', 'Número de óbitos');
const faixas = ['< 1 ano', '1 a 4 anos', '5 a 9 anos', '10 a 19 anos', '20 a 49 anos', '50 anos e mais', 'idade ignorada', 'total'];
const grade = [
  ['masculino', ['NU_1_M_NU', 'NU_1_4_NU', 'NU_5_9_NU', 'NU_10_19_M', 'NU_20_49_N', 'NU_50_M_NU', 'NU_IGRA_NU', 'NU_F_TOT_N']],
  ['feminino', ['NU_1_F_NU', 'NU1_4_F_NU', 'NU5_9_F_NU', 'NU10_19_N', 'NU_20_49_F', 'NU_50_F_NU', 'NU_IG_F_NU', 'NU_TO_F_NU']],
  ['sexo ignorado', ['NU_1_IGN', 'NU_1_4_IGN', 'NU_5_9_IGN', 'NU_10_19IG', 'NU_20_49IG', 'NU_50_IGN', 'NU_IG_IGN', 'NU_TOT_IGN']],
  ['total', ['NU_1_TOT_N', 'NU_1_4_TOT', 'NU_5_9_TOT', 'NU_10_19', 'NU_20_49', 'NU_50_TOT', 'NU_IGN_NU', 'NU_F_TOT']],
];
for (const [sexo, nomes] of grade) nomes.forEach((n, i) => { col[n] = num(n, 'p. 7-10, campo 32', `Doentes por faixa etária e sexo: ${sexo}, ${faixas[i]}`,
  n === 'NU_F_TOT' ? 'Total geral (todas as faixas e sexos). O DTANet.def do TabWin não lista esta coluna; a ligação segue a ordem do DICSDTA.' : n === 'NU_F_TOT_N' ? 'Apesar do "F" no nome, é o total do sexo masculino: o DTANet.def do TabWin traz "Nº Masc. Total, NU_F_TOT_N".' : 'Ligação confirmada pelo DTANet.def do TabWin.'); });
const sinais = [['NU_NAUSE_P', 'náuseas'], ['NU_VOMTO_N', 'vômitos'], ['NU_DIARR_N', 'diarreia'], ['NU_CEFAL_N', 'cefaleia'], ['NU_ABDOM_N', 'dor abdominal'], ['NU_NEURO_N', 'neurológicos'], ['NU_OUTRO_N', 'outros'], ['NU_FEBRE_N', 'febre']];
for (const [n, s] of sinais) col[n] = num(n, 'p. 10-11, campo 33', `Sinais e sintomas: nº de doentes com ${s}`);

// ---------- incubação (campos 34 a 36)
for (const [n, st, nome, campo] of [['NU_INCUB_M', 'ST_INCUB_M', 'mínimo', 34], ['MAX_INC', 'MAX_ST_INC', 'máximo', 35], ['NU_INC_ME', 'ST_INC_ME', 'mediana', 36]]) {
  col[n] = num(n, `p. 11-12, campo ${campo}`, `Período de incubação ${nome === 'mediana' ? '(mediana)' : nome}`, 'Número em horas ou em dias, conforme a coluna seguinte.');
  col[st] = c(st, 'FICHASDTA', `p. 1, campo ${campo}`, `Período de incubação ${nome === 'mediana' ? '(mediana)' : nome}: unidade`, 'categorico', { lista: 'horas_dias', fora_do_campo: fora(`o campo ${campo} só comporta 1 e 2`), observacao: `A ficha (campo ${campo}) escreve "1 - Horas" e "2 - Dias". ${REGRA}` });
}

// ---------- locais (campos 37 e 38)
col.TP_PRO_PRE = c('TP_PRO_PRE', 'FICHASDTA', 'p. 1, campo 37', 'Local de produção/preparação', 'categorico', { lista: 'local_producao', fora_do_campo: fora('o campo 37 só comporta 01 a 11 e 99'),
  observacao: `Rótulos da ficha (campo 37); o DICSDTA e a tabela Locproducao.cnv do TabWin (2019) têm os mesmos códigos. ${ZEROS} ${REGRA}` });
col.TP_LOCAL = c('TP_LOCAL', 'FICHASDTA', 'p. 1, campo 38', 'Local de ingestão', 'categorico', { lista: 'local_producao', fora_do_campo: fora('o campo 38 só comporta 01 a 11 e 99'),
  observacao: `Rótulos da ficha (campo 38), iguais aos do campo 37. Nenhum documento dá o nome da coluna do campo 38 (o DICSDTA e o DTANet.def não citam TP_LOCAL); a ligação é uma interpretação, pelos códigos e pela posição no arquivo, logo depois do modo de transmissão (pendência). ${ZEROS} O "0" (1 registro) e o "8" (1 registro, forma sem zero) aparecem em 2023. ${REGRA}` });

// ---------- fatores causais (campo 39)
const fatores = [['ST_IMPRO', 'matéria-prima imprópria'], ['ST_INAD', 'conservação inadequada'], ['ST_MANIP', 'manipulação/preparação inadequada'], ['ST_F_OUTRO', 'outros']];
for (const [n, nome] of fatores) col[n] = c(n, 'DICSDTA', 'p. 12, campo 39', `Fatores causais: ${nome}`, 'categorico', { lista: 'sn9_texto', fora_do_campo: fora('o campo 39 só comporta 1, 2 e 9'),
  observacao: `Categorias do DICSDTA e da ficha (campo 39): 1 - Sim, 2 - Não, 9 - Ignorado. ${FORMAS} ${REGRA}` });
col.ST_IMPRO_ = Object.assign(structuredClone(col.ST_IMPRO), { nome: 'ST_IMPRO_', observacao: `É a mesma coluna ST_IMPRO, que no arquivo de 2023 (SDTABR23) vem com o nome ST_IMPRO_. ${col.ST_IMPRO.observacao}` });
col.DS_F_OUTRO = c('DS_F_OUTRO', 'DICSDTA', 'p. 12, campo 39', 'Fatores causais: outros (especificar)', 'texto', { observacao: 'Texto livre; fica como veio.' });

// ---------- amostras clínicas (campos 40 a 47)
col.ST_A_CLINI = c('ST_A_CLINI', 'DICSDTA', 'p. 12, campo 40', 'Coletadas amostras clínicas', 'categorico', { lista: 'sn9', fora_do_campo: fora('o campo 40 só comporta 1, 2 e 9'), observacao: REGRA });
col.NU_A_CLINI = num('NU_A_CLINI', 'p. 12, campo 41', 'Amostras clínicas: nº de amostras coletadas');
col.NU_CLI_NUM = num('NU_CLI_NUM', 'p. 13, campo 43', 'Amostras clínicas: nº de positivas (resultado 1)');
col.NU_NUM_2 = num('NU_NUM_2', 'p. 13, campo 45', 'Amostras clínicas: nº de positivas (resultado 2)');
col.NU_RESU_3 = c('NU_RESU_3', 'DICSDTA', 'p. 13, campo 46', 'Amostras clínicas: resultado 3 (outro achado)', 'texto', {
  observacao: 'O DICSDTA põe NU_RESU_3 no campo 46 (resultado 3, nome do agente, texto), mas no arquivo a coluna só traz números (0 a 9), como a coluna NU_NUM_3 (nº de positivas). Fica como veio (pendência).' });
col.NU_NUM_3 = num('NU_NUM_3', 'p. 13, campo 47', 'Amostras clínicas: nº de positivas (resultado 3)');

// ---------- amostras bromatológicas (campos 48 a 55)
col.ST_ALIMEN = c('ST_ALIMEN', 'DICSDTA', 'p. 14, campo 48', 'Coletadas amostras de alimentos', 'categorico', { lista: 'sn9', fora_do_campo: fora('o campo 48 só comporta 1, 2 e 9'), observacao: REGRA });
col.NU_A_ALIM = num('NU_A_ALIM', 'p. 14, campo 49', 'Amostras de alimentos: nº de amostras coletadas');
col.NU_A_NUM_1 = num('NU_A_NUM_1', 'p. 14, campo 51', 'Amostras de alimentos: nº de positivas (resultado 1)');
col.NU_A_NUM_2 = num('NU_A_NUM_2', 'p. 15, campo 53', 'Amostras de alimentos: nº de positivas (resultado 2)');
col.NU_A_NUM_3 = num('NU_A_NUM_3', 'p. 15, campo 55', 'Amostras de alimentos: nº de positivas (resultado 3)');

// ---------- conclusão (campos 56 a 59)
for (const [n, k] of [['AGENTE_ET1', 'primeiro'], ['AGENTE_ET2', 'segundo'], ['AGENTE_ET3', 'terceiro']])
  col[n] = c(n, 'AJUSTESDTA', 'p. 1, campo 56', `Agente etiológico do surto: ${k} agente`, 'texto', { observacao: 'Texto livre (nome do agente identificado nos resultados laboratoriais); fica como veio, inclusive os acentos estragados de alguns anos (por exemplo, "Norov¡rus"). Substitui DS_ETIOLOG pela Nota Técnica nº 45/2024.' });
col.ALIMENTO_C = c('ALIMENTO_C', 'AJUSTESDTA', 'p. 1, campo 57', 'Alimento causador do surto', 'texto', { observacao: 'Texto livre; fica como veio, inclusive os acentos estragados de alguns anos (por exemplo, "µgua", "Ãgua"). Substitui DS_ALICAUS pela Nota Técnica nº 45/2024.' });
col.CRITERIO = c('CRITERIO', 'FICHASDTA', 'p. 2, campo 58', 'Critério de confirmação (referente ao agente etiológico)', 'categorico', {
  categorias: cats([['1', 'Clínico-epidemiológico'], ['2', 'Laboratorial clínico'], ['3', 'Laboratorial bromatológico'], ['4', 'Laboratorial clínico bromatológico'], ['5', 'Inconclusivo']]),
  fora_do_campo: fora('o campo 58 só comporta 1 a 5'), observacao: `Rótulos da ficha (campo 58); o DICSDTA e a tabela Confdescsurto.cnv do TabWin têm os mesmos códigos. ${REGRA}` });
col.DT_ENCERRA = c('DT_ENCERRA', 'DICSDTA', 'p. 16, campo 59', 'Data do encerramento', 'data', { observacao: 'Em 2022 e 2023, parte dos registros traz "-0010101" (297 registros), que não é data: sai como veio e vai para as Inconsistências.' });

const ORDEM = 'TP_NOT ID_AGRAVO DT_NOTIFIC SEM_NOT NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA ID_UNIDADE DT_SIN_PRI SEM_PRI QT_TOTAL_C CS_LOCAL SG_UF ID_MUNI_RE ID_RG_RESI ID_PAIS DT_DIGITA DTTRANSUS DTTRANSDM DTTRANSRM DTTRANSSM DTTRANSRS DTTRANSSE DT_INVEST CS_TRANS TP_INDIRET TP_LOCAL NU_ENTR NU_ENT_DOE NU_TOT NU_TOT_HOS NU_OBITO NU_1_M_NU NU_1_4_NU NU_5_9_NU NU_10_19_M NU_20_49_N NU_50_M_NU NU_IGRA_NU NU_F_TOT_N NU_1_F_NU NU1_4_F_NU NU5_9_F_NU NU10_19_N NU_20_49_F NU_50_F_NU NU_IG_F_NU NU_TO_F_NU NU_1_IGN NU_1_4_IGN NU_5_9_IGN NU_10_19IG NU_20_49IG NU_50_IGN NU_IG_IGN NU_TOT_IGN NU_1_TOT_N NU_1_4_TOT NU_5_9_TOT NU_10_19 NU_20_49 NU_50_TOT NU_IGN_NU NU_F_TOT NU_NAUSE_P NU_VOMTO_N NU_DIARR_N NU_CEFAL_N NU_ABDOM_N NU_NEURO_N NU_OUTRO_N NU_FEBRE_N NU_INCUB_M ST_INCUB_M MAX_INC MAX_ST_INC NU_INC_ME ST_INC_ME TP_PRO_PRE ST_IMPRO ST_IMPRO_ ST_INAD ST_MANIP ST_F_OUTRO DS_F_OUTRO ST_A_CLINI NU_A_CLINI NU_CLI_NUM NU_NUM_2 NU_RESU_3 NU_NUM_3 ST_ALIMEN NU_A_ALIM NU_A_NUM_1 NU_A_NUM_2 NU_A_NUM_3 CRITERIO DT_ENCERRA AGENTE_ET1 AGENTE_ET2 AGENTE_ET3 ALIMENTO_C'.split(' ');
for (const n of ORDEM) if (!col[n]) throw new Error(`falta ${n}`);
if (Object.keys(col).length !== ORDEM.length) throw new Error('colunas a mais');

const derivadas = structuredClone(teta.derivadas)
  .filter((d) => d.de === 'ID_MUNICIP' || d.de === 'ID_MN_RESI')
  .map((d) => (d.de === 'ID_MN_RESI' ? { ...d, de: 'ID_MUNI_RE', depois_de: 'ID_RG_RESI', rotulo: d.rotulo.replace('residência', 'ocorrência'), nome: d.nome.replace('_RES', '_OCO'), observacao: d.observacao.replace('município de residência', 'município de ocorrência (ID_MUNI_RE)').replace(' Não é a regional do Sinan (ID_RG_RESI).', '') } : d));
derivadas.push({ nome: 'SEM_PRI_CALC', rotulo: 'Semana epidemiológica dos primeiros sintomas (calculada pela data dos primeiros sintomas)', de: 'DT_SIN_PRI', calculo: 'semana_epidemiologica', depois_de: 'SEM_PRI',
  observacao: 'Coluna extra (regra do Rubens, 18/11/2026, para semanas que não vêm no arquivo): semana epidemiológica (AAAASS) calculada da data dos primeiros sintomas do 1º caso, pelo calendário epidemiológico (semana de domingo a sábado; a semana 1 é a que contém 4 de janeiro). Regra conferida contra cerca de 2,5 milhões de semanas gravadas pelo Sinan nos arquivos públicos, todas iguais. A coluna SEM_PRI continua como veio.' });

const dic = {
  formato: teta.formato,
  agravo: { nome: 'Surto de doenças transmitidas por alimentos (DTA)', codigos: ['3'], coluna: 'TP_NOT' },
  versao: 'Dados públicos do DATASUS (arquivos SDTABRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: false, por: '', data: '', registro: '' },
  convencoes: teta.convencoes,
  fontes,
  tabelas: teta.tabelas,
  listas,
  derivadas,
  colunas: ORDEM.map((n) => col[n]),
  pendencias: [
    { coluna: 'Campos vazios com bytes nulos (2022 e 2023)', descricao: 'Resolvida (Rubens, 19/11/2026): valor feito só de bytes nulos (o caractere de código 0, forma dos arquivos de 2022 e 2023 gravarem o campo vazio) vale como campo em branco, como os asteriscos, com a quantidade na aba Resumo. Regra do programa, para todos os agravos (docs/requisitos.md, seção 6.2).' },
    { coluna: 'Formas de texto e acentos estragados', descricao: 'Em 2022 a 2024 as colunas CS_TRANS, TP_INDIRET e ST_IMPRO, ST_INAD, ST_MANIP e ST_F_OUTRO vêm com o texto já escrito, às vezes com o acento estragado ("NÆo", "NÃ£o", "Alimento/ gua", "Alimento/Ã¡gua"); em 2025, com o código. Cada forma entrou como mais um código da mesma categoria (plano aprovado). Conferir na aba Categorias e Listas.' },
    { coluna: 'Identificação do arquivo', descricao: 'No surto o CID muda de surto para surto (22 códigos diferentes). Para reconhecer o arquivo de surto, o programa olha o tipo de notificação (TP_NOT = 3, sempre surto), e não o CID. Confirmar.' },
    { coluna: 'ID_AGRAVO', descricao: 'Nomes da CID-10 para os 20 códigos que aparecem nos arquivos e existem na CID-10. R699 (26 registros) e N199 (1) não existem na CID-10 e ficam como vieram. Alternativa: usar a tabela de agravos do Sinan (AGRAVNET.DBF, do TabWin), que o DTANet.def usa para este campo. Decidir.' },
    { coluna: 'ID_RG_RESI', descricao: 'Deveria ser o código da regional de saúde de ocorrência, mas traz em 100% dos registros o mesmo código do município de ocorrência. Fica como veio. Confirmar.' },
    { coluna: 'TP_LOCAL (local de ingestão)', descricao: 'Nenhum documento diz o nome da coluna do campo 38 (local de ingestão). TP_LOCAL tem os códigos do campo 38 (01 a 11 e 99) e foi ligada a ele por interpretação. Confirmar.' },
    { coluna: 'NU_RESU_3', descricao: 'O DICSDTA diz que é o resultado 3 das amostras clínicas (texto), mas a coluna só traz números de 0 a 9, como o nº de positivas. Fica como veio. Confirmar.' },
    { coluna: 'Datas em formato americano', descricao: 'Em 2022 e 2023 as datas de transferência vêm como texto mês/dia/ano (4/11/2022), que o programa não converte; saem como vieram e vão para as Inconsistências. Converter exigiria mudar o programa, com risco de confundir dia e mês. Decidir.' },
    { coluna: 'Campos sem valor (SEM_PRI, DT_DIGITA, DTTRANSRM)', descricao: 'Vêm "0" (2024 e 2025) ou em branco (2022 e 2023) em todos os registros. Ficam como vieram; para SEM_PRI foi criada a semana calculada pela data dos primeiros sintomas. Confirmar.' },
    { coluna: 'ST_IMPRO_', descricao: 'No arquivo de 2023 a coluna ST_IMPRO vem com o nome ST_IMPRO_. As duas entraram no dicionário, com a mesma tradução. Confirmar.' },
    { coluna: 'Colunas do DICSDTA fora do arquivo', descricao: 'O DICSDTA descreve outros campos que não vêm no arquivo público (nome do local, endereço, observações, resultados das amostras por extenso, DS_ETIOLOG e DS_ALICAUS antigos). Não entraram. Se o Rubens quiser, como na meningite e nas hepatites, podem ser acrescentados. Decidir.' },
  ],
};
writeFileSync(`${raiz}dicionarios/surto-dta.json`, JSON.stringify(dic, null, 2).replace(/\n/g, '\r\n') + '\r\n');
console.log('ok', dic.colunas.length, 'colunas', dic.derivadas.length, 'extras');
