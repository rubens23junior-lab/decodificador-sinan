// Monta dicionarios/chagas.json. Rótulos transcritos de:
//  DICCHAG   = docs/fontes/chagas/CHAGAN_DIC_DADOS.pdf (texto em modo tabela; páginas pelo rodapé "Revisado em Julho/2010")
//  FICHACHAG = docs/fontes/chagas/CHAGAN_FICHA.pdf
//  NOTIF2018 = dicionário da notificação individual (campos 1 a 30, internos e Anexo I, p. 19, linha Doença de Chagas aguda)
// Colunas comuns com fonte NOTIF2018 são copiadas do dicionário de LV já conferido (mesma fonte e página).
// Uso: node gerar-chagas.mjs <raiz do repositório>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.argv[2];
const lv = JSON.parse(readFileSync(join(raiz, 'dicionarios/leishmaniose-visceral.json'), 'utf8'));
const deLV = (nome, extra = {}) => {
  const c = lv.colunas.find((x) => x.nome === nome);
  if (!c) throw new Error('Não está em LV: ' + nome);
  return { ...structuredClone(c), ...extra };
};
const cat = (pares) => pares.map(([c, r]) => ({ codigos: Array.isArray(c) ? c : [c], rotulo: r }));
const C = [];
const col = (nome, fonte, local, rotulo, tipo, extra = {}) => C.push({ nome, fonte, local, rotulo, tipo, ...extra });
const dc = (nome, pg, campo, rotulo, tipo, extra) => col(nome, 'DICCHAG', `p. ${pg}, campo ${campo}`, rotulo, tipo, extra);
const lista = (nome, pg, campo, rotulo, l, extra) => dc(nome, pg, campo, rotulo, 'categorico', { lista: l, ...extra });
const comum = (...nomes) => nomes.forEach((n) => C.push(deLV(n)));

