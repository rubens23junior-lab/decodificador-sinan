// Gera dicionarios/sifilis-gestante.json.
// Colunas da notificação: as do dicionário de hanseníase (conferido; já com as regras gerais do Rubens).
// Colunas próprias: dicionário de dados de sífilis em gestante (DICSIFG) e a ficha.
// Uso: node gerar-sifilis-gestante.mjs <pasta do projeto> "<colunas do arquivo, na ordem>"
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.argv[2];
const ORDEM = process.argv[3].split(' ');
const base = JSON.parse(readFileSync(join(raiz, 'dicionarios/hanseniase.json'), 'utf8'));
const PACOTE = 'Pacote de documentação do TAB_SINAN (Docs_TAB_SINAN/Documentação/AGRAVOS), baixado pelo Rubens do site do DATASUS (informação dele, 13/11/2026)';

const fontes = {
  DICSIFG: { documento: 'Dicionário de Dados – Sinan NET – versão 5.0 – Sífilis em Gestante (campos 31 a 45)', orgao: 'Ministério da Saúde / SVS / DEVEP / CIEVS / GT-Sinan',
    data: `revisado em julho de 2010 (5 páginas). ${PACOTE}`, arquivo: 'docs/fontes/sifilis-gestante/SIFIGEN_DIC_DADOS.pdf' },
  FICHASIFG: { documento: 'Ficha de Investigação – Sífilis em Gestante – Sinan NET', orgao: 'Ministério da Saúde / SVS',
    data: `29/09/2008 no rodapé, com a definição de caso atualizada no cabeçalho. ${PACOTE}`, arquivo: 'docs/fontes/sifilis-gestante/SIFIGEN_FICHA.pdf' },
  INSTSIFG: { documento: 'Sífilis em Gestante – Instruções para preenchimento – Ficha de Investigação – Sinan NET', orgao: 'Ministério da Saúde / SVS',
    data: `29/09/2008 (rodapé). ${PACOTE}`, arquivo: 'docs/fontes/sifilis-gestante/SIFIGEN_INSTRUCIONAL.pdf' },
};
for (const [k, v] of Object.entries(base.fontes)) if (!/HANS$/.test(k)) fontes[k] = v;

const NOTIFICACAO = 'TP_NOT DT_NOTIFIC NU_ANO SG_UF_NOT ID_MUNICIP ID_REGIONA NU_IDADE_N CS_SEXO CS_GESTANT CS_RACA CS_ESCOL_N SG_UF ID_MN_RESI ID_RG_RESI ID_PAIS'.split(' ');
const daBase = (nome) => structuredClone(base.colunas.find((c) => c.nome === nome));
const cat = (pares) => pares.map(([codigo, rotulo, extra]) => ({ codigos: [codigo], rotulo, ...(extra || {}) }));
const D = (local) => ({ fonte: 'DICSIFG', local });
const FORA = (campo, codigos) => ({ rotulo: 'Inconsistência/Não Preenchido', motivo: `Código sem fonte oficial: o campo ${campo} da ficha só comporta ${codigos}` });
const OBS_FORA = 'Códigos que o campo não comporta saem como "Inconsistência/Não Preenchido" (regra geral do Rubens, 16/11/2026).';
const REAG = [['1', 'Reagente'], ['2', 'Não reagente'], ['3', 'Não realizado'], ['9', 'Ignorado']];
const ESQUEMA = [['1', 'Penicilina G benzatina 2.400.000 UI'], ['2', 'Penicilina G benzatina 4.800.000 UI'], ['3', 'Penicilina G benzatina 7.200.000 UI'], ['4', 'Outro esquema'], ['5', 'Não realizado'], ['9', 'Ignorado']];
const OBS_ESQ = 'Rótulos do DICSIFG, com a dose do código 3 como na ficha ("7.200.000 UI"; o DICSIFG escreve "7.200..000UI"). A ficha escreve "benzantina"; ficou "benzatina", como no DICSIFG.';

