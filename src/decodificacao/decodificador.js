// Decodificador: transforma os registros do arquivo (códigos) em valores
// legíveis, conforme o dicionário e as tabelas de apoio.
//
// Princípios (docs/requisitos.md):
//   - código desconhecido nunca é inventado: fica como veio, com alerta, e é
//     contado nas inconsistências;
//   - campo em branco continua em branco;
//   - só se usa dicionário conferido pelo Rubens.

import { converterData, converterIdade, idadeEmAnos } from './regras.js';

export class ErroDecodificacao extends Error {}

const TIPOS_TRADUZIDOS = new Set(['categorico', 'idade', 'municipio', 'uf', 'tabela']);
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
  const doDicionario = new Set(dic.colunas.map((c) => c.nome.toUpperCase()));
  const conhecidas = nomesArquivo.filter((n) => doDicionario.has(n.toUpperCase())).length;
  if (conhecidas < 0.8 * nomesArquivo.length || conhecidas < 0.5 * doDicionario.size) {
    throw new ErroDecodificacao(
      `O arquivo não parece ser de ${dic.agravo.nome}: só ${conhecidas} das ${nomesArquivo.length} colunas correspondem ao dicionário. ` +
        'Confira se escolheu o agravo certo e o arquivo certo. Nenhuma planilha foi gerada.',
    );
  }
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
  return (valores) => {
    if (indice === -1 || conferidos >= AMOSTRA_AGRAVO) return;
    conferidos++;
    if (!codigos.includes(valores[indice])) fora++;
    if (conferidos === AMOSTRA_AGRAVO && fora > AMOSTRA_AGRAVO / 2) {
      throw new ErroDecodificacao(
        `O arquivo não parece ser de ${dic.agravo.nome}: em ${fora} dos primeiros ${AMOSTRA_AGRAVO} registros o agravo não é ${codigos.join(' nem ')}. ` +
          'Confira se escolheu o agravo certo. Nenhuma planilha foi gerada.',
      );
    }
  };
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
 */
export function criarDecodificador(dic, tabelas, opcoes = {}) {
  const { manterOriginais = true, colunas: escolhidas = null, filtros = [], formatoAnalise = false } = opcoes;
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
        return (v) => (mapa.has(v) ? { valor: mapa.get(v) } : { erro: 'Código não encontrado no dicionário' });
      }
      case 'idade':
        return (v) => converterIdade(v, col.unidades);
      case 'data':
        return (v) => converterData(v);
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
        return (v) => {
          const r = rotuloTabela(valores[v]);
          return r ? { valor: r } : { erro: `Código não encontrado na tabela ${col.tabela}` };
        };
      }
      default:
        return null; // texto, numero, codigo: mantém como veio
    }
  }

  // ---- inconsistências: coluna → valor → { motivo, quantidade }
  const inconsistencias = new Map();
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

    const querida = (nome) => !escolhidas || escolhidas.some((e) => e.toUpperCase() === nome);
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
        if (!querida(d.nome.toUpperCase())) continue;
        const iOrigem = nomes.indexOf(String(d.de).toUpperCase());
        if (iOrigem === -1) continue;
        const valores = tabelas[d.tabela].valores;
        saida.push({
          cabecalho: formatoAnalise ? nomeAnalise(d.nome) : d.rotulo, original: `${d.nome} (calculada de ${d.de})`, tipoCelula: TIPO_CELULA.texto, origem: iOrigem, coluna: d.nome,
          traduz: (v) => {
            const r = rotuloTabela(valores[v]);
            return r ? { valor: r } : { erro: `Código de ${d.de} sem correspondência na tabela ${d.tabela}`, vazio: true };
          },
        });
      }
    });

    filtrosIndexados = filtros.map((f) => {
      const i = nomes.indexOf(f.coluna.toUpperCase());
      if (i === -1) throw new ErroDecodificacao(`A coluna do filtro (${f.coluna}) não existe neste arquivo.`);
      const col = porNome.get(f.coluna.toUpperCase());
      const ehData = col?.tipo === 'data';
      return { i, valores: f.valores ? new Set(f.valores) : null, de: f.de, ate: f.ate, ehData };
    });

    for (const n of nomes) {
      if (!porNome.has(n)) registrar(n, '(coluna inteira)', 'Coluna sem tradução no dicionário');
    }
    plano = saida;
    return saida.map(({ cabecalho, original, tipoCelula }) => ({ cabecalho, original, tipoCelula }));
  }

  /** Data em AAAAMMDD para comparar períodos (ou null se não for data válida). */
  function dataComparavel(v) {
    let m = /^(\d{4})(\d{2})(\d{2})$/.exec(v) || /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (m) return `${m[1]}${m[2]}${m[3]}`;
    m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
    return m ? `${m[3]}${m[2]}${m[1]}` : null;
  }

  /** O registro passa pelos filtros escolhidos? */
  function aceita(valores) {
    for (const f of filtrosIndexados) {
      const v = valores[f.i];
      if (f.valores && !f.valores.has(v)) return false;
      if (f.de || f.ate) {
        const d = f.ehData ? dataComparavel(v) : v;
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
      const r = p.traduz(bruto);
      if (r.erro) {
        registrar(p.coluna, bruto, r.erro);
        if (r.vazio) {
          saida[k] = null;
        } else {
          saida[k] = bruto;
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

  return { prepararColunas, aceita, decodificar, listarInconsistencias };
}
