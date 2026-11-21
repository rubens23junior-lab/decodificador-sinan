// Gera dicionarios/tuberculose.json a partir das fontes oficiais de docs/fontes/tuberculose.
// Campos da notificação copiados das hepatites e campos internos copiados da hanseníase (dicionários conferidos).
// Atenção: depois da conferência do Rubens, as correções vão direto no JSON; não rodar de novo.
import { readFileSync, writeFileSync } from 'node:fs';
const raiz = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // pasta principal do projeto
const ler = (a) => JSON.parse(readFileSync(`${raiz}dicionarios/${a}.json`, 'utf8'));
const hepa = ler('hepatites-virais');
const hans = ler('hanseniase');
const copia = (d, n) => structuredClone(d.colunas.find((x) => x.nome === n));
const REGRA = 'Códigos que o campo não comporta saem como "Inconsistência/Não Preenchido" (regra geral do Rubens, 16/11/2026).';
const fora = (campo, comporta) => ({ rotulo: 'Inconsistência/Não Preenchido', motivo: `Código sem fonte oficial: o campo ${campo} só comporta ${comporta}` });
const cats = (pares) => pares.map(([k, r]) => ({ codigos: Array.isArray(k) ? k : [k], rotulo: r }));
const PACOTE = 'Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026); copiado para o projeto em 20/11/2026';

const fontes = {
  DICTUBE: { documento: 'Dicionário de Dados – Sinan NET – versão 5.0 – Tuberculose (campos 31 a 66, acompanhamento e oportunidade)', orgao: 'Ministério da Saúde / SVS / DEVEP / CIEVS / GT-Sinan',
    data: `Sem data impressa (22 páginas); corresponde à ficha de 2014 (mesmos campos e números). ${PACOTE}.`, arquivo: 'docs/fontes/tuberculose/TUBEN_DIC_DADOS.pdf' },
  FICHATUBE: { documento: 'Ficha de Notificação/Investigação – Tuberculose – Sinan NET', orgao: 'Ministério da Saúde / SVS', data: `SVS 02/10/2014 (rodapé). ${PACOTE}.`, arquivo: 'docs/fontes/tuberculose/TUBEN_FICHA.pdf' },
  ACOMPTUBE: { documento: 'Tela de acompanhamento de tuberculose – Sinan NET (campos 48 a 66)', orgao: 'Ministério da Saúde / SVS', data: `SVS 09/01/2014 (rodapé). ${PACOTE}.`, arquivo: 'docs/fontes/tuberculose/TUBEN_FICHA_ACOMP.pdf' },
  INSTTUBE: { documento: 'Instruções para o preenchimento da ficha de notificação/investigação – Tuberculose – Sinan NET 5.0', orgao: 'Ministério da Saúde / SVS', data: `${PACOTE}.`, arquivo: 'docs/fontes/tuberculose/TUBEN_INSTRUCIONAL.pdf' },
  TABTUBE: { documento: 'Arquivo de definições do TabWin para investigação de tuberculose (TuberculNET5_0.def) e conversões (SIM_NAO, Posnegnr, Posnegnrna, POSNEGEM, BASUTBEM, SUNOPANR, NAOREATO, CUABTRFA2, FORMA, EXTRAPULNET, institutb, CUABOBT9net, sit12mes, encerra, TMR_TB, SENSIBIL, TP_TRANSF)', orgao: 'Ministério da Saúde / GT-Sinan e UT-Sinan',
    data: 'Atualizado até 15/04/2011 (cabeçalho do .def); algumas conversões revisadas pela UT-Sinan em 2019. Pacote TAB_SINANNET do DATASUS.', arquivo: 'docs/fontes/tabelas-apoio/TAB_SINANNET/TuberculNET5_0.def' },
  DICHANS: hans.fontes.DICHANS,
};
for (const [id, f] of Object.entries(hepa.fontes)) if (!/HEPA$/.test(id)) fontes[id] = f;

const listas = {
  sn9: cats([['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']]),
  sn: cats([['1', 'Sim'], ['2', 'Não']]),
  baciloscopia: cats([['1', 'Positiva'], ['2', 'Negativa'], ['3', 'Não realizada'], ['4', 'Não se aplica']]),
  extrapulmonar: cats([['1', 'Pleural'], ['2', 'Gang. Perif.'], ['3', 'Geniturinária'], ['4', 'Óssea'], ['5', 'Ocular'], ['6', 'Miliar'], ['7', 'Meningoencefálico'], ['8', 'Cutânea'], ['9', 'Laringea'], ['10', 'Outra']]),
  positivo_negativo_antigo: cats([['1', 'Positivo'], ['2', 'Negativo'], ['3', 'Não realizado']]),
};

