// Tela da ferramenta: escolha do agravo e do arquivo, análise, opções,
// processamento em segundo plano e download do resultado.

import { AGRAVOS_INTERFACE } from 'dados-interface';
import { agruparAgravos } from './grupos.js';

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

const estado = { agravo: null, arquivo: null, analise: null, idPedido: 0, urls: [] };
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
    else if (data.tipo === 'erro') mostrarErro(data.mensagem, data.sugestao);
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
  return AGRAVOS_INTERFACE[estado.agravo];
}

// Escolha do agravo: caixa com busca (decisão do Rubens, 24/11/2026). Digitando
// parte do nome (sem precisar de acento), a lista mostra só os agravos que combinam;
// sem digitar nada, mostra todos, separados pelos grupos. A dengue já vem escolhida.
const semAcento = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const combo = { destaque: -1 };

function montarSeletorAgravo() {
  const caixa = $('busca-agravo');
  caixa.addEventListener('focus', () => { caixa.select(); abrirLista(''); });
  caixa.addEventListener('click', () => { if ($('lista-agravos').hidden) abrirLista(''); });
  caixa.addEventListener('input', () => abrirLista(caixa.value));
  caixa.addEventListener('keydown', teclaNaBusca);
  // Fecha a lista ao sair da caixa, devolvendo o nome do agravo escolhido.
  caixa.addEventListener('blur', () => setTimeout(() => { fecharLista(); caixa.value = agravoAtual().dic.agravo.nome; }, 150));
  escolherAgravo(agruparAgravos(Object.keys(AGRAVOS_INTERFACE))[0].agravos[0], { analisarDeNovo: false });
}

/** Mostra a lista filtrada pelo texto digitado (nome do agravo ou do grupo). */
function abrirLista(texto) {
  const lista = $('lista-agravos');
  const busca = semAcento(texto.trim());
  lista.replaceChildren();
  for (const grupo of agruparAgravos(Object.keys(AGRAVOS_INTERFACE))) {
    const doGrupo = semAcento(grupo.nome).includes(busca);
    const ids = grupo.agravos.filter((id) => !busca || doGrupo || semAcento(AGRAVOS_INTERFACE[id].dic.agravo.nome).includes(busca));
    if (!ids.length) continue;
    lista.append(el('li', { className: 'grupo-lista', textContent: grupo.nome, role: 'presentation' }));
    for (const id of ids) {
      const item = el('li', { className: 'opcao-agravo', role: 'option', id: `opcao-${id}`, textContent: AGRAVOS_INTERFACE[id].dic.agravo.nome });
      item.dataset.id = id;
      item.setAttribute('aria-selected', String(id === estado.agravo));
      // mousedown (e não click): escolhe antes de a caixa perder o foco.
      item.addEventListener('mousedown', (e) => { e.preventDefault(); escolherAgravo(id); fecharLista(); $('busca-agravo').blur(); });
      lista.append(item);
    }
  }
  if (!lista.children.length) lista.append(el('li', { className: 'sem-resultado', role: 'presentation', textContent: 'Nenhum agravo com esse nome.' }));
  combo.destaque = busca ? 0 : -1;
  marcarDestaque();
  lista.hidden = false;
  $('busca-agravo').setAttribute('aria-expanded', 'true');
}

function fecharLista() {
  $('lista-agravos').hidden = true;
  $('busca-agravo').setAttribute('aria-expanded', 'false');
  $('busca-agravo').removeAttribute('aria-activedescendant');
}

function opcoesVisiveis() {
  return [...$('lista-agravos').querySelectorAll('.opcao-agravo')];
}

function marcarDestaque() {
  const opcoes = opcoesVisiveis();
  opcoes.forEach((o, i) => o.classList.toggle('destacada', i === combo.destaque));
  const atual = opcoes[combo.destaque];
  if (atual) {
    $('busca-agravo').setAttribute('aria-activedescendant', atual.id);
    atual.scrollIntoView({ block: 'nearest' });
  } else {
    $('busca-agravo').removeAttribute('aria-activedescendant');
  }
}

