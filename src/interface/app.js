// Tela da ferramenta: escolha do agravo e do arquivo, análise, opções,
// processamento em segundo plano e download do resultado.

import { AGRAVOS_INTERFACE } from 'dados-interface';

/* global __VERSAO__ */
const VERSAO = __VERSAO__;
const LIMITE_EXCEL = 1048574; // linhas de dados (o Excel aceita 1.048.576 contando o cabeçalho)
const RECOMENDADO_EXCEL = 300000;

const $ = (id) => document.getElementById(id);
const fmt = (n) => Number(n).toLocaleString('pt-BR');
const mb = (b) => (b < 1048576
  ? `${Math.max(1, Math.round(b / 1024)).toLocaleString('pt-BR')} KB`
  : `${(b / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`);
const dataBr = (aaaammdd) => `${aaaammdd.slice(6, 8)}/${aaaammdd.slice(4, 6)}/${aaaammdd.slice(0, 4)}`;

const estado = { arquivo: null, analise: null, idPedido: 0, urls: [] };
let worker = criarWorker();

// ---------------------------------------------------------------- trabalhador
function criarWorker() {
  const codigo = $('codigo-worker').textContent;
  const w = new Worker(URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' })));
  w.onmessage = ({ data }) => {
    if (data.id !== estado.idPedido) return; // resposta de um pedido antigo
    if (data.tipo === 'progresso') mostrarProgresso(data);
    else if (data.tipo === 'analise') mostrarAnalise(data.resultado);
    else if (data.tipo === 'pronto') mostrarResultado(data);
    else if (data.tipo === 'erro') mostrarErro(data.mensagem);
  };
  w.onerror = (e) => mostrarErro(`Erro inesperado no processamento: ${e.message}`);
  return w;
}

function pedir(mensagem) {
  estado.idPedido++;
  worker.postMessage({ ...mensagem, id: estado.idPedido });
}

// ---------------------------------------------------------------- agravo
function agravoAtual() {
  return AGRAVOS_INTERFACE[$('agravo').value];
}

function iniciar() {
  $('versao').textContent = VERSAO;
  for (const [id, a] of Object.entries(AGRAVOS_INTERFACE)) {
    $('agravo').add(new Option(a.dic.agravo.nome, id));
  }
  $('agravo').addEventListener('change', () => {
    mostrarInfoDicionario();
    if (estado.arquivo) analisar(estado.arquivo);
  });
  mostrarInfoDicionario();

  $('arquivo').addEventListener('change', (e) => e.target.files[0] && analisar(e.target.files[0]));
  const area = $('area-arquivo');
  area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('arrastando'); });
  area.addEventListener('dragleave', () => area.classList.remove('arrastando'));
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('arrastando');
    if (e.dataTransfer.files[0]) analisar(e.dataTransfer.files[0]);
  });
  area.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('arquivo').click(); } });
  $('codificacao').addEventListener('change', () => estado.arquivo && analisar(estado.arquivo));

  $('filtro-uf-coluna').addEventListener('change', preencherUfs);
  $('filtro-uf').addEventListener('change', () => { preencherMunicipios(); atualizarEstimativa(); });
  $('filtro-mun-coluna').addEventListener('change', atualizarEstimativa);
  $('filtro-mun').addEventListener('change', atualizarEstimativa);
  $('filtro-data-coluna').addEventListener('change', mostrarIntervalo);
  for (const id of ['filtro-de', 'filtro-ate']) $(id).addEventListener('change', atualizarEstimativa);
  $('marcar-todas').addEventListener('click', () => marcarColunas(true));
  $('desmarcar-todas').addEventListener('click', () => marcarColunas(false));
  $('lista-colunas').addEventListener('change', contarColunas);
  // No formato para análise o cabeçalho tem uma linha só, para o R ler direto.
  $('formato-analise').addEventListener('change', (e) => {
    $('cabecalho-original').disabled = e.target.checked;
    if (e.target.checked) $('cabecalho-original').checked = false;
  });
  $('processar').addEventListener('click', processar);
  $('cancelar').addEventListener('click', cancelar);
}

function mostrarInfoDicionario() {
  const { dic } = agravoAtual();
  $('info-dicionario').textContent =
    `Dicionário: ${dic.versao}. Conferido por ${dic.conferencia.por} em ${dataBr(dic.conferencia.data.replace(/-/g, ''))}.`;
}

