// Decodificador: transforma os registros do arquivo (códigos) em valores
// legíveis, conforme o dicionário e as tabelas de apoio.
//
// Princípios (docs/requisitos.md):
//   - código desconhecido nunca é inventado: fica como veio, com alerta, e é
//     contado nas inconsistências;
//   - campo em branco continua em branco;
//   - só se usa dicionário conferido pelo Rubens.

import { converterData, converterIdade, corrigirAcentos, idadeEmAnos, semanaEpidemiologica } from './regras.js';

export class ErroDecodificacao extends Error {}

const TIPOS_TRADUZIDOS = new Set(['categorico', 'idade', 'municipio', 'uf', 'tabela']);
const SO_ASTERISCOS = /^\*+$/; // valor só com asteriscos = campo não preenchido
const SO_NULOS = /^\0+$/; // valor só com bytes nulos (código 0) = campo não preenchido
const MAX_VALORES_POR_COLUNA = 500; // limite de valores distintos listados nas inconsistências
const AMOSTRA_AGRAVO = 1000; // registros usados para conferir se o arquivo é do agravo escolhido

/** Tipo da célula na planilha: texto, número ou data. */
export const TIPO_CELULA = { texto: 'texto', numero: 'numero', data: 'data' };

function rotuloTabela(valor) {
  return typeof valor === 'string' ? valor : valor?.nome;
}

/**
 * Recusa arquivos cujas colunas não correspondem ao dicionário.
 * @param {any} dic
 * @param {string[]} nomesArquivo
 */
export function verificarColunasDoAgravo(dic, nomesArquivo) {
  const { conhecidas, combina } = compararColunasDoAgravo(dic, nomesArquivo);
  if (!combina) {
    throw new ErroDecodificacao(
      `O arquivo não parece ser de ${dic.agravo.nome}: só ${conhecidas} das ${nomesArquivo.length} colunas correspondem ao dicionário. ` +
        'Confira se escolheu o agravo certo e o arquivo certo. Nenhuma planilha foi gerada.',
    );
  }
  if (estruturaAntiga(dic, nomesArquivo)) throw new ErroEstruturaAntiga(mensagemEstruturaAntiga(dic, ''));
}

/**
 * Arquivo de uma ficha antiga que o dicionário não cobre: o dicionário declara em
 * "estrutura.exige_uma_de" colunas que só existem na ficha que ele descreve, e o
 * arquivo não tem nenhuma delas. Exemplo: dengue de 2007 a 2013 (Sinan NET), com
 * colunas de mesmo nome e outro significado (levantamento de 23/11/2026).
 */
export class ErroEstruturaAntiga extends ErroDecodificacao {}

export function estruturaAntiga(dic, nomesArquivo) {
  const exige = dic.estrutura?.exige_uma_de;
  if (!exige?.length) return false;
  const nomes = new Set(nomesArquivo.map((n) => n.toUpperCase()));
  return !exige.some((c) => nomes.has(c.toUpperCase()));
}

/** Mensagem do dicionário para a ficha antiga; "{anos}" vira, por exemplo, " de 2010". */
export function mensagemEstruturaAntiga(dic, anos) {
  return dic.estrutura.mensagem.replace('{anos}', anos);
}

/**
 * Cria uma conferência do código do agravo nos primeiros registros: arquivos
 * de outro agravo com as mesmas colunas (por exemplo, chikungunya) são recusados.
 * @param {any} dic
 * @param {string[]} nomesArquivo
 * @returns {(valores: string[]) => void} lança erro se a amostra indicar outro agravo
 */
export function criarVerificadorDoAgravo(dic, nomesArquivo) {
  const coluna = dic.agravo.coluna?.toUpperCase();
  const codigos = codigosDoAgravo(dic);
  const indice = coluna && codigos.length ? nomesArquivo.map((n) => n.toUpperCase()).indexOf(coluna) : -1;
  let conferidos = 0;
  let fora = 0;
  const recusar = () => {
    throw new ErroDecodificacao(
      `O arquivo não parece ser de ${dic.agravo.nome}: em ${fora} dos primeiros ${conferidos} registros o agravo não é ${codigos.join(' nem ')}. ` +
        'Confira se escolheu o agravo certo. Nenhuma planilha foi gerada.',
    );
  };
  const conferir = (valores) => {
    // Código do agravo em branco não indica outro agravo: fica fora da conta.
    if (indice === -1 || conferidos >= AMOSTRA_AGRAVO || valores[indice] === '') return;
    conferidos++;
    if (!codigos.includes(valores[indice])) fora++;
    if (conferidos === AMOSTRA_AGRAVO && fora > AMOSTRA_AGRAVO / 2) recusar();
  };
  // Arquivo com menos registros que a amostra: a conferência é feita no fim da leitura.
  conferir.concluir = () => {
    if (conferidos > 0 && conferidos < AMOSTRA_AGRAVO && fora > conferidos / 2) recusar();
  };
  return conferir;
}

