// Gera a planilha de conferência de um dicionário, para o Rubens comparar
// cada coluna, código e rótulo com os documentos oficiais.
//
// Uso: node ferramentas/gerar-conferencia.js dicionarios/dengue.json [--ok COL1,COL2]
// Saída: docs/conferencia/conferencia-<agravo>.xlsx
//
// Se a planilha já existir (preenchida pelo Rubens), as marcações e os
// comentários das linhas que não mudaram são mantidos. Linhas novas ou
// alteradas ficam em amarelo e sem marcação, para nova conferência.
// --ok marca como OK linhas que o Rubens confirmou fora da planilha (no chat):
// coluna (CS_SEXO), categoria (CS_SEXO|M), coluna extra (REGSAUD_NOT) ou
// tabela (cnes). --ok-data dd/mm/aaaa informa o dia da confirmação (padrão: hoje).
// --referencia dicionarios/dengue.json: num dicionário novo, as linhas iguais
// às de um dicionário já conferido (mesmo nome legível, tipo e rótulos) não
// ficam em amarelo e recebem o comentário "Igual ao dicionário de ...".

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarXlsx, ESTILO } from '../src/saida/xlsx.js';
import { verificarDicionario } from '../src/dicionario/verificar.js';
import { NOMES_TIPOS, categoriasDaColuna } from '../src/dicionario/tipos.js';
import { lerXlsx } from './ler-xlsx.js';

const args = process.argv.slice(2);
const caminho = args.find((a) => a.endsWith('.json'));
const iOk = args.indexOf('--ok');
const confirmadosOk = new Set(iOk !== -1 ? args[iOk + 1].split(',').map((s) => s.trim().toUpperCase()) : []);
const iOkData = args.indexOf('--ok-data');
const iRef = args.indexOf('--referencia');
if (!caminho || (iRef !== -1 && caminho === args[iRef + 1])) {
  console.error('Uso: node ferramentas/gerar-conferencia.js dicionarios/<agravo>.json [--ok COL1,COL2] [--referencia dicionarios/<conferido>.json]');
  process.exit(1);
}
const referencia = iRef !== -1 ? JSON.parse(readFileSync(args[iRef + 1], 'utf8')) : null;
if (referencia && !referencia.conferencia.conferido) {
  console.error('O dicionário de referência precisa estar conferido.');
  process.exit(1);
}

const dic = JSON.parse(readFileSync(caminho, 'utf8'));
const { erros } = verificarDicionario(dic);
if (erros.length) {
  console.error('O dicionário tem erros; corrija antes de gerar a conferência:\n' + erros.join('\n'));
  process.exit(1);
}
const pastaDic = fileURLToPath(new URL('../dicionarios/', import.meta.url));
const municipios = JSON.parse(readFileSync(`${pastaDic}tabelas/ibge-municipios.json`, 'utf8'));

const pasta = fileURLToPath(new URL('../docs/conferencia/', import.meta.url));
mkdirSync(pasta, { recursive: true });
const destino = `${pasta}conferencia-${basename(caminho, '.json')}.xlsx`;
const anterior = existsSync(destino) ? lerXlsx(readFileSync(destino)) : {};

// Índice das linhas da planilha anterior: chave → { campos comparados, marcação, comentário }.
function indexar(aba, chave, campos, colMarca, colComentario) {
  const mapa = new Map();
  for (const l of (anterior[aba] ?? []).slice(1)) {
    if (!l.length) continue;
    mapa.set(chave(l), { campos: campos.map((i) => l[i] ?? ''), marca: l[colMarca] ?? '', comentario: l[colComentario] ?? '' });
  }
  return mapa;
}
const antColunas = indexar('Colunas', (l) => l[1], [2, 3, 4, 5, 6], 7, 8);
const antCategorias = indexar('Categorias', (l) => `${l[0]}|${l[2]}`, [3, 4, 5], 6, 7);
const antExtras = indexar('Colunas extras', (l) => l[0], [1, 2, 3, 4], 5, 6);
const antTabelas = indexar('Tabelas', (l) => l[0], [1, 2, 3], 4, 5);
const antPendencias = indexar('Pendências', (l) => l[0], [1], 2, 2);

const estatistica = { mantidas: 0, revisar: 0, iguais: 0 };
const hoje = new Date().toLocaleDateString('pt-BR');
const dataOk = iOkData !== -1 ? args[iOkData + 1] : hoje;