// ---------------------------------------------------------------- análise
function analisar(arquivo) {
  estado.arquivo = arquivo;
  estado.analise = null;
  esconder('passo-opcoes', 'resultado', 'erro', 'analise');
  mostrarProgresso({ etapa: 'Lendo o arquivo…', fracao: 0 });
  pedir({ tipo: 'analisar', arquivo, agravo: $('agravo').value, codificacao: $('codificacao').value || undefined });
}

function mostrarAnalise(a) {
  estado.analise = a;
  esconder('progresso');
  const { dic } = agravoAtual();
  const div = $('analise');
  div.replaceChildren();
  const ok = el('p', { className: a.semTraducao.length ? 'atencao' : 'ok' });
  ok.append(
    el('strong', { textContent: estado.arquivo.name }),
    ` (${a.formato.toUpperCase()}, ${a.codificacao}): ${fmt(a.registros)} notificações e ${a.colunas.length} colunas. `,
    a.semTraducao.length
      ? `${a.semTraducao.length} coluna(s) sem tradução no dicionário, que serão mantidas como estão: ${a.semTraducao.join(', ')}.`
      : `Todas as colunas têm tradução no dicionário de ${dic.agravo.nome}.`,
  );
  div.append(ok);
  if (a.excluidos) div.append(el('p', { className: 'detalhe', textContent: `${fmt(a.excluidos)} registro(s) marcado(s) como excluído(s) no arquivo não serão incluídos.` }));
  if (a.ausentesNoArquivo.length) {
    div.append(el('p', { className: 'detalhe', textContent: `Colunas do dicionário que não estão neste arquivo: ${a.ausentesNoArquivo.join(', ')}.` }));
  }
  div.hidden = false;
  montarOpcoes();
  $('passo-opcoes').hidden = false;
}

// ---------------------------------------------------------------- opções
function colunasDoTipo(tipo) {
  const presentes = new Set(estado.analise.colunas.map((n) => n.toUpperCase()));
  return agravoAtual().dic.colunas.filter((c) => c.tipo === tipo && presentes.has(c.nome.toUpperCase()));
}

function preencherSelectColunas(select, colunas, textoVazio) {
  select.replaceChildren();
  if (!colunas.length) select.add(new Option(textoVazio, ''));
  for (const c of colunas) select.add(new Option(c.rotulo, c.nome));
  select.disabled = colunas.length === 0;
}

function montarOpcoes() {
  preencherSelectColunas($('filtro-uf-coluna'), colunasDoTipo('uf'), 'Nenhuma coluna de UF no arquivo');
  preencherSelectColunas($('filtro-mun-coluna'), colunasDoTipo('municipio'), 'Nenhuma coluna de município no arquivo');
  const datas = colunasDoTipo('data');
  preencherSelectColunas($('filtro-data-coluna'), datas, 'Nenhuma coluna de data no arquivo');
  $('filtro-de').value = '';
  $('filtro-ate').value = '';
  preencherUfs();
  mostrarIntervalo();

  // Lista de colunas: as do arquivo que estão no dicionário, as sem tradução e as colunas extras.
  const { dic } = agravoAtual();
  const lista = $('lista-colunas');
  lista.replaceChildren();
  const porNome = new Map(dic.colunas.map((c) => [c.nome.toUpperCase(), c]));
  const presentes = new Set(estado.analise.colunas.map((n) => n.toUpperCase()));
  for (const nome of estado.analise.colunas) {
    const col = porNome.get(nome.toUpperCase());
    lista.append(caixaColuna(nome, col ? `${col.rotulo} (${col.nome})` : `${nome} (sem tradução)`));
  }
  for (const d of dic.derivadas ?? []) {
    if (presentes.has(d.de.toUpperCase())) lista.append(caixaColuna(d.nome, `${d.rotulo} (coluna extra)`));
  }
  contarColunas();
}

function caixaColuna(nome, texto) {
  const label = el('label');
  const caixa = el('input', { type: 'checkbox', checked: true });
  caixa.dataset.coluna = nome;
  label.append(caixa, ` ${texto}`);
  return label;
}

function marcarColunas(valor) {
  for (const c of $('lista-colunas').querySelectorAll('input')) c.checked = valor;
  contarColunas();
}

