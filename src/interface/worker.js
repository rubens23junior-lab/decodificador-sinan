// Processamento em segundo plano (Web Worker): lê o arquivo, analisa e gera
// a planilha sem travar a tela. Os dicionários e as tabelas vêm embutidos no
// próprio código (módulo "dados-embutidos", montado no empacotamento).

import { gunzipSync, strFromU8 } from 'fflate';
import { AGRAVOS } from 'dados-embutidos';
import { analisarArquivo } from '../analisar.js';
import { processar } from '../processar.js';

const tabelasCarregadas = {};
const BLOCO_BLOB = 32 << 20; // a cada 32 MB, os pedaços viram um Blob (libera memória)

/** Abre as tabelas de um agravo (descompactando quando necessário). */
function tabelasDo(agravo) {
  if (!tabelasCarregadas[agravo]) {
    const tabelas = {};
    for (const [id, conteudo] of Object.entries(AGRAVOS[agravo].tabelas)) {
      tabelas[id] = conteudo instanceof Uint8Array ? JSON.parse(strFromU8(gunzipSync(conteudo))) : conteudo;
    }
    tabelasCarregadas[agravo] = tabelas;
  }
  return tabelasCarregadas[agravo];
}

/** Destino que guarda a saída em blocos de Blob, para não ocupar a memória toda. */
function destinoEmBlob(_nome, tipo) {
  const blobs = [];
  let partes = [];
  let tamanho = 0;
  let total = 0;
  return {
    escrever(pedaco) {
      partes.push(pedaco.slice());
      tamanho += pedaco.length;
      total += pedaco.length;
      if (tamanho >= BLOCO_BLOB) {
        blobs.push(new Blob(partes));
        partes = [];
        tamanho = 0;
      }
    },
    concluir() {
      if (partes.length) blobs.push(new Blob(partes));
      return { blob: new Blob(blobs, { type: tipo }), tamanho: total };
    },
  };
}

function avisarProgresso(id, etapa) {
  let ultimo = 0;
  return (fracao, lidos) => {
    const agora = Date.now();
    if (agora - ultimo < 200 && fracao < 1) return;
    ultimo = agora;
    postMessage({ tipo: 'progresso', id, etapa, fracao, lidos });
  };
}

onmessage = async ({ data: msg }) => {
  const { id } = msg;
  try {
    postMessage({ tipo: 'progresso', id, etapa: 'Abrindo o arquivo…', fracao: 0 });
    const bytes = new Uint8Array(await msg.arquivo.arrayBuffer());
    const { dic } = AGRAVOS[msg.agravo];

    if (msg.tipo === 'analisar') {
      const resultado = analisarArquivo({
        bytes,
        nomeArquivo: msg.arquivo.name,
        dic,
        codificacao: msg.codificacao,
        aoProgresso: avisarProgresso(id, 'Lendo o arquivo…'),
      });
      postMessage({ tipo: 'analise', id, resultado });
    } else if (msg.tipo === 'processar') {
      postMessage({ tipo: 'progresso', id, etapa: 'Preparando as tabelas…', fracao: 0 });
      const tabelas = tabelasDo(msg.agravo);
      const resultado = processar({
        bytes,
        nomeArquivo: msg.arquivo.name,
        dic,
        tabelas,
        opcoes: msg.opcoes,
        versaoFerramenta: msg.versao,
        aoProgresso: avisarProgresso(id, 'Decodificando…'),
        criarDestino: destinoEmBlob,
      });
      postMessage({
        tipo: 'pronto',
        id,
        arquivos: resultado.arquivos,
        lidos: resultado.lidos,
        incluidos: resultado.incluidos,
        inconsistencias: resultado.inconsistencias.reduce((s, i) => s + (i.valor === '(coluna inteira)' ? 0 : i.quantidade), 0),
      });
    }
  } catch (erro) {
    const mensagem = erro?.constructor?.name?.startsWith('Erro')
      ? erro.message
      : `Erro inesperado: ${erro?.message ?? erro}. Se persistir, informe ao responsável pela ferramenta.`;
    postMessage({ tipo: 'erro', id, mensagem });
  }
};
