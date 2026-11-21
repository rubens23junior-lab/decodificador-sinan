// Gera dicionarios/sifilis-congenita.json.
// Colunas da notificação: as do dicionário de hanseníase (conferido; com as regras gerais do Rubens).
// Colunas próprias: dicionário de dados de sífilis congênita (DICSIFC) e a ficha.
// Uso: node gerar-sifilis-congenita.mjs <pasta do projeto> "<colunas do arquivo, na ordem>"
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.argv[2];
const ORDEM = process.argv[3].split(' ');
const base = JSON.parse(readFileSync(join(raiz, 'dicionarios/hanseniase.json'), 'utf8'));
const PACOTE = 'Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026)';

const fontes = {
  DICSIFC: { documento: 'Dicionário de Dados – Sinan NET – versão 5.0 – Sífilis Congênita (campos 31 a 66 e Anexo 1)', orgao: 'Ministério da Saúde / SVS / DEVEP / CIEVS / GT-Sinan',
    data: `revisado em abril de 2012 (20 páginas). ${PACOTE}`, arquivo: 'docs/fontes/sifilis-congenita/SIFICN_DIC_DADOS.pdf' },
  FICHASIFC: { documento: 'Ficha de Investigação – Sífilis Congênita – Sinan NET', orgao: 'Ministério da Saúde / SVS',
    data: `04/08/2008 no rodapé, com a definição de caso e as observações de preenchimento atualizadas. ${PACOTE}`, arquivo: 'docs/fontes/sifilis-congenita/SIFICN_FICHA.pdf' },
  INSTSIFC: { documento: 'Sífilis Congênita – Instruções para preenchimento – Ficha de Investigação – Sinan NET', orgao: 'Ministério da Saúde / SVS',
    data: `04/08/2008 (rodapé). ${PACOTE}`, arquivo: 'docs/fontes/sifilis-congenita/SIFICN_INSTRUCIONAL.pdf' },
};
for (const [k, v] of Object.entries(base.fontes)) if (!/HANS$/.test(k)) fontes[k] = v;

const NOTIFICACAO = 'TP_NOT SEM_NOT DT_NOTIFIC NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS'.split(' ');
const lv = JSON.parse(readFileSync(join(raiz, 'dicionarios/leishmaniose-visceral.json'), 'utf8'));
const daBase = (nome) => structuredClone(base.colunas.find((c) => c.nome === nome) ?? lv.colunas.find((c) => c.nome === nome));
const cat = (pares) => pares.map(([codigo, rotulo, extra]) => ({ codigos: [codigo], rotulo, ...(extra || {}) }));
const D = (local) => ({ fonte: 'DICSIFC', local });
const FORA = (campo, codigos) => ({ rotulo: 'Inconsistência/Não Preenchido', motivo: `Código sem fonte oficial: o campo ${campo} da ficha só comporta ${codigos}` });
const OBS_FORA = 'Códigos que o campo não comporta saem como "Inconsistência/Não Preenchido" (regra geral do Rubens, 16/11/2026).';
const REAG = [['1', 'Reagente'], ['2', 'Não reagente'], ['3', 'Não realizado'], ['9', 'Ignorado']];
const SIMNAO_NR = [['1', 'Sim'], ['2', 'Não'], ['3', 'Não realizado'], ['9', 'Ignorado']];
const SIMNAO_NA = [['1', 'Sim'], ['2', 'Não'], ['3', 'Não se aplica'], ['9', 'Ignorado']];
const catF = (campo, pares) => cat(pares).map((k) => ({ ...k, fonte: 'FICHASIFC', local: `p. 1, campo ${campo}` }));
const sinal = (pag, nome) => ({ ...D(`p. ${pag}, campo 63`), rotulo: `Sinais e sintomas – ${nome}`, tipo: 'categorico', categorias: cat(SIMNAO_NA),
  fora_do_campo: FORA(63, '1, 2, 3 e 9'), observacao: 'Não se aplica: por exemplo, aborto ou natimorto. ' + OBS_FORA });