function contarColunas() {
  const caixas = [...$('lista-colunas').querySelectorAll('input')];
  $('conta-colunas').textContent = `${caixas.filter((c) => c.checked).length} de ${caixas.length} marcadas`;
}

function preencherUfs() {
  const select = $('filtro-uf');
  select.replaceChildren(new Option('Todas as UFs', ''));
  const coluna = $('filtro-uf-coluna').value;
  const contagem = estado.analise.contagens[coluna] ?? {};
  const { ufs } = agravoAtual().municipios;
  const itens = Object.entries(contagem)
    .filter(([codigo]) => codigo !== '')
    .map(([codigo, n]) => [codigo, ufs[codigo] ?? `Código ${codigo} (sem tradução)`, n])
    .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  for (const [codigo, nome, n] of itens) select.add(new Option(`${nome} – ${fmt(n)} notificações`, codigo));
  select.disabled = !coluna;
  preencherMunicipios();
  atualizarEstimativa();
}

function preencherMunicipios() {
  const select = $('filtro-mun');
  const uf = $('filtro-uf').value;
  select.replaceChildren();
  if (!uf || !$('filtro-mun-coluna').value) {
    select.add(new Option(uf ? 'Nenhuma coluna de município' : 'Escolha uma UF para filtrar por município', ''));
    select.disabled = true;
    return;
  }
  select.add(new Option('Todos os municípios da UF', ''));
  const { municipios } = agravoAtual().municipios;
  Object.entries(municipios)
    .filter(([, m]) => m.uf === uf)
    .sort((a, b) => a[1].nome.localeCompare(b[1].nome, 'pt-BR'))
    .forEach(([codigo, m]) => select.add(new Option(m.nome, codigo)));
  select.disabled = false;
}

function mostrarIntervalo() {
  const iv = estado.analise.intervalos[$('filtro-data-coluna').value];
  const col = colunasDoTipo('data').find((c) => c.nome === $('filtro-data-coluna').value);
  $('intervalo-datas').textContent = iv?.menor
    ? `${col.rotulo} no arquivo: de ${dataBr(iv.menor)} a ${dataBr(iv.maior)}.`
    : '';
  atualizarEstimativa();
}

function filtrosEscolhidos() {
  const filtros = [];
  const uf = $('filtro-uf').value;
  if (uf) filtros.push({ coluna: $('filtro-uf-coluna').value, valores: [uf] });
  const mun = $('filtro-mun').value;
  if (mun && !$('filtro-mun').disabled) filtros.push({ coluna: $('filtro-mun-coluna').value, valores: [mun] });
  const de = $('filtro-de').value.replace(/-/g, '');
  const ate = $('filtro-ate').value.replace(/-/g, '');
  if (de || ate) filtros.push({ coluna: $('filtro-data-coluna').value, de: de || undefined, ate: ate || undefined });
  return filtros;
}

function atualizarEstimativa() {
  if (!estado.analise) return;
  const uf = $('filtro-uf').value;
  const base = uf ? estado.analise.contagens[$('filtro-uf-coluna').value]?.[uf] ?? 0 : estado.analise.registros;
  const outros = $('filtro-mun').value || $('filtro-de').value || $('filtro-ate').value;
  const radioExcel = document.querySelector('input[name="saida"][value="xlsx"]');
  const p = $('estimativa');
  let texto = `${outros ? 'No máximo ' : ''}${fmt(base)} notificações na saída${outros ? ' (os filtros de município e período reduzem esse número)' : ''}. `;
  p.className = 'detalhe';
  radioExcel.disabled = false;
  if (base > LIMITE_EXCEL && !outros) {
    texto += 'É mais do que o Excel aceita (1.048.576 linhas): use filtros ou a saída em CSV.';
    radioExcel.disabled = true;
    document.querySelector('input[name="saida"][value="csv"]').checked = true;
    p.className = 'atencao';
  } else if (base > RECOMENDADO_EXCEL) {
    texto += 'Acima de 300 mil, a planilha Excel fica pesada para abrir (vários minutos). Recomenda-se filtrar ou usar CSV.';
    p.className = 'atencao';
  }
  p.textContent = texto;
}

