// Gera o bloco comum de identificação (dicionarios/comum/identificacao.json).
//
// São os campos da ficha de notificação individual que existem nas exportações
// do Sinan (feitas pelos municípios e regionais), mas que o DATASUS retira dos
// arquivos públicos: nome, data de nascimento, Cartão SUS, endereço, telefone,
// transferências e lotes. A ficha de notificação individual é a mesma em todos
// os agravos, por isso o bloco é juntado a todos os dicionários (src/dicionario/bloco.js).
//
// "identifica": true marca o dado que identifica a pessoa. Esses campos só vão
// para a planilha quando o usuário marca "Incluir os dados que identificam a pessoa".
//
// Fonte: Dicionário de Dados – Notificação Individual (Sinan NET), revisado em
// novembro de 2018 (docs/fontes/notificacao-individual).
// Uso: node ferramentas/geradores-dicionarios/gerar-bloco-identificacao.mjs

import { writeFileSync, mkdirSync } from 'node:fs';

const raiz = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // pasta principal do projeto
const F = 'NINDIN2018';

const col = (nome, rotulo, tipo, local, extra = {}) => ({ nome, rotulo, tipo, fonte: F, local, ...extra });
const ident = { identifica: true };

const colunas = [
  col('NU_NOTIFIC', 'Número da notificação', 'codigo', 'p. 1, Nº da notificação', { ...ident, observacao: 'Número que identifica o registro no Sinan. Permite voltar à notificação original, por isso é tratado como dado de identificação.' }),
  col('NM_PACIENT', 'Nome do paciente', 'texto', 'p. 3, campo 8', ident),
  col('DT_NASC', 'Data de nascimento', 'data', 'p. 3, campo 9', ident),
  col('ID_CNS_SUS', 'Número do Cartão SUS', 'codigo', 'p. 6, campo 15', ident),
  col('NM_MAE_PAC', 'Nome da mãe', 'texto', 'p. 6, campo 16', ident),
  col('ID_DISTRIT', 'Distrito de residência (código)', 'codigo', 'p. 6, campo 19', { observacao: 'Código da tabela de distritos cadastrada pelo gestor municipal do Sinan; a tabela não é pública, o código fica como veio.' }),
  col('ID_BAIRRO', 'Bairro de residência (código)', 'codigo', 'p. 7, campo 20', { observacao: 'Código da tabela de localidades do município; a tabela não é pública, o código fica como veio.' }),
  col('NM_BAIRRO', 'Bairro de residência', 'texto', 'p. 7, campo 20 (Nome do Bairro)'),
  col('ID_LOGRADO', 'Logradouro de residência (código)', 'codigo', 'p. 7, campo 21', ident),
  col('NM_LOGRADO', 'Logradouro de residência', 'texto', 'p. 7, campo 21', { ...ident, observacao: 'No documento, o nome da coluna aparece quebrado em duas linhas ("NM_LOGRAD" e "O").' }),
  col('NU_NUMERO', 'Número do logradouro', 'texto', 'p. 7, campo 22', ident),
  col('NM_COMPLEM', 'Complemento do logradouro', 'texto', 'p. 8, campo 23', { ...ident, observacao: 'No documento, o nome da coluna aparece quebrado em duas linhas ("NM_COMPLE" e "M").' }),
  col('ID_GEO1', 'Geo campo 1 (georreferenciamento)', 'codigo', 'p. 8, campo 24', ident),
  col('ID_GEO2', 'Geo campo 2 (georreferenciamento)', 'codigo', 'p. 8, campo 25', ident),
  col('NM_REFEREN', 'Ponto de referência', 'texto', 'p. 8, campo 26', ident),
  col('NU_CEP', 'CEP de residência', 'codigo', 'p. 8, campo 27', ident),
  col('NU_DDD_TEL', 'DDD do telefone', 'codigo', 'p. 8, campo 28', ident),
  col('NU_TELEFON', 'Telefone', 'codigo', 'p. 8, campo 28', ident),
  col('CS_ZONA', 'Zona de residência', 'categorico', 'p. 8, campo 29', {
    categorias: [
      { codigos: ['1'], rotulo: 'Urbana' },
      { codigos: ['2'], rotulo: 'Rural' },
      { codigos: ['3'], rotulo: 'Periurbana' },
      { codigos: ['9'], rotulo: 'Ignorado' },
    ],
  }),
  col('CODISINF', 'Distrito provável de infecção (código)', 'codigo', 'p. 12, campo 38', { observacao: 'Código da tabela de distritos do município; a tabela não é pública, o código fica como veio.' }),
  col('CO_BAINF', 'Bairro provável de infecção (código)', 'codigo', 'p. 12, campo 39', { observacao: 'No documento a coluna se chama CO_BAINFC; nas exportações do Sinan Online ela vem como CO_BAINF.' }),
  col('NOBAIINF', 'Bairro provável de infecção', 'texto', 'p. 12, campo 39 (Nome do bairro)'),
  col('FONETICA_N', 'Chave fonética do nome', 'texto', 'p. 14, campos internos', { ...ident, observacao: 'Primeiro e último nomes do paciente concatenados.' }),
  col('SOUNDEX', 'Nome codificado (Soundex)', 'texto', 'p. 14, campos internos', { ...ident, observacao: 'Nome do paciente codificado pelo método Soundex.' }),
  col('DT_TRANSUS', 'Data de transferência da unidade de saúde', 'data', 'p. 14, campos internos'),
  col('DT_TRANSDM', 'Data de transferência do distrito municipal', 'data', 'p. 14, campos internos'),
  col('DT_TRANSSM', 'Data de transferência da secretaria municipal de saúde', 'data', 'p. 14, campos internos'),
  col('DT_TRANSRM', 'Data de transferência da regional municipal', 'data', 'p. 14, campos internos'),
  col('DT_TRANSRS', 'Data de transferência da regional de saúde', 'data', 'p. 14, campos internos'),
  col('DT_TRANSSE', 'Data de transferência da secretaria estadual de saúde', 'data', 'p. 15, campos internos'),
  col('NU_LOTE_V', 'Número do lote vertical', 'codigo', 'p. 15, campos internos'),
  col('NU_LOTE_H', 'Número do lote horizontal', 'codigo', 'p. 15, campos internos'),
  col('IDENT_MICR', 'Identificação do microcomputador (código de instalação)', 'codigo', 'p. 15, campos internos', { observacao: 'Código de instalação do sistema (código do município, 6 dígitos) no computador em que o registro foi digitado pela primeira vez.' }),
];

