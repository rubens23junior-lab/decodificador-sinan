// Leitura de arquivos CSV, com detecção do separador (vírgula ou ponto e
// vírgula). Trabalha em fluxo: recebe o texto em pedaços e entrega um
// registro por vez. Segue as regras usuais do CSV: campos entre aspas podem
// conter separador e quebra de linha, e aspas dentro deles vêm duplicadas.

import { ErroLeitura } from './erros.js';

/**
 * Escolhe o separador pela linha de cabeçalho: o que aparecer mais vezes
 * fora de aspas, entre ";" e ",".
 * @param {string} linha
 */
export function detectarSeparador(linha) {
  let pontoEVirgula = 0;
  let virgula = 0;
  let entreAspas = false;
  for (const c of linha) {
    if (c === '"') entreAspas = !entreAspas;
    else if (!entreAspas && c === ';') pontoEVirgula++;
    else if (!entreAspas && c === ',') virgula++;
  }
  return pontoEVirgula >= virgula && pontoEVirgula > 0 ? ';' : ',';
}

/**
 * @param {object} opcoes
 * @param {(nomes: string[], separador: string) => void} [opcoes.aoCabecalho]
 * @param {(valores: string[]) => void} opcoes.aoRegistro
 */
export function criarLeitorCSV({ aoCabecalho, aoRegistro }) {
  let inicio = ''; // texto guardado até encontrar o fim da 1ª linha
  let separador = null;
  let nomes = null;
  let linha = 1;
  let lidos = 0;

  // estado do analisador
  let campo = '';
  let campos = [];
  let entreAspas = false;
  let aspaPendente = false; // vimos uma aspa dentro de aspas: pode ser fim ou aspa duplicada
  let ignorarLF = false;
  let camposComConteudo = false;

  function fecharCampo() {
    campos.push(campo);
    campo = '';
  }

  function fecharRegistro() {
    fecharCampo();
    const registro = campos;
    campos = [];
    const vazio = registro.length === 1 && registro[0] === '' && !camposComConteudo;
    camposComConteudo = false;
    if (vazio) return; // linha em branco
    if (nomes === null) {
      nomes = registro.map((n) => n.trim());
      if (aoCabecalho) aoCabecalho(nomes, separador);
      return;
    }
    if (registro.length !== nomes.length) {
      throw new ErroLeitura(
        `A linha ${linha} do CSV tem ${registro.length} colunas, mas o cabeçalho tem ${nomes.length}. Confira se o arquivo não foi alterado ou cortado.`,
      );
    }
    lidos++;
    aoRegistro(registro.map((v) => v.trim()));
  }

  function analisar(texto) {
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (ignorarLF) {
        ignorarLF = false;
        if (c === '\n') continue;
      }
      if (aspaPendente) {
        aspaPendente = false;
        if (c === '"') {
          campo += '"';
          continue;
        }
        entreAspas = false; // a aspa anterior fechou o campo
      }
      if (entreAspas) {
        if (c === '"') aspaPendente = true;
        else campo += c;
        continue;
      }
      if (c === '"') {
        entreAspas = true;
        camposComConteudo = true;
      } else if (c === separador) {
        fecharCampo();
        camposComConteudo = true;
      } else if (c === '\n' || c === '\r') {
        fecharRegistro();
        linha++;
        if (c === '\r') ignorarLF = true;
      } else {
        campo += c;
      }
    }
  }

  return {
    /** @param {string} texto */
    empurrar(texto) {
      if (separador === null) {
        inicio += texto;
        if (inicio.charCodeAt(0) === 0xfeff) inicio = inicio.slice(1); // marca BOM
        const fim = inicio.search(/[\r\n]/);
        if (fim === -1) return; // ainda não chegou o fim da 1ª linha
        separador = detectarSeparador(inicio.slice(0, fim));
        texto = inicio;
        inicio = '';
      }
      analisar(texto);
    },
    finalizar() {
      if (separador === null) {
        if (inicio.charCodeAt(0) === 0xfeff) inicio = inicio.slice(1);
        separador = detectarSeparador(inicio);
        analisar(inicio);
      }
      if (aspaPendente) {
        aspaPendente = false;
        entreAspas = false;
      }
      if (entreAspas) {
        throw new ErroLeitura('O CSV terminou com aspas abertas. O arquivo pode estar cortado ou com aspas a mais.');
      }
      if (campo !== '' || campos.length > 0) fecharRegistro();
      if (nomes === null) {
        throw new ErroLeitura('O arquivo CSV está vazio.');
      }
      return { lidos, separador };
    },
  };
}
