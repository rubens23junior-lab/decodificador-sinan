// Acrescenta aos dicionários de dengue e chikungunya (24/11/2026, pedido do Rubens):
// 1. a regra da ficha antiga ("estrutura"): arquivos sem nenhuma das colunas de sinais
//    de alarme e de dengue grave são da ficha antiga do Sinan NET (até 2013), em que
//    colunas de mesmo nome tinham outro significado; esses arquivos são recusados;
// 2. os campos da ficha de dengue/chikungunya do Sinan Online que existem nas
//    exportações feitas pelos municípios, mas não nos arquivos públicos.
// Só acrescenta; o que já existe no dicionário (conferido) não é trocado.
// Uso: node ferramentas/geradores-dicionarios/acrescentar-dengue-exportacao.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const raiz = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // pasta principal do projeto

const exigeUmaDe = [
  'ALRM_HIPOT', 'ALRM_PLAQ', 'ALRM_VOM', 'ALRM_SANG', 'ALRM_HEMAT', 'ALRM_ABDOM', 'ALRM_LETAR', 'ALRM_HEPAT', 'ALRM_LIQ', 'DT_ALRM',
  'GRAV_PULSO', 'GRAV_CONV', 'GRAV_ENCH', 'GRAV_INSUF', 'GRAV_TAQUI', 'GRAV_EXTRE', 'GRAV_HIPOT', 'GRAV_HEMAT', 'GRAV_MELEN',
  'GRAV_METRO', 'GRAV_SANG', 'GRAV_AST', 'GRAV_MIOC', 'GRAV_CONSC', 'GRAV_ORGAO', 'DT_GRAV',
];

const novas = [
  { nome: 'HOSPITAL', rotulo: 'Unidade de saúde da hospitalização (CNES)', tipo: 'tabela', tabela: 'cnes', fonte: 'ONLINE2015', local: 'p. 8, campo 54',
    observacao: 'Só nas exportações do Sinan; não vem nos arquivos públicos do DATASUS. Código da unidade (co_unidade_hospital), procurado na tabela do CNES.' },
  { nome: 'DDD_HOSP', rotulo: 'DDD do telefone do hospital', tipo: 'codigo', fonte: 'ONLINE2015', local: 'p. 8, campo 55',
    observacao: 'Só nas exportações do Sinan; não vem nos arquivos públicos do DATASUS.' },
  { nome: 'TEL_HOSP', rotulo: 'Telefone do hospital', tipo: 'codigo', fonte: 'ONLINE2015', local: 'p. 8, campo 55',
    observacao: 'Só nas exportações do Sinan; não vem nos arquivos públicos do DATASUS.' },
  { nome: 'DS_OBS', rotulo: 'Informações complementares e observações adicionais', tipo: 'texto', fonte: 'ONLINE2015', local: 'p. 27', identifica: true,
    observacao: 'Texto livre, que pode conter nome, endereço ou outros dados da pessoa; por isso é tratado como dado de identificação. Só nas exportações do Sinan.' },
];

for (const agravo of ['dengue', 'chikungunya']) {
  const arq = `${raiz}dicionarios/${agravo}.json`;
  const dic = JSON.parse(readFileSync(arq, 'utf8'));
  dic.estrutura = {
    exige_uma_de: exigeUmaDe,
    mensagem:
      'Este arquivo traz notificações de dengue{anos}, registradas na ficha antiga do Sinan. Infelizmente, os dicionários de dados dos microdados desse período não são disponibilizados, por isso não é possível decodificar essas notificações com segurança. Nenhuma planilha foi gerada.',
    origem: 'Levantamento de 23/11/2026 (docs/levantamento-dengue-anos-antigos.md): os arquivos de 2000 a 2013 não têm nenhuma das colunas de sinais de alarme e de dengue grave; nos de 2007 a 2013, colunas de mesmo nome (CLASSI_FIN, COMPLICA, CON_FHD, EVIDENCIA) tinham outro significado.',
  };
  if (agravo === 'chikungunya') dic.estrutura.mensagem = dic.estrutura.mensagem.replace('notificações de dengue', 'notificações de chikungunya');
  const existentes = new Set(dic.colunas.map((c) => c.nome));
  for (const c of novas) if (!existentes.has(c.nome)) dic.colunas.push(c);
  writeFileSync(arq, JSON.stringify(dic, null, 2) + '\n');
  console.log(`${agravo}: ${dic.colunas.length} colunas, estrutura com ${exigeUmaDe.length} colunas-marca.`);
}

// 24/11/2026: os quatro campos acima foram marcados depois com "so_em_exportacoes": true
// (não são cobrados como ausentes nos arquivos públicos).
