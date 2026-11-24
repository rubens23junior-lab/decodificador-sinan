// Verificação de dicionários de dados. Aponta erros que impedem o uso do
// dicionário e avisos que merecem atenção, sempre em português.

export const TIPOS = ['texto', 'numero', 'data', 'categorico', 'idade', 'municipio', 'uf', 'codigo', 'tabela'];

// Tabelas de que cada tipo depende.
const TABELAS_DO_TIPO = { municipio: ['ibge_municipios'], uf: ['ibge_municipios'] };

const CAMPOS_FONTE = ['documento', 'orgao', 'data', 'arquivo'];

function vazio(valor) {
  return typeof valor !== 'string' || valor.trim() === '';
}

/**
 * Confere uma lista de categorias: códigos e rótulos preenchidos e nenhum
 * código repetido.
 */
function verificarCategorias(categorias, onde, fontes, erros) {
  if (!Array.isArray(categorias) || categorias.length === 0) {
    erros.push(`${onde}: não tem nenhuma categoria.`);
    return;
  }
  const vistos = new Map();
  categorias.forEach((cat, i) => {
    const pos = `${onde}, categoria ${i + 1}`;
    if (!Array.isArray(cat.codigos) || cat.codigos.length === 0) {
      erros.push(`${pos}: falta a lista de códigos.`);
    } else {
      for (const codigo of cat.codigos) {
        if (typeof codigo !== 'string' || codigo === '') {
          erros.push(`${pos}: código vazio ou que não é texto (${JSON.stringify(codigo)}).`);
          continue;
        }
        if (vistos.has(codigo)) {
          erros.push(`${onde}: o código "${codigo}" aparece repetido (categorias ${vistos.get(codigo)} e ${i + 1}).`);
        } else {
          vistos.set(codigo, i + 1);
        }
      }
    }
    if (vazio(cat.rotulo)) erros.push(`${pos}: falta o rótulo.`);
    if (cat.fonte !== undefined && !fontes[cat.fonte]) {
      erros.push(`${pos}: a fonte "${cat.fonte}" não está na lista de fontes.`);
    }
  });
}

/**
 * @param {any} dic dicionário já lido do JSON
 * @returns {{erros: string[], avisos: string[]}}
 */