// Assinaturas do dicionário de referência (sem fonte e página).
// Uma linha só conta como igual se também tiver a mesma observação e a mesma
// fonte especial (categorias com fonte própria).
const assinaturaColuna = (c) => `${c.rotulo}|${c.tipo}|${c.tabela ?? ''}|${c.observacao ?? ''}`;
const assinaturaCategoria = (cat) => `${cat.rotulo}|${cat.fonte ?? ''}`;
const ref = referencia && {
  colunas: new Map(referencia.colunas.map((c) => [c.nome, assinaturaColuna(c)])),
  categorias: new Map(referencia.colunas.flatMap((c) => categoriasDaColuna(referencia, c).map((cat) => [`${c.nome}|${cat.codigos.join(' / ')}`, assinaturaCategoria(cat)]))),
  extras: new Map((referencia.derivadas ?? []).map((d) => [d.nome, `${d.rotulo}|${d.de}|${d.tabela}`])),
  tabelas: new Map(Object.entries(referencia.tabelas ?? {}).map(([id, t]) => [id, t.arquivo])),
};
const igualNaReferencia = (grupo, chave, assinatura) => !!ref && ref[grupo].get(chave) === assinatura;

/**
 * Compara a linha atual com a anterior e devolve [marca, comentário, destacar].
 * "igual" indica que a linha é idêntica à do dicionário de referência.
 */
function marcacao(mapa, chave, campos, podeConfirmar, igual = false) {
  const ant = mapa.get(chave);
  const atuais = campos.map((c) => String(c ?? ''));
  if (!ant && igual) {
    estatistica.iguais++;
    return ['', `Igual ao dicionário de ${referencia.agravo.nome} já conferido (muda só a fonte ou a página).`, false];
  }
  if (!ant) {
    estatistica.revisar++;
    return ['', 'Novo nesta versão', true];
  }
  if (ant.campos.some((c, i) => c !== atuais[i])) {
    estatistica.revisar++;
    const antes = ant.comentario ? ` Seu comentário anterior: "${ant.comentario}".` : '';
    return ['', `Alterado depois da conferência anterior.${antes}`, true];
  }
  if (podeConfirmar && confirmadosOk.has(chave.toUpperCase()) && ant.marca !== 'OK') {
    estatistica.mantidas++;
    return ['OK', `Confirmado como OK pelo Rubens no chat em ${dataOk}.`, false];
  }
  if (ant.marca === '') estatistica.revisar++;
  else estatistica.mantidas++;
  return [ant.marca, ant.comentario, ant.marca === ''];
}

const nomeFonte = (id) => `${id} (${basename(dic.fontes[id].arquivo.replace(/ \(fora do Git\)$/, ''))})`;
const quebra = (v) => ({ valor: v ?? '', estilo: ESTILO.quebraTexto });

/** Monta a linha; se "destacar", pinta todas as células de amarelo. */
function linha(valores, destacar) {
  if (!destacar) return valores;
  return valores.map((v) => ({ valor: v !== null && typeof v === 'object' ? v.valor : v, estilo: ESTILO.destaque }));
}

const colunas = [['Nº', 'Coluna no arquivo', 'Nome legível', 'Tipo', 'Fonte', 'Local na fonte', 'Observação', 'Conferido?', 'Comentário']];
const categorias = [['Coluna no arquivo', 'Nome legível', 'Código(s)', 'Rótulo', 'Fonte', 'Local na fonte', 'Conferido?', 'Comentário']];

dic.colunas.forEach((col, i) => {
  const tipo = col.tipo === 'tabela' ? `${NOMES_TIPOS.tabela}: ${col.tabela}` : NOMES_TIPOS[col.tipo];
  const campos = [col.rotulo, tipo, nomeFonte(col.fonte), col.local, col.observacao ?? ''];
  const [marca, comentario, destacar] = marcacao(antColunas, col.nome, campos, true, igualNaReferencia('colunas', col.nome, assinaturaColuna(col)));
  colunas.push(linha([i + 1, col.nome, col.rotulo, tipo, nomeFonte(col.fonte), col.local, quebra(col.observacao), marca, comentario], destacar));

  for (const cat of categoriasDaColuna(dic, col)) {
    const rotulo = col.tipo === 'idade' ? `1º dígito = unidade: ${cat.rotulo} (${cat.plural})` : cat.rotulo;
    const codigos = cat.codigos.join(' / ');
    const fonte = nomeFonte(cat.fonte ?? col.fonte);
    const local = cat.local ?? col.local;
    const [m, c, d] = marcacao(antCategorias, `${col.nome}|${codigos}`, [rotulo, fonte, local], true,
      igualNaReferencia('categorias', `${col.nome}|${codigos}`, assinaturaCategoria(cat)));
    categorias.push(linha([col.nome, col.rotulo, codigos, rotulo, fonte, local, m, c], d));
  }
});

const extras = [['Coluna extra', 'Nome legível', 'Calculada a partir de', 'Tabela', 'Observação', 'Conferido?', 'Comentário']];
// Inclui as colunas extras ainda em conferência (a ferramenta só as usa depois).
for (const d of [...(dic.derivadas ?? []), ...(dic.derivadas_em_conferencia ?? [])]) {
  const campos = [d.rotulo, d.de, d.tabela, d.observacao ?? ''];
  const [m, c, dest] = marcacao(antExtras, d.nome, campos, true, igualNaReferencia('extras', d.nome, `${d.rotulo}|${d.de}|${d.tabela}`));
  extras.push(linha([d.nome, d.rotulo, d.de, d.tabela, quebra(d.observacao), m, c], dest));
}