// ---------------------------------------------------------------- processamento
function processar() {
  esconder('erro', 'resultado');
  const de = $('filtro-de').value;
  const ate = $('filtro-ate').value;
  if (de && ate && de > ate) return mostrarErro('A data inicial do período é posterior à data final. Corrija o período e tente de novo.');
  const caixas = [...$('lista-colunas').querySelectorAll('input')];
  const marcadas = caixas.filter((c) => c.checked).map((c) => c.dataset.coluna);
  if (!marcadas.length) return mostrarErro('Nenhuma coluna foi marcada. Marque ao menos uma coluna para gerar a planilha.');

  for (const url of estado.urls) URL.revokeObjectURL(url);
  estado.urls = [];
  $('passo-opcoes').hidden = true;
  mostrarProgresso({ etapa: 'Preparando…', fracao: 0 });
  pedir({
    tipo: 'processar',
    arquivo: estado.arquivo,
    agravo: $('agravo').value,
    versao: VERSAO,
    opcoes: {
      saida: document.querySelector('input[name="saida"]:checked').value,
      manterOriginais: $('manter-originais').checked,
      cabecalhoOriginal: $('cabecalho-original').checked,
      formatoAnalise: $('formato-analise').checked,
      colunas: marcadas.length === caixas.length ? null : marcadas,
      filtros: filtrosEscolhidos(),
      codificacao: $('codificacao').value || undefined,
    },
  });
}

function cancelar() {
  worker.terminate();
  worker = criarWorker();
  estado.idPedido++;
  esconder('progresso');
  if (estado.analise) $('passo-opcoes').hidden = false;
}

function mostrarProgresso({ etapa, fracao, lidos }) {
  const sec = $('progresso');
  sec.hidden = false;
  $('etapa').textContent = etapa;
  $('barra').value = fracao ?? 0;
  $('progresso-texto').textContent = `${Math.round((fracao ?? 0) * 100)}%${lidos ? ` – ${fmt(lidos)} registros lidos` : ''}`;
}

function mostrarResultado(r) {
  esconder('progresso');
  const sec = $('resultado');
  sec.replaceChildren(el('h2', { textContent: 'Pronto!' }));
  const tabela = el('table', { className: 'resumo' });
  for (const [k, v] of [
    ['Registros lidos', fmt(r.lidos)],
    ['Registros na planilha', fmt(r.incluidos)],
    ['Valores sem tradução (destacados em amarelo)', fmt(r.inconsistencias)],
  ]) {
    const tr = el('tr');
    tr.append(el('td', { textContent: k }), el('td', { textContent: v }));
    tabela.append(tr);
  }
  const links = el('p', { className: 'downloads' });
  for (const a of r.arquivos) {
    const url = URL.createObjectURL(a.blob);
    estado.urls.push(url);
    links.append(el('a', { href: url, download: a.nome, className: 'botao principal', textContent: `Baixar ${a.nome} (${mb(a.tamanho)})` }));
  }
  const novo = el('button', { type: 'button', className: 'botao-leve', textContent: 'Mudar opções e processar de novo' });
  novo.addEventListener('click', () => { sec.hidden = true; $('passo-opcoes').hidden = false; });
  const aviso = r.arquivos.length > 1
    ? 'Os arquivos foram gerados no seu computador. O primeiro começou a baixar; clique no segundo botão para baixar também o Excel de apoio (inconsistências, dicionário usado e resumo).'
    : 'A planilha foi gerada no seu computador. Se o download não começou sozinho, use o botão abaixo.';
  sec.append(
    el('p', { className: 'ok', textContent: aviso }),
    tabela,
    links,
    el('p', { className: 'detalhe', textContent: 'Confira a aba "Inconsistências" para ver os valores que não foram encontrados no dicionário.' }),
    novo,
  );
  sec.hidden = false;
  links.querySelector('a')?.click();
}

function mostrarErro(mensagem) {
  esconder('progresso');
  const sec = $('erro');
  sec.replaceChildren(el('strong', { textContent: 'Não foi possível concluir. ' }), mensagem);
  sec.hidden = false;
  if (estado.analise) $('passo-opcoes').hidden = false;
}

// ---------------------------------------------------------------- utilidades
function el(tag, props = {}) {
  return Object.assign(document.createElement(tag), props);
}

function esconder(...ids) {
  for (const id of ids) $(id).hidden = true;
}

iniciar();