const bloco = {
  formato: 1,
  nome: 'Bloco de identificação (ficha de notificação individual)',
  versao: 'Sinan NET, Dicionário de Dados – Notificação Individual, revisado em novembro de 2018',
  // Conferido pelo Rubens em 24/11/2026: não rodar de novo este gerador sem refazer a conferência.
  conferencia: { conferido: false, por: null, data: null, registro: null },
  fontes: {
    [F]: {
      documento: 'Dicionário de Dados – Notificação Individual (Sinan NET)',
      orgao: 'Ministério da Saúde / SVS',
      data: 'revisado em novembro de 2018',
      arquivo: 'docs/fontes/notificacao-individual/Dicionario das Fichas de Notificação Individual.pdf',
    },
  },
  colunas,
  pendencias: [
    {
      descricao: 'A coluna NU_LOTE_I, que aparece em exportações do Sinan Online de dengue, não está descrita em nenhum documento disponível. Fica fora do bloco e vai para a planilha como veio, sem tradução.',
    },
    {
      descricao: 'Os bairros (código e nome) e os distritos não são tratados como dados de identificação, por decisão do Rubens (identificadores diretos apenas). Em municípios pequenos, combinados com outras variáveis, podem ajudar a identificar a pessoa.',
    },
  ],
};

mkdirSync(raiz + 'dicionarios/comum', { recursive: true });
writeFileSync(raiz + 'dicionarios/comum/identificacao.json', JSON.stringify(bloco, null, 2) + '\n');
console.log(`Gerado dicionarios/comum/identificacao.json com ${colunas.length} colunas (${colunas.filter((c) => c.identifica).length} de identificação).`);