const col = {};
for (const n of ['TP_NOT', 'DT_NOTIFIC', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_REGIONA', 'NU_IDADE_N', 'CS_SEXO', 'CS_GESTANT', 'CS_RACA', 'CS_ESCOL_N', 'SG_UF', 'ID_MN_RESI', 'ID_RG_RESI', 'ID_PAIS']) col[n] = copia(hepa, n);
for (const cat of col.CS_ESCOL_N.categorias) if (cat.fonte === 'FICHAHEPA') Object.assign(cat, { fonte: 'FICHATUBE', local: 'p. 1, campo 14' });
col.CS_ESCOL_N.observacao = col.CS_ESCOL_N.observacao.replace('o 0 vem da ficha de tétano acidental (p. 1, campo 14)', 'o 0 vem da ficha de tuberculose (campo 14)');
col.CS_GESTANT.observacao = 'As formas com um e dois dígitos (01 e 1) entram (regra do Rubens); 9, 09 e 99 = Ignorado (decisão do Rubens nas hepatites, 19/11/2026). ' + REGRA;
col.CS_RACA.fora_do_campo = fora(13, '1 a 5 e 9');
col.CS_RACA.observacao = `O código 6 aparece em 1 registro. ${REGRA}`;
for (const n of ['ANO_NASC', 'NDUPLIC_N', 'IN_VINCULA', 'DT_DIGITA', 'DT_TRANSUS', 'DT_TRANSDM', 'DT_TRANSSM', 'DT_TRANSRM', 'DT_TRANSRS', 'DT_TRANSSE', 'CS_FLXRET', 'FLXRECEBI', 'MIGRADO_W']) col[n] = copia(hans, n);
col.ANO_NASC.observacao = 'O NOTIF2018 descreve a data de nascimento (DT_NASC); o arquivo público traz só o ano, na coluna ANO_NASC. Fica como veio.';
col.IN_VINCULA.observacao = 'Indica se a notificação foi vinculada (a categoria 1 é atribuída pelo sistema após a vinculação de notificações de hanseníase ou tuberculose). Rótulos do dicionário de hanseníase, já conferido; o dicionário de tuberculose cita as regras de vinculação sem listar os códigos.';
col.MIGRADO_W.observacao = 'Rótulo do NOTIF2018, como na hanseníase. Vem em branco em todos os registros de 2020 a 2025.';

col.ID_AGRAVO = { nome: 'ID_AGRAVO', fonte: 'FICHATUBE', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
  categorias: [{ codigos: ['A169', 'A16.9', 'A 16. 9', 'A 16.9', 'A16.'], rotulo: 'Tuberculose respiratória, não especificada, sem menção de confirmação bacteriológica ou histológica', fonte: 'CID10_TABWIN', local: 'CID10_01.CNV, código A169 (nome completado pela CSV da CID-10, como na tabela do projeto)' }],
  observacao: "A ficha mostra 'TUBERCULOSE' com o CID 'A 16. 9'; no arquivo vem 'A169' (regra do Rubens: o CID como na ficha e sem ponto e espaços). Em cerca de 2% dos registros (12.089 de 2020 a 2025) vem 'A16.': o campo tem 4 posições, e a forma da ficha com ponto ('A16.9') fica cortada no ponto; por isso 'A16.' entrou como forma do mesmo CID (pendência). Rótulo da CID-10 (tabela do TabWin), como o Rubens decidiu na meningite (19/11/2026)." };
col.DT_DIAG = { nome: 'DT_DIAG', fonte: 'INSTTUBE', local: 'p. 1, item 7', rotulo: 'Data do diagnóstico ou da evidência laboratorial e/ou clínica', tipo: 'data',
  observacao: 'Ficha, campo 7 ("Data do Diagnóstico"). Instrucional, item 7: "data do diagnóstico ou da evidência laboratorial e/ou clínica da doença de acordo com a definição de caso vigente no momento da notificação". Nome como no HIV (decisão do Rubens, 20/11/2026).' };
col.TPUNINOT = { nome: 'TPUNINOT', fonte: 'NOTIF2018', local: 'não aparece na fonte', rotulo: 'Tipo da unidade notificadora (estabelecimento de saúde que realizou o registro do caso)', tipo: 'codigo',
  observacao: 'Nenhum documento de tuberculose descreve esta coluna. O nome legível é o que o Rubens decidiu na violência (10/11/2026), sem documento oficial; os códigos ficam como vieram (pendência).' };
col.ID_OCUPA_N = { ...copia(hans, 'ID_OCUPA_N'), fonte: 'TABTUBE', local: 'TuberculNET5_0.def, "Ocupação"', observacao: copia(hans, 'ID_OCUPA_N').observacao + ' A ficha de tuberculose de 2014 não tem o campo de ocupação; o TuberculNET.def o inclui desde 2010. Vem preenchida em só 10 registros de 2020 a 2025.' };

const D = (nome, local, rotulo, tipo, extra = {}) => ({ nome, fonte: 'DICTUBE', local, rotulo, tipo, ...extra });
const L = (nome, local, rotulo, lista, campo, comporta, obs) => D(nome, local, rotulo, 'categorico', { lista, fora_do_campo: fora(campo, comporta), observacao: [obs, REGRA].filter(Boolean).join(' ') });
const C = (nome, local, rotulo, pares, campo, comporta, obs) => D(nome, local, rotulo, 'categorico', { categorias: cats(pares), fora_do_campo: fora(campo, comporta), observacao: [obs, REGRA].filter(Boolean).join(' ') });
const NOME_ARQ = (dic) => `No DICTUBE a coluna se chama ${dic}; no arquivo, com o nome encurtado (ligação pelo número do campo e pelo TuberculNET5_0.def).`;
const ANTIGO = 'Campo da ficha anterior à de 2014: não está no DICTUBE nem na ficha atual; nome e códigos pelo TuberculNET5_0.def do TabWin (pendência).';

col.TRATAMENTO = C('TRATAMENTO', 'p. 1, campo 32', 'Tipo de entrada', [['1', 'Caso Novo'], ['2', 'Recidiva'], ['3', 'Reingresso após Abandono'], ['4', 'Não Sabe'], ['5', 'Transferência'], ['6', 'Pós-óbito']], 32, '1 a 6');
col.INSTITUCIO = D('INSTITUCIO', 'TuberculNET5_0.def', 'Institucionalizado (ficha anterior)', 'categorico', { fonte: 'TABTUBE',
  categorias: cats([['1', 'Não'], ['2', 'Presídio'], ['3', 'Asilo'], ['4', 'Orfanato'], ['5', 'Hospital Psiquiátrico'], ['6', 'Outro']]),
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: a conversão institutb.cnv só tem 1 a 6' },
  observacao: `${ANTIGO} Rótulos do institutb.cnv (revisado em 2019). Vem preenchido em só 74 registros de 2020 a 2025. ${REGRA}` });
col.RAIOX_TORA = C('RAIOX_TORA', 'p. 6, campo 39', 'Radiografia do tórax', [['1', 'Suspeito'], ['2', 'Normal'], ['3', 'Outra patologia'], ['4', 'Não realizado']], 39, '1 a 4');
col.TESTE_TUBE = D('TESTE_TUBE', 'TuberculNET5_0.def', 'Teste tuberculínico (ficha anterior)', 'categorico', { fonte: 'TABTUBE',
  categorias: cats([['1', 'Não reator'], ['2', 'Reator fraco'], ['3', 'Reator forte'], ['4', 'Não realizado']]),
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: a conversão NAOREATO.CNV só tem 1 a 4' },
  observacao: `${ANTIGO} Rótulos do NAOREATO.CNV, que os escreve em maiúsculas. Vem preenchido em só 72 registros. ${REGRA}` });
col.FORMA = C('FORMA', 'p. 3, campo 35', 'Forma', [['1', 'Pulmonar'], ['2', 'Extrapulmonar'], ['3', 'Pulmonar + Extrapulmonar']], 35, '1, 2 e 3');
col.EXTRAPU1_N = L('EXTRAPU1_N', 'p. 4, campo 36', 'Se extrapulmonar', 'extrapulmonar', 36, '1 a 10', `${NOME_ARQ('EXTRAPU_N')} Rótulos do DICTUBE e da ficha ("Laringea", sem acento, como nas duas fontes). Formas como "1/", "2,", "6/" e "[2" (5 registros) saem como inconsistência.`);
col.EXTRAPU2_N = D('EXTRAPU2_N', 'TuberculNET5_0.def', 'Se extrapulmonar: segunda localização (ficha anterior)', 'categorico', { fonte: 'TABTUBE', lista: 'extrapulmonar',
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: a conversão EXTRAPULNET.CNV só tem 1 a 10' },
  observacao: `${ANTIGO} O EXTRAPULNET.CNV usa os mesmos códigos 1 a 10 do campo 36 atual (nomes em maiúsculas); ficaram os rótulos do campo 36. Vem preenchido em cerca de 4.800 registros. ${REGRA}` });
const AGR = [['AGRAVAIDS', 'Aids', 'p. 4-5'], ['AGRAVALCOO', 'Alcoolismo', 'p. 5'], ['AGRAVDIABE', 'Diabetes', 'p. 5'], ['AGRAVDOENC', 'Doença mental', 'p. 5'], ['AGRAVDROGA', 'Uso de drogas ilícitas', 'p. 5', 'AGRAVDROGAS'], ['AGRAVTABAC', 'Tabagismo', 'p. 5', 'AGRAVTABACO'], ['AGRAVOUTRA', 'Outras', 'p. 5']];
for (const [n, r, p, dic] of AGR) col[n] = L(n, `${p}, campo 37`, `Doenças e agravos associados: ${r}`, 'sn9', 37, '1, 2 e 9', [dic && NOME_ARQ(dic), n === 'AGRAVOUTRA' && 'Valores como "/", "E", "H" e "X" (7 registros) saem como inconsistência.'].filter(Boolean).join(' '));
col.BACILOSC_E = L('BACILOSC_E', 'p. 6, campo 38', 'Baciloscopia de escarro (diagnóstico)', 'baciloscopia', 38, '1 a 4');
col.BACILOS_E2 = D('BACILOS_E2', 'TuberculNET5_0.def', '2ª baciloscopia de escarro (ficha anterior)', 'categorico', { fonte: 'TABTUBE', lista: 'positivo_negativo_antigo',
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: a conversão Posnegnr.cnv só tem 1, 2 e 3' }, observacao: `${ANTIGO} Rótulos do Posnegnr.cnv. Vem preenchido em só 94 registros. ${REGRA}` });
col.BACILOSC_O = D('BACILOSC_O', 'TuberculNET5_0.def', 'Baciloscopia de outro material (ficha anterior)', 'categorico', { fonte: 'TABTUBE', lista: 'positivo_negativo_antigo',
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: a conversão Posnegnr.cnv só tem 1, 2 e 3' }, observacao: `${ANTIGO} Rótulos do Posnegnr.cnv. Vem preenchido em só 77 registros. ${REGRA}` });
col.CULTURA_ES = C('CULTURA_ES', 'p. 7, campo 43', 'Cultura', [['1', 'Positiva'], ['2', 'Negativa'], ['3', 'Em andamento'], ['4', 'Não realizada']], 43, '1 a 4', 'O TuberculNET5_0.def chama a coluna de "Cultura Escarro".');
col.CULTURA_OU = D('CULTURA_OU', 'TuberculNET5_0.def', 'Cultura de outro material (ficha anterior)', 'categorico', { fonte: 'TABTUBE',
  categorias: cats([['1', 'Positivo'], ['2', 'Negativo'], ['3', 'Em andamento'], ['4', 'Não realizado']]),
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: a conversão POSNEGEM.CNV só tem 1 a 4' }, observacao: `${ANTIGO} Rótulos do POSNEGEM.CNV. Vem preenchido em só 77 registros. ${REGRA}` });
col.HIV = C('HIV', 'p. 6, campo 40', 'HIV', [['1', 'Positivo'], ['2', 'Negativo'], ['3', 'Em andamento'], ['4', 'Não realizado']], 40, '1 a 4');
col.HISTOPATOL = C('HISTOPATOL', 'p. 7, campo 42', 'Histopatologia', [['1', 'Baar Positivo'], ['2', 'Sugestivo de TB'], ['3', 'Não sugestivo de TB'], ['4', 'Em andamento'], ['5', 'Não realizado']], 42, '1 a 5', 'O código 6 aparece em 212 registros e sai como inconsistência.');
col.DT_INIC_TR = D('DT_INIC_TR', 'p. 9, campo 46', 'Data de início do tratamento atual', 'data');
const DROGAS = [['RIFAMPICIN', 'rifampicina'], ['ISONIAZIDA', 'isoniazida'], ['ETAMBUTOL', 'etambutol'], ['ESTREPTOMI', 'estreptomicina'], ['PIRAZINAMI', 'pirazinamida'], ['ETIONAMIDA', 'etionamida'], ['OUTRAS', 'outras']];
for (const [n, r] of DROGAS) col[n] = D(n, 'TuberculNET5_0.def', `Drogas em uso (ficha anterior): ${r}`, 'categorico', { fonte: 'TABTUBE', lista: 'sn',
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: a conversão SIM_NAO.CNV só tem 1 e 2' },
  observacao: `${ANTIGO} O .def chama a coluna de "Drog ${r.toUpperCase()}"; códigos do SIM_NAO.CNV (1 Sim, 2 Não). Vem preenchido em menos de 50 registros. ${REGRA}` });
col.TRAT_SUPER = D('TRAT_SUPER', 'TuberculNET5_0.def', 'Tratamento supervisionado indicado (ficha anterior)', 'categorico', { fonte: 'TABTUBE', lista: 'sn9',
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: o SIM_NAO.CNV só tem 1 e 2 (e o 9 junto do Ign/Branco)' },
  observacao: `${ANTIGO} Códigos do SIM_NAO.CNV; o 9, que o TabWin agrupa como "Ign/Branco", ficou Ignorado. Vem preenchido em cerca de 139 mil registros (23%). ${REGRA}` });
col.NU_CONTATO = D('NU_CONTATO', 'p. 9, campo 47', 'Total de contatos identificados', 'numero', { observacao: `${NOME_ARQ('NU_COMU_ID')} Valores só com asteriscos ("**", 128 registros) valem como campo em branco (regra do Rubens).` });
col.DOENCA_TRA = D('DOENCA_TRA', 'TuberculNET5_0.def', 'Doença relacionada ao trabalho', 'categorico', { fonte: 'TABTUBE', lista: 'sn9', fora_do_campo: fora('de doença relacionada ao trabalho', '1, 2 e 9'),
  observacao: `O DICTUBE e a ficha de 2014 não têm este campo; o TuberculNET5_0.def lê a coluna com o SIM_NAO.CNV. Nos arquivos de 2020 a 2025 vem "0" em cerca de 129 mil registros e números de 1 a 9 em poucos (pendência). ${REGRA}` });
col.SG_UF_AT = D('SG_UF_AT', 'p. 9, campo 48', 'UF de notificação atual', 'uf', { observacao: `${NOME_ARQ('SG_UF_ATUAL')} No arquivo vem o código numérico da UF (IBGE).` });
col.ID_MUNIC_A = D('ID_MUNIC_A', 'p. 10, campo 49', 'Município de notificação atual', 'municipio', { observacao: NOME_ARQ('ID_MUNIC_AT') });
col.DT_NOTI_AT = D('DT_NOTI_AT', 'p. 11, campo 51', 'Data da notificação atual', 'data');
col.SG_UF_2 = D('SG_UF_2', 'p. 12, campo 53', 'UF de residência atual', 'uf', { observacao: 'No arquivo vem o código numérico da UF (IBGE).' });
col.ID_MUNIC_2 = D('ID_MUNIC_2', 'p. 13, campo 54', 'Município de residência atual', 'municipio');
for (const i of [1, 2, 3, 4, 5, 6]) col[`BACILOSC_${i}`] = L(`BACILOSC_${i}`, `p. ${i <= 3 ? 16 : 17}, campo 58`, `Baciloscopia de acompanhamento (escarro): ${i}º mês`, 'baciloscopia', 58, '1 a 4');
col.BAC_APOS_6 = L('BAC_APOS_6', 'p. 17-18, campo 58', 'Baciloscopia de acompanhamento (escarro): após o 6º mês', 'baciloscopia', 58, '1 a 4', `${NOME_ARQ('BACILOSC_APOS_6')} Valores como 0, 5, 6, 8, 9, "x", "q", "T" e sinais de pontuação (cerca de 170 registros) saem como inconsistência.`);
col.TRATSUP_AT = L('TRATSUP_AT', 'p. 18, campo 60', 'Tratamento Diretamente Observado (TDO) realizado', 'sn9', 60, '1, 2 e 9', 'Vem em branco em todos os registros de 2020 a 2025.');
col.DT_MUDANCA = D('DT_MUDANCA', 'TuberculNET5_0.def', 'Data da mudança de tratamento (ficha anterior)', 'data', { fonte: 'TABTUBE', observacao: `${ANTIGO.replace('nome e códigos', 'nome')} O nome legível é uma interpretação do nome da coluna (pendência). Vem preenchida em só 4 registros.` });
col.NU_COMU_EX = D('NU_COMU_EX', 'p. 19, campo 61', 'Total de contatos examinados', 'numero', { observacao: NOME_ARQ('NU_CONT_EX') });
col.SITUA_9_M = D('SITUA_9_M', 'TuberculNET5_0.def', 'Situação no 9º mês (ficha anterior)', 'categorico', { fonte: 'TABTUBE',
  categorias: cats([['1', 'Cura'], ['2', 'Abandono'], ['3', 'Óbito por tuberculose'], ['4', 'Óbito por outras causas'], ['5', 'Transferência p/ mesmo município'], ['6', 'Transferência p/ Outro Município'], ['7', 'Transferência p/ Outra UF'], ['8', 'Transferência p/ Outro País'], ['9', 'Mudança de Esquema'], ['10', 'Mudança de Diagnóstico'], ['11', 'Falência'], ['12', 'Continua em Tratamento'], ['13', 'TB Multirresistente']]),
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: a conversão CUABOBT9net.CNV só tem 1 a 13' }, observacao: `${ANTIGO} Rótulos do CUABOBT9net.CNV. Vem preenchida em só 85 registros. ${REGRA}` });
col.SITUA_12_M = D('SITUA_12_M', 'TuberculNET5_0.def', 'Situação no 12º mês (ficha anterior)', 'categorico', { fonte: 'TABTUBE',
  categorias: cats([['1', 'Cura'], ['2', 'Abandono'], ['3', 'Óbito por tuberculose'], ['4', 'Óbito por outras causas'], ['5', 'Transferência p/ mesmo município'], ['6', 'Transferência p/ Outro Município'], ['7', 'Transferência p/ Outra UF'], ['8', 'Transferência p/ Outro País'], ['9', 'Mudança de Esquema'], ['10', 'Mudança de Diagnóstico'], ['11', 'Continua em Tratamento']]),
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: a conversão sit12mes.CNV só tem 1 a 11' }, observacao: `${ANTIGO} Rótulos do sit12mes.CNV. Vem preenchida em só 6 registros. ${REGRA}` });
col.SITUA_ENCE = C('SITUA_ENCE', 'p. 19, campo 62', 'Situação de encerramento', [['1', 'Cura'], ['2', 'Abandono'], ['3', 'Óbito por TB'], ['4', 'Óbito por outras causas'], ['5', 'Transferência'], ['6', 'Mudança de Diagnóstico'], ['7', 'TB-DR'], ['8', 'Mudança de Esquema'], ['9', 'Falência'], ['10', 'Abandono Primário']], 62, '1 a 10');
col.DT_ENCERRA = D('DT_ENCERRA', 'p. 21, campo 66', 'Data de encerramento', 'data');
col.POP_LIBER = L('POP_LIBER', 'p. 2, campo 33', 'Populações especiais: população privada de liberdade', 'sn9', 33, '1, 2 e 9');
col.POP_RUA = L('POP_RUA', 'p. 3, campo 33', 'Populações especiais: população em situação de rua', 'sn9', 33, '1, 2 e 9');
col.POP_SAUDE = L('POP_SAUDE', 'p. 3, campo 33', 'Populações especiais: profissional de saúde', 'sn9', 33, '1, 2 e 9', 'O código 3 aparece em cerca de 27 mil registros e sai como inconsistência (pendência).');
col.POP_IMIG = L('POP_IMIG', 'p. 3, campo 33', 'Populações especiais: imigrante', 'sn9', 33, '1, 2 e 9', 'O código 3 aparece em cerca de 2.150 registros e sai como inconsistência (pendência).');
col.BENEF_GOV = L('BENEF_GOV', 'p. 3, campo 34', 'Beneficiário de programa de transferência de renda do governo', 'sn9', 34, '1, 2 e 9');
col.TEST_MOLEC = C('TEST_MOLEC', 'p. 8, campo 44', 'Teste Molecular Rápido TB (TMR-TB)', [['1', 'Detectável sensível à Rifampicina'], ['2', 'Detectável resistente à Rifampicina'], ['3', 'Não detectável'], ['4', 'Inconclusivo'], ['5', 'Não realizado']], 44, '1 a 5', NOME_ARQ('TESTE_MOLEC'));
col.TEST_SENSI = C('TEST_SENSI', 'p. 8-9, campo 45', 'Teste de sensibilidade', [['1', 'Resistente somente à Isoniazida'], ['2', 'Resistente somente à Rifampicina'], ['3', 'Resistente à Isoniazida e Rifampicina'], ['4', 'Resistente a outras drogas de 1ª linha'], ['5', 'Sensível'], ['6', 'Em andamento'], ['7', 'Não realizado']], 45, '1 a 7', NOME_ARQ('TEST_SENSIBILID'));
col.ANT_RETRO = L('ANT_RETRO', 'p. 7, campo 41', 'Terapia antirretroviral durante o tratamento para a TB', 'sn9', 41, '1, 2 e 9', NOME_ARQ('ANTIRRETROVIRAL'));
col.TRANSF = C('TRANSF', 'p. 20, campo 63', 'Se transferência', [['1', 'Mesmo município'], ['2', 'Município diferente (mesma UF)'], ['3', 'UF diferente'], ['4', 'País diferente'], ['9', 'Ignorado']], 63, '1 a 4 e 9');
col.UF_TRANSF = D('UF_TRANSF', 'p. 21, campo 64', 'UF de transferência', 'uf', { observacao: `${NOME_ARQ('SG_UF_TRANSF')} No arquivo vem o código numérico da UF (IBGE).` });
col.MUN_TRANSF = D('MUN_TRANSF', 'p. 21, campo 65', 'Município de transferência (código)', 'codigo', { observacao: 'O DICTUBE descreve o código do município (6 dígitos), mas nos arquivos públicos de 2020 a 2025 a coluna traz só 2 dígitos, sempre iguais à UF de transferência (UF_TRANSF): o município vem cortado. Por isso fica como veio, sem tradução (pendência).' });

// Campos do DICTUBE fora do arquivo público
const FORA_ARQ = 'Não vem nos arquivos públicos do DATASUS (TUBEBR20 a 25); incluída para arquivos exportados do próprio Sinan (regra do Rubens para colunas do dicionário oficial fora do arquivo, 19/11/2026).';
const extras = {
  TRATAMENTO_antes: { nome: 'NU_PRONTUA', ...D('NU_PRONTUA', 'p. 1, campo 31', 'Nº do prontuário', 'texto', { observacao: FORA_ARQ }) },
  EXTRAPU2_N_depois: D('EXTRAPUL_O', 'p. 4, campo 36', 'Se extrapulmonar: outra (especificar)', 'texto', { observacao: FORA_ARQ }),
  AGRAVOUTRA_depois: D('AGRAVOUTDE', 'p. 5, campo 37', 'Doenças e agravos associados: outras (especificar)', 'texto', { observacao: FORA_ARQ }),
  ID_MUNIC_A_depois: D('NU_NOTI_AT', 'p. 10, campo 50', 'Número da notificação atual', 'texto', { observacao: FORA_ARQ }),
  DT_NOTI_AT_depois: D('ID_UNID_AT', 'p. 12, campo 52', 'Unidade de saúde atual (CNES)', 'tabela', { tabela: 'cnes', observacao: `Sai o nome do estabelecimento pelo CNES. ${FORA_ARQ}` }),
  ID_MUNIC_2_depois: [D('NU_CEP2', 'p. 14, campo 55', 'CEP de residência atual', 'codigo', { observacao: FORA_ARQ }), D('ID_BAIRRO2', 'p. 15, campo 57', 'Bairro de residência atual (código)', 'codigo', { observacao: FORA_ARQ }), D('NM_BAIRRO2', 'p. 15, campo 57', 'Bairro de residência atual (nome)', 'texto', { observacao: FORA_ARQ })],
  BAC_APOS_6_depois: D('NU_PRONT_AT', 'p. 18, campo 59', 'Nº do prontuário atual', 'texto', { observacao: FORA_ARQ }),
  DT_ENCERRA_depois: [C('OPORTU', 'p. 22', 'Oportunidade de encerramento', [['1', 'Oportuno'], ['2', 'Inoportuno']], 'de oportunidade', '1 e 2', `Campo preenchido automaticamente pelo sistema (1 se o intervalo entre a data de encerramento e a data de notificação estiver dentro do prazo). ${FORA_ARQ}`), D('DT_OPORTU', 'p. 22', 'Data de oportunidade', 'data', { observacao: FORA_ARQ })],
};

const ORDEM_ARQ = 'TP_NOT ID_AGRAVO DT_NOTIFIC NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA DT_DIAG ANO_NASC NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS NDUPLIC_N IN_VINCULA DT_DIGITA DT_TRANSUS DT_TRANSDM DT_TRANSSM DT_TRANSRM DT_TRANSRS DT_TRANSSE CS_FLXRET FLXRECEBI MIGRADO_W ID_OCUPA_N TRATAMENTO INSTITUCIO RAIOX_TORA TESTE_TUBE FORMA EXTRAPU1_N EXTRAPU2_N AGRAVAIDS AGRAVALCOO AGRAVDIABE AGRAVDOENC AGRAVOUTRA BACILOSC_E BACILOS_E2 BACILOSC_O CULTURA_ES CULTURA_OU HIV HISTOPATOL DT_INIC_TR RIFAMPICIN ISONIAZIDA ETAMBUTOL ESTREPTOMI PIRAZINAMI ETIONAMIDA OUTRAS TRAT_SUPER NU_CONTATO DOENCA_TRA SG_UF_AT ID_MUNIC_A DT_NOTI_AT SG_UF_2 ID_MUNIC_2 BACILOSC_1 BACILOSC_2 BACILOSC_3 BACILOSC_4 BACILOSC_5 BACILOSC_6 TRATSUP_AT DT_MUDANCA NU_COMU_EX SITUA_9_M SITUA_12_M SITUA_ENCE DT_ENCERRA TPUNINOT POP_LIBER POP_RUA POP_SAUDE POP_IMIG BENEF_GOV AGRAVDROGA AGRAVTABAC TEST_MOLEC TEST_SENSI ANT_RETRO BAC_APOS_6 TRANSF UF_TRANSF MUN_TRANSF'.split(' ');
const colunas = [];
for (const n of ORDEM_ARQ) {
  if (!col[n]) throw new Error(n);
  if (n === 'TRATAMENTO') colunas.push(extras.TRATAMENTO_antes);
  colunas.push(col[n]);
  for (const e of [extras[`${n}_depois`]].flat().filter(Boolean)) colunas.push(e);
}
for (const k of Object.keys(col)) if (!ORDEM_ARQ.includes(k)) throw new Error('fora da ordem: ' + k);

const derivadas = structuredClone(hepa.derivadas).filter((d) => !/^SEM_/.test(d.nome));

const pendencias = [
  { coluna: 'Fontes', descricao: 'Fonte principal: o DICTUBE (dicionário de tuberculose do pacote Docs_TAB_SINAN, sem data, com os campos da ficha de 2014) e a ficha de 2014 com a tela de acompanhamento. O TuberculNET5_0.def do TabWin liga as colunas do arquivo aos campos. Confirmar.' },
  { coluna: 'Nomes diferentes no DICTUBE', descricao: 'Várias colunas têm no arquivo um nome encurtado em relação ao DICTUBE: EXTRAPU1_N (EXTRAPU_N), AGRAVDROGA (AGRAVDROGAS), AGRAVTABAC (AGRAVTABACO), ANT_RETRO (ANTIRRETROVIRAL), TEST_MOLEC (TESTE_MOLEC), TEST_SENSI (TEST_SENSIBILID), SG_UF_AT (SG_UF_ATUAL), ID_MUNIC_A (ID_MUNIC_AT), BAC_APOS_6 (BACILOSC_APOS_6), UF_TRANSF (SG_UF_TRANSF), NU_CONTATO (NU_COMU_ID, campo 47) e NU_COMU_EX (NU_CONT_EX, campo 61). A ligação foi feita pelo número do campo e pelo TuberculNET5_0.def. As duas últimas (contatos identificados e examinados) não estão no .def e foram ligadas pelo sentido (pendência). Confirmar.' },
  { coluna: 'Campos da ficha anterior', descricao: 'O arquivo ainda traz colunas da ficha anterior à de 2014, que não estão no DICTUBE: INSTITUCIO, TESTE_TUBE, EXTRAPU2_N, BACILOS_E2, BACILOSC_O, CULTURA_OU, as drogas (RIFAMPICIN a OUTRAS), TRAT_SUPER, DT_MUDANCA, SITUA_9_M e SITUA_12_M. Nomes e códigos vieram do TuberculNET5_0.def e das suas conversões. Quase todas vêm vazias; TRAT_SUPER vem em 23% e EXTRAPU2_N em cerca de 4.800 registros. Confirmar.' },
  { coluna: 'ID_AGRAVO', descricao: 'A ficha mostra o CID "A 16. 9" (A16.9). Em 12.089 registros (2%) o arquivo traz "A16.", que parece a forma com ponto cortada pelo tamanho do campo (4 posições). Entrou como forma do mesmo CID. Confirmar.' },
  { coluna: 'DOENCA_TRA', descricao: 'Não está no DICTUBE nem na ficha de 2014. Vem "0" em cerca de 129 mil registros e números de 1 a 9 em poucos, o que não combina com Sim/Não/Ignorado do .def: tudo isso sai como inconsistência. Decidir se a coluna deve ficar como código mantido como veio.' },
  { coluna: 'POP_SAUDE e POP_IMIG', descricao: 'O código 3 aparece em cerca de 27 mil (profissional de saúde) e 2.150 (imigrante) registros; o campo 33 só comporta 1, 2 e 9. Sai como inconsistência. Confirmar.' },
  { coluna: 'Valores fora da ficha', descricao: 'Saem como inconsistência: BENEF_GOV "-" e 3, 4, 6, 7, 8; HISTOPATOL 6 (212); TEST_SENSI 8 e 9; TRANSF 0; CS_RACA 6; e sinais de pontuação e letras em EXTRAPU1_N, AGRAVOUTRA e BAC_APOS_6. Confirmar.' },
  { coluna: 'TPUNINOT', descricao: 'Sem descrição nos documentos de tuberculose. Ficou com o nome que o Rubens decidiu na violência, com os códigos como vieram. Confirmar.' },
  { coluna: 'IN_VINCULA e MIGRADO_W', descricao: 'Rótulos copiados da hanseníase (já conferida). O MIGRADO.cnv do TabWin usa 1 = Não e 2 = Sim, diferente do NOTIF2018 (1 = Migrado); a coluna vem em branco em todos os registros. Confirmar.' },
  { coluna: 'Campos do DICTUBE fora do arquivo', descricao: 'Entraram, pela regra do Rubens: nº do prontuário (31), extrapulmonar "outra" (36), outros agravos "especificar" (37), número da notificação atual (50), unidade de saúde atual (52), CEP e bairro de residência atual (55 e 57), nº do prontuário atual (59), oportunidade e data de oportunidade. O distrito de residência atual (56) ficou de fora: no PDF o nome da coluna aparece como "D_DISTR_2", provavelmente cortado, e não dá para ler com segurança.' },
  { coluna: 'MUN_TRANSF', descricao: 'Nos arquivos públicos o município de transferência vem só com 2 dígitos, sempre iguais à UF de transferência (cerca de 5 mil registros por ano): o município vem cortado. Ficou como código mantido como veio (sem procurar na tabela de municípios, para não encher as Inconsistências). Confirmar.' },
  { coluna: 'SEM_NOT e SEM_DIAG', descricao: 'O arquivo de tuberculose não traz as semanas epidemiológicas; por isso não foram criadas colunas extras de semana. Se quiser, dá para calcular pela data, como nos outros agravos.' },
];

const dic = {
  formato: hepa.formato,
  agravo: { nome: 'Tuberculose', codigos: ['A169', 'A16.9', 'A 16. 9', 'A 16.9', 'A16.'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos TUBEBRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: false, por: '', data: '', registro: '' },
  convencoes: hepa.convencoes, fontes, tabelas: hepa.tabelas, listas, colunas, derivadas, pendencias,
};
const usadas = new Set([...colunas.flatMap((x) => [x.fonte, ...(x.categorias || []).map((k) => k.fonte)]), ...Object.values(listas).flat().map((k) => k.fonte), ...Object.values(hepa.tabelas).map((t) => t.fonte)].filter(Boolean));
for (const f of usadas) if (!fontes[f]) throw new Error('fonte ' + f);
for (const k of Object.keys(fontes)) if (!usadas.has(k) && !['FICHATUBE', 'ACOMPTUBE'].includes(k)) delete fontes[k];
writeFileSync(`${raiz}dicionarios/tuberculose.json`, JSON.stringify(dic, null, 2) + '\n');
console.log(`tuberculose.json: ${colunas.length} colunas, ${derivadas.length} extras, ${pendencias.length} pendências; fontes: ${Object.keys(fontes).join(' ')}`);
