// Gera dicionarios/sifilis-adquirida.json a partir das fontes oficiais.
// Colunas comuns são copiadas dos dicionários de sífilis já conferidos.
import { readFileSync, writeFileSync } from 'node:fs';
const raiz = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // pasta principal do projeto
const ler = (a) => JSON.parse(readFileSync(`${raiz}dicionarios/${a}.json`, 'utf8'));
const g = ler('sifilis-gestante');
const c = ler('sifilis-congenita');
const copia = (d, n) => structuredClone(d.colunas.find((x) => x.nome === n));
const REGRA = 'Códigos que o campo não comporta saem como "Inconsistência/Não Preenchido" (regra geral do Rubens, 16/11/2026).';

const fontes = {
  FICHASIFA: {
    documento: 'Ficha de Investigação – Sífilis Adquirida – Sinan NET (com instruções de preenchimento na p. 2)',
    orgao: 'Ministério da Saúde / SINAN',
    data: '05/10/2010 no rodapé. Baixada pelo Rubens do Portal do Sinan (informação dele, 18/11/2026)',
    arquivo: 'docs/fontes/sifilis-adquirida/sifilis-adquirida.pdf',
  },
  FICHANC: {
    documento: 'Ficha de Notificação/Conclusão – Sinan NET',
    orgao: 'Ministério da Saúde / SVS',
    data: 'SVS 27/09/2005 no rodapé',
    arquivo: 'docs/fontes/notificacao-individual/Fichas de Notificação - Conclusão INdividual.pdf',
  },
};
for (const [id, f] of Object.entries(g.fontes)) if (!['DICSIFG', 'FICHASIFG', 'INSTSIFG'].includes(id)) fontes[id] = f;