const titulo = (campo, pag, nome) => ({ ...D(`p. ${pag}, campo ${campo}`), rotulo: `${nome} – título (1:)`, tipo: 'texto',
  observacao: 'Resultado quantitativo (título); o número é o denominador (por exemplo, 8 = 1:8). Fica como veio; valor só com asteriscos vale como campo em branco.' });

const proprias = {
  ID_AGRAVO: { fonte: 'FICHASIFC', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
    categorias: [{ codigos: ['A509', 'A50.9', 'A 50.9', 'A 5 0.9', 'A50.', 'A50'], rotulo: 'Sífilis congênita' }],
    observacao: "A ficha mostra o CID 'A 5 0.9'; no arquivo vem 'A509' (regra do Rubens: o CID como na ficha e sem espaços). O arquivo também traz 'A50.' (351 registros em 2025 e 689 em 2024), aparentemente o CID cortado; decisão do Rubens (16/11/2026): 'A50.' e 'A50' = Sífilis congênita." },
  DT_DIAG: { ...daBase('DT_DIAG'), fonte: 'FICHASIFC', local: 'p. 1, campo 7',
    observacao: 'Ficha, observação de preenchimento do campo 7: data do diagnóstico ou da evidência laboratorial e/ou clínica da doença, de acordo com a definição de caso vigente.' },
  SEM_DIAG: { ...daBase('SEM_DIAG'), fonte: 'FICHASIFC', local: 'p. 1, campo 7 (Data do diagnóstico)',
    observacao: 'Semana epidemiológica do diagnóstico, gerada pelo Sinan na digitação (decisão do Rubens na hanseníase, 16/11/2026). Vem em branco em todos os registros de 2024 e 2025.' },
  ANT_IDADE: { ...D('p. 1, campo 31'), rotulo: 'Idade da mãe', tipo: 'texto',
    observacao: 'Idade da mãe, em anos, por ocasião da notificação. Fica como veio; valor só com asteriscos (276 registros em 2025) vale como campo em branco.' },
  ANT_RACA: { ...D('p. 1, campo 32'), rotulo: 'Raça/cor da mãe', tipo: 'categorico',
    categorias: cat([['1', 'Branca'], ['2', 'Preta'], ['3', 'Amarela'], ['4', 'Parda'], ['5', 'Indígena'], ['9', 'Ignorado']]),
    fora_do_campo: FORA(32, '1 a 5 e 9'), observacao: OBS_FORA },
  ID_OCUPA_N: { ...daBase('ID_OCUPA_N'), ...D('p. 1-2, campo 33'), rotulo: 'Ocupação da mãe (CBO)',
    observacao: 'Na sífilis congênita, a ocupação é a da mãe (DICSIFC, campo 33, co_ocupacao_mae). Nome pela CBO 2002; os códigos especiais do Sinan são procurados na tabela de ocupações do Sinan NET (OCUPANET).' },
  ESCOLMAE: { ...D('p. 2, campo 34'), rotulo: 'Escolaridade da mãe', tipo: 'categorico',
    categorias: daBase('CS_ESCOL_N').categorias.map((k, i) => (i === 0 ? { ...k, fonte: 'FICHASIFC', local: 'p. 1, campo 34' } : { codigos: k.codigos, rotulo: k.rotulo })),
    observacao: 'Mesmas categorias da escolaridade da notificação, repetidas no DICSIFC e na ficha (campo 34). O arquivo traz os códigos com dois dígitos (00 a 10). Formas com um e dois dígitos e o 43 = Analfabeto: regras do Rubens para a escolaridade.' },
  ANT_PRE_NA: { ...D('p. 2, campo 35'), rotulo: 'Realizou pré-natal nesta gestação', tipo: 'categorico',
    categorias: cat([['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']]), fora_do_campo: FORA(35, '1, 2 e 9'), observacao: OBS_FORA },
  UF_PRE_NAT: { ...D('p. 3, campo 36'), rotulo: 'UF de realização do pré-natal', tipo: 'texto',
    observacao: 'No arquivo vem a sigla da UF (por exemplo, SP), exceto em 351 registros de 2025 (os mesmos com agravo "A50."), que trazem o código numérico. Fica como veio, sem conversão (pendência).' },
  MUN_PRE_NA: { ...D('p. 3, campo 37'), rotulo: 'Município de realização do pré-natal', tipo: 'municipio' },
  ANTSIFIL_N: { ...D('p. 3, campo 39'), rotulo: 'Diagnóstico de sífilis materna', tipo: 'categorico',
    categorias: cat([['1', 'Durante o pré-natal'], ['2', 'No momento do parto/curetagem'], ['3', 'Após o parto'], ['4', 'Não realizado'], ['9', 'Ignorado']]),
    fora_do_campo: FORA(39, '1 a 4 e 9'), observacao: OBS_FORA },
  LAB_PARTO: { ...D('p. 3, campo 40'), rotulo: 'Teste não treponêmico no parto/curetagem (mãe)', tipo: 'categorico', categorias: cat(REAG),
    fora_do_campo: FORA(40, '1, 2, 3 e 9'), observacao: 'VDRL materno na admissão para o parto/curetagem. ' + OBS_FORA },
  LAB_TITU_2: titulo(41, 4, 'Teste não treponêmico no parto/curetagem (mãe)'),
  LAB_DT3: { ...D('p. 4, campo 42'), rotulo: 'Data do teste não treponêmico no parto/curetagem (mãe)', tipo: 'data' },
  LAB_CONF: { ...D('p. 4, campo 43'), rotulo: 'Teste treponêmico no parto/curetagem (mãe)', tipo: 'categorico', categorias: catF(43, REAG),
    fora_do_campo: FORA(43, '1, 2, 3 e 9'), observacao: 'O DICSIFC não lista as categorias deste campo; elas vêm da ficha (campo 43). ' + OBS_FORA },
  TRA_ESQUEM: { ...D('p. 4, campo 44'), rotulo: 'Esquema de tratamento da mãe', tipo: 'categorico',
    categorias: cat([['1', 'Adequado'], ['2', 'Inadequado'], ['3', 'Não realizado'], ['9', 'Ignorado']]),
    fora_do_campo: FORA(44, '1, 2, 3 e 9'), observacao: 'Adequado: tratamento completo para o estágio clínico, com penicilina benzatina, iniciado até 30 dias antes do parto (ficha, observação do campo 44). ' + OBS_FORA },
  TRA_DT: { ...D('p. 4, campo 45'), rotulo: 'Data do início do tratamento da mãe', tipo: 'data' },
  ANT_TRATAD: { ...D('p. 4, campo 46'), rotulo: 'Parceiro(s) tratado(s) concomitantemente à gestante', tipo: 'categorico',
    categorias: cat([['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']]), fora_do_campo: FORA(46, '1, 2 e 9'), observacao: OBS_FORA },
  ANT_UF_CRI: { ...D('p. 5, campo 47'), rotulo: 'UF de nascimento/aborto/natimorto', tipo: 'texto',
    observacao: 'No arquivo vem a sigla da UF, exceto em 351 registros de 2025 (os mesmos com agravo "A50."), que trazem o código numérico. Fica como veio, sem conversão (pendência).' },
  ANT_MUNI_C: { ...D('p. 5, campo 48'), rotulo: 'Município de nascimento/aborto/natimorto', tipo: 'municipio' },
  LABC_SANGU: { ...D('p. 5, campo 50'), rotulo: 'Teste não treponêmico – sangue periférico (criança)', tipo: 'categorico', categorias: cat(REAG),
    fora_do_campo: FORA(50, '1, 2, 3 e 9'), observacao: 'O arquivo traz também o 4 (15 registros em 2025 e 38 em 2024). ' + OBS_FORA },
  LABC_TIT_1: titulo(51, 5, 'Teste não treponêmico – sangue periférico (criança)'),
  LABC_DT_1: { ...D('p. 5, campo 52'), rotulo: 'Data do teste não treponêmico – sangue periférico (criança)', tipo: 'data' },
  LABC_IGG: { ...D('p. 6, campo 53'), rotulo: 'Teste treponêmico após 18 meses (criança)', tipo: 'categorico',
    categorias: cat([['1', 'Reagente'], ['2', 'Não reagente'], ['3', 'Não realizado'], ['4', 'Não se aplica'], ['9', 'Ignorado']]),
    fora_do_campo: FORA(53, '1 a 4 e 9'), observacao: OBS_FORA },
  LABC_DT: { ...D('p. 6, campo 54'), rotulo: 'Data do teste treponêmico após 18 meses (criança)', tipo: 'data' },
  LABC_LIQUO: { ...D('p. 6, campo 55'), rotulo: 'Teste não treponêmico – líquor (criança)', tipo: 'categorico', categorias: cat(REAG),
    fora_do_campo: FORA(55, '1, 2, 3 e 9'), observacao: 'O arquivo traz também o 4 (20 registros em 2025 e 43 em 2024). ' + OBS_FORA },
  LABC_TIT_2: titulo(56, 6, 'Teste não treponêmico – líquor (criança)'),
  LABC_DT_2: { ...D('p. 6, campo 57'), rotulo: 'Data do teste não treponêmico – líquor (criança)', tipo: 'data' },
  LABC_TITUL: { ...D('p. 6, campo 58'), rotulo: 'Titulação ascendente', tipo: 'categorico', categorias: cat(SIMNAO_NR),
    fora_do_campo: FORA(58, '1, 2, 3 e 9'), observacao: 'Comparação dos títulos da sorologia não treponêmica da criança no seguimento (1, 3, 6, 12 e 18 meses). ' + OBS_FORA },
  LABC_EVIDE: { ...D('p. 6, campo 59'), rotulo: 'Evidência de Treponema pallidum', tipo: 'categorico', categorias: catF(59, SIMNAO_NR),
    fora_do_campo: FORA(59, '1, 2, 3 e 9'), observacao: 'As categorias vêm da ficha (campo 59); no DICSIFC elas aparecem deslocadas na tabela. ' + OBS_FORA },
  LABC_LIQ_1: { ...D('p. 7, campo 60'), rotulo: 'Alteração liquórica', tipo: 'categorico', categorias: cat(SIMNAO_NR),
    fora_do_campo: FORA(60, '1, 2, 3 e 9'), observacao: OBS_FORA },
  TRA_DIAG_T: { ...D('p. 7, campo 61'), rotulo: 'Diagnóstico radiológico da criança: alteração no exame dos ossos longos', tipo: 'categorico', categorias: cat(SIMNAO_NR),
    fora_do_campo: FORA(61, '1, 2, 3 e 9'), observacao: OBS_FORA },
  TRA_DIAG_C: { ...D('p. 8, campo 62'), rotulo: 'Diagnóstico clínico da criança', tipo: 'categorico',
    categorias: cat([['1', 'Assintomático'], ['2', 'Sintomático'], ['3', 'Não se aplica'], ['9', 'Ignorado']]),
    fora_do_campo: FORA(62, '1, 2, 3 e 9'), observacao: 'Vem em branco em todos os registros de 2024 e 2025. ' + OBS_FORA },
  CLI_ICTERI: sinal(8, 'icterícia'),
  CLI_ANEMIA: sinal(9, 'anemia'),
  CLI_ESPLEN: sinal(9, 'esplenomegalia'),
  CLI_OSTEO: sinal(9, 'osteocondrite'),
  CLI_RINITE: sinal(10, 'rinite muco-sanguinolenta'),
  HEPATO: sinal(10, 'hepatomegalia'),
  LESOES: sinal(11, 'lesões cutâneas'),
  CLI_PSEUDO: sinal(11, 'pseudoparalisia'),
  CLI_OUTRO: sinal(11, 'outro'),
  SIN_OUTR_E: { ...D('p. 12, campo 63 (outro – especificar)'), rotulo: 'Sinais e sintomas – outro (especificar)', tipo: 'texto', observacao: 'Texto livre; fica como veio.' },
  TRA_ESQU_1: { ...D('p. 12, campo 64'), rotulo: 'Esquema de tratamento da criança', tipo: 'categorico',
    categorias: cat([['1', 'Penicilina G cristalina 100.000 a 150.000 UI/kg/dia – 10 dias'], ['2', 'Penicilina G procaína 50.000 UI/kg/dia – 10 dias'],
      ['3', 'Penicilina G benzatina 50.000 UI/kg/dia – dose única'], ['4', 'Outro esquema'], ['5', 'Não realizado'], ['6', 'Não se aplica'], ['9', 'Ignorado']]),
    fora_do_campo: FORA(64, '1 a 6 e 9'),
    observacao: 'Rótulos do DICSIFC (a ficha não tem o 6 "Não se aplica", que o DICSIFC lista). ' + OBS_FORA },
  DS_ESQUEMA: { ...D('p. 12, campo 64 (outro esquema – especificar)'), rotulo: 'Esquema de tratamento da criança – outro (especificar)', tipo: 'texto', observacao: 'Texto livre; fica como veio.' },
  EVOLUCAO: { ...D('p. 13, campo 65'), rotulo: 'Evolução do caso', tipo: 'categorico',
    categorias: cat([['1', 'Vivo'], ['2', 'Óbito por sífilis congênita'], ['3', 'Óbito por outras causas'], ['4', 'Aborto'], ['5', 'Natimorto'], ['9', 'Ignorado']]),
    fora_do_campo: FORA(65, '1 a 5 e 9'), observacao: OBS_FORA },
  EVO_DIAG_N: { ...D('p. 13, Diagnóstico final (campo interno)'), rotulo: 'Diagnóstico final', tipo: 'categorico',
    categorias: cat([['1', 'Sífilis congênita recente'], ['2', 'Sífilis congênita tardia'], ['3', 'Aborto'], ['4', 'Natimorto'], ['5', 'Descartado']]),
    fora_do_campo: { rotulo: 'Inconsistência/Não Preenchido', motivo: 'Código sem fonte oficial: o diagnóstico final só comporta 1 a 5' },
    observacao: 'Campo interno, preenchido automaticamente pelo sistema a partir dos critérios de definição de caso (Anexo 1 do DICSIFC). Recente: diagnóstico em criança com menos de 2 anos; tardia: 2 anos ou mais. ' + OBS_FORA },
  DT_OBITO: { ...D('p. 14, campo 66'), rotulo: 'Data do óbito', tipo: 'data' },
};

