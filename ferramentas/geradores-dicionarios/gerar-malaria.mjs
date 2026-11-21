// Monta dicionarios/malaria.json. Rótulos transcritos de:
//  DICMAL   = docs/fontes/malaria/MALAN_DIC_DADOS.pdf (texto em modo tabela; páginas pelo rodapé "Revisado em julho/2010")
//  FICHAMAL = docs/fontes/malaria/MALAN_FICHA.pdf (01/01/2010)
// Colunas comuns com fonte NOTIF2018 são copiadas do dicionário de LV já conferido (mesma fonte e página).
// Uso: node gerar-malaria.mjs <raiz do repositório> <arquivo com a lista de colunas do DBC>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [raiz, listaColunas] = process.argv.slice(2);
const lv = JSON.parse(readFileSync(join(raiz, 'dicionarios/leishmaniose-visceral.json'), 'utf8'));
const cat = (pares) => pares.map(([c, r]) => ({ codigos: Array.isArray(c) ? c : [c], rotulo: r }));
const def = {};
const dm = (nome, pg, campo, rotulo, tipo, extra = {}) => { def[nome] = { nome, fonte: 'DICMAL', local: `p. ${pg}, campo ${campo}`, rotulo, tipo, ...extra }; };
const daFicha = (pg, campo) => ({ fonte: 'FICHAMAL', local: `p. ${pg}, campo ${campo}` });
const doInstrutivo = (pg, campo) => ({ fonte: 'INSTMAL', local: `p. ${pg}, campo ${campo}` });

