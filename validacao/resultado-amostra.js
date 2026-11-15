// Validação: conta o resultado da conferência por amostra preenchida pelo
// Rubens (docs/validacao/amostra-conferencia.xlsx) e calcula a taxa de erro
// com intervalo de confiança de 95% (Clopper-Pearson, exato).
// Mostra o resultado da conferência inicial e, se houver, o resultado depois
// da revisão das divergências registrada em docs/validacao/revisao-amostra.json
// (a marcação original na planilha não é alterada).
//
// Uso: node validacao/resultado-amostra.js

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lerXlsx } from '../ferramentas/ler-xlsx.js';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const [cabecalho, ...linhas] = lerXlsx(readFileSync(`${raiz}docs/validacao/amostra-conferencia.xlsx`)).Amostra;
const iAgravo = cabecalho.indexOf('Agravo');
const iMarca = cabecalho.indexOf('Correto? (SIM/NÃO)');
const iComentario = cabecalho.indexOf('Comentário');
const arquivoRevisao = `${raiz}docs/validacao/revisao-amostra.json`;
const revisoes = new Map(existsSync(arquivoRevisao)
  ? JSON.parse(readFileSync(arquivoRevisao, 'utf8')).revisoes.map((r) => [String(r.linha), r])
  : []);

/** Probabilidade de até k sucessos em n tentativas com chance p (binomial acumulada). */
function binomialAcumulada(k, n, p) {
  let termo = (1 - p) ** n;
  let soma = termo;
  for (let i = 1; i <= k; i++) {
    termo *= ((n - i + 1) / i) * (p / (1 - p));
    soma += termo;
  }
  return soma;
}

/** Limites de Clopper-Pearson (95%) para x erros em n, por bissecção. */
function intervalo(x, n) {
  const busca = (f) => {
    let a = 0, b = 1;
    for (let i = 0; i < 100; i++) {
      const m = (a + b) / 2;
      if (f(m)) b = m; else a = m;
    }
    return (a + b) / 2;
  };
  const inferior = x === 0 ? 0 : busca((p) => 1 - binomialAcumulada(x - 1, n, p) >= 0.025);
  const superior = x === n ? 1 : busca((p) => binomialAcumulada(x, n, p) <= 0.025);
  return [inferior, superior];
}

const normalizar = (v) => String(v ?? '').trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const pct = (v) => `${(v * 100).toFixed(2).replace('.', ',')}%`;
const pendentes = [];

/** Conta acertos e erros por agravo; com revisar = true, aplica as revisões. */
function contar(revisar) {
  const grupos = new Map();
  const notas = [];
  for (const l of linhas) {
    if (!l.length) continue;
    const revisao = revisar ? revisoes.get(String(l[0])) : undefined;
    const marca = normalizar(revisao ? revisao.decisao : l[iMarca]);
    if (marca !== 'SIM' && marca !== 'NAO') {
      if (!revisar) pendentes.push(l[0]);
      continue;
    }
    for (const g of [l[iAgravo], 'Total']) {
      if (!grupos.has(g)) grupos.set(g, { n: 0, erros: 0 });
      grupos.get(g).n++;
      if (marca === 'NAO') grupos.get(g).erros++;
    }
    if (marca === 'NAO') notas.push(`  nº ${l[0]} (${l[iAgravo]}): ${l[iComentario] ?? ''}`);
    if (revisao) notas.push(`  nº ${l[0]} (${l[iAgravo]}): revisada para ${revisao.decisao} em ${revisao.data}: ${revisao.motivo}`);
  }
  for (const [g, { n, erros: x }] of grupos) {
    const [a, b] = intervalo(x, n);
    console.log(`${g}: ${n} células conferidas, ${x} erro(s); taxa de erro ${pct(x / n)} (IC 95%: ${pct(a)} a ${pct(b)})`);
  }
  if (notas.length) console.log(`${revisar ? 'Células revisadas' : 'Células marcadas como NÃO'}:\n${notas.join('\n')}`);
}

console.log('Conferência inicial (marcação da planilha):');
contar(false);
if (revisoes.size) {
  console.log('\nDepois da revisão das divergências (revisao-amostra.json):');
  contar(true);
}
if (pendentes.length) console.log(`Ainda sem marcação (SIM/NÃO): ${pendentes.length} linhas (nº ${pendentes.slice(0, 20).join(', ')}${pendentes.length > 20 ? '…' : ''})`);