const col = {};
for (const n of ['TP_NOT', 'DT_NOTIFIC', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_REGIONA', 'NU_IDADE_N', 'CS_SEXO', 'CS_GESTANT', 'CS_RACA', 'SG_UF', 'ID_MN_RESI', 'ID_RG_RESI', 'ID_PAIS']) col[n] = copia(g, n);
col.SEM_NOT = copia(c, 'SEM_NOT');
col.CS_ESCOL_N = copia(g, 'CS_ESCOL_N');
for (const cat of col.CS_ESCOL_N.categorias) if (cat.fonte === 'FICHASIFG') Object.assign(cat, { fonte: 'FICHASIFA', local: 'p. 1, campo 14' });

col.ID_AGRAVO = {
  nome: 'ID_AGRAVO', fonte: 'FICHASIFA', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
  categorias: [{ codigos: ['A539', 'A53.9'], rotulo: 'Sífilis adquirida' }],
  observacao: "A ficha mostra 'SÍFILIS ADQUIRIDA' com o CID 'A53.9'; no arquivo vem 'A539' (regra do Rubens: o CID como na ficha e sem o ponto). Nome como na ficha, por decisão do Rubens (18/11/2026); na CID-10 o A53.9 é 'Sífilis não especificada'.",
};
col.DT_DIAG = {
  nome: 'DT_DIAG', fonte: 'FICHASIFA', local: 'p. 1, campo 7', rotulo: 'Data do diagnóstico', tipo: 'data',
  observacao: 'Ficha, observações (p. 2): a data do diagnóstico é a data da coleta de material para exame laboratorial ou da evidência clínica.',
};
col.SEM_DIAG = {
  nome: 'SEM_DIAG', fonte: 'FICHASIFA', local: 'p. 1, campo 7 (Data do diagnóstico)', rotulo: 'Semana epidemiológica do diagnóstico do caso notificado', tipo: 'texto',
  observacao: 'Semana epidemiológica do diagnóstico, gerada pelo Sinan na digitação (decisão do Rubens na hanseníase, 16/11/2026). Na sífilis adquirida vem preenchida nos arquivos de 2023 a 2025, por isso não há coluna calculada.',
};
col.DT_INVEST = {
  nome: 'DT_INVEST', fonte: 'NOTIF2018', local: 'p. 9, campo 31 (agravos de Notificação/Conclusão)', rotulo: 'Data da investigação', tipo: 'data',
  observacao: 'Campo da ficha de Notificação/Conclusão, não da ficha de investigação de sífilis adquirida (ver pendência sobre a estrutura do arquivo).',
};
col.ID_OCUPA_N = copia(g, 'ID_OCUPA_N');
Object.assign(col.ID_OCUPA_N, { fonte: 'FICHASIFA', local: 'p. 1, campo 31 (instrução na p. 2)' });

col.CLASSI_FIN = {
  nome: 'CLASSI_FIN', fonte: 'FICHASIFA', local: 'p. 1, campo 42', rotulo: 'Classificação final', tipo: 'categorico',
  categorias: [{ codigos: ['1'], rotulo: 'Confirmado' }, { codigos: ['2'], rotulo: 'Descartado' }],
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: o campo 42 da ficha só comporta 1 e 2, e o Anexo I do NOTIF2018 não tem linha de sífilis adquirida' },
  observacao: `A ficha de Notificação/Conclusão (campo 32) traz as mesmas categorias. O código 8 aparece em cerca de 13% dos registros (33.406 em 2023, 30.443 em 2024 e 12.589 em 2025); nenhuma fonte de sífilis adquirida o define, e ele sai como "Inconsistência/Não Preenchido" (decisão do Rubens, 18/11/2026). ${REGRA}`,
};
col.CRITERIO = {
  nome: 'CRITERIO', fonte: 'FICHANC', local: 'p. 1, campo 33', rotulo: 'Critério de confirmação/descarte', tipo: 'categorico',
  categorias: [{ codigos: ['1'], rotulo: 'Laboratorial' }, { codigos: ['2'], rotulo: 'Clínico-Epidemiológico' }],
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: o campo 33 da ficha de Notificação/Conclusão só comporta 1 e 2' },
  observacao: `O NOTIF2018 (p. 9, campo 33) remete ao Anexo I, que não tem linha de sífilis adquirida; as categorias vêm da ficha de Notificação/Conclusão. ${REGRA}`,
};
col.DOENCA_TRA = {
  nome: 'DOENCA_TRA', fonte: 'NOTIF2018', local: 'p. 13, campo 40', rotulo: 'Doença relacionada ao trabalho', tipo: 'categorico',
  categorias: [{ codigos: ['1'], rotulo: 'Sim' }, { codigos: ['2'], rotulo: 'Não' }, { codigos: ['9'], rotulo: 'Ignorado' }],
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: o campo 40 só comporta 1, 2 e 9' },
  observacao: `Campo da ficha de Notificação/Conclusão (campo 40), com as mesmas categorias. ${REGRA}`,
};
col.EVOLUCAO = {
  nome: 'EVOLUCAO', fonte: 'FICHANC', local: 'p. 1, campo 41', rotulo: 'Evolução do caso', tipo: 'categorico',
  categorias: [{ codigos: ['1'], rotulo: 'Cura' }, { codigos: ['2'], rotulo: 'Óbito pelo agravo notificado' }, { codigos: ['3'], rotulo: 'Óbito por outras causas' }, { codigos: ['9'], rotulo: 'Ignorado' }],
  fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: o campo 41 da ficha de Notificação/Conclusão só comporta 1, 2, 3 e 9' },
  observacao: `O NOTIF2018 (p. 13, campo 41) remete ao Anexo I, que não tem linha de sífilis adquirida; as categorias vêm da ficha de Notificação/Conclusão. ${REGRA}`,
};
col.DT_OBITO = { nome: 'DT_OBITO', fonte: 'NOTIF2018', local: 'p. 13, campo 42', rotulo: 'Data do óbito', tipo: 'data', observacao: 'Campo habilitado se a evolução for 2 ou 3.' };
col.DT_ENCERRA = { nome: 'DT_ENCERRA', fonte: 'NOTIF2018', local: 'p. 14, campo 43', rotulo: 'Data do encerramento', tipo: 'data', observacao: 'Campo da ficha de Notificação/Conclusão (campo 43).' };

const ORDEM = ['TP_NOT', 'ID_AGRAVO', 'DT_NOTIFIC', 'SEM_NOT', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_REGIONA', 'DT_DIAG', 'SEM_DIAG', 'NU_IDADE_N', 'CS_SEXO', 'CS_GESTANT', 'CS_RACA', 'CS_ESCOL_N', 'SG_UF', 'ID_MN_RESI', 'ID_RG_RESI', 'ID_PAIS', 'DT_INVEST', 'ID_OCUPA_N', 'CLASSI_FIN', 'CRITERIO', 'DOENCA_TRA', 'EVOLUCAO', 'DT_OBITO', 'DT_ENCERRA'];
for (const n of ORDEM) if (!col[n]) throw new Error(`falta ${n}`);

const dic = {
  formato: g.formato,
  agravo: { nome: 'Sífilis adquirida', codigos: ['A539', 'A53.9'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos SIFABRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: false, por: '', data: '', registro: '' },
  convencoes: g.convencoes,
  fontes,
  tabelas: g.tabelas,
  listas: {},
  derivadas: g.derivadas.filter((d) => d.nome !== 'SEM_DIAG_CALC'),
  colunas: ORDEM.map((n) => col[n]),
  pendencias: [
    { coluna: 'Estrutura do arquivo', descricao: 'Os arquivos públicos (SIFABR23 a 25, 27 colunas) trazem os campos 1 a 30 da notificação e os campos de conclusão da ficha de Notificação/Conclusão (DT_INVEST, CLASSI_FIN, CRITERIO, DOENCA_TRA, EVOLUCAO, DT_OBITO, DT_ENCERRA). Os campos 32 a 41 da ficha de investigação de sífilis adquirida (antecedente, comportamento sexual, testes, classificação clínica, tratamento) não vêm no arquivo. Por isso, o critério, a evolução, a doença relacionada ao trabalho e as datas seguem o NOTIF2018 e a ficha de Notificação/Conclusão. Confirmar.' },
    { coluna: 'CLASSI_FIN', descricao: 'Resolvida (Rubens, 18/11/2026): o código 8 (33.406 registros em 2023, 30.443 em 2024 e 12.589 em 2025) sai como "Inconsistência/Não Preenchido", pela regra geral, porque nenhuma fonte de sífilis adquirida o define.' },
    { coluna: 'CRITERIO e EVOLUCAO', descricao: 'O NOTIF2018 remete ao Anexo I, que não tem linha de sífilis adquirida. As categorias vêm da ficha de Notificação/Conclusão (critério: 1 Laboratorial, 2 Clínico-Epidemiológico; evolução: 1 Cura, 2 Óbito pelo agravo notificado, 3 Óbito por outras causas, 9 Ignorado). Confirmar.' },
    { coluna: 'ID_AGRAVO', descricao: 'Resolvida (Rubens, 18/11/2026): A539 = "Sífilis adquirida", como na ficha.' },
    { coluna: 'Dicionário de dados', descricao: 'Não há dicionário de dados específico de sífilis adquirida no pacote Docs_TAB_SINAN; as fontes são a ficha de investigação, a ficha de Notificação/Conclusão e o NOTIF2018.' },
  ],
};
writeFileSync(`${raiz}dicionarios/sifilis-adquirida.json`, JSON.stringify(dic, null, 2) + '\n');
console.log('ok', dic.colunas.length, 'colunas');