def.ID_AGRAVO = {
  nome: 'ID_AGRAVO', fonte: 'FICHAMAL', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
  categorias: cat([[['B54', 'B 54'], 'Malária']]),
  observacao: "A ficha traz 'MALÁRIA' e o código 'B 54'; por decisão do Rubens (14/11/2026), as duas formas ('B54' e 'B 54') valem. O arquivo de 2025 traz 'B54'.",
};
{
  const e = structuredClone(lv.colunas.find((c) => c.nome === 'CS_ESCOL_N'));
  e.categorias[0] = { ...e.categorias[0], codigos: ['0', '00', '43'], fonte: 'FICHAMAL', local: 'p. 1, campo 14 (o 43 vem do NOTIF2018, p. 5)' };
  e.observacao = "No NOTIF2018 o Analfabeto aparece como '43'; a ficha de malária (p. 1, campo 14) traz '0-Analfabeto'. Por decisão do Rubens (conferências de violência e Chagas), o 0 e o 43 valem como Analfabeto. As formas com um e dois dígitos seguem a decisão P6 do Rubens.";
  def.CS_ESCOL_N = e;
}
dm('DT_INVEST', 1, '31', 'Data da investigação', 'data');
dm('ID_OCUPA_N', '1-2', '32', 'Ocupação (CBO)', 'tabela', { tabela: 'cbo', observacao: 'Nome da ocupação pela CBO 2002. Códigos especiais do Sinan que não estão na CBO ficam como vieram (ver pendências).' });
dm('AT_ATIVIDA', 2, '33', 'Principal atividade nos últimos 15 dias', 'categorico', {
  categorias: [
    ...cat([['1', 'Agricultura'], ['2', 'Pecuária'], ['3', 'Doméstica'], ['4', 'Turismo'], ['5', 'Garimpagem'], ['6', 'Exploração vegetal'], ['7', 'Caça/pesca'], ['8', 'Construtor de estradas / barragens'], ['9', 'Mineração'], ['10', 'Viajante'], ['11', 'Outros']]),
    { codigos: ['12'], rotulo: 'Motorista', ...daFicha(1, 33) },
    ...cat([['99', 'Ignorado']]),
  ],
  observacao: "O DICMAL (2010) lista 1 a 11 e 99; o 12 (Motorista) vem da ficha (p. 1, campo 33) e do instrutivo. O arquivo de 2025 traz 42 registros com 12.",
});
dm('AT_LAMINA', 2, '34', 'Tipo de lâmina', 'categorico', {
  categorias: [['1', 'Busca Passiva (BP)'], ['2', 'Busca Ativa (BA)'], ['3', 'Lâmina de Verificação de Cura (LVC)']].map(([c, r]) => ({ codigos: [c], rotulo: r, ...doInstrutivo(2, 34) })),
  observacao: 'O DICMAL (p. 2, campo 34) e a ficha só trazem as siglas; os nomes vêm do instrutivo (p. 2, campo 34), por decisão do Rubens (14/11/2026). Segundo o DICMAL, BA/BP identificam caso novo e LVC, recaída/recrudescência.',
});
dm('AT_SINTOMA', 2, '35', 'Sintomas', 'categorico', { categorias: cat([['1', 'Com sintomas'], ['2', 'Sem sintomas']]) });
dm('DEXAME', 2, '36', 'Data do exame', 'data');
dm('RESULT', '2-3', '37', 'Resultado do exame', 'categorico', {
  categorias: [['1', 'Negativo'], ['2', 'F (P. falciparum)'], ['3', 'F+FG (P. falciparum+gametócitos de P. falciparum)'], ['4', 'V (P. vivax)'], ['5', 'F+V (P. falciparum+P. vivax)'], ['6', 'V+FG (P. vivax+ gametócitos de P. falciparum)'], ['7', 'FG (gametócitos de P. falciparum)'], ['8', 'M (P. malariae)'], ['9', 'F+M (P. falciparum +P. malariae)'], ['10', 'O (P. ovale)']]
    .map(([c, r]) => ({ codigos: [c], rotulo: r, ...doInstrutivo(2, 37) })),
  observacao: 'O DICMAL (p. 2-3, campo 37) e a ficha só trazem as siglas; os rótulos com o nome das espécies vêm do instrutivo (p. 2, campo 37), por decisão do Rubens (14/11/2026).',
});
dm('PMM', 3, '38', 'Parasitos por mm³', 'numero');
dm('PCRUZ', 3, '39', 'Parasitemia em cruzes', 'categorico', {
  categorias: cat([['1', 'Menor ½ + (Menor que meia cruz)'], ['2', '1/2 + (Meia cruz)'], ['3', '+ (Uma cruz)'], ['4', '++ (Duas cruzes)'], ['5', '+++ (Três cruzes)'], ['6', '++++ (Quatro cruzes)']]),
});
dm('TRA_ESQUEM', '3-4', '40', 'Esquema de tratamento utilizado', 'categorico', {
  categorias: [
    ...cat([
      ['1', 'Infecções por Pv com Cloroquina em 3 dias e Primaquina em 7 dias'],
      ['2', 'Infecções por Pf com Quinina em 3 dias + Doxiciclina em 5 dias + primaquina no 6º dia'],
      ['3', 'Infecções mistas por Pv + Pf com Mefloquina em dose única e primaquina em 7 dias'],
      ['4', 'Infecções por Pm com cloroquina em 3 dias'],
      ['5', 'Infecções por Pv em crianças apresentando vômitos, com cápsulas retais de artesunato em 4 dias e Primaquina em 7 dias'],
      ['6', 'Infecções por Pf com Mefloquina em dose única e primaquina no segundo dia'],
      ['7', 'Infecções por Pf com Quinina em 7 dias'],
      ['8', 'Infecções por Pf de crianças com cápsulas retais de artesunato em 4 dias e dose única de Mefloquina no 3º dia e Primaquina no 5º ida'],
      ['9', 'Infecções mistas por Pv + Pf com Quinina em 3 dias, doxiciclina em 5 dias e Primaquina em 7 dias'],
      ['10', 'Prevenção de recaída da malária por Pv com Cloroquina em dose única semanal durante 3 meses'],
      ['11', 'Malária grave e complicada'],
    ]),
    { codigos: ['12'], rotulo: 'Infecções por Pf com a associação Artemeter+Lumerfantrina em 3 dias' },
    ...cat([['99', 'Outro esquema utilizado (por médico)']]),
  ].map((c) => ({ ...c, ...daFicha(1, 40) })),
  observacao: "Rótulos da ficha (p. 1, campo 40), por decisão do Rubens (14/11/2026); o texto de 1 a 11 e 99 é igual ao do DICMAL, que não tem o 12. No 8, 'ida' é a grafia da fonte. No 12, a grafia 'Lumerfantrina' é a da ficha (o texto extraído aparece como 'Lumerfantrin a'; a conferir na página). O arquivo de 2025 traz 53 registros com 12.",
});
dm('DSTRAESQUE', 4, '40', 'Esquema de tratamento utilizado - Outro (descrever)', 'texto');
dm('DTRATA', 4, '41', 'Data do início do tratamento', 'data');
dm('CLASSI_FIN', 4, '42', 'Classificação final', 'categorico', {
  categorias: [...cat([['1', 'Confirmado'], ['2', 'Descartado']]), { codigos: ['8'], rotulo: 'Inconclusivo', fonte: 'NOTIF2018', local: 'p. 23, nota (**) do Anexo I (regra geral; o Anexo I não tem linha de malária)' }],
  observacao: "O DICMAL e a ficha listam só 1 e 2. O arquivo de 2025 traz 27 registros com 8. Decisão do Rubens (14/11/2026): 8 = Inconclusivo, pela nota (**) do Anexo I do NOTIF2018 ('categoria atribuída pelo sistema quando ultrapassado o prazo para investigação oportuna'), aplicada por analogia, porque o Anexo I não tem linha de malária.",
});
dm('TPAUTOCTO', '4-5', '43', 'O caso é autóctone de residência?', 'categorico', { categorias: cat([['1', 'Sim'], ['2', 'Não'], ['3', 'Indeterminado']]) });
dm('COUFINF', '5-6', '44', 'UF provável da fonte de infecção', 'uf');
def.COPAISINF = { ...structuredClone(lv.colunas.find((c) => c.nome === 'COPAISINF')), fonte: 'DICMAL', local: 'p. 6, campo 45' };
dm('COMUNINF', '6-7', '46', 'Município provável da fonte de infecção', 'municipio');
dm('LOC_INF', '7-8', '49', 'Localidade provável de infecção', 'texto');
dm('DT_ENCERRA', 8, '50', 'Data de encerramento', 'data');
dm('NU_LOTE_I', 8, 'interno (Transferência vertical da investigação)', 'Lote da transferência vertical da investigação', 'texto');

