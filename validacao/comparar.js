// Validação: compara os pares "código -> texto" da nossa ferramenta com os do
// microdatasus (gerados por ferramenta-pares.js e microdatasus-pares.R) e
// grava uma planilha com o resultado, código por código.
//
// Uso: node validacao/comparar.js <agravo> <pares-ferramenta.csv> <pares-microdatasus.csv> [--versao-microdatasus 3.0.0] [--arquivo DENGBR25.dbc]
// Saída: docs/validacao/comparacao-<agravo>.xlsx (só códigos e contagens, nenhum registro individual)
//
// Grupos de cada código:
//   Igual                      mesmo texto nas duas
//   Só grafia                  mesmo texto ignorando maiúsculas, acentos, º/ª e pontuação
//   Significado diferente      as duas traduzem, com textos diferentes
//   Só a ferramenta traduz     o microdatasus deixa o código como veio
//   Só o microdatasus traduz   a ferramenta deixa o código como veio (e o marca)
//   Microdatasus apaga o valor o código existe, mas o microdatasus devolve vazio
//   Nenhuma traduz             as duas deixam o código como veio

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarLeitorCSV } from '../src/leitura/csv.js';
import { criarXlsx, ESTILO } from '../src/saida/xlsx.js';
import { categoriasDaColuna, NOMES_TIPOS } from '../src/dicionario/tipos.js';

const args = process.argv.slice(2);
const opcao = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const [agravo, arqNos, arqMd] = args;
if (!arqMd) {
  console.error('Uso: node validacao/comparar.js <agravo> <pares-ferramenta.csv> <pares-microdatasus.csv> [--versao-microdatasus X] [--arquivo nome]');
  process.exit(1);
}
const raiz = fileURLToPath(new URL('../', import.meta.url));
const dic = JSON.parse(readFileSync(`${raiz}dicionarios/${agravo}.json`, 'utf8'));
const porNome = new Map(dic.colunas.map((c) => [c.nome.toUpperCase(), c]));

/**
 * Lê um CSV de pares: coluna → código → texto → registros.
 * O mesmo código pode receber textos diferentes em registros diferentes
 * (por exemplo, quando uma coluna é sobrescrita por outra).
 */
function lerPares(caminho) {
  const pares = new Map();
  const leitor = criarLeitorCSV({
    aoRegistro([coluna, codigo, rotulo, n]) {
      if (!pares.has(coluna)) pares.set(coluna, new Map());
      const porCodigo = pares.get(coluna);
      if (!porCodigo.has(codigo)) porCodigo.set(codigo, new Map());
      const porRotulo = porCodigo.get(codigo);
      porRotulo.set(rotulo, (porRotulo.get(rotulo) ?? 0) + Number(n));
    },
  });
  leitor.empurrar(readFileSync(caminho, 'utf8'));
  leitor.finalizar();
  return pares;
}
const nos = lerPares(arqNos);
const md = lerPares(arqMd);

const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/º/g, 'o').replace(/ª/g, 'a')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// Idade: "1 ano" e "1 anos" são a mesma idade; compara número e unidade.
const UNIDADES = { hora: 'horas', horas: 'horas', dia: 'dias', dias: 'dias', mes: 'meses', meses: 'meses', ano: 'anos', anos: 'anos', minuto: 'minutos', minutos: 'minutos' };
const idade = (t) => {
  const m = /^(\d+) (\S+)$/.exec(normalizar(t));
  return m ? `${Number(m[1])} ${UNIDADES[m[2]] ?? m[2]}` : null;
};

function grupo(coluna, codigo, rNos, rMd) {
  // Datas: as duas convertem para AAAA-MM-DD, que é a mesma escrita do código.
  const ehData = porNome.get(coluna)?.tipo === 'data';
  if (rNos === rMd) return codigo !== '' && rNos === codigo && !ehData ? 'Nenhuma traduz' : 'Igual';
  const traduzNos = rNos !== codigo;
  if (codigo !== '' && rMd === '') return 'Microdatasus apaga o valor';
  const traduzMd = rMd !== codigo;
  if (traduzNos && !traduzMd) return 'Só a ferramenta traduz';
  if (!traduzNos && traduzMd) return 'Só o microdatasus traduz';
  const tipo = porNome.get(coluna)?.tipo;
  if (tipo === 'idade' && idade(rNos) !== null && idade(rNos) === idade(rMd)) return 'Só grafia';
  if (normalizar(rNos) === normalizar(rMd)) return 'Só grafia';
  return 'Significado diferente';
}
const GRUPOS = ['Igual', 'Só grafia', 'Significado diferente', 'Só a ferramenta traduz', 'Só o microdatasus traduz', 'Microdatasus apaga o valor', 'Nenhuma traduz'];
// Grupos listados um a um na aba Diferenças.
const DIFERENCAS = new Set(['Só grafia', 'Significado diferente', 'Só a ferramenta traduz', 'Só o microdatasus traduz', 'Microdatasus apaga o valor']);
// Colunas com muitos códigos (municípios, CNES, CBO, datas...): os códigos que só a
// ferramenta traduz aparecem só no resumo por coluna; as demais diferenças, um a um.
const DETALHAR = new Set(['categorico', 'idade', 'uf']);
const detalhar = (col, g) => DIFERENCAS.has(g) && (!col || DETALHAR.has(col.tipo) || g !== 'Só a ferramenta traduz');

