// Gera dicionarios/hiv-crianca-exposta.json a partir das fontes oficiais de docs/fontes/hiv-crianca-exposta.
// Colunas comuns (campos 1 a 30 e internos) são copiadas do dicionário de hepatites virais, já conferido.
// Atenção: depois da conferência do Rubens, as correções vão direto no JSON; não rodar de novo.
import { readFileSync, writeFileSync } from 'node:fs';
const raiz = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // pasta principal do projeto
const ler = (a) => JSON.parse(readFileSync(`${raiz}dicionarios/${a}.json`, 'utf8'));
const hepa = ler('hepatites-virais');
const copia = (n) => structuredClone(hepa.colunas.find((x) => x.nome === n));
const REGRA = 'Códigos que o campo não comporta saem como "Inconsistência/Não Preenchido" (regra geral do Rubens, 16/11/2026).';
const VAZIA = 'Vem em branco em todos os registros de 2022 a 2024.';
const cats = (pares) => pares.map(([k, r]) => ({ codigos: [k], rotulo: r }));
const PACOTE = 'Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026); copiado para o projeto em 19/11/2026, com a autorização dele para usar os dicionários de HIV de 2024 como fonte principal';

const fontes = {
  DICHIVE: { documento: 'Dicionário de Dados – HIV criança exposta (campos da notificação e de encerramento)', orgao: 'Ministério da Saúde / SVSA / DAENT / CGIAE / GT-Sinan',
    data: `Revisado em fevereiro/2024 (rodapé). ${PACOTE}.`, arquivo: 'docs/fontes/hiv-crianca-exposta/HIVCR_DIC_DADOS.pdf' },
  FICHAHIVE: { documento: 'Ficha de Notificação/Investigação – Criança exposta ao HIV – Sinan NET', orgao: 'Ministério da Saúde / SVS',
    data: 'SVS 18/05/2009 (rodapé). PDF escaneado (só imagem), colocado pelo Rubens em docs/fontes em 19/11/2026; lido pelas imagens das duas páginas.',
    arquivo: 'docs/fontes/hiv-crianca-exposta/11140250-ficha-de-investigacao-crianca-exposta-ao-hiv.pdf' },
};
for (const [id, f] of Object.entries(hepa.fontes)) if (!/HEPA$/.test(id)) fontes[id] = f;

