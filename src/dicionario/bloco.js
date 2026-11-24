// Bloco comum de identificação (dicionarios/comum/identificacao.json).
//
// A ficha de notificação individual é a mesma em todos os agravos. As exportações
// do Sinan feitas pelos municípios trazem os campos dela que o DATASUS retira dos
// arquivos públicos (nome, Cartão SUS, endereço...). Este módulo junta esses campos
// ao dicionário de cada agravo. O que o dicionário do agravo já tem não é trocado.

/**
 * @param {any} dic dicionário do agravo
 * @param {any} bloco bloco comum (só entra se conferido)
 * @returns {any} cópia do dicionário com as colunas do bloco que faltavam
 */
export function comBlocoComum(dic, bloco) {
  if (!bloco?.conferencia?.conferido) return dic;
  const existentes = new Set(dic.colunas.map((c) => c.nome.toUpperCase()));
  const novas = bloco.colunas.filter((c) => !existentes.has(c.nome.toUpperCase())).map((c) => ({ ...c, do_bloco_comum: true }));
  if (!novas.length) return dic;
  return {
    ...dic,
    fontes: { ...(bloco.fontes ?? {}), ...dic.fontes },
    listas: { ...(bloco.listas ?? {}), ...(dic.listas ?? {}) },
    colunas: [...dic.colunas, ...novas],
  };
}

/** Colunas que identificam a pessoa (só vão para a planilha quando o usuário pede). */
export function colunasDeIdentificacao(dic) {
  return dic.colunas.filter((c) => c.identifica).map((c) => c.nome.toUpperCase());
}