/**
 * Quantas colunas do arquivo estão no dicionário, e se isso basta para o arquivo
 * ser do agravo (80% das colunas do arquivo e metade das do dicionário).
 * @param {any} dic
 * @param {string[]} nomesArquivo
 */
export function compararColunasDoAgravo(dic, nomesArquivo) {
  const doDicionario = new Set(dic.colunas.map((c) => c.nome.toUpperCase()));
  const conhecidas = nomesArquivo.filter((n) => doDicionario.has(n.toUpperCase())).length;
  // A exigência de metade das colunas do dicionário conta só as colunas do próprio agravo:
  // os campos que só existem nas exportações do Sinan (bloco comum de identificação e
  // "so_em_exportacoes") não estão nos arquivos públicos e não podem pesar contra eles.
  const doAgravo = new Set(dic.colunas.filter((c) => !c.do_bloco_comum && !c.so_em_exportacoes).map((c) => c.nome.toUpperCase()));
  const conhecidasDoAgravo = nomesArquivo.filter((n) => doAgravo.has(n.toUpperCase())).length;
  const combina = conhecidas >= 0.8 * nomesArquivo.length && conhecidasDoAgravo >= 0.5 * doAgravo.size;
  return { conhecidas, combina, total: doAgravo.size };
}

/**
 * Procura, entre os dicionários disponíveis, o agravo mais provável de um arquivo:
 * as colunas precisam combinar e, quando o arquivo traz a coluna do agravo, o
 * código precisa ser o do dicionário em mais da metade da amostra de registros.
 * @param {Record<string, any>} dicionarios dicionários, pelo identificador
 * @param {string[]} nomesArquivo
 * @param {string[][]} amostra primeiros registros do arquivo
 * @returns {{id: string, nome: string} | null}
 */
export function sugerirAgravo(dicionarios, nomesArquivo, amostra) {
  const nomes = nomesArquivo.map((n) => n.toUpperCase());
  const candidatos = [];
  for (const [id, dic] of Object.entries(dicionarios)) {
    const { conhecidas, combina, total } = compararColunasDoAgravo(dic, nomesArquivo);
    if (!combina) continue;
    const codigos = codigosDoAgravo(dic);
    const indice = dic.agravo.coluna && codigos.length ? nomes.indexOf(dic.agravo.coluna.toUpperCase()) : -1;
    let peloCodigo = false;
    const preenchidos = indice === -1 ? [] : amostra.filter((v) => v[indice] !== '');
    if (preenchidos.length) {
      const certos = preenchidos.filter((v) => codigos.includes(v[indice])).length;
      if (certos <= preenchidos.length / 2) continue;
      peloCodigo = true;
    }
    candidatos.push({ id, nome: dic.agravo.nome, peloCodigo, pontos: conhecidas / nomes.length + conhecidas / total });
  }
  candidatos.sort((a, b) => Number(b.peloCodigo) - Number(a.peloCodigo) || b.pontos - a.pontos);
  return candidatos[0] ? { id: candidatos[0].id, nome: candidatos[0].nome } : null;
}

/** Formas aceitas do código do agravo ("codigo" ou lista "codigos" no dicionário). */
export function codigosDoAgravo(dic) {
  return [].concat(dic.agravo.codigos ?? dic.agravo.codigo ?? []);
}

/**
 * @param {any} dic dicionário (JSON)
 * @param {Record<string, any>} tabelas conteúdo das tabelas de apoio, pelo id usado no dicionário
 * @param {object} [opcoes]
 * @param {boolean} [opcoes.manterOriginais] manter a coluna com o código ao lado da traduzida (padrão: sim)
 * @param {string[]|null} [opcoes.colunas] nomes das colunas a incluir (padrão: todas)
 * @param {{coluna: string, valores?: string[], de?: string, ate?: string}[]} [opcoes.filtros]
 * @param {boolean} [opcoes.formatoAnalise] nomes de coluna do SINAN em minúsculas
 *   (código ao lado com "_cod") e coluna numérica idade_anos (padrão: não)
 * @param {boolean} [opcoes.incluirIdentificacao] incluir os dados que identificam a pessoa
 *   (colunas marcadas com "identifica" no dicionário; padrão: não)
 */
