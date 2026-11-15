// Geradores de arquivos fictícios para os testes. Nenhum dado real é usado.

/** Converte texto para windows-1252 (suficiente para letras acentuadas do português). */
export function paraWindows1252(texto) {
  const bytes = new Uint8Array(texto.length);
  for (let i = 0; i < texto.length; i++) {
    const codigo = texto.charCodeAt(i);
    if (codigo > 0xff) throw new Error(`Caractere fora do windows-1252 nos dados de teste: ${texto[i]}`);
    bytes[i] = codigo;
  }
  return bytes;
}

/**
 * Monta um DBF.
 * @param {{nome: string, tipo: string, tamanho: number}[]} campos
 * @param {string[][]} registros
 * @param {{excluidos?: number[], marcaFim?: boolean}} [opcoes]
 */
export function criarDBF(campos, registros, { excluidos = [], marcaFim = true } = {}) {
  const tamCabecalho = 32 + 32 * campos.length + 1;
  const tamRegistro = 1 + campos.reduce((soma, c) => soma + c.tamanho, 0);
  const total = tamCabecalho + tamRegistro * registros.length + (marcaFim ? 1 : 0);
  const bytes = new Uint8Array(total);
  const visao = new DataView(bytes.buffer);

  bytes[0] = 0x03;
  bytes[1] = 126; // 2026
  bytes[2] = 1;
  bytes[3] = 15;
  visao.setUint32(4, registros.length, true);
  visao.setUint16(8, tamCabecalho, true);
  visao.setUint16(10, tamRegistro, true);

  campos.forEach((c, i) => {
    const pos = 32 + 32 * i;
    bytes.set(paraWindows1252(c.nome), pos);
    bytes[pos + 11] = c.tipo.charCodeAt(0);
    bytes[pos + 16] = c.tamanho;
  });
  bytes[tamCabecalho - 1] = 0x0d;

  registros.forEach((valores, r) => {
    let pos = tamCabecalho + r * tamRegistro;
    bytes[pos++] = excluidos.includes(r) ? 0x2a : 0x20;
    campos.forEach((c, i) => {
      const texto = (valores[i] ?? '').padEnd(c.tamanho, ' ').slice(0, c.tamanho);
      bytes.set(paraWindows1252(texto), pos);
      pos += c.tamanho;
    });
  });
  if (marcaFim) bytes[total - 1] = 0x1a;
  return bytes;
}

/**
 * Compacta no formato "implode" usando só bytes literais (sem repetições).
 * Não economiza espaço, mas gera um fluxo válido para testar a leitura.
 */
export function compactarSoLiterais(dados) {
  const saida = [0x00, 0x06]; // literais sem Huffman; dicionário de 4096 bytes
  let acumulador = 0;
  let qtd = 0;
  function escrever(valor, nbits) {
    for (let i = 0; i < nbits; i++) {
      acumulador |= ((valor >> i) & 1) << qtd;
      qtd++;
      if (qtd === 8) {
        saida.push(acumulador);
        acumulador = 0;
        qtd = 0;
      }
    }
  }
  for (const byte of dados) {
    escrever(0, 1); // marca de literal
    escrever(byte, 8);
  }
  // Código de fim: marca de cópia, símbolo de comprimento 15 (sete bits 0,
  // pois os códigos são gravados invertidos) e 8 bits extras = 255 (264 + 255 = 519).
  escrever(1, 1);
  escrever(0, 7);
  escrever(255, 8);
  if (qtd > 0) saida.push(acumulador);
  return new Uint8Array(saida);
}

/** Monta um DBC a partir de um DBF: cabeçalho + 4 bytes + registros compactados. */
export function criarDBC(dbf) {
  const tamCabecalho = new DataView(dbf.buffer, dbf.byteOffset).getUint16(8, true);
  const compactado = compactarSoLiterais(dbf.subarray(tamCabecalho));
  const bytes = new Uint8Array(tamCabecalho + 4 + compactado.length);
  bytes.set(dbf.subarray(0, tamCabecalho), 0);
  bytes.set(compactado, tamCabecalho + 4);
  return bytes;
}

// Colunas e registros fictícios usados em vários testes.
export const CAMPOS_FICTICIOS = [
  { nome: 'DT_NOTIFIC', tipo: 'D', tamanho: 8 },
  { nome: 'NU_IDADE_N', tipo: 'N', tamanho: 4 },
  { nome: 'CS_SEXO', tipo: 'C', tamanho: 1 },
  { nome: 'NM_TESTE', tipo: 'C', tamanho: 20 },
];

export const REGISTROS_FICTICIOS = [
  ['20240115', '4025', 'F', 'São João'],
  ['20240203', '3009', 'M', 'Conceição'],
  ['', '', '', ''],
  ['20241231', '1012', 'I', 'Ação Fictícia'],
];