export function verificarDicionario(dic) {
  const erros = [];
  const avisos = [];

  if (dic === null || typeof dic !== 'object' || Array.isArray(dic)) {
    return { erros: ['O dicionário não é um objeto JSON.'], avisos };
  }
  if (dic.formato !== 1) erros.push('Campo "formato" ausente ou diferente de 1.');
  if (!dic.agravo || vazio(dic.agravo.nome)) erros.push('Falta o nome do agravo ("agravo.nome").');
  if (vazio(dic.versao)) erros.push('Falta a versão ("versao").');

  if (!dic.conferencia || typeof dic.conferencia.conferido !== 'boolean') {
    erros.push('Falta a situação de conferência ("conferencia.conferido").');
  } else if (dic.conferencia.conferido) {
    if (vazio(dic.conferencia.por) || vazio(dic.conferencia.data)) {
      erros.push('Dicionário marcado como conferido, mas sem "por" e "data".');
    }
  } else {
    avisos.push('Dicionário ainda não conferido pelo Rubens: não pode ser usado para gerar planilhas.');
  }

  const fontes = dic.fontes && typeof dic.fontes === 'object' ? dic.fontes : {};
  if (Object.keys(fontes).length === 0) erros.push('O dicionário não tem nenhuma fonte.');
  for (const [id, fonte] of Object.entries(fontes)) {
    for (const campo of CAMPOS_FONTE) {
      if (vazio(fonte?.[campo])) erros.push(`Fonte "${id}": falta "${campo}".`);
    }
  }

  const tabelas = dic.tabelas && typeof dic.tabelas === 'object' ? dic.tabelas : {};
  for (const [id, t] of Object.entries(tabelas)) {
    if (vazio(t?.arquivo)) erros.push(`Tabela "${id}": falta o arquivo.`);
    if (!fontes[t?.fonte]) erros.push(`Tabela "${id}": a fonte "${t?.fonte}" não está na lista de fontes.`);
    if (t?.completar_zeros !== undefined && !(Number.isInteger(t.completar_zeros) && t.completar_zeros > 0)) {
      erros.push(`Tabela "${id}": "completar_zeros" precisa ser um número inteiro positivo (veio ${JSON.stringify(t.completar_zeros)}).`);
    }
  }

  const listas = dic.listas && typeof dic.listas === 'object' ? dic.listas : {};
  const listasUsadas = new Set();
  for (const [id, categorias] of Object.entries(listas)) {
    verificarCategorias(categorias, `Lista "${id}"`, fontes, erros);
  }

  if (!Array.isArray(dic.colunas) || dic.colunas.length === 0) {
    erros.push('O dicionário não tem nenhuma coluna.');
  } else {
    const nomes = new Set();
    dic.colunas.forEach((col, i) => {
      const onde = `Coluna ${vazio(col?.nome) ? `nº ${i + 1}` : col.nome}`;
      if (vazio(col?.nome)) {
        erros.push(`${onde}: falta o nome da coluna.`);
      } else {
        const chave = col.nome.toUpperCase();
        if (nomes.has(chave)) erros.push(`${onde}: coluna repetida.`);
        nomes.add(chave);
      }
      if (vazio(col?.rotulo)) erros.push(`${onde}: falta o nome legível ("rotulo").`);
      if (!TIPOS.includes(col?.tipo)) erros.push(`${onde}: tipo "${col?.tipo}" desconhecido. Use um de: ${TIPOS.join(', ')}.`);
      if (!fontes[col?.fonte]) erros.push(`${onde}: a fonte "${col?.fonte}" não está na lista de fontes.`);
      if (vazio(col?.local)) avisos.push(`${onde}: falta o local na fonte (página, campo).`);

      if (col?.tipo === 'categorico') {
        if (col.lista !== undefined && col.categorias !== undefined) {
          erros.push(`${onde}: use "lista" ou "categorias", não os dois.`);
        } else if (col.lista !== undefined) {
          if (!listas[col.lista]) erros.push(`${onde}: a lista "${col.lista}" não existe.`);
          listasUsadas.add(col.lista);
        } else {
          verificarCategorias(col.categorias, onde, fontes, erros);
        }
      } else if (col?.lista !== undefined || col?.categorias !== undefined) {
        erros.push(`${onde}: só colunas do tipo "categorico" têm categorias.`);
      }
      if (col?.texto_livre !== undefined) {
        if (col.tipo !== 'categorico' || col.texto_livre !== true) erros.push(`${onde}: "texto_livre" só vale como true, em colunas do tipo "categorico".`);
        if (col.fora_do_campo !== undefined) erros.push(`${onde}: "texto_livre" e "fora_do_campo" não podem ser usados juntos.`);
      }
      if (col?.fora_do_campo !== undefined) {
        if (col.tipo !== 'categorico') erros.push(`${onde}: "fora_do_campo" só vale para colunas do tipo "categorico".`);
        if (vazio(col.fora_do_campo?.rotulo) || vazio(col.fora_do_campo?.motivo)) {
          erros.push(`${onde}: "fora_do_campo" precisa de "rotulo" e "motivo".`);
        }
      }

      if (col?.tipo === 'idade') {
        verificarCategorias(col.unidades, `${onde} (unidades de idade)`, fontes, erros);
        (Array.isArray(col.unidades) ? col.unidades : []).forEach((u, i) => {
          if (u.maximo !== undefined && !(Number.isInteger(u.maximo) && u.maximo >= 0)) {
            erros.push(`${onde} (unidades de idade), categoria ${i + 1}: o "maximo" precisa ser um número inteiro (veio ${JSON.stringify(u.maximo)}).`);
          }
        });
      }
      if (col?.tipo === 'tabela' && !tabelas[col.tabela]) {
        erros.push(`${onde}: a tabela "${col.tabela}" não está na lista de tabelas.`);
      }
      if (col?.complemento !== undefined && (col.tipo !== 'tabela' || !tabelas[col.complemento])) {
        erros.push(`${onde}: o complemento "${col.complemento}" só vale para o tipo "tabela" e precisa estar na lista de tabelas.`);
      }
      for (const t of TABELAS_DO_TIPO[col?.tipo] ?? []) {
        if (!tabelas[t]) erros.push(`${onde}: o tipo "${col.tipo}" precisa da tabela "${t}", que não está na lista de tabelas.`);
      }
    });

    const nomesColunas = new Set(dic.colunas.map((c) => String(c?.nome).toUpperCase()));
    // "derivadas_em_conferencia": colunas extras novas, que a ferramenta só
    // usa depois de conferidas (quando passam para "derivadas").
    const nomesExtras = new Set();
    for (const [i, d] of [...(dic.derivadas ?? []), ...(dic.derivadas_em_conferencia ?? [])].entries()) {
      const onde = `Coluna extra ${vazio(d?.nome) ? `nº ${i + 1}` : d.nome}`;
      if (vazio(d?.nome)) erros.push(`${onde}: falta o nome.`);
      else if (nomesColunas.has(d.nome.toUpperCase())) erros.push(`${onde}: o nome repete uma coluna do arquivo.`);
      else if (nomesExtras.has(d.nome.toUpperCase())) erros.push(`${onde}: o nome repete outra coluna extra.`);
      else nomesExtras.add(d.nome.toUpperCase());
      if (vazio(d?.rotulo)) erros.push(`${onde}: falta o nome legível ("rotulo").`);
      if (!nomesColunas.has(String(d?.de).toUpperCase())) erros.push(`${onde}: a coluna de origem "${d?.de}" não existe.`);
      if (d?.calculo === 'alerta_condicional') {
        // Aviso quando duas colunas têm, ao mesmo tempo, valores listados.
        if (!Array.isArray(d.valores) || !d.valores.length) erros.push(`${onde}: faltam os valores da coluna "${d.de}" ("valores").`);
        if (!nomesColunas.has(String(d.e?.coluna).toUpperCase())) erros.push(`${onde}: a segunda coluna ("e.coluna") não existe.`);
        if (!Array.isArray(d.e?.valores) || !d.e.valores.length) erros.push(`${onde}: faltam os valores da segunda coluna ("e.valores").`);
        if (vazio(d.texto) || vazio(d.motivo)) erros.push(`${onde}: faltam o texto do aviso ("texto") e o motivo ("motivo").`);
      } else if (d?.calculo === 'codigo_com_ponto_vezes_100') {
        // Tentativa de recuperar código gravado com ponto: precisa de uma tabela (e, se houver, do complemento).
        if (!tabelas[d.tabela]) erros.push(`${onde}: a tabela "${d.tabela}" não está na lista de tabelas.`);
        if (d.complemento !== undefined && !tabelas[d.complemento]) erros.push(`${onde}: a tabela "${d.complemento}" não está na lista de tabelas.`);
      } else if (d?.calculo !== undefined) {
        // Coluna calculada por regra, sem tabela (a semana epidemiológica, a partir de uma data).
        if (d.calculo !== 'semana_epidemiologica') erros.push(`${onde}: cálculo "${d.calculo}" desconhecido.`);
        if (d.tabela !== undefined) erros.push(`${onde}: use "calculo" ou "tabela", não os dois.`);
        const origem = dic.colunas.find((c) => String(c?.nome).toUpperCase() === String(d.de).toUpperCase());
        if (origem && origem.tipo !== 'data') erros.push(`${onde}: a semana epidemiológica só pode ser calculada de uma coluna do tipo "data".`);
      } else if (!tabelas[d?.tabela]) {
        erros.push(`${onde}: a tabela "${d?.tabela}" não está na lista de tabelas.`);
      }
      if (d?.depois_de !== undefined && !nomesColunas.has(String(d.depois_de).toUpperCase())) {
        erros.push(`${onde}: a coluna "${d.depois_de}" (posição) não existe.`);
      }
    }
  }

  for (const id of Object.keys(listas)) {
    if (!listasUsadas.has(id)) avisos.push(`Lista "${id}" não é usada por nenhuma coluna.`);
  }

  // "identifica": coluna com dado que identifica a pessoa (só vai para a planilha quando o usuário pede).
  for (const col of dic.colunas ?? []) {
    if (col?.identifica !== undefined && typeof col.identifica !== 'boolean') erros.push(`Coluna ${col.nome}: "identifica" deve ser true ou false.`);
  }
  // "estrutura": colunas que só existem na ficha que o dicionário descreve (arquivo sem nenhuma = ficha antiga).
  if (dic.estrutura !== undefined) {
    const e = dic.estrutura;
    if (!Array.isArray(e?.exige_uma_de) || !e.exige_uma_de.length || !e.exige_uma_de.every((c) => typeof c === 'string')) {
      erros.push('"estrutura.exige_uma_de" deve ser uma lista de nomes de colunas.');
    } else {
      const nomes = new Set((dic.colunas ?? []).map((c) => String(c?.nome).toUpperCase()));
      const fora = e.exige_uma_de.filter((c) => !nomes.has(c.toUpperCase()));
      if (fora.length) erros.push(`"estrutura.exige_uma_de" cita colunas que não estão no dicionário: ${fora.join(', ')}.`);
    }
    if (typeof e?.mensagem !== 'string' || !e.mensagem.includes('{anos}')) erros.push('"estrutura.mensagem" deve ser um texto com a marca {anos}.');
  }

  return { erros, avisos };
}