const colunas = ORDEM.map((nome) => {
  if (proprias[nome]) { const { fonte, local, rotulo, tipo, nome: _n, ...resto } = proprias[nome]; return { nome, fonte, local, rotulo, tipo, ...resto }; }
  if (NOTIFICACAO.includes(nome)) return daBase(nome);
  throw new Error(`Sem definição: ${nome}`);
});
{ const esc = colunas.find((c) => c.nome === 'CS_ESCOL_N');
  esc.categorias = esc.categorias.map((k) => (k.fonte === 'FICHAHANS' ? { ...k, fonte: 'FICHASIFC', local: 'p. 1, campo 14' } : k));
  esc.observacao = (esc.observacao || '').replace(/ficha de hanseníase/g, 'ficha de sífilis congênita'); }
for (const c of colunas) for (const f of [c.fonte, ...(c.categorias || []).map((k) => k.fonte)].filter(Boolean)) if (!fontes[f]) throw new Error(`${c.nome}: fonte ${f}`);
const usadas = new Set([...colunas.flatMap((c) => [c.fonte, ...(c.categorias || []).map((k) => k.fonte)]), ...Object.values(base.tabelas).map((t) => t.fonte)].filter(Boolean));
for (const k of Object.keys(fontes)) if (!usadas.has(k) && k !== 'INSTSIFC') delete fontes[k];