const proprias = {
  ID_AGRAVO: { fonte: 'FICHASIFG', local: 'p. 1, campo 2 (Código CID10)', rotulo: 'Agravo', tipo: 'categorico',
    categorias: [{ codigos: ['O981', 'O98.1'], rotulo: 'Sífilis em gestante' }],
    observacao: "A ficha mostra o CID 'O98.1'; no arquivo vem 'O981' (regra do Rubens: o CID como na ficha e sem o ponto/espaços)." },
  DT_DIAG: { ...daBase('DT_DIAG'), fonte: 'FICHASIFG', local: 'p. 1, campo 7',
    observacao: 'Data do diagnóstico (ficha, campo 7), como na hanseníase: o DICSIFG diz que os campos 1 a 30 seguem a notificação "exceto a data de diagnóstico".' },
  SEM_DIAG: { ...daBase('SEM_DIAG'), fonte: 'FICHASIFG', local: 'p. 1, campo 7 (Data do diagnóstico)',
    observacao: 'Semana epidemiológica do diagnóstico, gerada pelo Sinan na digitação (decisão do Rubens na hanseníase, 16/11/2026). Vem em branco em todos os registros de 2024 e 2025.' },
  ID_OCUPA_N: { ...daBase('ID_OCUPA_N'), ...D('p. 1, campo 31'), rotulo: 'Ocupação (CBO)' },
  PRE_UFREL: { ...D('p. 1, campo 32'), rotulo: 'UF de realização do pré-natal', tipo: 'uf',
    observacao: 'O DICSIFG fala em sigla da UF, mas o arquivo traz o código numérico (IBGE); o nome da UF vem da tabela do IBGE.' },
  PRE_MUNIRE: { ...D('p. 2, campo 33'), rotulo: 'Município de realização do pré-natal', tipo: 'municipio' },
  TPEVIDENCI: { ...D('p. 2, campo 36'), rotulo: 'Classificação clínica', tipo: 'categorico',
    categorias: cat([['1', 'Primária'], ['2', 'Secundária'], ['3', 'Terciária'], ['4', 'Latente'], ['9', 'Ignorado']]),
    fora_do_campo: FORA(36, '1 a 4 e 9'), observacao: OBS_FORA },
  TPTESTE1: { ...D('p. 2-3, campo 37'), rotulo: 'Teste não treponêmico no pré-natal', tipo: 'categorico', categorias: cat(REAG),
    fora_do_campo: FORA(37, '1, 2, 3 e 9'), observacao: 'Teste não treponêmico: VDRL ou RPR. ' + OBS_FORA },
  DSTITULO1: { ...D('p. 3, campo 38'), rotulo: 'Título do teste não treponêmico no pré-natal (1:)', tipo: 'texto',
    observacao: 'Resultado da titulação do VDRL/RPR; o número é o denominador do título (por exemplo, 8 = 1:8). Fica como veio.' },
  DTTESTE1: { ...D('p. 3, campo 39'), rotulo: 'Data do teste não treponêmico no pré-natal', tipo: 'data' },
  TPCONFIRMA: { ...D('p. 3, campo 40'), rotulo: 'Teste treponêmico no pré-natal', tipo: 'categorico',
    categorias: cat(REAG).map((k) => ({ ...k, fonte: 'FICHASIFG', local: 'p. 1, campo 40' })),
    fora_do_campo: FORA(40, '1, 2, 3 e 9'),
    observacao: 'O DICSIFG não lista as categorias deste campo (só diz "aceita apenas os códigos listados"); elas vêm da ficha (campo 40). Testes treponêmicos: FTA-Abs, MHA-Tp, TPHA, ELISA. ' + OBS_FORA },
  TPESQUEMA: { ...D('p. 4, campo 41'), rotulo: 'Esquema de tratamento prescrito à gestante', tipo: 'categorico', categorias: cat(ESQUEMA),
    fora_do_campo: FORA(41, '1 a 5 e 9'), observacao: `${OBS_ESQ} ${OBS_FORA}` },
  TRATPARC: { ...D('p. 4, campo 42'), rotulo: 'Parceiro tratado concomitantemente à gestante', tipo: 'categorico',
    categorias: cat([['1', 'Sim'], ['2', 'Não'], ['9', 'Ignorado']]), fora_do_campo: FORA(42, '1, 2 e 9'), observacao: OBS_FORA },
  TPESQPAR: { ...D('p. 4, campo 43'), rotulo: 'Esquema de tratamento prescrito ao parceiro', tipo: 'categorico', categorias: cat(ESQUEMA),
    fora_do_campo: FORA(43, '1 a 5 e 9'), observacao: `${OBS_ESQ} ${OBS_FORA}` },
  TPMOTPARC: { ...D('p. 4, campo 44'), rotulo: 'Motivo para o não tratamento do parceiro', tipo: 'categorico',
    categorias: cat([['1', 'Parceiro não teve mais contato com a gestante'], ['2', 'Parceiro não foi comunicado/convocado à US para tratamento'],
      ['3', 'Parceiro foi comunicado/convocado à US para tratamento, mas não compareceu'], ['4', 'Parceiro foi comunicado/convocado à US mas recusou o tratamento'],
      ['5', 'Parceiro com sorologia não reagente'], ['6', 'Outro motivo']]),
    fora_do_campo: FORA(44, '1 a 6'), observacao: 'Rótulos como na ficha (o DICSIFG traz o mesmo texto em minúsculas); US = unidade de saúde. ' + OBS_FORA },
  DSMOTIVO: { ...D('p. 5, campo 45'), rotulo: 'Motivo para o não tratamento do parceiro – outro (descrição)', tipo: 'texto',
    observacao: 'Texto livre; fica como veio.' },
  CLASSI_FIN: { fonte: 'NOTIF2018', local: 'campo 32 (Classificação final), Anexo I', rotulo: 'Classificação final', tipo: 'codigo',
    observacao: 'Nenhum documento de sífilis em gestante descreve a classificação final, e o Anexo I do NOTIF2018 não tem linha de sífilis. A coluna vem em branco em todos os registros de 2024 e 2025; se vier algum código, fica como veio.' },
};

