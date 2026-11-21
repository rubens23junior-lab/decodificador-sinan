// Partes comuns aos geradores de HIV adulto e HIV criança (etapa 2 do HIV).
// Campos da notificação copiados do dicionário de hepatites virais, já conferido pelo Rubens.
import { readFileSync } from 'node:fs';
export const raiz = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // pasta principal do projeto
export const hepa = JSON.parse(readFileSync(`${raiz}dicionarios/hepatites-virais.json`, 'utf8'));
export const copia = (n) => structuredClone(hepa.colunas.find((x) => x.nome === n));
export const REGRA = 'Códigos que o campo não comporta saem como "Inconsistência/Não Preenchido" (regra geral do Rubens, 16/11/2026).';
export const fora = (campo, comporta) => ({ rotulo: 'Inconsistência/Não Preenchido', motivo: `Código sem fonte oficial: o campo ${campo} só comporta ${comporta}` });
export const cats = (pares) => pares.map(([k, r]) => ({ codigos: Array.isArray(k) ? k : [k], rotulo: r }));
export const PACOTE = 'Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026); copiado para o projeto em 19/11/2026, com a decisão do Rubens de usar os dicionários de HIV de 2024 como fonte principal';

export const listasComuns = () => ({
  sn9: cats([['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']]),
  sn_nao_se_aplica: cats([['1', 'Sim'], ['2', 'Não'], ['3', 'Não se aplica']]),
  resultado_teste: cats([['1', 'Positivo/reagente'], ['2', 'Negativo/não reagente'], ['3', 'Inconclusivo'], ['4', 'Não realizado'], ['9', 'Ignorado']]),
  // Categoria de exposição (campo interno), atribuída pelo sistema. Rótulos do dicionário de 2024;
  // o código 69 repete no dicionário o rótulo do 68, e vem aqui pela conversão do TabWin (ClascatN.cnv).
  categoria_exposicao: [
    ...cats([['10', 'Homossexual'], ['11', 'Homo/Drogas'], ['12', 'Homo/Hemofilico'], ['13', 'Homo/transfusão'], ['14', 'Homo/Droga/Hemof'], ['15', 'Homo/Droga/Transf'],
      ['20', 'Bissexual'], ['21', 'Bi/Drogas'], ['22', 'Bi/Hemofílico'], ['23', 'Bi/Transfusão'], ['24', 'Bi/Droga/Hemofílico'], ['25', 'Bi/Droga/Transfusão'],
      ['30', 'Heterossexual'], ['31', 'Hetero/Droga'], ['32', 'Hetero/Hemofílico'], ['33', 'Hetero/Transfusão'], ['34', 'Hetero/Droga/Hemofílico'], ['35', 'Hetero/Droga/Transfusão'],
      ['36', 'Hetero c/parceria de risco indefinido'], ['40', 'Drogas'], ['41', 'Drogas/Hemofílico'], ['42', 'Drogas/Transfusão'], ['50', 'Hemofilico'],
      ['59', 'Transfusão/Droga/Hetero/Hemofílico'], ['60', 'Transfusão'], ['61', 'Transfusão/Drogas'], ['62', 'Transfusão/Homo'], ['63', 'Transfusão/Bi'],
      ['64', 'Transfusão/Droga/ Homossexual'], ['65', 'Transfusão/Droga/Bissexual'], ['66', 'Transfusão/Hetero'], ['67', 'Transfusão/Droga/Hetero'], ['68', 'Transfusão/Droga/Homo/Hemofílico']]),
    { codigos: ['69'], rotulo: 'Transfusão/Drogas/Bissexual/Hemofílico', fonte: 'SINANNET_AIDS', local: 'ClascatN.cnv, código 69' },
    ...cats([['70', 'Acidente com material biológico com posterior soroconversão até 06 meses.'], ['80', 'Perinatal'], ['90', 'Ignorado']]),
  ],
});

export const fonteDef = {
  documento: 'Arquivos de definições do TabWin para aids em adultos (AidsNET.def) e em crianças (AidsCriNET.def), com as conversões Sim_nao, sim_naoap, simnaoaids, AntrelN, Posnegaidsa, Posnegaids, ClascatN, Critaids, CritaidsC, evoaids e EvoAIDScri',
  orgao: 'Ministério da Saúde / GT-Sinan e UT-Sinan', data: 'Conversões revisadas pela UT-Sinan em 2019 (cabeçalho dos arquivos). Pacote TAB_SINANNET do DATASUS.',
  arquivo: 'docs/fontes/tabelas-apoio/TAB_SINANNET/AidsNET.def e AidsCriNET.def',
};

/** Campos da notificação: copiados das hepatites, com observações ajustadas ao HIV. */
export function notificacao(fonteEscolaridade, localEscolaridade, arquivos) {
  const col = {};
  for (const n of ['TP_NOT', 'DT_NOTIFIC', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_REGIONA', 'NU_IDADE_N', 'CS_SEXO', 'CS_GESTANT', 'CS_RACA', 'CS_ESCOL_N', 'SG_UF', 'ID_MN_RESI', 'ID_RG_RESI', 'ID_PAIS']) col[n] = copia(n);
  for (const cat of col.CS_ESCOL_N.categorias) if (cat.fonte === 'FICHAHEPA') Object.assign(cat, { fonte: fonteEscolaridade, local: localEscolaridade });
  col.CS_ESCOL_N.categorias.find((k) => k.rotulo === 'Ignorado').codigos = ['9', '09', '99'];
  col.CS_ESCOL_N.fora_do_campo = { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: o campo 14 só comporta 0 a 10' };
  col.CS_ESCOL_N.observacao = col.CS_ESCOL_N.observacao.replace('o 0 vem da ficha de tétano acidental (p. 1, campo 14)', `o 0 vem da ficha de aids (campo 14)`)
    + ` Nos arquivos ${arquivos} o Ignorado vem como "99"; 9, 09 e 99 = Ignorado (regra do Rubens para o Ignorado com dois dígitos, hepatites, 19/11/2026). ${REGRA}`;
  col.CS_GESTANT.observacao = 'As formas com um e dois dígitos (01 e 1) entram (regra do Rubens); 9, 09 e 99 = Ignorado (decisão do Rubens nas hepatites, 19/11/2026). ' + REGRA;
  return col;
}

export const derivadas = () => structuredClone(hepa.derivadas).filter((d) => d.nome !== 'SEM_NOT_CALC');