/**
 * Verifica o bloco comum de identificação (dicionarios/comum/identificacao.json).
 * @param {any} bloco
 */
export function verificarBlocoComum(bloco) {
  const erros = [];
  if (!bloco || typeof bloco !== 'object') return { erros: ['O bloco comum não é um objeto JSON.'], avisos: [] };
  if (!Array.isArray(bloco.colunas) || !bloco.colunas.length) erros.push('O bloco comum não tem colunas.');
  const fontes = bloco.fontes ?? {};
  const vistos = new Set();
  for (const [i, c] of (bloco.colunas ?? []).entries()) {
    const onde = `Coluna ${i + 1} (${c?.nome ?? 'sem nome'})`;
    if (!c?.nome || !c?.rotulo) erros.push(`${onde}: falta nome ou rótulo.`);
    if (vistos.has(c?.nome)) erros.push(`${onde}: nome repetido.`);
    vistos.add(c?.nome);
    if (!['texto', 'codigo', 'data', 'categorico'].includes(c?.tipo)) erros.push(`${onde}: tipo "${c?.tipo}" não permitido no bloco comum.`);
    if (!fontes[c?.fonte]) erros.push(`${onde}: fonte "${c?.fonte}" não declarada.`);
    if (!c?.local) erros.push(`${onde}: falta o local na fonte.`);
    if (c?.tipo === 'categorico' && !(Array.isArray(c.categorias) && c.categorias.length)) erros.push(`${onde}: coluna categórica sem categorias.`);
    if (c?.identifica !== undefined && typeof c.identifica !== 'boolean') erros.push(`${onde}: "identifica" deve ser true ou false.`);
  }
  if (typeof bloco.conferencia?.conferido !== 'boolean') erros.push('O bloco comum não diz se foi conferido.');
  return { erros, avisos: [] };
}