const pendencias = [
  { coluna: 'ID_AGRAVO', descricao: 'Além de "A509" (sífilis congênita), o arquivo traz "A50." em 351 registros de 2025 e 689 de 2024. Esses registros formam um grupo à parte: todos trazem a UF do pré-natal e a UF de nascimento em código numérico (os demais trazem sigla). Parece o CID cortado ("A50." de "A50.9"); nenhuma fonte define "A50.". Resolvida (Rubens, 16/11/2026): "A50." e "A50" = Sífilis congênita.' },
  { coluna: 'Asteriscos', descricao: 'Muitos campos vêm só com asteriscos ("***", "****", "********") no lugar do valor, por exemplo a data do óbito (12.475 de 12.630 em 2025), as datas dos testes e os títulos. Resolvida (Rubens, 16/11/2026): valor só com asteriscos vale como campo em branco, em todos os agravos; a quantidade aparece na aba Resumo.' },
  { coluna: 'UF_PRE_NAT e ANT_UF_CRI', descricao: 'Vêm como sigla, exceto no grupo "A50." (código numérico). Ficam como vieram, sem conversão. Confirmar.' },
  { coluna: 'LABC_SANGU e LABC_LIQUO', descricao: 'O código 4 aparece (15 e 20 registros em 2025; 38 e 43 em 2024), mas os campos 50 e 55 só comportam 1, 2, 3 e 9. Sai como "Inconsistência/Não Preenchido" pela regra geral. Confirmar.' },
  { coluna: 'LAB_CONF e LABC_EVIDE', descricao: 'As categorias vêm da ficha, porque no DICSIFC não aparecem (LAB_CONF) ou aparecem deslocadas (LABC_EVIDE). Confirmar.' },
  { coluna: 'TRA_ESQU_1', descricao: 'O DICSIFC lista 6 = Não se aplica, que a ficha não traz; ficou no dicionário. Confirmar.' },
  { coluna: 'TRA_DIAG_C', descricao: 'Diagnóstico clínico da criança vem sempre em branco (2024 e 2025).' },
  { coluna: 'EVO_DIAG_N', descricao: 'Diagnóstico final (campo interno, calculado pelo sistema): 1 Sífilis congênita recente, 2 tardia, 3 Aborto, 4 Natimorto, 5 Descartado, conforme o DICSIFC (p. 13). Confirmar.' },
  { coluna: 'Nota informativa', descricao: 'SIFICN_NOTA_INFORMATIVA.pdf é uma imagem escaneada, sem texto que a ferramenta consiga ler; não foi usada. Se trouxer alguma mudança de categoria, conferir.' },
  { coluna: 'UNI_PRE_NA, ANT_LOCAL_, CLI_ASSINT, SIN_*_C', descricao: 'Estão no DICSIFC, mas não vêm no arquivo público. Não entram no dicionário.' },
];

const dic = {
  formato: base.formato,
  agravo: { nome: 'Sífilis congênita', codigos: ['A509', 'A50.9', 'A 50.9', 'A 5 0.9', 'A50.', 'A50'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos SIFCBRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: false, por: '', data: '', registro: '' },
  convencoes: base.convencoes, fontes, tabelas: base.tabelas, regras_tabelas: base.regras_tabelas, listas: base.listas,
  colunas, derivadas: base.derivadas, pendencias,
};
writeFileSync(join(raiz, 'dicionarios/sifilis-congenita.json'), JSON.stringify(dic, null, 2) + '\n');
console.log(`sifilis-congenita.json: ${colunas.length} colunas, ${pendencias.length} pendências, fontes: ${Object.keys(fontes).join(' ')}`);