/** Setas sobem e descem na lista, Enter escolhe, Esc fecha. */
function teclaNaBusca(e) {
  const opcoes = opcoesVisiveis();
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    if ($('lista-agravos').hidden) abrirLista($('busca-agravo').value);
    const n = opcoesVisiveis().length;
    if (!n) return;
    combo.destaque = e.key === 'ArrowDown' ? (combo.destaque + 1) % n : (combo.destaque - 1 + n) % n;
    marcarDestaque();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const escolhida = opcoes[combo.destaque] ?? (opcoes.length === 1 ? opcoes[0] : null);
    if (escolhida) { escolherAgravo(escolhida.dataset.id); fecharLista(); $('busca-agravo').blur(); }
  } else if (e.key === 'Escape') {
    fecharLista();
    $('busca-agravo').value = agravoAtual().dic.agravo.nome;
  }
}

function escolherAgravo(id, { analisarDeNovo = true } = {}) {
  const mudou = estado.agravo !== id;
  estado.agravo = id;
  $('busca-agravo').value = AGRAVOS_INTERFACE[id].dic.agravo.nome;
  $('agravo-escolhido').replaceChildren('Agravo escolhido: ', el('strong', { textContent: AGRAVOS_INTERFACE[id].dic.agravo.nome }));
  mostrarInfoDicionario();
  if (analisarDeNovo && mudou && estado.arquivo) analisar(estado.arquivo);
}

// ---------------------------------------------------------------- tema
// Escuro por padrão; a escolha do tema claro fica guardada neste navegador
// (só a palavra "claro" ou "escuro", nenhum dado do arquivo).
function lerTemaGuardado() {
  try {
    return localStorage.getItem('decodificador-tema');
  } catch {
    return null;
  }
}

function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  const botao = $('trocar-tema');
  botao.textContent = tema === 'claro' ? 'Tema escuro' : 'Tema claro';
  botao.setAttribute('aria-pressed', String(tema === 'claro'));
}

function trocarTema() {
  const tema = document.documentElement.dataset.tema === 'claro' ? 'escuro' : 'claro';
  aplicarTema(tema);
  try {
    localStorage.setItem('decodificador-tema', tema);
  } catch {
    // sem armazenamento (navegação privada, por exemplo): vale só nesta visita
  }
}

function iniciar() {
  $('versao').textContent = VERSAO;
  aplicarTema(lerTemaGuardado() === 'claro' ? 'claro' : 'escuro');
  $('trocar-tema').addEventListener('click', trocarTema);
  montarSeletorAgravo();

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
  $('incluir-identificacao').addEventListener('change', atualizarColunasIdentificacao);
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
  esconder('resultado', 'erro', 'analise');
  mostrarOpcoes(false);
  mostrarProgresso({ etapa: 'Lendo o arquivo…', fracao: 0 });
  pedir({ tipo: 'analisar', arquivo, agravo: estado.agravo, codificacao: $('codificacao').value || undefined });
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
  // Exportação do Sinan com dados que identificam a pessoa (nome, Cartão SUS, endereço...).
  if (a.identificacao?.length) {
    const aviso = el('p', { className: 'atencao' });
    aviso.append(
      el('strong', { textContent: 'Este arquivo tem dados que identificam pessoas. ' }),
      'Por padrão, eles não vão para a planilha. Se você precisar deles (por exemplo, para uma investigação ou ação no território), marque "Incluir os dados que identificam a pessoa" nas opções de colunas.',
    );
    div.append(aviso);
  }
  div.hidden = false;
  montarOpcoes();
  mostrarOpcoes(true);
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
    const caixa = caixaColuna(nome, col ? `${col.rotulo} (${col.nome})${col.identifica ? ' – dado de identificação' : ''}` : `${nome} (sem tradução)`);
    if (col?.identifica) caixa.classList.add('coluna-identificacao');
    lista.append(caixa);
  }
  montarOpcaoIdentificacao();
  for (const d of dic.derivadas ?? []) {
    if (presentes.has(d.de.toUpperCase())) lista.append(caixaColuna(d.nome, `${d.rotulo} (coluna extra)`));
  }
  contarColunas();
}

