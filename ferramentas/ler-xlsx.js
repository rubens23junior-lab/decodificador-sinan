// Leitura simples de planilhas .xlsx (inclusive as salvas pelo Excel, que vêm
// compactadas). Devolve o texto de cada célula, aba por aba. Uso só nas
// ferramentas de desenvolvimento (precisa do Node).

import { inflateRawSync } from 'node:zlib';

function desfazerEscape(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Extrai os arquivos internos de um ZIP (sem compressão ou "deflate"). */
export function lerZip(bytes) {
  const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let fim = buf.length - 22;
  while (fim >= 0 && buf.readUInt32LE(fim) !== 0x06054b50) fim--;
  if (fim < 0) throw new Error('Arquivo não é um ZIP/XLSX válido.');
  const total = buf.readUInt16LE(fim + 10);
  let pos = buf.readUInt32LE(fim + 16);
  const arquivos = {};
  for (let i = 0; i < total; i++) {
    const metodo = buf.readUInt16LE(pos + 10);
    const tamanho = buf.readUInt32LE(pos + 20);
    const tn = buf.readUInt16LE(pos + 28);
    const te = buf.readUInt16LE(pos + 30);
    const tc = buf.readUInt16LE(pos + 32);
    const local = buf.readUInt32LE(pos + 42);
    const nome = buf.subarray(pos + 46, pos + 46 + tn).toString('utf8');
    const inicio = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const dados = buf.subarray(inicio, inicio + tamanho);
    if (metodo !== 0 && metodo !== 8) throw new Error(`Compressão não suportada em ${nome}.`);
    arquivos[nome] = (metodo === 8 ? inflateRawSync(dados) : dados).toString('utf8');
    pos += 46 + tn + te + tc;
  }
  return arquivos;
}

function indiceColuna(letras) {
  let n = 0;
  for (const c of letras) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

/**
 * @param {Uint8Array} bytes
 * @returns {Record<string, string[][]>} linhas de cada aba, pelo nome da aba
 */
export function lerXlsx(bytes) {
  const arquivos = lerZip(bytes);
  const compartilhadas = [...(arquivos['xl/sharedStrings.xml'] ?? '').matchAll(/<si>([\s\S]*?)<\/si>/g)]
    .map((m) => desfazerEscape([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
  const relacoes = Object.fromEntries(
    [...arquivos['xl/_rels/workbook.xml.rels'].matchAll(/<Relationship\b[^>]*>/g)].map((m) => [
      m[0].match(/Id="([^"]+)"/)[1],
      m[0].match(/Target="([^"]+)"/)[1].replace(/^\/?(xl\/)?/, 'xl/'),
    ]),
  );
  const abas = {};
  for (const m of arquivos['xl/workbook.xml'].matchAll(/<sheet\b[^>]*>/g)) {
    const nome = desfazerEscape(m[0].match(/name="([^"]*)"/)[1]);
    const xml = arquivos[relacoes[m[0].match(/r:id="([^"]+)"/)[1]]];
    const linhas = [];
    for (const lm of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const numero = Number(lm[1].match(/r="(\d+)"/)?.[1] ?? linhas.length + 1);
      const linha = [];
      for (const cm of (lm[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = cm[1].match(/r="([A-Z]+)\d+"/)[1];
        const tipo = cm[1].match(/t="([^"]+)"/)?.[1];
        const corpo = cm[2] ?? '';
        let valor = '';
        if (tipo === 's') valor = compartilhadas[Number(corpo.match(/<v>([\s\S]*?)<\/v>/)?.[1])] ?? '';
        else if (tipo === 'inlineStr') valor = desfazerEscape([...corpo.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(''));
        else valor = desfazerEscape(corpo.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '');
        linha[indiceColuna(ref)] = valor;
      }
      linhas[numero - 1] = Array.from(linha, (v) => v ?? '');
    }
    abas[nome] = Array.from(linhas, (l) => l ?? []);
  }
  return abas;
}
