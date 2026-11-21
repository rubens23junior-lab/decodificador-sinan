// Grupos de agravos na tela (decisão do Rubens, 21/11/2026): botões por grupo,
// com a dengue em primeiro lugar. Cada identificador é o nome do arquivo do
// dicionário em dicionarios/. Agravo sem grupo aparece em "Outros".

export const GRUPOS_AGRAVOS = [
  { nome: 'Arboviroses', agravos: ['dengue', 'chikungunya', 'zika'] },
  {
    nome: 'Outras doenças transmitidas por vetores',
    agravos: ['leishmaniose-tegumentar', 'leishmaniose-visceral', 'chagas', 'malaria', 'febre-maculosa'],
  },
  { nome: 'Zoonoses e acidentes com animais', agravos: ['leptospirose', 'animais-peconhentos', 'atendimento-antirrabico'] },
  { nome: 'HIV', agravos: ['hiv-adulto', 'hiv-crianca', 'hiv-crianca-exposta', 'hiv-gestante'] },
  { nome: 'Sífilis', agravos: ['sifilis-adquirida', 'sifilis-gestante', 'sifilis-congenita'] },
  { nome: 'Toxoplasmoses', agravos: ['toxoplasmose-gestacional', 'toxoplasmose-congenita'] },
  {
    nome: 'Hepatites, meningite, tuberculose, hanseníase e tétano',
    agravos: ['hepatites-virais', 'meningite', 'tuberculose', 'hanseniase', 'tetano-acidental', 'tetano-neonatal'],
  },
  { nome: 'Violência e surtos', agravos: ['violencia', 'surto-dta'] },
];

/**
 * Organiza os agravos disponíveis nos grupos, na ordem definida acima.
 * @param {string[]} disponiveis identificadores dos agravos do pacote
 * @returns {{nome: string, agravos: string[]}[]}
 */
export function agruparAgravos(disponiveis) {
  const restantes = new Set(disponiveis);
  const grupos = [];
  for (const g of GRUPOS_AGRAVOS) {
    const agravos = g.agravos.filter((id) => restantes.delete(id));
    if (agravos.length) grupos.push({ nome: g.nome, agravos });
  }
  if (restantes.size) grupos.push({ nome: 'Outros', agravos: [...restantes] });
  return grupos;
}
