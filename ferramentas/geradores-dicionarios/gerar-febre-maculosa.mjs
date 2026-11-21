// Gera dicionarios/febre-maculosa.json a partir das fontes oficiais de docs/fontes/febre-maculosa.
// Campos da notificação, internos e de autoctonia copiados da leptospirose (dicionário conferido, mesma estrutura).
// Atenção: depois da conferência do Rubens, as correções vão direto no JSON; não rodar de novo.
import { readFileSync, writeFileSync } from 'node:fs';
const raiz = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // pasta principal do projeto
const lept = JSON.parse(readFileSync(`${raiz}dicionarios/leptospirose.json`, 'utf8'));
const hepa = JSON.parse(readFileSync(`${raiz}dicionarios/hepatites-virais.json`, 'utf8'));
const copia = (n) => structuredClone(lept.colunas.find((x) => x.nome === n));
const REGRA = 'Códigos que o campo não comporta saem como "Inconsistência/Não Preenchido" (regra geral do Rubens, 16/11/2026).';
const fora = (campo, comporta) => ({ rotulo: 'Inconsistência/Não Preenchido', motivo: `Código sem fonte oficial: o campo ${campo} só comporta ${comporta}` });
const cats = (pares) => pares.map(([k, r]) => ({ codigos: Array.isArray(k) ? k : [k], rotulo: r }));
const PACOTE = 'Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026); copiado para o projeto em 20/11/2026';
const FORA_ARQ = 'Não vem nos arquivos públicos do DATASUS (FMACBR23 a 25); incluída para arquivos exportados do próprio Sinan (regra do Rubens para colunas do dicionário oficial fora do arquivo, 19/11/2026).';

const fontes = {
  DICFMAC: { documento: 'Dicionário de Dados – Sinan NET – versão 5.0 – Febre maculosa (campos 31 a 63)', orgao: 'Ministério da Saúde / SVS / DEVEP / CIEVS / GT-Sinan',
    data: `Revisado em março/2012 (rodapé). ${PACOTE}.`, arquivo: 'docs/fontes/febre-maculosa/FMACUN_DIC_DADOS.pdf' },
  FICHAFMAC: { documento: 'Ficha de Investigação – Febre maculosa – Sinan NET', orgao: 'Ministério da Saúde / SVS', data: `SVS 19/09/2006 (rodapé). ${PACOTE}.`, arquivo: 'docs/fontes/febre-maculosa/FMACUN_FICHA.pdf' },
  INSTFMAC: { documento: 'Febre maculosa – Instruções para preenchimento – Ficha de investigação – Sinan NET', orgao: 'Ministério da Saúde / SVS', data: `${PACOTE}.`, arquivo: 'docs/fontes/febre-maculosa/FMACUN_INSTRUCIONAL.pdf' },
  TABFMAC: { documento: 'Arquivo de definições do TabWin para investigação de febre maculosa (FMacNet.def) e conversões', orgao: 'Ministério da Saúde / GT-Sinan',
    data: 'Alterado em 16/10/2007 e atualizado em 24/09/2010 (cabeçalho do .def). Pacote TAB_SINANNET do DATASUS.', arquivo: 'docs/fontes/tabelas-apoio/TAB_SINANNET/FMacNet.def' },
};
for (const [id, f] of Object.entries(lept.fontes)) if (!/LEPT$/.test(id)) fontes[id] = f;

const listas = {
  sn9: cats([['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']]),
  resultado: cats([['1', 'Positivo'], ['2', 'Negativo'], ['3', 'Inconclusivo'], ['4', 'Não realizado']]),
  uf_sigla: structuredClone(hepa.listas.uf_sigla),
};
fontes.DATASUS_UF = hepa.fontes.DATASUS_UF;

