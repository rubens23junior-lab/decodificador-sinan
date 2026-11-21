// Gera dicionarios/toxoplasmose-congenita.json e dicionarios/toxoplasmose-gestacional.json.
// Não há dicionário de dados próprio: as fichas são de Notificação/Conclusão (modelo do Sinan NET, versão da SES-MG),
// como na sífilis adquirida. Campos da notificação copiados da leptospirose; campos da conclusão, da sífilis adquirida.
// Atenção: depois da conferência do Rubens, as correções vão direto no JSON; não rodar de novo.
import { readFileSync, writeFileSync } from 'node:fs';
const raiz = decodeURIComponent(new URL('../../', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // pasta principal do projeto
const ler = (a) => JSON.parse(readFileSync(`${raiz}dicionarios/${a}.json`, 'utf8'));
const lept = ler('leptospirose');
const sifa = ler('sifilis-adquirida');
const hans = ler('hanseniase');
const tube = ler('tuberculose');
const de = (d, n) => structuredClone(d.colunas.find((x) => x.nome === n));
const REGRA = 'Códigos que o campo não comporta saem como "Inconsistência/Não Preenchido" (regra geral do Rubens, 16/11/2026).';

const CID = {
  P371: { codigos: ['P371', 'P37.1', 'P 37.1', 'P 3 7. 1'], rotulo: 'Toxoplasmose congênita', local: 'CID10_16.CNV, código P371' },
  O986: { codigos: ['O986', 'O98.6', 'O 98.6', 'O 9 8. 6'], rotulo: 'Doenças causadas por protozoários complicando a gravidez, o parto e o puerpério', local: 'CID10_15.CNV, código O986' },
  B58: { codigos: ['B58', 'B 58', 'B 5 8', 'B58.'], rotulo: 'Toxoplasmose', local: 'CID10_01.CNV, código B58' },
};

function gerar({ arquivo, nome, sigla, cid, ficha, arquivosPublicos }) {
  const F = `FICHA${sigla}`;
  const fontes = {
    [F]: { documento: `Ficha de Notificação/Conclusão – ${nome} – ${cid === 'P371' ? 'P37.1' : 'O98.6'} – Sinan NET (versão da SES-MG)`, orgao: 'Secretaria de Estado de Saúde de Minas Gerais (modelo da ficha de Notificação/Conclusão do Sinan NET)',
      data: `SES-MG 05/07/2019 (rodapé). Colocada pelo Rubens em docs/fontes em 20/11/2026; não existe dicionário de dados próprio (informação do Rubens).${sigla === 'TOXG' ? ' O PDF não tem texto (as letras são desenho); foi lido pela imagem da página.' : ''}`,
      arquivo: ficha },
  };
  for (const [id, f] of Object.entries(lept.fontes)) if (!/LEPT$/.test(id)) fontes[id] = f;
  fontes.FICHANC = sifa.fontes.FICHANC;
  fontes.DICHANS = hans.fontes.DICHANS;

  const col = {};
  for (const n of ['TP_NOT', 'DT_NOTIFIC', 'SEM_NOT', 'NU_ANO', 'SG_UF_NOT', 'ID_MUNICIP', 'ID_REGIONA', 'ID_UNIDADE', 'DT_SIN_PRI', 'SEM_PRI', 'ANO_NASC', 'NU_IDADE_N', 'CS_SEXO', 'CS_GESTANT', 'CS_RACA', 'CS_ESCOL_N', 'SG_UF', 'ID_MN_RESI', 'ID_RG_RESI', 'ID_PAIS', 'NDUPLIC_N', 'DT_DIGITA', 'TPAUTOCTO', 'COPAISINF', 'COMUNINF']) col[n] = de(lept, n);
  for (const cat of col.CS_ESCOL_N.categorias) if (cat.fonte === 'FICHALEPT') Object.assign(cat, { fonte: F, local: 'p. 1, campo 14' });
  col.CS_ESCOL_N.observacao = (col.CS_ESCOL_N.observacao || '').replace(/ficha de leptospirose/g, `ficha de ${nome.toLowerCase()}`);
  col.SEM_PRI.observacao = 'Formato AAAASS (ano e semana). Fica como veio.';
  col.IN_VINCULA = de(hans, 'IN_VINCULA');
  col.IN_VINCULA.observacao = 'Indica se a notificação foi vinculada. Rótulos do dicionário de hanseníase, já conferido; nenhum documento de toxoplasmose descreve a coluna.';
  col.TPUNINOT = { ...de(tube, 'TPUNINOT'), observacao: 'Nenhum documento de toxoplasmose descreve esta coluna. O nome legível é o que o Rubens decidiu na violência (10/11/2026), sem documento oficial. Vem em branco em todos os registros de 2022 a 2025.' };
  col.TP_SISTEMA = { nome: 'TP_SISTEMA', fonte: F, local: 'não aparece na fonte', rotulo: 'TP_SISTEMA (sem descrição nas fontes)', tipo: 'codigo',
    observacao: 'Nenhum documento descreve esta coluna. Vem em branco em todos os registros de 2022 a 2025; se vier algum valor, fica como veio (pendência).' };

  col.ID_AGRAVO = { nome: 'ID_AGRAVO', fonte: F, local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
    categorias: ['P371', 'O986', 'B58'].map((k) => ({ codigos: CID[k].codigos, rotulo: CID[k].rotulo, fonte: 'CID10_TABWIN', local: CID[k].local })),
    observacao: `A ficha mostra '${nome}' com o CID '${cid === 'P371' ? 'P37.1' : 'O98.6'}'. Os arquivos ${arquivosPublicos} misturam três CIDs: P37.1 (toxoplasmose congênita), O98.6 (toxoplasmose gestacional) e B58 (toxoplasmose); os três entram, cada um com o nome da CID-10 (tabela do TabWin), como o Rubens decidiu na meningite. Regra do Rubens (21/11/2026): o B58 em gestante fica como veio, mas recebe o aviso da coluna extra logo depois.` };

  const C = (nome, local, rotulo, fonte, pares, campo, comporta, obs) => ({ nome, fonte, local, rotulo, tipo: 'categorico', categorias: pares.map(([k, r]) => ({ codigos: [k], rotulo: r })), fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: `Código sem fonte oficial: o campo ${campo} da ficha só comporta ${comporta}` }, observacao: [obs, REGRA].filter(Boolean).join(' ') });
  col.DT_INVEST = { ...de(sifa, 'DT_INVEST'), fonte: F, local: 'p. 1, campo 31', observacao: 'Ficha de Notificação/Conclusão, campo 31.' };
  col.ID_OCUPA_N = { ...de(lept, 'ID_OCUPA_N'), fonte: 'NOTIF2018', local: 'não aparece na ficha de toxoplasmose', observacao: de(lept, 'ID_OCUPA_N').observacao + ' A ficha de Notificação/Conclusão de toxoplasmose não tem o campo de ocupação, mas o arquivo traz a coluna; nome como nos outros agravos.' };
  col.CLASSI_FIN = C('CLASSI_FIN', 'p. 1, campo 32', 'Classificação final', F, [['1', 'Confirmado'], ['2', 'Descartado']], 32, '1 e 2', 'O código 8 aparece em cerca de 10% dos registros e sai como "Inconsistência/Não Preenchido", como na leptospirose e na febre maculosa.');
  col.CRITERIO = C('CRITERIO', 'p. 1, campo 33', 'Critério de confirmação/descarte', F, [['1', 'Laboratorial'], ['2', 'Clínico-Epidemiológico']], 33, '1 e 2');
  col.TPAUTOCTO = { ...col.TPAUTOCTO, fonte: F, local: 'p. 1, campo 34' };
  col.COUFINF = { nome: 'COUFINF', fonte: F, local: 'p. 1, campo 35', rotulo: 'UF provável de infecção', tipo: 'uf', observacao: 'No arquivo vem o código numérico da UF (IBGE); o nome da UF vem da tabela do IBGE.' };
  col.COPAISINF = { ...col.COPAISINF, fonte: F, local: 'p. 1, campo 36', observacao: 'Sem tabela compatível: o código fica como veio (pendência). Vem "0" em cerca de metade dos registros, como na leptospirose.' };
  col.COMUNINF = { ...col.COMUNINF, fonte: F, local: 'p. 1, campo 37' };
  col.DOENCA_TRA = C('DOENCA_TRA', 'p. 1, campo 40', 'Doença relacionada ao trabalho', F, [['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']], 40, '1, 2 e 9');
  col.EVOLUCAO = C('EVOLUCAO', 'p. 1, campo 41', 'Evolução do caso', F, [['1', 'Cura/Melhora'], ['2', 'Óbito pelo agravo notificado'], ['3', 'Óbito por outras causas'], ['9', 'Ignorado']], 41, '1, 2, 3 e 9',
    `Rótulos da ficha (${sigla === 'TOXC' ? 'a congênita escreve "Cura/Melhorado"' : 'a gestacional escreve "Cura/Melhora"'}; ficou "Cura/Melhora" nas duas).`);
  col.DT_OBITO = { nome: 'DT_OBITO', fonte: F, local: 'p. 1, campo 42', rotulo: 'Data do óbito', tipo: 'data' };
  col.DT_ENCERRA = { nome: 'DT_ENCERRA', fonte: F, local: 'p. 1, campo 43', rotulo: 'Data do encerramento', tipo: 'data' };

  const ORDEM = 'TP_NOT ID_AGRAVO DT_NOTIFIC SEM_NOT NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA ID_UNIDADE DT_SIN_PRI SEM_PRI ANO_NASC NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS NDUPLIC_N IN_VINCULA DT_INVEST ID_OCUPA_N CLASSI_FIN CRITERIO TPAUTOCTO COUFINF COPAISINF COMUNINF DOENCA_TRA EVOLUCAO DT_OBITO DT_ENCERRA DT_DIGITA TP_SISTEMA TPUNINOT'.split(' ');
  const colunas = ORDEM.map((n) => { if (!col[n]) throw new Error(n); return col[n]; });
  for (const k of Object.keys(col)) if (!ORDEM.includes(k)) throw new Error('fora da ordem: ' + k);

  const derivadas = [
    { nome: 'ALERTA_B58_GESTANTE', rotulo: 'Aviso: possível toxoplasmose gestacional (CID B58 em gestante)', de: 'ID_AGRAVO', calculo: 'alerta_condicional', valores: CID.B58.codigos,
      e: { coluna: 'CS_GESTANT', valores: ['1', '2', '3', '4', '01', '02', '03', '04'] },
      texto: 'Possível caso de toxoplasmose gestacional: notificada com o CID B58 (toxoplasmose), mas o campo Gestante indica gestação; o CID esperado seria O98.6',
      motivo: 'CID B58 (toxoplasmose) com o campo Gestante = 1º, 2º ou 3º trimestre ou idade gestacional ignorada. Na qualificação das notificações, a gestante com toxoplasmose deve ser notificada com o CID O98.6 (toxoplasmose gestacional); o CID ficou como veio (regra do Rubens, 21/11/2026)',
      depois_de: 'ID_AGRAVO',
      observacao: 'Coluna extra, pedida pelo Rubens (21/11/2026), que trabalhou como referência regional de toxoplasmose e na qualificação dessas notificações: quando o CID é B58 e o campo Gestante indica gestação (1º, 2º ou 3º trimestre ou idade gestacional ignorada), é um possível caso de toxoplasmose gestacional, que deveria ter sido notificado com o O98.6. O CID não é mudado; o aviso sai nesta coluna, destacado e contado nas Inconsistências. Nos demais registros a coluna fica vazia.' },
    ...structuredClone(lept.derivadas),
  ];

  const pendencias = [
    { coluna: 'Fontes', descricao: `Não existe dicionário de dados de ${nome.toLowerCase()} (informação do Rubens). Fonte: a ficha de Notificação/Conclusão (versão da SES-MG, 05/07/2019) e o dicionário da notificação individual (NOTIF2018), como na sífilis adquirida. Os campos da notificação vieram da leptospirose, já conferida. Confirmar.` },
    { coluna: 'ID_AGRAVO', descricao: `Os arquivos misturam P37.1, O98.6 e B58. Os três entram com o nome da CID-10. O programa reconhece o arquivo pelo CID principal (${cid === 'P371' ? 'P37.1' : 'O98.6'}), que é a maioria. Confirmar.` },
    { coluna: 'ALERTA_B58_GESTANTE', descricao: 'Regra do Rubens (21/11/2026): CID B58 com o campo Gestante indicando gestação (códigos 1 a 4) recebe o aviso de possível toxoplasmose gestacional (CID esperado O98.6); o CID fica como veio. Confirmar o texto do aviso.' },
    { coluna: 'CLASSI_FIN', descricao: 'O código 8 aparece em cerca de 10% dos registros; a ficha só lista 1 e 2. Sai como "Inconsistência/Não Preenchido". Confirmar.' },
    { coluna: 'ID_OCUPA_N, IN_VINCULA, TPUNINOT e TP_SISTEMA', descricao: 'Colunas do arquivo que a ficha não tem. Ocupação e vinculação seguem os outros agravos; TPUNINOT e TP_SISTEMA vêm sempre vazias e ficam como vieram (TP_SISTEMA sem descrição em nenhuma fonte). Confirmar.' },
  ];

  const dic = {
    formato: lept.formato,
    agravo: { nome, codigos: CID[cid].codigos, coluna: 'ID_AGRAVO' },
    versao: `Dados públicos do DATASUS (arquivos ${sigla}BRxx.dbc), Sinan NET 5.0`,
    conferencia: { conferido: false, por: '', data: '', registro: '' },
    convencoes: lept.convencoes, fontes, tabelas: lept.tabelas, listas: {}, colunas, derivadas, pendencias,
  };
  const usadas = new Set([...colunas.flatMap((x) => [x.fonte, ...(x.categorias || []).map((k) => k.fonte)]), ...Object.values(lept.tabelas).map((t) => t.fonte)].filter(Boolean));
  for (const f of usadas) if (!fontes[f]) throw new Error('fonte ' + f);
  for (const k of Object.keys(fontes)) if (!usadas.has(k)) delete fontes[k];
  writeFileSync(`${raiz}dicionarios/${arquivo}.json`, JSON.stringify(dic, null, 2) + '\n');
  console.log(`${arquivo}.json: ${colunas.length} colunas, ${derivadas.length} extras, ${pendencias.length} pendências; fontes: ${Object.keys(fontes).join(' ')}`);
}

gerar({ arquivo: 'toxoplasmose-congenita', nome: 'Toxoplasmose congênita', sigla: 'TOXC', cid: 'P371', ficha: 'docs/fontes/toxoplasmose-congenita/Ficha de Notificação Toxoplasmose Congênita P37.1 SINAN MG_2019.pdf', arquivosPublicos: 'TOXCBR22 a 25' });
gerar({ arquivo: 'toxoplasmose-gestacional', nome: 'Toxoplasmose gestacional', sigla: 'TOXG', cid: 'O986', ficha: 'docs/fontes/toxoplasmose-gestacional/toxoplasmose-gestacional-ficha-de-notificacao.pdf', arquivosPublicos: 'TOXGBR22 a 25' });