/**
 * Compara as colunas de um arquivo com as do dicionário.
 * @param {any} dic
 * @param {string[]} nomesArquivo
 */
export function compararColunas(dic, nomesArquivo) {
  const doDicionario = new Set(dic.colunas.map((c) => c.nome.toUpperCase()));
  const doArquivo = new Set(nomesArquivo.map((n) => n.toUpperCase()));
  return {
    semTraducao: [...doArquivo].filter((n) => !doDicionario.has(n)),
    // Campos que só existem nas exportações do Sinan (bloco comum de identificação e
    // campos marcados com "so_em_exportacoes") não são cobrados dos arquivos públicos.
    ausentesNoArquivo: dic.colunas.filter((c) => !c.do_bloco_comum && !c.so_em_exportacoes).map((c) => c.nome.toUpperCase()).filter((n) => !doArquivo.has(n)),
  };
}

/**
 * Confere uma tabela de apoio no formato { fonte, descricao, total, valores }.
 * O valor pode ser texto ou objeto com "nome".
 * @param {any} tabela
 */
export function verificarTabela(tabela) {
  const erros = [];
  for (const campo of CAMPOS_FONTE) {
    if (vazio(tabela?.fonte?.[campo])) erros.push(`Tabela sem "${campo}" na fonte.`);
  }
  const valores = tabela?.valores ?? {};
  const total = Object.keys(valores).length;
  if (total === 0) erros.push('Tabela vazia.');
  if (tabela?.total !== total) erros.push(`A tabela anuncia ${tabela?.total} códigos, mas tem ${total}.`);
  let semRotulo = 0;
  for (const v of Object.values(valores)) {
    if (vazio(typeof v === 'string' ? v : v?.nome)) semRotulo++;
  }
  if (semRotulo) erros.push(`${semRotulo} códigos sem rótulo.`);
  return { erros, avisos: [] };
}

/**
 * Confere a tabela de municípios do IBGE.
 * @param {any} tabela
 */
export function verificarTabelaMunicipios(tabela) {
  const erros = [];
  if (!tabela?.fonte || vazio(tabela.fonte.documento)) erros.push('Tabela de municípios sem fonte.');
  const ufs = tabela?.ufs ?? {};
  const municipios = tabela?.municipios ?? {};
  const total = Object.keys(municipios).length;
  if (total === 0) erros.push('Tabela de municípios vazia.');
  if (tabela?.total_municipios !== total) {
    erros.push(`A tabela anuncia ${tabela?.total_municipios} municípios, mas tem ${total}.`);
  }
  for (const [codigo, m] of Object.entries(municipios)) {
    if (!/^\d{6}$/.test(codigo)) erros.push(`Município com código inválido: "${codigo}".`);
    if (vazio(m?.nome)) erros.push(`Município ${codigo}: falta o nome.`);
    if (!ufs[m?.uf]) erros.push(`Município ${codigo}: UF "${m?.uf}" não está na lista de UFs.`);
    if (m?.codigo_ibge?.slice(0, 6) !== codigo) erros.push(`Município ${codigo}: código IBGE "${m?.codigo_ibge}" não corresponde.`);
  }
  return { erros, avisos: [] };
}