/** Opção "Incluir os dados que identificam a pessoa": só aparece quando o arquivo tem esses dados. */
function montarOpcaoIdentificacao() {
  const ids = estado.analise.identificacao ?? [];
  const caixa = $('incluir-identificacao');
  caixa.checked = false;
  $('bloco-identificacao').hidden = ids.length === 0;
  const { dic } = agravoAtual();
  const rotulos = ids.map((n) => dic.colunas.find((c) => c.nome === n)?.rotulo ?? n);
  $('texto-identificacao').textContent = ids.length
    ? `Desmarcado, a planilha sai sem: ${rotulos.join(', ')}. Marque só se precisar desses dados; a planilha passa a ter dados pessoais e deve ser guardada e compartilhada com o mesmo cuidado do Sinan.`
    : '';
  atualizarColunasIdentificacao();
}

/** As colunas de identificação ficam desligadas na lista enquanto a opção não for marcada. */
function atualizarColunasIdentificacao() {
  const incluir = $('incluir-identificacao').checked;
  for (const l of $('lista-colunas').querySelectorAll('.coluna-identificacao')) {
    const c = l.querySelector('input');
    c.disabled = !incluir;
    l.classList.toggle('desligada', !incluir);
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
  // Colunas de identificação desligadas (opção não marcada) não entram na conta.
  const caixas = [...$('lista-colunas').querySelectorAll('input')].filter((c) => !c.disabled);
  $('conta-colunas').textContent = `${caixas.filter((c) => c.checked).length} de ${caixas.length} marcadas`;
  atualizarBarra();
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
  mostrarOpcoes(false);
  mostrarProgresso({ etapa: 'Preparando…', fracao: 0 });
  pedir({
    tipo: 'processar',
    arquivo: estado.arquivo,
    agravo: estado.agravo,
    versao: VERSAO,
    opcoes: {
      saida: document.querySelector('input[name="saida"]:checked').value,
      manterOriginais: $('manter-originais').checked,
      cabecalhoOriginal: $('cabecalho-original').checked,
      formatoAnalise: $('formato-analise').checked,
      incluirIdentificacao: $('incluir-identificacao').checked,
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
  if (estado.analise) mostrarOpcoes(true);
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
  novo.addEventListener('click', () => { sec.hidden = true; mostrarOpcoes(true); });
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

function mostrarErro(mensagem, sugestao = null) {
  esconder('progresso');
  const sec = $('erro');
  sec.replaceChildren(el('strong', { textContent: 'Não foi possível concluir. ' }), mensagem);
  // Arquivo de outro agravo: botão para trocar para o agravo provável (nunca troca sozinho).
  if (sugestao && AGRAVOS_INTERFACE[sugestao.id]) {
    const usar = el('button', { type: 'button', className: 'botao principal', textContent: `Usar ${sugestao.nome}` });
    usar.addEventListener('click', () => escolherAgravo(sugestao.id));
    sec.append(
      el('p', { className: 'sugestao', textContent: `Se o arquivo for mesmo de ${sugestao.nome}, clique no botão abaixo. O arquivo será lido de novo com esse agravo.` }),
      usar,
    );
  }
  sec.hidden = false;
  if (estado.analise) mostrarOpcoes(true);
  sec.scrollIntoView({ block: 'center' });
}

/** Mostra ou esconde as opções junto com a barra fixa do botão de processar. */
function mostrarOpcoes(visivel) {
  $('passo-opcoes').hidden = !visivel;
  $('barra-acao').hidden = !visivel;
  document.body.classList.toggle('com-barra', visivel);
  if (visivel) atualizarBarra();
}

/** Resumo na barra fixa: arquivo, agravo e colunas marcadas. */
function atualizarBarra() {
  if (!estado.analise || !estado.arquivo) return;
  const caixas = [...$('lista-colunas').querySelectorAll('input')];
  const marcadas = caixas.filter((c) => c.checked).length;
  $('barra-resumo').textContent =
    `${estado.arquivo.name} · ${agravoAtual().dic.agravo.nome} · ${marcadas} de ${caixas.length} colunas`;
}

// ---------------------------------------------------------------- utilidades
function el(tag, props = {}) {
  return Object.assign(document.createElement(tag), props);
}

function esconder(...ids) {
  for (const id of ids) $(id).hidden = true;
}

iniciar();