const col = {};
for (const n of ['TP_NOT', 'DT_NOTIFIC', 'SEM_NOT', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_REGIONA', 'NU_IDADE_N', 'CS_SEXO', 'CS_GESTANT', 'CS_RACA', 'CS_ESCOL_N', 'SG_UF', 'ID_MN_RESI', 'ID_RG_RESI', 'ID_PAIS']) col[n] = copia(n);
for (const cat of col.CS_ESCOL_N.categorias) if (cat.fonte === 'FICHAHEPA') Object.assign(cat, { fonte: 'DICHIVE', local: 'p. 3, Escolaridade' });
col.CS_ESCOL_N.observacao = col.CS_ESCOL_N.observacao.replace('o 0 vem da ficha de tétano acidental (p. 1, campo 14)', 'o 0 vem do DICHIVE (p. 3); na ficha da criança exposta o campo 14 vem riscado, sem categorias')
  + ' Atenção: 394 notificações de 2022 a 2024 (Espírito Santo) trazem "1" (1ª a 4ª série incompleta do EF) para crianças expostas; sai como está gravado (pendência).';
col.SEM_NOT.observacao = 'Formato AAAASS (ano e semana). Nas notificações do Espírito Santo de 2022 a 2024 (394) vem em branco; a semana calculada pela data da notificação está na coluna extra logo depois.';
col.CS_GESTANT.observacao = 'As formas com um e dois dígitos (01 e 1) entram (regra do Rubens); 9, 09 e 99 = Ignorado (decisão do Rubens nas hepatites, 19/11/2026). O NOTIF2018 diz que na criança exposta o campo Gestante não é habilitado; nos arquivos vem quase sempre 6 (Não se aplica). ' + REGRA;

col.ID_AGRAVO = { nome: 'ID_AGRAVO', fonte: 'FICHAHIVE', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
  categorias: [{ codigos: ['Z206', 'Z20.6', 'Z 20.6', 'Z 20 6', 'Z 2 0 6'], rotulo: 'Contato com e exposição ao vírus da imunodeficiência humana [HIV]', fonte: 'CID10_TABWIN', local: 'CID10_21.cnv, código Z206' }],
  observacao: "A ficha mostra 'CRIANÇA EXPOSTA AO HIV' com o CID 'Z 20.6'; no arquivo vem 'Z206' (regra do Rubens: o CID como na ficha e sem ponto e espaços). Rótulo da CID-10 (tabela do TabWin), como o Rubens decidiu na meningite (19/11/2026)." };
col.DT_DIAG = { nome: 'DT_DIAG', fonte: 'FICHAHIVE', local: 'p. 2, instruções, item 7', rotulo: 'Data do diagnóstico', tipo: 'data',
  observacao: 'Instruções da ficha, item 7: entende-se como data do diagnóstico a data de nascimento da criança ou, nos casos de exposição por amamentação cruzada, a data de início da amamentação (quando não conhecida, o 1º dia do mês e ano aproximados da exposição). O DICHIVE (p. 2) descreve o campo como "Data dos primeiros sintomas / Diagnóstico".' };
col.SEM_DIAG = { nome: 'SEM_DIAG', fonte: 'DICHIVE', local: 'p. 2', rotulo: 'Semana epidemiológica do diagnóstico', tipo: 'texto',
  observacao: 'Formato AAAASS. Nas notificações do Espírito Santo de 2022 a 2024 (394) vem em branco; a semana calculada pela data do diagnóstico está na coluna extra logo depois.' };
col.DT_INVEST = { nome: 'DT_INVEST', fonte: 'DICHIVE', local: 'p. 4', rotulo: 'Data da investigação', tipo: 'data', observacao: VAZIA };
col.ID_OCUPA_N = { ...copia('ID_OCUPA_N'), fonte: 'DICHIVE', local: 'p. 4', observacao: copia('ID_OCUPA_N').observacao + ' ' + VAZIA };
col.CLASSI_FIN = { nome: 'CLASSI_FIN', fonte: 'DICHIVE', local: 'p. 4', rotulo: 'Classificação final', tipo: 'codigo',
  observacao: `O DICHIVE remete ao "Anexo I", que não vem no documento; o Anexo I do NOTIF2018 não tem linha de criança exposta, e a ficha não tem esse campo. ${VAZIA} Se vier algum código, fica como veio.` };
col.CRITERIO = { nome: 'CRITERIO', fonte: 'DICHIVE', local: 'p. 4', rotulo: 'Critério de confirmação', tipo: 'codigo',
  observacao: `O DICHIVE remete ao "Anexo I", que não vem no documento; o Anexo I do NOTIF2018 não tem linha de criança exposta, e a ficha não tem esse campo. ${VAZIA} Se vier algum código, fica como veio.` };
col.DOENCA_TRA = { nome: 'DOENCA_TRA', fonte: 'DICHIVE', local: 'p. 4', rotulo: 'Doença relacionada ao trabalho', tipo: 'categorico',
  categorias: cats([['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']]), fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: o DICHIVE só lista 1, 2 e 9' },
  observacao: `Categorias do DICHIVE (1 - Sim, 2 - Não, 9 - Ignorado), na coluna de categorias ao lado dos campos de encerramento (a diagramação do PDF desalinha as linhas). ${VAZIA} ${REGRA}` };
col.EVOLUCAO = { nome: 'EVOLUCAO', fonte: 'FICHAHIVE', local: 'p. 2, campo 47', rotulo: 'Evolução do caso', tipo: 'categorico',
  categorias: cats([['1', 'Infectada'], ['2', 'Não infectada'], ['3', 'Perda de seguimento'], ['4', 'Caso em andamento'], ['5', 'Transferência para outro município e/ou estado'], ['6', 'Óbito por HIV/Aids'], ['7', 'Óbito por outras causas']]),
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: o campo 47 da ficha só comporta 1 a 7' },
  observacao: `O DICHIVE remete ao "Anexo I", que não vem no documento; as categorias vêm do campo 47 da ficha ("Evolução do caso (criança exposta ao HIV)"), ligação feita por interpretação (pendência). A ficha escreve "Municipio e/ou Estado" com maiúsculas. ${VAZIA} ${REGRA}` };
col.DT_OBITO = { nome: 'DT_OBITO', fonte: 'DICHIVE', local: 'p. 4', rotulo: 'Data do óbito', tipo: 'data', observacao: VAZIA };
col.DT_ENCERRA = { nome: 'DT_ENCERRA', fonte: 'DICHIVE', local: 'p. 4', rotulo: 'Data do encerramento', tipo: 'data', observacao: `Na ficha, campo 48 ("Data de encerramento da investigação de criança exposta ao HIV"). ${VAZIA}` };

const ORDEM = 'TP_NOT ID_AGRAVO DT_NOTIFIC SEM_NOT NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA DT_DIAG SEM_DIAG NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS DT_INVEST ID_OCUPA_N CLASSI_FIN CRITERIO DOENCA_TRA EVOLUCAO DT_OBITO DT_ENCERRA'.split(' ');
const colunas = ORDEM.map((n) => { if (!col[n]) throw new Error(n); return col[n]; });
for (const k of Object.keys(col)) if (!ORDEM.includes(k)) throw new Error('fora da ordem: ' + k);
const derivadas = structuredClone(hepa.derivadas);

const pendencias = [
  { coluna: 'Fontes', descricao: 'Fonte principal: o DICHIVE (dicionário de HIV criança exposta, revisado em fevereiro/2024, do pacote Docs_TAB_SINAN). A ficha (2009) é um PDF escaneado; foi lida pelas imagens. Não há arquivo de definições do TabWin para criança exposta. Confirmar.' },
  { coluna: 'CLASSI_FIN e CRITERIO', descricao: 'O DICHIVE remete ao "Anexo I", que não vem no documento, e o Anexo I do NOTIF2018 não tem linha de criança exposta. As colunas vêm em branco em todos os registros: ficaram como código mantido como veio. Confirmar.' },
  { coluna: 'EVOLUCAO', descricao: 'Também remete ao "Anexo I". As categorias foram tiradas do campo 47 da ficha de 2009 ("Evolução do caso (criança exposta ao HIV)": 1 Infectada a 7 Óbito por outras causas), ligação por interpretação. A coluna vem em branco em todos os registros. Confirmar.' },
  { coluna: 'DOENCA_TRA', descricao: 'O PDF do DICHIVE desalinha as linhas da tabela; "1 - Sim, 2 - Não, 9 - Ignorado" foi ligado à doença relacionada ao trabalho, como em todas as fichas do Sinan. Vem em branco em todos os registros. Confirmar.' },
  { coluna: 'Notificações do Espírito Santo', descricao: '394 notificações (163 em 2022, 127 em 2023 e 104 em 2024) vêm com outro formato: tipo de notificação, semanas, regional e país em branco, idade "****" (vira campo em branco) e escolaridade "1" (1ª a 4ª série incompleta do EF) para a criança. Tudo sai como está gravado; a escolaridade fica com o rótulo do código 1 (pendência). Decidir se a escolaridade "1" dessas notificações deve sair como inconsistência.' },
  { coluna: 'Campos 31 a 46 da ficha', descricao: 'A ficha de 2009 tem os dados da mãe/nutriz, do parto, do aleitamento e dos exames da criança (campos 31 a 46), mas nem o DICHIVE de 2024 nem o arquivo público trazem essas colunas, e nenhum documento dá o nome delas no banco. Não entraram.' },
  { coluna: 'Colunas sem valor', descricao: 'DT_INVEST, ID_OCUPA_N, CLASSI_FIN, CRITERIO, DOENCA_TRA, EVOLUCAO, DT_OBITO e DT_ENCERRA vêm em branco (ou com asteriscos, que valem como branco) em todos os registros de 2022 a 2024. Ficam no dicionário para arquivos que as tragam.' },
];

const dic = {
  formato: hepa.formato,
  agravo: { nome: 'HIV em criança exposta', codigos: ['Z206', 'Z20.6', 'Z 20.6', 'Z 20 6', 'Z 2 0 6'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos HIVEBRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: false, por: '', data: '', registro: '' },
  convencoes: hepa.convencoes, fontes, tabelas: hepa.tabelas, listas: {}, colunas, derivadas, pendencias,
};
const usadas = new Set([...colunas.flatMap((x) => [x.fonte, ...(x.categorias || []).map((k) => k.fonte)]), ...Object.values(hepa.tabelas).map((t) => t.fonte)].filter(Boolean));
for (const f of usadas) if (!fontes[f]) throw new Error('fonte ' + f);
for (const k of Object.keys(fontes)) if (!usadas.has(k)) delete fontes[k];
writeFileSync(`${raiz}dicionarios/hiv-crianca-exposta.json`, JSON.stringify(dic, null, 2) + '\n');
console.log(`hiv-crianca-exposta.json: ${colunas.length} colunas, ${derivadas.length} extras, ${pendencias.length} pendências; fontes: ${Object.keys(fontes).join(' ')}`);