// ---- Campos 1 a 30 e internos (NOTIF2018, como em LV) ----
comum('TP_NOT');
col('ID_AGRAVO', 'FICHACHAG', 'p. 1, campo 2 (Código CID10)', 'Agravo', 'categorico', {
  categorias: cat([[['B57.1', 'B571'], 'Doença de Chagas aguda']]),
  observacao: "A ficha traz 'DOENÇA DE CHAGAS AGUDA' e o código 'B 57.1'; o NOTIF2018 (p. 1, campo 2) diz que o ponto é retirado ao exportar. O arquivo de 2025 traz 'B571'.",
});
comum('DT_NOTIFIC', 'SEM_NOT', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_REGIONA', 'ID_UNIDADE', 'DT_SIN_PRI', 'SEM_PRI');
C.push(deLV('ANO_NASC', { observacao: 'O NOTIF2018 descreve a data de nascimento (DT_NASC); o arquivo público traz só o ano, na coluna ANO_NASC, que não aparece nas fontes de Chagas (pendência).' }));
comum('NU_IDADE_N', 'CS_SEXO', 'CS_GESTANT', 'CS_RACA');
{
  const e = deLV('CS_ESCOL_N');
  e.categorias[0] = { ...e.categorias[0], codigos: ['0', '00', '43'], fonte: 'FICHACHAG', local: 'p. 1, campo 14 (o 43 vem do NOTIF2018, p. 5)' };
  e.observacao = e.observacao.replace('o 0 vem da ficha de LV (p. 1, campo 14)', "o 0 vem da ficha de Chagas (p. 1, campo 14). Por decisão do Rubens (conferência de 13/11/2026), o 0 e o 43 valem como Analfabeto");
  C.push(e);
}
comum('SG_UF', 'ID_MN_RESI', 'ID_RG_RESI', 'ID_PAIS', 'NDUPLIC_N');

// ---- Dicionário de Chagas (campos 31 a 70) ----
dc('DT_INVEST', 1, '31', 'Data da investigação', 'data');
dc('ID_OCUPA_N', 2, '32', 'Ocupação (CBO)', 'tabela', { tabela: 'cbo', observacao: 'Nome da ocupação pela CBO 2002. Códigos especiais do Sinan que não estão na CBO ficam como vieram (ver pendências).' });
for (const i of [1, 2, 3]) {
  dc(`ANT_UF_${i}`, 2, '33', `Deslocamento - UF ${i}`, 'uf', { observacao: 'Deslocamento: o DICCHAG diz "15 meses anteriores ao início dos sinais e sintomas"; a ficha diz "até 120 dias antes do início dos sintomas" (pendência).' });
  dc(`MUN_${i}`, 2, i === 3 ? '33 (o PDF numera 34 o Município 3)' : '33', `Deslocamento - Município ${i}`, 'municipio');
}
dc('PRESENCA', 2, '34', 'Presença de vestígios de triatomídeos intradomicílio', 'categorico', {
  local: 'p. 2-3, campo 34',
  categorias: cat([['1', 'Sim'], ['2', 'Não'], ['3', 'Não realizado'], ['9', 'Ignorado']]),
});
dc('PARASITO', 3, '35', 'Data do encontro dos vestígios', 'data');
lista('HISTORIA', 3, '36', 'História de uso de sangue ou hemoderivados nos últimos 120 dias', 'sni', {
  observacao: "O nome do campo no DICCHAG diz '120 dias' e a descrição diz '90 dias'. A ficha (p. 1, campo 36) também diz '120 dias'; por decisão do Rubens (13/11/2026), vale 120 dias.",
});
lista('CONTROLE', 3, '37', 'Existência de controle sorológico na unidade de hemoterapia', 'snnai');
lista('MANIPULA', 3, '38', 'Manipulação de material com T. cruzi', 'snnai');
lista('MAECHAGA', 3, '39', 'Menor ou igual a 9 meses de idade: mãe com infecção chagásica', 'snnai');
lista('ORAL', 3, '40', 'Possibilidade de transmissão por via oral', 'sni');
lista('ASSINTOMA', 3, '41', 'Sinais e sintomas - Assintomático', 'sni');
const sin = (nome, rotulo) => lista(nome, 4, '41', `Sinais e sintomas - ${rotulo}`, 'sni');
sin('EDEMA', 'Edema'); sin('MENINGOE', 'Sinais de meningoencefalite'); sin('POLIADENO', 'Poliadenopatia');
sin('FEBRE', 'Febre persistente'); sin('HEPATOME', 'Hepatomegalia'); sin('SINAIS_ICC', 'Sinais de ICC');
C.push({ ...(sin('ARRITMIAS', 'Taquicardia Persistente/Arritimias'), C.pop()), observacao: "Nome como na ficha de Chagas (p. 2, campo 41, grafia da fonte), por decisão do Rubens (13/11/2026); o DICCHAG diz só 'TAQUICARDIA PERSISTENTE'. Categorias do DICCHAG." });
sin('ASTENIA', 'Astenia'); sin('ESPLENOM', 'Esplenomegalia'); sin('CHAGOMA', 'Chagoma de inoculação (sinal de Romana ou outro)'); sin('OUTRO_SIN', 'Outros');
dc('OUTRO_ESP', 4, '41', 'Sinais e sintomas - Outros (especificar)', 'texto');
dc('DT_COL_DIR', 4, '42', 'Parasitológico direto - Data da coleta', 'data', { local: 'p. 4-5, campo 42' });
lista('EXAME', 5, '43', 'Parasitológico direto - Exame a fresco', 'pnnr');
lista('MICRO_HEMA', 5, '43', 'Parasitológico direto - Strout/Microhematócrito/QBC', 'pnnr');
lista('OUTRO', 5, '43', 'Parasitológico direto - Outro', 'pnnr');
dc('DT_COL_IND', 5, '44', 'Parasitológico indireto - Data da coleta', 'data');
lista('XENODIAG', 5, '44', 'Parasitológico indireto - Xenodiagnóstico', 'pnnr');
lista('HEMOCULT', 5, '45', 'Parasitológico indireto - Hemocultivo', 'pnnr');
dc('DT_COL_S1', 5, '46', 'Sorologia - Data da coleta S1', 'data');
dc('DT_COL_S2', 5, '47', 'Sorologia - Data da coleta S2', 'data');
const soro = (nome, pg, campo, rotulo) => lista(nome, pg, campo, rotulo, 'rnrin');
soro('ELI_IGM_S1', '5-6', '48', 'Sorologia ELISA - IgM S1'); soro('ELI_IGG_S1', 6, '48', 'Sorologia ELISA - IgG S1');
soro('ELI_IGM_S2', 6, '48', 'Sorologia ELISA - IgM S2'); soro('ELI_IGG_S2', 6, '48', 'Sorologia ELISA - IgG S2');
soro('HEM_IGM_S1', 6, '49', 'Sorologia Hemoaglutinação - IgM S1'); soro('HEM_IGG_S1', '6-7', '49', 'Sorologia Hemoaglutinação - IgG S1');
soro('HEM_IGM_S2', 7, '49', 'Sorologia Hemoaglutinação - IgM S2'); soro('HEM_IGG_S2', 7, '49', 'Sorologia Hemoaglutinação - IgG S2');
// Nomes do campo 50 como no "Nome do campo" do DICCHAG (decisão do Rubens, 13/11/2026).
const IFI = 'Resultado da Imunofluorescência Indireta - IFI';
const titulo = (nome, pg, rotulo) => dc(nome, pg, '50', rotulo, 'texto', {
  observacao: "O valor é o título da diluição: a ficha de Chagas (p. 2, campo 50) imprime '1 : ____' e o campo guarda só o número de baixo (por exemplo, 40 = 1:40). O DICCHAG repete por engano as categorias do resultado (1 reagente a 4 não realizado). Decisão do Rubens (13/11/2026): manter o número como veio, sem tradução.",
});
soro('IMU_IGM_S1', 7, '50', `${IFI} IgM S1`); titulo('TIT_IGM_S1', 7, `${IFI} Título IgM S1`);
soro('IMU_IGM_S2', 7, '50', `${IFI} IgM S2`); titulo('TIT_IGM_S2', 8, `${IFI} Título IgM S2`);
soro('IMU_IGG_S1', 8, '50', `${IFI} IgG S1`); titulo('TIT_IGG_S1', 8, `${IFI} Título IgG S1`);
soro('IMU_IGG_S2', 8, '50', `${IFI} IgG S2`); titulo('TIT_IGG_S2', 8, `${IFI} Título IgG S2`);
dc('RESUL_HIS', 8, '51', 'Histopatológico - Data da coleta', 'data', { local: 'p. 8-9, campo 51' });
dc('RES_HIST', 9, '52', 'Resultado do histopatológico', 'categorico', { categorias: cat([['1', 'Positivo'], ['2', 'Negativo'], ['3', 'Não realizado'], ['9', 'Ignorado']]) });
lista('ESPECIFICO', 9, '53', 'Tipo de tratamento - Específico', 'sni');
lista('SINTOMATIC', 9, '53', 'Tipo de tratamento - Sintomático', 'sni');
dc('DROGA', 9, '54', 'Droga utilizada no tratamento específico', 'categorico', { categorias: cat([['1', 'Benznidazol'], ['2', 'Outro']]) });
dc('TEMPO', 9, '55', 'Tempo de tratamento (em dias)', 'numero', { observacao: "Unidade tirada da ficha de Chagas (p. 2, campo 55: 'Tempo de tratamento (em dias)'), por decisão do Rubens (13/11/2026); o DICCHAG não informa a unidade." });
const med = (nome, pg, rotulo) => lista(nome, pg, '56', `Medidas tomadas - ${rotulo}`, 'snnai');
med('CON_TRIAT', 9, 'Controle de triatomídeos'); med('BIOSSEG', '9-10', 'Implantação de normas de biossegurança em laboratório');
med('FISCALIZA', 10, 'Fiscalização sanitária em unidade de hemoterapia'); med('MED_OUTRO', 10, 'Outros');
dc('OUTRO_DES', 10, '56', 'Medidas tomadas - Outros (especificar)', 'texto');
const anexo = (fonteDic) => `O DICCHAG (${fonteDic}) é de 2010; as categorias seguem o Anexo I do NOTIF2018 (revisado em novembro/2018, linha Doença de Chagas aguda), o documento mais recente (regra do Rubens).`;
col('CLASSI_FIN', 'FICHACHAG', 'p. 2, campo 57', 'Classificação final', 'categorico', {
  categorias: [
    ...cat([['1', 'Confirmado'], ['2', 'Descartado']]),
    { codigos: ['8'], rotulo: 'Inconclusivo', fonte: 'NOTIF2018', local: "p. 19, Anexo I, linha Doença de Chagas aguda; nota (**) na p. 23" },
  ],
  observacao: "1 e 2 como na ficha e no DICCHAG (p. 10, campo 57). O 8 não aparece na ficha porque é gravado pelo próprio sistema: segundo a nota (**) do Anexo I do NOTIF2018 (p. 23), é a 'categoria atribuída pelo sistema quando ultrapassado o prazo para investigação oportuna desse agravo'. Decisão do Rubens (13/11/2026), depois de ver a nota: adotar 8 = Inconclusivo. O arquivo de 2025 traz 1.111 registros com 8.",
});
col('CRITERIO', 'NOTIF2018', 'p. 19, Anexo I', 'Critério de confirmação/descarte', 'categorico', {
  categorias: cat([['1', 'Laboratorial'], ['2', 'Clínico-epidemiológico'], ['3', 'Clínico']]),
  observacao: anexo("p. 10, campo 58: '1-laboratório, 2-clínico-epidemiológico, 3-clínico'"),
});
col('EVOLUCAO', 'NOTIF2018', 'p. 19, Anexo I', 'Evolução do caso', 'categorico', {
  categorias: [
    ...cat([['1', 'Vivo']]),
    { codigos: ['2'], rotulo: 'Óbito por D. Chagas Aguda', fonte: 'FICHACHAG', local: 'p. 2, campo 59' },
    ...cat([['3', 'Óbito por outras causas'], ['9', 'Ignorado']]),
  ],
  observacao: anexo("p. 10, campo 59: '2- óbito por chagas'") + " O rótulo do 2 segue a ficha de Chagas ('Óbito por D. Chagas Aguda'), por decisão do Rubens (13/11/2026).",
});
dc('DT_OBITO', 11, '60', 'Data do óbito', 'data');
dc('CON_PROVAV', 11, '61', 'Modo provável da infecção', 'categorico', {
  categorias: cat([['1', 'Transfusional'], ['2', 'Vetorial'], ['3', 'Transplacentária'], ['4', 'Acidental'], ['5', 'Oral'], ['6', 'Outra'], ['9', 'Ignorada']]),
});
dc('CON_OUTRA', 11, '61', 'Modo provável da infecção - Outra (especificar)', 'texto');
dc('CON_LOCAL', 11, '62', 'Local provável de infecção (no período de 90 dias)', 'categorico', {
  local: 'p. 11-12, campo 62',
  categorias: cat([['1', 'Unidade de hemoterapia'], ['2', 'Domicílio'], ['3', 'Laboratório'], ['4', 'Outro'], ['9', 'Ignorado']]),
});
dc('TPAUTOCTO', 12, '63', 'O caso é autóctone de residência?', 'categorico', { categorias: cat([['1', 'Sim'], ['2', 'Não'], ['3', 'Indeterminado']]) });
dc('COUFINF', 13, '64', 'UF provável da fonte de infecção', 'uf');
C.push({ ...deLV('COPAISINF'), fonte: 'DICCHAG', local: 'p. 13, campo 65' });
dc('COMUNINF', 14, '66', 'Município provável da fonte de infecção', 'municipio');
lista('DOENCA_TRA', 15, '69', 'Doença relacionada ao trabalho', 'sni');
dc('DT_ENCERRA', 15, '70', 'Data do encerramento', 'data');
comum('DT_DIGITA', 'DT_TRANSUS', 'DT_TRANSDM', 'DT_TRANSSM', 'DT_TRANSRM', 'DT_TRANSRS', 'DT_TRANSSE', 'NU_LOTE_V', 'NU_LOTE_H');

const fontesLV = ['NOTIF2018', 'IBGE_DTB2023', 'DATASUS_MUNICIPIOS', 'DATASUS_REGSAUD', 'CNES', 'CBO', 'MS_MACRORREGIOES'];
const PACOTE = "Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026)";
const dic = {
  formato: 1,
  agravo: { nome: 'Doença de Chagas aguda', codigos: ['B57.1', 'B571'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos CHAGBRxx.dbc), Sinan NET 5.0',
  conferencia: {
    conferido: true,
    por: 'Rubens Araujo da Silva Junior',
    data: '2026-11-14',
    registro: 'docs/conferencia/conferencia-chagas.xlsx (rodadas de 13 e 14/11/2026, com a aba Listas; 6 colunas com pedidos já atendidos confirmadas como OK no chat em 14/11/2026)',
  },
  convencoes: lv.convencoes,
  fontes: {
    DICCHAG: { documento: 'Dicionário de Dados – Sinan NET – versão 5.0 – Doença de Chagas (campos 31 a 70)', orgao: 'Ministério da Saúde / SVS / GT-Sinan', data: `revisado em julho de 2010. ${PACOTE}`, arquivo: 'docs/fontes/chagas/CHAGAN_DIC_DADOS.pdf' },
    FICHACHAG: { documento: 'Ficha de Investigação – Doença de Chagas Aguda – Sinan NET', orgao: 'Ministério da Saúde / SVS', data: `08/10/2009 (rodapé da ficha). ${PACOTE}`, arquivo: 'docs/fontes/chagas/CHAGAN_FICHA.pdf' },
    ...Object.fromEntries(fontesLV.map((id) => [id, lv.fontes[id]])),
  },
  tabelas: lv.tabelas,
  regras_tabelas: lv.regras_tabelas,
  listas: {
    sni: cat([['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']]),
    snnai: cat([['1', 'Sim'], ['2', 'Não'], ['3', 'Não se aplica'], ['9', 'Ignorado']]),
    pnnr: cat([['1', 'Positivo'], ['2', 'Negativo'], ['3', 'Não realizado']]),
    rnrin: cat([['1', 'Reagente'], ['2', 'Não reagente'], ['3', 'Inconclusivo'], ['4', 'Não realizado']]),
  },
  derivadas: lv.derivadas,
  colunas: C,
  pendencias: [
    { coluna: 'TIT_IGM_S1, TIT_IGM_S2, TIT_IGG_S1, TIT_IGG_S2', descricao: 'O DICCHAG lista para os títulos da imunofluorescência as categorias do resultado (1 reagente a 4 não realizado), mas o arquivo traz títulos numéricos (40, 80, 160…). Mantidos como texto, sem tradução. Confirmar.' },
    // Decisão de 13/11/2026 registrada na observação das colunas TIT_* (opção A, com os nomes do DICCHAG).
    { coluna: 'CRITERIO, EVOLUCAO', descricao: 'Categorias do Anexo I do NOTIF2018 (2018), mais recente que o DICCHAG (2010), pela regra do Rubens; o 2 da evolução segue a ficha. Confirmar.' },
    { coluna: 'CLASSI_FIN', descricao: 'Decisão do Rubens (13/11/2026): 1 Confirmado e 2 Descartado, como na ficha, e 8 Inconclusivo, atribuído pelo sistema (Anexo I do NOTIF2018, p. 19, nota da p. 23).' },
    { coluna: 'HISTORIA', descricao: "O nome do campo diz 'últimos 120 dias' e a descrição diz '90 dias'. Usado o nome do campo. Confirmar." },
    { coluna: 'CON_LOCAL', descricao: "O DICCHAG (p. 11, campo 62) diz 'no período de 90 dias'; a ficha (p. 2, campo 62) diz 'no período de 120 dias'. Usado o DICCHAG (90 dias). Confirmar." },
    { coluna: 'ANT_UF_1 a MUN_3', descricao: "O DICCHAG (p. 2, campo 33) descreve os deslocamentos 'no período de 15 meses anteriores ao início dos sinais e sintomas'; a ficha (p. 1, campo 33) diz 'até 120 dias antes do início dos sintomas'. O prazo só aparece na observação das colunas. Confirmar qual citar." },
    ...lv.pendencias.filter((x) => ['ANO_NASC', 'NU_LOTE_I', 'CS_ESCOL_N', 'ID_PAIS', 'COPAISINF', 'ID_OCUPA_N', 'ID_REGIONA', 'ID_RG_RESI'].includes(x.coluna))
      .filter((x) => x.coluna !== 'NU_LOTE_I')
      .map((x) => ({ ...x, descricao: x.descricao.replace('ficha de LV', 'ficha de Chagas').replace('fontes de LV', 'fontes de Chagas') })),
  ],
};
writeFileSync(join(raiz, 'dicionarios/chagas.json'), JSON.stringify(dic, null, 2) + '\n');
console.log('chagas.json:', C.length, 'colunas');