/** Fonte oficial do código na nossa ferramenta: documento e local. */
function fonte(col, codigo) {
  if (!col) return '';
  const cat = categoriasDaColuna(dic, col).find((c) => c.codigos?.includes(codigo));
  const id = cat?.fonte ?? col.fonte;
  const doc = dic.fontes[id] ? basename(dic.fontes[id].arquivo.replace(/ \(fora do Git\)$/, '')) : '';
  return [id && `${id} (${doc})`, cat?.local ?? col.local].filter(Boolean).join(', ');
}

const totais = Object.fromEntries(GRUPOS.map((g) => [g, { codigos: 0, registros: 0 }]));
const linhasColuna = [['Coluna', 'Nome legível', 'Tipo na ferramenta', 'Códigos distintos', 'Registros', ...GRUPOS.map((g) => `${g} (registros)`), 'Diferença de contagem']];
const linhasDif = [['Coluna', 'Nome legível', 'Código', 'Registros', 'Texto na ferramenta', 'Texto no microdatasus', 'Grupo', 'Fonte oficial usada pela ferramenta', 'Decisão do Rubens', 'Comentário']];
const soNumaFerramenta = [];

const nomesColunas = [...new Set([...nos.keys(), ...md.keys()])];
for (const coluna of nomesColunas) {
  const a = nos.get(coluna);
  const b = md.get(coluna);
  if (!a || !b) {
    soNumaFerramenta.push([coluna, a ? 'Só na saída da ferramenta' : 'Só na saída do microdatasus']);
    continue;
  }
  const col = porNome.get(coluna);
  const porGrupo = Object.fromEntries(GRUPOS.map((g) => [g, 0]));
  let registros = 0;
  let diferencaContagem = 0;
  const soma = (m) => (m ? [...m.values()].reduce((s, n) => s + n, 0) : 0);
  for (const codigo of new Set([...a.keys(), ...b.keys()])) {
    const x = a.get(codigo);
    const y = b.get(codigo);
    if (soma(x) !== soma(y)) diferencaContagem += Math.abs(soma(x) - soma(y));
    if (!x || !y) continue;
    if (x.size !== 1) throw new Error(`A ferramenta deu mais de um texto para ${coluna}=${codigo}.`);
    const [rNos] = x.keys();
    for (const [rMd, n] of y) {
      const g = grupo(coluna, codigo, rNos, rMd);
      porGrupo[g] += n;
      registros += n;
      totais[g].codigos++;
      totais[g].registros += n;
      if (detalhar(col, g)) {
        const destaque = g === 'Significado diferente' || g === 'Microdatasus apaga o valor';
        const linha = [coluna, col?.rotulo ?? '', codigo === '' ? '(vazio)' : codigo, n, rNos === '' ? '(vazio)' : rNos,
          rMd === '' ? '(vazio)' : rMd, g, fonte(col, codigo), '', y.size > 1 ? 'O microdatasus dá textos diferentes para este mesmo código.' : ''];
        linhasDif.push(destaque ? linha.map((v) => ({ valor: v, estilo: ESTILO.destaque })) : linha);
      }
    }
  }
  linhasColuna.push([coluna, col?.rotulo ?? '(sem dicionário)', col ? NOMES_TIPOS[col.tipo] : '', new Set([...a.keys(), ...b.keys()]).size, registros,
    ...GRUPOS.map((g) => porGrupo[g]), diferencaContagem]);
}

const registrosArquivo = Math.max(...[...nos.values()].map((m) => [...m.values()].reduce((s, porRotulo) => s + [...porRotulo.values()].reduce((t, n) => t + n, 0), 0)));
const linhasResumo = [
  ['Item', 'Valor'],
  ['Agravo', dic.agravo.nome],
  ['Arquivo comparado', opcao('--arquivo') ?? ''],
  ['Registros no arquivo', registrosArquivo],
  ['Dicionário da ferramenta', `${dic.versao} (conferido por ${dic.conferencia.por} em ${dic.conferencia.data})`],
  ['Microdatasus', `versão ${opcao('--versao-microdatasus') ?? '?'}, função process_sinan_${agravo.replace(/-/g, '_')}, municipality_data = FALSE`],
  ['Gerado em', new Date().toLocaleString('pt-BR')],
  ['', ''],
  ['Grupo', 'Códigos (coluna + código)', 'Registros × colunas'],
  ...GRUPOS.map((g) => [g, totais[g].codigos, totais[g].registros]),
  ['', ''],
  ['Colunas presentes em só uma das saídas', soNumaFerramenta.map((s) => `${s[0]} (${s[1].toLowerCase()})`).join('; ') || 'nenhuma'],
];

mkdirSync(`${raiz}docs/validacao`, { recursive: true });
const destino = `${raiz}docs/validacao/comparacao-${agravo}.xlsx`;
writeFileSync(destino, criarXlsx([
  { nome: 'Resumo', linhas: linhasResumo, larguras: [40, 60, 20] },
  { nome: 'Diferenças', linhas: linhasDif, larguras: [12, 28, 10, 10, 34, 34, 24, 40, 20, 40] },
  { nome: 'Por coluna', linhas: linhasColuna, larguras: [12, 30, 16, 10, 12, ...GRUPOS.map(() => 14), 12] },
]));
console.log(`Gravada ${destino}`);
for (const g of GRUPOS) console.log(`  ${g}: ${totais[g].codigos} códigos, ${totais[g].registros.toLocaleString('pt-BR')} registros×colunas`);
console.log(`  Linhas na aba Diferenças: ${linhasDif.length - 1}`);