const colunas = readFileSync(listaColunas, 'utf8').trim().split(/\r?\n/).map((nome) => {
  if (def[nome]) return def[nome];
  const c = lv.colunas.find((x) => x.nome === nome);
  if (!c) throw new Error('Coluna sem fonte: ' + nome);
  if (c.fonte !== 'NOTIF2018') throw new Error(`Coluna de LV com fonte própria, precisa de fonte de malária: ${nome} (${c.fonte})`);
  const copia = structuredClone(c);
  if (nome === 'ANO_NASC') copia.observacao = copia.observacao.replace('fontes de LV', 'fontes de malária');
  return copia;
});

const PACOTE = 'Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026)';
const fontesLV = ['NOTIF2018', 'IBGE_DTB2023', 'DATASUS_MUNICIPIOS', 'DATASUS_REGSAUD', 'CNES', 'CBO', 'MS_MACRORREGIOES'];
const dic = {
  formato: 1,
  agravo: { nome: 'Malária', codigos: ['B54'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos MALABRxx.dbc), Sinan NET 5.0',
  conferencia: {
    conferido: true,
    por: 'Rubens Araujo da Silva Junior',
    data: '2026-11-14',
    registro: 'docs/conferencia/conferencia-malaria.xlsx (duas rodadas de conferência na planilha em 14/11/2026)',
  },
  convencoes: lv.convencoes,
  fontes: {
    INSTMAL: { documento: 'Instruções para preenchimento – Ficha de Investigação – Malária – Sinan NET', orgao: 'Ministério da Saúde / SVS', data: `30/10/2007 (rodapé). ${PACOTE}`, arquivo: 'docs/fontes/malaria/MALAN_INSTRUCIONAL.pdf' },
    DICMAL: { documento: 'Dicionário de Dados – Sinan NET – versão 5.0 – Malária (campos 31 a 50)', orgao: 'Ministério da Saúde / SVS / GT-Sinan', data: `revisado em julho de 2010. ${PACOTE}`, arquivo: 'docs/fontes/malaria/MALAN_DIC_DADOS.pdf' },
    FICHAMAL: { documento: 'Ficha de Investigação – Malária – Sinan NET', orgao: 'Ministério da Saúde / SVS', data: `01/01/2010 (rodapé da ficha). ${PACOTE}`, arquivo: 'docs/fontes/malaria/MALAN_FICHA.pdf' },
    ...Object.fromEntries(fontesLV.map((id) => [id, lv.fontes[id]])),
  },
  tabelas: lv.tabelas,
  regras_tabelas: lv.regras_tabelas,
  listas: {},
  derivadas: lv.derivadas,
  colunas,
  pendencias: [
    { coluna: 'CLASSI_FIN', descricao: 'O arquivo de 2025 traz 27 registros com 8. Nenhuma fonte de malária lista o 8, e o Anexo I do NOTIF2018 (que define 8 = Inconclusivo em outros agravos) não tem linha de malária. Decisão do Rubens (14/11/2026): 8 = Inconclusivo, por analogia com a nota do Anexo I.' },
    { coluna: 'AT_ATIVIDA e TRA_ESQUEM', descricao: 'O código 12 (Motorista; e o esquema Artemeter+Lumerfantrina) vem da ficha de 2010, porque o DICMAL não o lista. Confirmar, inclusive a grafia "Lumerfantrina" na ficha (p. 1, campo 40).' },
    { coluna: 'RESULT e AT_LAMINA', descricao: 'Siglas mantidas como na fonte (F, V, FG, M, O; BP, BA, LVC), sem explicação no DICMAL. Confirmar se ficam assim.' },
    ...lv.pendencias.filter((x) => ['ANO_NASC', 'ID_PAIS', 'COPAISINF', 'ID_OCUPA_N', 'ID_REGIONA', 'ID_RG_RESI'].includes(x.coluna))
      .map((x) => ({ ...x, descricao: x.descricao.replace('fontes de LV', 'fontes de malária') })),
  ],
};
writeFileSync(join(raiz, 'dicionarios/malaria.json'), JSON.stringify(dic, null, 2) + '\n');
console.log('malaria.json:', colunas.length, 'colunas');