const tabelas = [['Tabela', 'Fonte', 'Arquivo', 'Códigos', 'Conferido?', 'Comentário']];
for (const [id, t] of Object.entries(dic.tabelas ?? {})) {
  const caminhoTabela = `${pastaDic}${t.arquivo}`;
  const conteudo = caminhoTabela.endsWith('.gz') ? null : JSON.parse(readFileSync(caminhoTabela, 'utf8'));
  const total = conteudo ? String(conteudo.total ?? conteudo.total_municipios) : 'ver verificador';
  const [m, c, d] = marcacao(antTabelas, id, [nomeFonte(t.fonte), t.arquivo, total], true, igualNaReferencia('tabelas', id, t.arquivo));
  tabelas.push(linha([id, nomeFonte(t.fonte), t.arquivo, total, m, c], d));
}

const fontes = [['ID', 'Documento', 'Órgão', 'Data', 'Arquivo']];
for (const [id, f] of Object.entries(dic.fontes)) fontes.push([id, quebra(f.documento), f.orgao, quebra(f.data), f.arquivo]);

const pendencias = [['Coluna', 'Descrição', 'Decisão do Rubens']];
for (const p of dic.pendencias ?? []) {
  const [, decisao, destacar] = marcacao(antPendencias, p.coluna, [p.descricao]);
  pendencias.push(linha([p.coluna, quebra(p.descricao), destacar && decisao.startsWith('Alterado') ? '' : decisao], destacar));
}

const ufs = [['Código IBGE', 'UF']];
for (const [codigo, nome] of Object.entries(municipios.ufs).sort()) ufs.push([codigo, nome]);

const instrucoes = [
  [`Conferência do dicionário: ${dic.agravo.nome}`],
  [`Versão: ${dic.versao}`],
  [`Gerada em: ${new Date().toLocaleString('pt-BR')}`],
  [''],
  ['Como conferir'],
  [{ valor: 'LINHAS EM AMARELO: novas, alteradas desde a última conferência ou ainda sem marcação. Só elas precisam ser conferidas agora.', estilo: ESTILO.destaque }],
  ['1. Na aba "Colunas", confira o nome legível e o tipo de cada coluna. Abra o documento indicado em "Fonte" na página de "Local na fonte".'],
  ['2. Na aba "Categorias", confira cada código e rótulo contra a mesma página.'],
  ['3. Nas abas "Colunas extras" e "Tabelas", confira as colunas calculadas e as tabelas de apoio.'],
  ['4. Nas colunas "Conferido?", escreva OK ou CORRIGIR. Em "Comentário", explique o que mudar.'],
  ['5. Na aba "Pendências", escreva a sua decisão para cada item.'],
  ['6. Salve e avise. Só depois que tudo estiver OK o dicionário é marcado como conferido e pode ser usado.'],
  [''],
  ['Regras do projeto'],
  ...dic.convencoes.map((c) => [`• ${c}`]),
  ['• Códigos que aparecerem no arquivo e não estiverem aqui ficam como vieram, com destaque, e vão para a aba Inconsistências da planilha final.'],
  [''],
  ['Tabelas de apoio'],
  [`Municípios: ${municipios.total_municipios} municípios e ${Object.keys(municipios.ufs).length} UFs do IBGE. ${dic.regras_tabelas?.municipio ?? ''}`],
];

writeFileSync(destino, criarXlsx([
  { nome: 'Instruções', linhas: instrucoes, larguras: [140], cabecalho: false },
  { nome: 'Colunas', linhas: colunas, larguras: [5, 14, 45, 30, 32, 22, 60, 12, 40] },
  { nome: 'Categorias', linhas: categorias, larguras: [14, 40, 14, 45, 32, 30, 12, 40] },
  { nome: 'Colunas extras', linhas: extras, larguras: [14, 45, 18, 16, 60, 12, 40] },
  { nome: 'Tabelas', linhas: tabelas, larguras: [20, 40, 34, 12, 12, 40] },
  { nome: 'Fontes', linhas: fontes, larguras: [20, 60, 32, 45, 50] },
  { nome: 'Pendências', linhas: pendencias, larguras: [14, 90, 50] },
  { nome: 'UFs', linhas: ufs, larguras: [14, 30] },
]));
console.log(`Gerada ${destino}: ${colunas.length - 1} colunas, ${categorias.length - 1} categorias, ${extras.length - 1} colunas extras, ${tabelas.length - 1} tabelas.`);
console.log(`Marcações mantidas: ${estatistica.mantidas}; iguais ao dicionário de referência: ${estatistica.iguais}; linhas para conferir (em amarelo): ${estatistica.revisar}.`);
