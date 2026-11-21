// Conta quantas vezes cada valor aparece em colunas de um arquivo.
// Mostra só totais (nenhum registro individual). Serve para conferir os
// códigos que aparecem de fato nos arquivos antes de montar os dicionários.
//
// Uso: node ferramentas/contar-valores.js <arquivo> <COLUNA> [COLUNA...]
// Exemplo: node ferramentas/contar-valores.js dados_publicos/dengue-chikungunya/DENGBR25.dbc CLASSI_FIN CRITERIO

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { lerArquivo, detectarFormato } from '../src/leitura/index.js';

const MAX_VALORES = 40;

const [caminho, ...pedidas] = process.argv.slice(2);
if (!caminho || pedidas.length === 0) {
  console.error('Uso: node ferramentas/contar-valores.js <arquivo> <COLUNA> [COLUNA...]');
  process.exit(1);
}

const bytes = readFileSync(caminho);
const formato = detectarFormato(basename(caminho), bytes);
const inicio = Date.now();
let indices = [];
const contagens = pedidas.map(() => new Map());

const resumo = lerArquivo(bytes, {
  formato,
  aoCabecalho(colunas) {
    const nomes = colunas.map((c) => c.nome.toUpperCase());
    indices = pedidas.map((p) => {
      const i = nomes.indexOf(p.toUpperCase());
      if (i === -1) {
        console.error(`Coluna não encontrada: ${p}`);
        process.exit(1);
      }
      return i;
    });
  },
  aoRegistro(valores) {
    for (let k = 0; k < indices.length; k++) {
      const v = valores[indices[k]];
      contagens[k].set(v, (contagens[k].get(v) ?? 0) + 1);
    }
  },
});

const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
console.log(`Arquivo: ${basename(caminho)} (${formato}, ${resumo.codificacao})`);
console.log(`Registros lidos: ${resumo.lidos.toLocaleString('pt-BR')}; excluídos: ${resumo.excluidos}; tempo: ${segundos} s`);

pedidas.forEach((coluna, k) => {
  const linhas = [...contagens[k].entries()].sort((a, b) => b[1] - a[1]);
  console.log(`\n${coluna.toUpperCase()}: ${linhas.length} valores diferentes`);
  for (const [valor, qtd] of linhas.slice(0, MAX_VALORES)) {
    console.log(`  ${(valor === '' ? '(em branco)' : `"${valor}"`).padEnd(16)} ${qtd.toLocaleString('pt-BR').padStart(12)}`);
  }
  if (linhas.length > MAX_VALORES) console.log(`  ... e mais ${linhas.length - MAX_VALORES} valores`);
});