const colunas = ORDEM.map((nome) => {
  if (proprias[nome]) { const { fonte, local, rotulo, tipo, nome: _n, ...resto } = proprias[nome]; return { nome, fonte, local, rotulo, tipo, ...resto }; }
  if (NOTIFICACAO.includes(nome)) return daBase(nome);
  throw new Error(`Sem definição: ${nome}`);
});
// a escolaridade aponta para a ficha da gestante no código 0
{ const esc = colunas.find((c) => c.nome === 'CS_ESCOL_N');
  esc.categorias = esc.categorias.map((k) => (k.fonte === 'FICHAHANS' ? { ...k, fonte: 'FICHASIFG', local: 'p. 1, campo 14' } : k));
  esc.observacao = (esc.observacao || '').replace(/ficha de hanseníase/g, 'ficha de sífilis em gestante'); }
for (const c of colunas) for (const f of [c.fonte, ...(c.categorias || []).map((k) => k.fonte)].filter(Boolean)) if (!fontes[f]) throw new Error(`${c.nome}: fonte ${f}`);
const usadas = new Set([...colunas.flatMap((c) => [c.fonte, ...(c.categorias || []).map((k) => k.fonte)]), ...Object.values(base.tabelas).map((t) => t.fonte)].filter(Boolean));
for (const k of Object.keys(fontes)) if (!usadas.has(k) && k !== 'INSTSIFG') delete fontes[k];

const pendencias = [
  { coluna: 'CLASSI_FIN', descricao: 'Sem fonte de sífilis em gestante e sem linha no Anexo I do NOTIF2018; vem sempre em branco (2024 e 2025). Ficou como código mantido como veio. Confirmar.' },
  { coluna: 'DTTESTE1', descricao: 'Em 18.747 registros de 2024 e 12.473 de 2025 a data do teste vem como "********". Resolvida (Rubens, 16/11/2026): valor só com asteriscos vale como campo em branco, em todos os agravos.' },
  { coluna: 'TPCONFIRMA', descricao: 'As categorias (1 Reagente, 2 Não reagente, 3 Não realizado, 9 Ignorado) vêm da ficha, porque o DICSIFG não as lista. Confirmar.' },
  { coluna: 'TPESQUEMA e TPESQPAR', descricao: 'Grafias divergentes nas fontes: "benzatina" (DICSIFG) e "benzantina" (ficha); "7.200..000UI" (DICSIFG) e "7.200.000 UI" (ficha). Ficou "Penicilina G benzatina 7.200.000 UI". Confirmar.' },
  { coluna: 'PRE_MUNIRE', descricao: 'Dois registros de 2025 trazem texto no lugar do código do município ("aa" e "..." no formato). Ficam como vieram, nas Inconsistências.' },
  { coluna: 'Nota informativa', descricao: 'SIFIGEN_NOTA_INFORMATIVA.pdf é uma imagem escaneada, sem texto que a ferramenta consiga ler; não foi usada. Se trouxer alguma mudança de categoria, conferir.' },
  { coluna: 'PRE_UNIPRE, PRE_SISPRE', descricao: 'Unidade do pré-natal e número no SISPRENATAL estão no DICSIFG (campos 34 e 35), mas não vêm no arquivo público. Não entram no dicionário.' },
  { coluna: 'DSTITULO1 e DSMOTIVO', descricao: 'Título e motivo (texto) ficam como vieram.' },
];

const dic = {
  formato: base.formato,
  agravo: { nome: 'Sífilis em gestante', codigos: ['O981', 'O98.1'], coluna: 'ID_AGRAVO' },
  versao: 'Dados públicos do DATASUS (arquivos SIFGBRxx.dbc), Sinan NET 5.0',
  conferencia: { conferido: false, por: '', data: '', registro: '' },
  convencoes: base.convencoes, fontes, tabelas: base.tabelas, regras_tabelas: base.regras_tabelas, listas: base.listas,
  colunas, derivadas: base.derivadas, pendencias,
};
writeFileSync(join(raiz, 'dicionarios/sifilis-gestante.json'), JSON.stringify(dic, null, 2) + '\n');
console.log(`sifilis-gestante.json: ${colunas.length} colunas, ${pendencias.length} pendências, fontes: ${Object.keys(fontes).join(' ')}`);
