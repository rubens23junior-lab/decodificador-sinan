// Dicionário e tabelas fictícios para os testes da decodificação.
// Os códigos e rótulos são inventados de propósito: não representam o SINAN.

export function dicionarioFicticio() {
  return {
    formato: 1,
    agravo: { nome: 'Agravo Fictício', codigo: 'X99', coluna: 'ID_AGRAVO' },
    versao: 'teste',
    conferencia: { conferido: true, por: 'Pessoa fictícia', data: '2026-01-01' },
    fontes: { F: { documento: 'Documento fictício', orgao: 'Órgão', data: '2026', arquivo: 'x.pdf' } },
    tabelas: {
      ibge_municipios: { arquivo: 'x', fonte: 'F' },
      municipios_datasus: { arquivo: 'x', fonte: 'F' },
      regioes: { arquivo: 'x', fonte: 'F' },
      unidades: { arquivo: 'x', fonte: 'F' },
    },
    listas: { sn: [{ codigos: ['1'], rotulo: 'Sim' }, { codigos: ['2'], rotulo: 'Não' }] },
    colunas: [
      { nome: 'ID_AGRAVO', rotulo: 'Agravo', tipo: 'categorico', fonte: 'F', local: 'p', categorias: [{ codigos: ['X99'], rotulo: 'Fictício' }] },
      { nome: 'DT_NOTIFIC', rotulo: 'Data da notificação', tipo: 'data', fonte: 'F', local: 'p' },
      { nome: 'NU_IDADE_N', rotulo: 'Idade', tipo: 'idade', fonte: 'F', local: 'p',
        unidades: [{ codigos: ['3'], rotulo: 'mês', plural: 'meses' }, { codigos: ['4'], rotulo: 'ano', plural: 'anos' }] },
      { nome: 'CS_ESCOL', rotulo: 'Escolaridade', tipo: 'categorico', fonte: 'F', local: 'p',
        categorias: [{ codigos: ['1', '01'], rotulo: 'Nível um' }, { codigos: ['9'], rotulo: 'Ignorado' }] },
      { nome: 'FEBRE', rotulo: 'Febre', tipo: 'categorico', fonte: 'F', local: 'p', lista: 'sn' },
      { nome: 'SG_UF', rotulo: 'UF de residência', tipo: 'uf', fonte: 'F', local: 'p' },
      { nome: 'ID_MN_RESI', rotulo: 'Município de residência', tipo: 'municipio', fonte: 'F', local: 'p' },
      { nome: 'ID_UNIDADE', rotulo: 'Unidade', tipo: 'tabela', tabela: 'unidades', fonte: 'F', local: 'p' },
      { nome: 'ID_REGIONA', rotulo: 'Regional (código)', tipo: 'codigo', fonte: 'F', local: 'p' },
    ],
    derivadas: [{ nome: 'REGIAO_RES', rotulo: 'Região de residência', de: 'ID_MN_RESI', tabela: 'regioes', depois_de: 'ID_REGIONA' }],
  };
}

export function tabelasFicticias() {
  return {
    ibge_municipios: {
      ufs: { 99: 'Estado Fictício' },
      municipios: { 990001: { nome: 'Vila Alfa', uf: '99', codigo_ibge: '9900011' } },
    },
    municipios_datasus: { valores: { 990000: { nome: 'Municipio Ignorado - Ficticio', uf: '99' } } },
    regioes: { valores: { 990001: 'Região Norte Fictícia (99001)' } },
    unidades: { valores: { 1234567: 'Posto Fictício' } },
  };
}

export const COLUNAS_ARQUIVO = ['ID_AGRAVO', 'DT_NOTIFIC', 'NU_IDADE_N', 'CS_ESCOL', 'FEBRE', 'SG_UF', 'ID_MN_RESI', 'ID_UNIDADE', 'ID_REGIONA'];