export function criarDecodificador(dic, tabelas, opcoes = {}) {
  const { manterOriginais = true, colunas: escolhidas = null, filtros = [], formatoAnalise = false, incluirIdentificacao = false } = opcoes;
  // Dados que identificam a pessoa (nome, Cartão SUS, endereço...): ficam fora da
  // planilha, a não ser que o usuário peça (decisão do Rubens, 24/11/2026).
  const identificacao = new Set(dic.colunas.filter((c) => c.identifica).map((c) => c.nome.toUpperCase()));
  const retiradas = [];
  if (!dic?.conferencia?.conferido) {
    throw new ErroDecodificacao(`O dicionário de ${dic?.agravo?.nome ?? 'agravo'} ainda não foi conferido e não pode ser usado.`);
  }
  for (const id of Object.keys(dic.tabelas ?? {})) {
    if (!tabelas[id]) throw new ErroDecodificacao(`A tabela de apoio "${id}" não foi carregada.`);
  }

  const porNome = new Map(dic.colunas.map((c) => [c.nome.toUpperCase(), c]));
  const ibge = tabelas.ibge_municipios;
  const complementoMunicipios = tabelas.municipios_datasus?.valores ?? {};
  const listas = dic.listas ?? {};

  // ---- tradutores por coluna: recebem o código e devolvem { valor } ou { erro }
  function tradutor(col) {
    switch (col.tipo) {
      case 'categorico': {
        const mapa = new Map();
        for (const cat of col.lista ? listas[col.lista] : col.categorias) {
          for (const codigo of cat.codigos) mapa.set(codigo, cat.rotulo);
        }
        // "fora_do_campo": código que o campo da ficha não comporta. Sai com um rótulo
        // explícito (por exemplo "Inconsistência/Não preenchido"), continua destacado
        // e vai para as inconsistências com o motivo dado no dicionário.
        const fora = col.fora_do_campo;
        // "texto_livre": campo de texto em que a fonte também lista códigos; o que
        // não for código fica como veio, sem destaque (decisão do Rubens, 18/11/2026).
        if (col.texto_livre) return (v) => ({ valor: mapa.has(v) ? mapa.get(v) : v });
        return (v) => {
          if (mapa.has(v)) return { valor: mapa.get(v) };
          return fora ? { erro: fora.motivo, rotulo: fora.rotulo } : { erro: 'Código não encontrado no dicionário' };
        };
      }
      case 'idade':
        return (v) => converterIdade(v, col.unidades);
      case 'data': {
        // "mes_dia_ano": data com barras gravada no formato americano (M/D/AAAA).
        const opcoesData = { mesPrimeiro: Boolean(col.mes_dia_ano) };
        return (v) => converterData(v, opcoesData);
      }
      case 'municipio':
        return (v) => {
          const m = ibge.municipios[v];
          if (m) return { valor: `${m.nome} (${ibge.ufs[m.uf]})` };
          const c = complementoMunicipios[v];
          if (c) return { valor: c.nome };
          return { erro: 'Código não encontrado na tabela de municípios' };
        };
      case 'uf':
        return (v) => (ibge.ufs[v] ? { valor: ibge.ufs[v] } : { erro: 'Código não encontrado na tabela de UFs' });
      case 'tabela': {
        const valores = tabelas[col.tabela].valores;
        // "complemento": outra tabela, consultada só quando o código não está na principal.
        const complemento = col.complemento ? tabelas[col.complemento].valores : {};
        const nomes = col.complemento ? `${col.tabela} nem na ${col.complemento}` : col.tabela;
        // "completar_zeros" (na lista de tabelas do dicionário): código numérico mais
        // curto que o tamanho da tabela é procurado também com zeros à esquerda.
        const zeros = dic.tabelas?.[col.tabela]?.completar_zeros;
        const procurar = (c) => rotuloTabela(valores[c]) ?? rotuloTabela(complemento[c]);
        return (v) => {
          let r = procurar(v);
          if (!r && zeros && /^\d+$/.test(v) && v.length < zeros) r = procurar(v.padStart(zeros, '0'));
          return r ? { valor: r } : { erro: `Código não encontrado na tabela ${nomes}` };
        };
      }
      case 'texto': {
        // "corrigir_acentos": texto livre com acentos estragados de forma conhecida
        // (regras.js); o conserto é contado no Resumo (decisão do Rubens, 19/11/2026).
        // "numero_fora_do_campo": campo de texto em que um valor só com algarismos
        // não cabe; sai com o rótulo dado, destacado e nas inconsistências.
        const fora = col.numero_fora_do_campo;
        if (!col.corrigir_acentos && !fora) return null;
        return (v) => {
          if (fora && /^\d+$/.test(v)) return { erro: fora.motivo, rotulo: fora.rotulo };
          if (!col.corrigir_acentos) return { valor: v };
          const c = corrigirAcentos(v);
          if (c !== v) acentos++;
          return { valor: c };
        };
      }
      default:
        return null; // numero, codigo: mantém como veio
    }
  }

  // ---- inconsistências: coluna → valor → { motivo, quantidade }
  const inconsistencias = new Map();
  let asteriscos = 0;
  let nulos = 0;
  let acentos = 0;
  function registrar(coluna, valor, motivo) {
    let porValor = inconsistencias.get(coluna);
    if (!porValor) inconsistencias.set(coluna, (porValor = new Map()));
    let item = porValor.get(valor);
    if (!item) {
      if (porValor.size >= MAX_VALORES_POR_COLUNA) {
        valor = '(outros valores)';
        motivo = `Mais de ${MAX_VALORES_POR_COLUNA} valores diferentes; os demais foram somados aqui`;
        item = porValor.get(valor);
      }
      if (!item) porValor.set(valor, (item = { motivo, quantidade: 0 }));
    }
    item.quantidade++;
  }

  let plano = null;
  let conferirAgravo = () => {};
  let filtrosIndexados = [];

  /**
   * Prepara a saída a partir das colunas do arquivo. Recusa arquivos que não
   * correspondem ao dicionário.
   * @param {string[]} nomesArquivo
   */
  function prepararColunas(nomesArquivo) {
    const nomes = nomesArquivo.map((n) => n.toUpperCase());
    verificarColunasDoAgravo(dic, nomesArquivo);
    conferirAgravo = criarVerificadorDoAgravo(dic, nomesArquivo);

    const escolhida = (nome) => !escolhidas || escolhidas.some((e) => e.toUpperCase() === nome);
    const querida = (nome) => escolhida(nome) && (incluirIdentificacao || !identificacao.has(nome));
    retiradas.length = 0;
    if (!incluirIdentificacao) for (const n of nomes) if (identificacao.has(n)) retiradas.push(porNome.get(n).nome);
    const saida = []; // { cabecalho, original, tipoCelula, origem, traduz?, tabela? }
    const derivadasApos = new Map();
    for (const d of dic.derivadas ?? []) {
      const chave = String(d.depois_de ?? d.de).toUpperCase();
      if (!derivadasApos.has(chave)) derivadasApos.set(chave, []);
      derivadasApos.get(chave).push(d);
    }

    // Formato para análise: nomes curtos do SINAN, em minúsculas, sem acento nem espaço.
    const nomeAnalise = (n) => String(n).toLowerCase();

    nomes.forEach((nome, i) => {
      const col = porNome.get(nome);
      if (!col) {
        const cabecalho = formatoAnalise ? nomeAnalise(nomesArquivo[i]) : nomesArquivo[i];
        if (querida(nome)) saida.push({ cabecalho, original: nomesArquivo[i], tipoCelula: TIPO_CELULA.texto, origem: i, semDicionario: true });
      } else if (querida(nome)) {
        const traduz = tradutor(col);
        const tipoCelula = col.tipo === 'data' ? TIPO_CELULA.data : TIPO_CELULA.texto;
        saida.push({ cabecalho: formatoAnalise ? nomeAnalise(col.nome) : col.rotulo, original: col.nome, tipoCelula, origem: i, traduz, coluna: col.nome });
        if (manterOriginais && TIPOS_TRADUZIDOS.has(col.tipo)) {
          const cabecalho = formatoAnalise ? `${nomeAnalise(col.nome)}_cod` : col.nome;
          saida.push({ cabecalho, original: `${col.nome} (código)`, tipoCelula: TIPO_CELULA.texto, origem: i });
        }
        // Idade em anos completos, numérica; os problemas da idade já são
        // contados na coluna traduzida, então aqui só fica vazio.
        if (formatoAnalise && col.tipo === 'idade') {
          saida.push({
            cabecalho: 'idade_anos', original: `idade_anos (calculada de ${col.nome})`, tipoCelula: TIPO_CELULA.numero, origem: i,
            traduz: (v) => ({ valor: idadeEmAnos(v, col.unidades) }),
          });
        }
      }
      for (const d of derivadasApos.get(nome) ?? []) {
        if (!querida(d.nome.toUpperCase()) || (!incluirIdentificacao && identificacao.has(String(d.de).toUpperCase()))) continue;
        const iOrigem = nomes.indexOf(String(d.de).toUpperCase());
        if (iOrigem === -1) continue;
        // "alerta_condicional": aviso quando duas colunas têm, ao mesmo tempo, valores
        // que indicam um possível erro de notificação (por exemplo, CID B58 em gestante =
        // possível toxoplasmose gestacional, que deveria ser O98.6; regra do Rubens,
        // 21/11/2026). O dado original não muda: o aviso sai nesta coluna, destacado e
        // contado nas Inconsistências; nos demais registros a coluna fica vazia.
        let iOrigem2 = -1;
        if (d.calculo === 'alerta_condicional') {
          iOrigem2 = nomes.indexOf(String(d.e?.coluna).toUpperCase());
          if (iOrigem2 === -1) continue;
        }
        // "calculo": coluna calculada por uma regra (semana epidemiológica, código
        // com ponto vezes 100 ou alerta condicional); sem ele, a coluna vem de uma tabela de apoio.
        const traduz = d.calculo === 'alerta_condicional'
          ? (() => {
              const valores1 = new Set(d.valores);
              const valores2 = new Set(d.e.valores);
              return (v, v2) => (valores1.has(v) && valores2.has(v2) ? { erro: d.motivo, rotulo: d.texto } : { valor: null });
            })()
          : d.calculo === 'semana_epidemiologica'
          ? (v) => {
              const r = semanaEpidemiologica(v);
              return r.erro ? { erro: r.erro, vazio: true } : r;
            }
          : d.calculo === 'codigo_com_ponto_vezes_100'
          ? (() => {
              // Tentativa de recuperar código gravado com ponto (por exemplo, ocupação
              // "5161.1" = 516110 dividido por 100): só para valores com ponto; o código
              // multiplicado por 100 é procurado na tabela (e no complemento). Valores sem
              // ponto ficam vazios aqui; a coluna original continua como veio
              // (decisão do Rubens, 20/11/2026).
              const valores = tabelas[d.tabela].valores;
              const complemento = d.complemento ? tabelas[d.complemento].valores : {};
              const tamanho = d.tamanho ?? 6;
              return (v) => {
                if (!/^\d+\.\d+$/.test(v)) return { valor: null };
                const codigo = String(Math.round(Number(v) * 100)).padStart(tamanho, '0');
                const r = rotuloTabela(valores[codigo]) ?? rotuloTabela(complemento[codigo]);
                return r ? { valor: `${codigo} – ${r}` } : { erro: `Código ${v} × 100 = ${codigo} não encontrado na tabela ${d.tabela}`, vazio: true };
              };
            })()
          : (() => {
              const valores = tabelas[d.tabela].valores;
              return (v) => {
                const r = rotuloTabela(valores[v]);
                return r ? { valor: r } : { erro: `Código de ${d.de} sem correspondência na tabela ${d.tabela}`, vazio: true };
              };
            })();
        saida.push({
          cabecalho: formatoAnalise ? nomeAnalise(d.nome) : d.rotulo, original: `${d.nome} (calculada de ${d.de}${iOrigem2 >= 0 ? ` e ${d.e.coluna}` : ''})`, tipoCelula: TIPO_CELULA.texto, origem: iOrigem, coluna: d.nome,
          traduz, ...(iOrigem2 >= 0 ? { origem2: iOrigem2 } : {}),
        });
      }
    });

    filtrosIndexados = filtros.map((f) => {
      const i = nomes.indexOf(f.coluna.toUpperCase());
      if (i === -1) throw new ErroDecodificacao(`A coluna do filtro (${f.coluna}) não existe neste arquivo.`);
      const col = porNome.get(f.coluna.toUpperCase());
      const ehData = col?.tipo === 'data';
      return { i, valores: f.valores ? new Set(f.valores) : null, de: f.de, ate: f.ate, ehData, mesPrimeiro: Boolean(col?.mes_dia_ano) };
    });

    for (const n of nomes) {
      if (!porNome.has(n)) registrar(n, '(coluna inteira)', 'Coluna sem tradução no dicionário');
    }
    plano = saida;
    return saida.map(({ cabecalho, original, tipoCelula }) => ({ cabecalho, original, tipoCelula }));
  }

  /** Data em AAAAMMDD para comparar períodos (ou null se não for data válida). */
  function dataComparavel(v, mesPrimeiro = false) {
    let m = /^(\d{4})(\d{2})(\d{2})$/.exec(v) || /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (m) return `${m[1]}${m[2]}${m[3]}`;
    if (mesPrimeiro) {
      m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
      return m ? `${m[3]}${m[1].padStart(2, '0')}${m[2].padStart(2, '0')}` : null;
    }
    m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
    return m ? `${m[3]}${m[2]}${m[1]}` : null;
  }

  /** O registro passa pelos filtros escolhidos? */
  function aceita(valores) {
    for (const f of filtrosIndexados) {
      const v = valores[f.i];
      if (f.valores && !f.valores.has(v)) return false;
      if (f.de || f.ate) {
        const d = f.ehData ? dataComparavel(v, f.mesPrimeiro) : v;
        if (d === null || d === '' || (f.de && d < f.de) || (f.ate && d > f.ate)) return false;
      }
    }
    return true;
  }

  /**
   * Decodifica um registro.
   * @param {string[]} valores valores do arquivo, na ordem das colunas
   * @returns {{valores: (string|number|null)[], alertas: number[]|null}}
   */
  function decodificar(valores) {
    // Valor feito só de asteriscos ("***", "********") é a forma de alguns arquivos
    // públicos marcarem campo não preenchido: passa a valer como campo em branco
    // (decisão do Rubens, 16/11/2026). A quantidade vai para o Resumo.
    // Do mesmo modo, valor feito só de bytes nulos (código 0), forma de alguns arquivos
    // públicos (por exemplo, surto de DTA de 2022 e 2023) gravarem o campo vazio, vale
    // como campo em branco (decisão do Rubens, 19/11/2026). A quantidade vai para o Resumo.
    if (valores.some((v) => SO_ASTERISCOS.test(v) || SO_NULOS.test(v))) {
      valores = valores.map((v) => {
        if (SO_ASTERISCOS.test(v)) {
          asteriscos++;
          return '';
        }
        if (SO_NULOS.test(v)) {
          nulos++;
          return '';
        }
        return v;
      });
    }
    conferirAgravo(valores);
    const saida = new Array(plano.length);
    let alertas = null;
    for (let k = 0; k < plano.length; k++) {
      const p = plano[k];
      const bruto = valores[p.origem];
      if (bruto === '' || !p.traduz) {
        saida[k] = bruto === '' ? null : bruto;
        continue;
      }
      const r = p.origem2 === undefined ? p.traduz(bruto) : p.traduz(bruto, valores[p.origem2]);
      if (r.erro) {
        registrar(p.coluna, bruto, r.erro);
        if (r.vazio) {
          saida[k] = null;
        } else {
          saida[k] = r.rotulo ?? bruto;
          (alertas ??= []).push(k);
        }
      } else {
        saida[k] = r.valor;
      }
    }
    return { valores: saida, alertas };
  }

  /** Lista das inconsistências, por coluna e quantidade. */
  function listarInconsistencias() {
    const lista = [];
    for (const [coluna, porValor] of inconsistencias) {
      const col = porNome.get(coluna) ?? (dic.derivadas ?? []).find((d) => d.nome === coluna);
      for (const [valor, { motivo, quantidade }] of porValor) {
        lista.push({ coluna, rotulo: col?.rotulo ?? '', valor, motivo, quantidade });
      }
    }
    return lista.sort((a, b) => a.coluna.localeCompare(b.coluna) || b.quantidade - a.quantidade);
  }

  /** Quantos valores só com asteriscos foram tratados como campo em branco. */
  const contarAsteriscos = () => asteriscos;

  /** Quantos valores só com bytes nulos foram tratados como campo em branco. */
  const contarNulos = () => nulos;

  /** Quantos textos livres tiveram os acentos estragados consertados. */
  const contarAcentos = () => acentos;

  /** Conferência do código do agravo nos arquivos com menos registros que a amostra. */
  const concluirConferencia = () => conferirAgravo.concluir?.();

  /** Colunas de identificação que o arquivo tinha e ficaram fora da planilha. */
  const identificacaoRetirada = () => [...retiradas];

  return { prepararColunas, aceita, decodificar, concluirConferencia, listarInconsistencias, contarAsteriscos, contarNulos, contarAcentos, identificacaoRetirada };
}