const col = {};
for (const n of ['TP_NOT', 'DT_NOTIFIC', 'SEM_NOT', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_REGIONA', 'ID_UNIDADE', 'DT_SIN_PRI', 'SEM_PRI', 'ANO_NASC', 'NU_IDADE_N', 'CS_SEXO', 'CS_GESTANT', 'CS_RACA', 'CS_ESCOL_N', 'SG_UF', 'ID_MN_RESI', 'ID_RG_RESI', 'ID_PAIS', 'DT_DIGITA', 'DT_TRANSUS', 'DT_TRANSDM', 'DT_TRANSRM', 'DT_TRANSRS', 'DT_TRANSSE', 'NU_LOTE_V', 'NU_LOTE_H']) col[n] = copia(n);
for (const cat of col.CS_ESCOL_N.categorias) if (cat.fonte === 'FICHALEPT') Object.assign(cat, { fonte: 'FICHAFMAC', local: 'p. 1, campo 14' });
col.CS_ESCOL_N.observacao = (col.CS_ESCOL_N.observacao || '').replace(/ficha de leptospirose/g, 'ficha de febre maculosa');
col.SEM_PRI.observacao = 'Formato AAAASS (ano e semana). Fica como veio.';

col.ID_AGRAVO = { nome: 'ID_AGRAVO', fonte: 'FICHAFMAC', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
  categorias: [{ codigos: ['A779', 'A77.9', 'A 77.9', 'A 7 7. 9'], rotulo: 'Febre maculosa não especificada', fonte: 'CID10_TABWIN', local: 'CID10_01.CNV, código A779' }],
  observacao: "A ficha mostra 'Febre Maculosa / Rickettsioses' com o CID 'A 77.9'; no arquivo vem 'A779' (regra do Rubens: o CID como na ficha e sem ponto e espaços). Rótulo da CID-10 (tabela do TabWin), como o Rubens decidiu na meningite (19/11/2026)." };

const D = (nome, local, rotulo, tipo, extra = {}) => ({ nome, fonte: 'DICFMAC', local, rotulo, tipo, ...extra });
const L = (nome, local, rotulo, lista, campo, comporta, obs) => D(nome, local, rotulo, 'categorico', { lista, fora_do_campo: fora(campo, comporta), observacao: [obs, REGRA].filter(Boolean).join(' ') });
const C = (nome, local, rotulo, pares, campo, comporta, obs) => D(nome, local, rotulo, 'categorico', { categorias: cats(pares), fora_do_campo: fora(campo, comporta), observacao: [obs, REGRA].filter(Boolean).join(' ') });

col.DT_INVEST = D('DT_INVEST', 'p. 1, campo 31', 'Data da investigação', 'data');
col.ID_OCUPA_N = { ...copia('ID_OCUPA_N'), fonte: 'DICFMAC', local: 'p. 1, campo 32' };
const SINAIS = [['FEBRE', 'febre', 'p. 2'], ['CEFALEIA', 'cefaléia', 'p. 2'], ['ABDOMINAL', 'dor abdominal', 'p. 2'], ['MIALGIA', 'mialgia', 'p. 2'], ['NAUSEA', 'náusea/vômito', 'p. 2'], ['EXANTEMA', 'exantema', 'p. 2'],
  ['DIARREIA', 'diarréia', 'p. 2'], ['ICTERICIA', 'icterícia', 'p. 2'], ['HIPEREMIA', 'hiperemia conjuntival', 'p. 2'], ['HEPATOME', 'hepatomegalia/esplenomegalia', 'p. 2-3'], ['PETEQUIAS', 'petéquias', 'p. 3'],
  ['HEMORRAG', 'manifestações hemorrágicas', 'p. 3'], ['LINFADENO', 'linfadenopatia', 'p. 3'], ['CONVULSAO', 'convulsão', 'p. 3'], ['NECROSE', 'necrose de extremidades', 'p. 3'], ['PROSTACAO', 'prostração', 'p. 3'],
  ['CHOQUE', 'choque/hipotensão', 'p. 3'], ['COMA', 'estupor/coma', 'p. 3'], ['HEMORRAGI', 'sufusão hemorrágica', 'p. 3'], ['RESPIRATO', 'alterações respiratórias', 'p. 3'], ['OLIGURIA', 'oligúria/anúria', 'p. 3'], ['OUTROS', 'outros', 'p. 3']];
for (const [n, r, p] of SINAIS) col[n] = L(n, `${p}, campo 33`, `Sinais e sintomas: ${r}`, 'sn9', 33, '1, 2 e 9', n === 'HEMORRAGI' ? 'O DICFMAC liga HEMORRAG às manifestações hemorrágicas e HEMORRAGI à sufusão hemorrágica; o FMacNet.def confirma ("Manif. Hemorr." e "Sufusão/Hemorag").' : undefined);
col.OUTRO_ESP = D('OUTRO_ESP', 'p. 4, campo 33', 'Sinais e sintomas: outros (especificar)', 'texto', { observacao: 'Texto livre; fica como veio.' });
const ANIMAIS = [['CARRAPATO', 'carrapato'], ['CAPIVARA', 'capivara'], ['CAO_GATO', 'cão/gato'], ['BOVINO', 'bovinos'], ['EQUINOS', 'equinos'], ['OUTROANI', 'outros animais']];
for (const [n, r] of ANIMAIS) col[n] = L(n, 'p. 4, campo 34', `Teve contato com animais: ${r}`, 'sn9', 34, '1, 2 e 9', 'Situação/exposição de risco nas últimas duas semanas (14 dias), como diz a ficha.');
col.ANIM_ESP = D('ANIM_ESP', 'p. 4, campo 34', 'Teve contato com animais: outros (especificar)', 'texto', { observacao: 'Texto livre; fica como veio.' });
col.FOI_MATA = L('FOI_MATA', 'p. 4, campo 35', 'Frequentou ambientes com mata, floresta, rios, cachoeiras etc.', 'sn9', 35, '1, 2 e 9');
col.HOSPITAL = L('HOSPITAL', 'p. 4, campo 36', 'Ocorreu hospitalização', 'sn9', 36, '1, 2 e 9');
col.DTINTERNA = D('DTINTERNA', 'p. 4, campo 37', 'Data da internação', 'data');
col.DTALTA = D('DTALTA', 'p. 5, campo 38', 'Data da alta', 'data');
col.COUFHOSP = D('COUFHOSP', 'p. 5, campo 39', 'UF do hospital', 'categorico', { lista: 'uf_sigla', observacao: 'O arquivo traz quase sempre o código numérico da UF e, em 594 registros, a sigla (ES). As duas formas saem como sigla, pela tabela de UFs do DATASUS (regra do Rubens para coluna mista, 19/11/2026).' });
const hospMun = D('COMUNHOSP', 'p. 5, campo 40', 'Município do hospital', 'municipio', { observacao: FORA_ARQ });
const hospUn = D('COUNIHOSP', 'p. 5, campo 41', 'Hospital (CNES)', 'tabela', { tabela: 'cnes', observacao: `Sai o nome do estabelecimento pelo CNES. ${FORA_ARQ}` });
col.DIAGNO_LAB = L('DIAGNO_LAB', 'p. 5, campo 42', 'Diagnóstico laboratorial', 'sn9', 42, '1, 2 e 9');
col.DTS1 = D('DTS1', 'p. 5, campo 43', 'Sorologia: data da coleta da amostra S1', 'data');
col.DTS2 = D('DTS2', 'p. 5, campo 43', 'Sorologia: data da coleta da amostra S2', 'data');
const SORO = 'Rótulos do DICFMAC (a ficha escreve "Reagente" e "Não reagente" para os códigos 1 e 2).';
const TIT = 'O título é o denominador da diluição (por exemplo 64 = 1:64). Fica como veio; o arquivo traz também formas como "-64" e "0".';
for (const [n, t, r, p] of [['IGM_S1', 'TIT_IGM_S1', 'S1 IgM', 'p. 5'], ['IGG_S1', 'TIT_IGG_S1', 'S1 IgG', 'p. 6'], ['IGM_S2', 'TIT_IGM_S2', 'S2 IgM', 'p. 6'], ['IGG_S2', 'TIT_IGG_S2', 'S2 IgG', 'p. 6']]) {
  col[n] = L(n, `${p}, campo 43`, `Sorologia: resultado ${r}`, 'resultado', 43, '1 a 4', SORO);
  col[t] = D(t, `${p}, campo 43`, `Sorologia: título ${r}`, 'texto', { observacao: TIT });
}
col.DT_COLETA = D('DT_COLETA', 'p. 6, campo 44', 'Isolamento: data da coleta', 'data');
col.ISOLAMENTO = C('ISOLAMENTO', 'p. 6, campo 45', 'Resultado do isolamento', [['1', 'Detectado'], ['2', 'Não Detectado'], ['3', 'Não realizado']], 45, '1, 2 e 3');
col.AGENTE = D('AGENTE', 'p. 7, campo 46', 'Agente', 'texto', { observacao: 'Texto livre (o arquivo traz o número e o nome do agente, por exemplo "1. RICKETTSIA RICKETTSSII"); nenhum documento lista esses números. Fica como veio.' });
col.HISTOPATO = L('HISTOPATO', 'p. 7, campo 47', 'Resultado da histopatologia', 'resultado', 47, '1 a 4');
col.IMUNOHIST = L('IMUNOHIST', 'p. 7, campo 48', 'Resultado da imunohistoquímica', 'resultado', 48, '1 a 4');
col.CLASSI_FIN = C('CLASSI_FIN', 'p. 7, campo 49', 'Classificação final', [['1', 'Confirmado'], ['2', 'Descartado']], 49, '1 e 2',
  'O DICFMAC e a ficha só listam 1 e 2. O código 8 aparece em 2.272 registros (6%) e sai como "Inconsistência/Não Preenchido", como na leptospirose (o Classifi.cnv do TabWin o chama de Inconclusivo).');
col.CRITERIO = C('CRITERIO', 'p. 7, campo 50', 'Critério de confirmação/descarte', [['1', 'Laboratório'], ['2', 'Clínico-Epidemiológico'], ['3', 'Clínico']], 50, '1, 2 e 3',
  'O DICFMAC observa que a categoria 3 (Clínico) ficou inválida na versão 4.0, mas a lista ainda na ficha; aparece em 163 registros.');
col.DIAG_DESCA = D('DIAG_DESCA', 'p. 7, campo 51', 'Se descartado, especificar diagnóstico', 'texto', { observacao: 'Texto livre; fica como veio.' });
col.TPAUTOCTO = { ...copia('TPAUTOCTO'), fonte: 'DICFMAC', local: 'p. 7, campo 52', fora_do_campo: fora(52, '1, 2 e 3'), observacao: `Rótulos do DICFMAC. ${REGRA}` };
col.COUFINF = D('COUFINF', 'p. 8, campo 53', 'UF provável de infecção', 'uf', { observacao: 'No arquivo vem o código numérico da UF (IBGE); o nome da UF vem da tabela do IBGE.' });
col.COPAISINF = { ...copia('COPAISINF'), fonte: 'DICFMAC', local: 'p. 9, campo 54', observacao: 'Sem tabela compatível: o código fica como veio (pendência). Vem "0" em cerca de 34.500 registros (89%), quase sempre sem autoctonia, como na leptospirose.' };
col.COMUNINF = { ...copia('COMUNINF'), fonte: 'DICFMAC', local: 'p. 10, campo 55' };
const infExtra = [
  D('CODISINF', 'p. 10, campo 56', 'Distrito provável de infecção (código)', 'codigo', { observacao: FORA_ARQ }),
  D('CO_BAINFC', 'p. 11, campo 57', 'Bairro provável de infecção (código)', 'codigo', { observacao: FORA_ARQ }),
  D('NOBAIINF', 'p. 11, campo 57', 'Bairro provável de infecção (nome)', 'texto', { observacao: FORA_ARQ }),
  C('ZONA', 'p. 11, campo 58', 'Zona provável de infecção', [['1', 'Urbana'], ['2', 'Rural'], ['3', 'Peri-urbana'], ['9', 'Ignorado']], 58, '1, 2, 3 e 9', `Rótulos da ficha. ${FORA_ARQ}`),
];
col.AMBIENTE = C('AMBIENTE', 'p. 12, campo 59', 'Ambiente provável de infecção', [['1', 'Domiciliar'], ['2', 'Trabalho'], ['3', 'Lazer'], ['4', 'Outro'], ['9', 'Ignorado']], 59, '1 a 4 e 9', 'Rótulos da ficha (no PDF do DICFMAC as categorias aparecem cortadas).');
col.DOENCA_TRA = L('DOENCA_TRA', 'p. 12, campo 60', 'Doença relacionada ao trabalho', 'sn9', 60, '1, 2 e 9');
col.EVOLUCAO = C('EVOLUCAO', 'p. 12, campo 61', 'Evolução do caso', [['1', 'Cura'], ['2', 'Óbito por febre maculosa'], ['3', 'Óbito por outra causa'], ['9', 'Ignorado']], 61, '1, 2, 3 e 9', 'Rótulos da ficha.');
col.DT_OBITO = D('DT_OBITO', 'p. 13, campo 62', 'Data do óbito', 'data');
col.DT_ENCERRA = D('DT_ENCERRA', 'p. 13, campo 63', 'Data do encerramento', 'data');
col.IDENT_MICR = { nome: 'IDENT_MICR', fonte: 'DICFMAC', local: 'não aparece na fonte', rotulo: 'IDENT_MICR (sem descrição nas fontes)', tipo: 'codigo',
  observacao: 'Nem o DICFMAC, nem a ficha, nem o FMacNet.def descrevem esta coluna. Vem em branco em todos os registros de 2023 a 2025; se vier algum valor, fica como veio (pendência).' };

const ORDEM = 'TP_NOT ID_AGRAVO DT_NOTIFIC SEM_NOT NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA ID_UNIDADE DT_SIN_PRI SEM_PRI ANO_NASC NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS DT_INVEST ID_OCUPA_N FEBRE CEFALEIA ABDOMINAL MIALGIA NAUSEA EXANTEMA DIARREIA ICTERICIA HIPEREMIA HEPATOME PETEQUIAS HEMORRAG LINFADENO CONVULSAO NECROSE PROSTACAO CHOQUE COMA HEMORRAGI RESPIRATO OLIGURIA OUTROS OUTRO_ESP CARRAPATO CAPIVARA CAO_GATO BOVINO EQUINOS OUTROANI ANIM_ESP FOI_MATA HOSPITAL DTINTERNA DTALTA COUFHOSP DIAGNO_LAB DTS1 DTS2 IGM_S1 TIT_IGM_S1 IGG_S1 TIT_IGG_S1 IGM_S2 TIT_IGM_S2 IGG_S2 TIT_IGG_S2 DT_COLETA DT_DIGITA ISOLAMENTO AGENTE HISTOPATO IMUNOHIST CLASSI_FIN CRITERIO DIAG_DESCA TPAUTOCTO COUFINF COPAISINF COMUNINF AMBIENTE DOENCA_TRA EVOLUCAO DT_OBITO DT_ENCERRA DT_TRANSUS DT_TRANSDM DT_TRANSRM DT_TRANSRS DT_TRANSSE NU_LOTE_V NU_LOTE_H IDENT_MICR'.split(' ');
const colunas = [];
for (const n of ORDEM) {
  if (!col[n]) throw new Error(n);
  if (n === 'AMBIENTE') colunas.push(...infExtra);
  colunas.push(col[n]);
  if (n === 'COUFHOSP') colunas.push(hospMun, hospUn);
}
for (const k of Object.keys(col)) if (!ORDEM.includes(k)) throw new Error('fora da ordem: ' + k);

const pendencias = [
  { coluna: 'Fontes', descricao: 'Fonte principal: o DICFMAC (dicionário de febre maculosa, revisado em março/2012, do pacote Docs_TAB_SINAN). A ficha é de 2006. O FMacNet.def do TabWin confirma as colunas. Os campos da notificação, internos e de autoctonia foram copiados da leptospirose, já conferida. Confirmar.' },
  { coluna: 'CLASSI_FIN', descricao: 'O código 8 aparece em 2.272 registros (6%); o DICFMAC e a ficha só listam 1 e 2. Sai como "Inconsistência/Não Preenchido", como na leptospirose. Confirmar.' },
  { coluna: 'CRITERIO', descricao: 'O código 3 (Clínico) está na ficha e no DICFMAC, que observa que a categoria ficou inválida na versão 4.0; aparece em 163 registros. Entrou como "Clínico". Confirmar.' },
  { coluna: 'Sorologia (IGM/IGG e títulos)', descricao: 'Resultados com os rótulos do DICFMAC (1 Positivo, 2 Negativo, 3 Inconclusivo, 4 Não realizado); a ficha escreve "Reagente/Não reagente". O código 9 aparece em 1 registro de cada e sai como inconsistência. Os títulos ficam como texto. Confirmar.' },
  { coluna: 'COUFHOSP', descricao: 'A UF do hospital vem em código numérico e, em 594 registros, em sigla (ES): sai sempre a sigla (lista uf_sigla, regra do Rubens para coluna mista). Confirmar.' },
  { coluna: 'AGENTE', descricao: 'Texto como veio: o arquivo traz número e nome do agente (por exemplo "1. RICKETTSIA RICKETTSSII"), e nenhum documento lista esses números. Confirmar.' },
  { coluna: 'IDENT_MICR', descricao: 'Coluna sem descrição em nenhuma fonte (nem no FMacNet.def); vem sempre em branco. Ficou como código mantido como veio. Confirmar.' },
  { coluna: 'Campos do DICFMAC fora do arquivo', descricao: 'Entraram, pela regra do Rubens: município e nome do hospital (40 e 41), distrito, bairro e zona prováveis de infecção (56 a 58).' },
  { coluna: 'Arquivos', descricao: 'Vieram 2023, 2024 e 2025 (17.942, 9.962 e 11.010 notificações).' },
];

const dic = {
  formato: lept.formato,
  agravo: { nome: 'Febre maculosa', codigos: ['A779', 'A77.9', 'A 77.9', 'A 7 7. 9'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos FMACBRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: false, por: '', data: '', registro: '' },
  convencoes: lept.convencoes, fontes, tabelas: lept.tabelas, listas, colunas, derivadas: structuredClone(lept.derivadas), pendencias,
};
const usadas = new Set([...colunas.flatMap((x) => [x.fonte, ...(x.categorias || []).map((k) => k.fonte)]), ...Object.values(listas).flat().map((k) => k.fonte), ...Object.values(lept.tabelas).map((t) => t.fonte)].filter(Boolean));
for (const f of usadas) if (!fontes[f]) throw new Error('fonte ' + f);
for (const k of Object.keys(fontes)) if (!usadas.has(k) && !['FICHAFMAC', 'INSTFMAC', 'TABFMAC'].includes(k)) delete fontes[k];
writeFileSync(`${raiz}dicionarios/febre-maculosa.json`, JSON.stringify(dic, null, 2) + '\n');
console.log(`febre-maculosa.json: ${colunas.length} colunas, ${dic.derivadas.length} extras, ${pendencias.length} pendências; fontes: ${Object.keys(fontes).join(' ')}`);
