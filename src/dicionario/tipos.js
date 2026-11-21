// Nomes dos tipos de coluna, para mostrar ao usuário.
export const NOMES_TIPOS = {
  texto: 'Texto (mantido como está)',
  numero: 'Número',
  data: 'Data (convertida para data do Excel)',
  categorico: 'Código → rótulo',
  idade: 'Idade codificada (regra especial)',
  municipio: 'Município (tabela do IBGE)',
  uf: 'UF (tabela do IBGE)',
  codigo: 'Código mantido (sem tabela)',
  tabela: 'Código → nome (tabela de apoio)',
};

/** Categorias de uma coluna (da lista compartilhada ou da própria coluna). */
export function categoriasDaColuna(dic, col) {
  if (col.tipo === 'categorico') return col.lista ? dic.listas[col.lista] : col.categorias;
  if (col.tipo === 'idade') return col.unidades;
  return [];
}

// Regras de cálculo das colunas extras sem tabela ("calculo" no dicionário).
export const NOMES_CALCULOS = {
  semana_epidemiologica: 'Semana epidemiológica (AAAASS), calculada da data pelo calendário epidemiológico',
  codigo_com_ponto_vezes_100: 'Tentativa de recuperar código gravado com ponto: valor × 100, procurado na tabela',
  alerta_condicional: 'Aviso quando duas colunas têm, ao mesmo tempo, valores que indicam possível erro de notificação',
};
