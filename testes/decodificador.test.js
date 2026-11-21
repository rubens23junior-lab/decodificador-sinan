import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarDecodificador, ErroDecodificacao } from '../src/decodificacao/decodificador.js';
import { dicionarioFicticio, tabelasFicticias, COLUNAS_ARQUIVO } from './auxiliares/dicionario-ficticio.js';

const REGISTRO = ['X99', '20250115', '4025', '01', '1', '99', '990001', '1234567', '0042'];

function preparar(opcoes) {
  const dec = criarDecodificador(dicionarioFicticio(), tabelasFicticias(), opcoes);
  const colunas = dec.prepararColunas(COLUNAS_ARQUIVO);
  return { dec, colunas };
}

test('monta o cabeçalho: nome legível, código ao lado e coluna extra na posição pedida', () => {
  const { colunas } = preparar();
  assert.deepEqual(colunas.map((c) => c.cabecalho), [
    'Agravo', 'ID_AGRAVO', 'Data da notificação', 'Idade', 'NU_IDADE_N', 'Escolaridade', 'CS_ESCOL', 'Febre', 'FEBRE',
    'UF de residência', 'SG_UF', 'Município de residência', 'ID_MN_RESI', 'Unidade', 'ID_UNIDADE', 'Regional (código)', 'Região de residência',
  ]);
  assert.equal(colunas[2].tipoCelula, 'data');
  assert.equal(colunas[16].original, 'REGIAO_RES (calculada de ID_MN_RESI)');
});

test('sem as colunas originais e só com as colunas escolhidas', () => {
  const { colunas } = preparar({ manterOriginais: false, colunas: ['CS_ESCOL', 'FEBRE', 'REGIAO_RES', 'ID_REGIONA'] });
  assert.deepEqual(colunas.map((c) => c.cabecalho), ['Escolaridade', 'Febre', 'Regional (código)', 'Região de residência']);
});

test('categoria conhecida vira o rótulo (inclusive formas equivalentes como "01")', () => {
  const { dec } = preparar({ manterOriginais: false });
  const { valores, alertas } = dec.decodificar(REGISTRO);
  assert.deepEqual(valores, ['Fictício', 45672, '25 anos', 'Nível um', 'Sim', 'Estado Fictício', 'Vila Alfa (Estado Fictício)', 'Posto Fictício', '0042', 'Região Norte Fictícia (99001)']);
  assert.equal(alertas, null);
  assert.deepEqual(dec.listarInconsistencias(), []);
});

test('categoria desconhecida fica como veio, com alerta, e vai para as inconsistências', () => {
  const { dec } = preparar({ manterOriginais: false });
  const r = REGISTRO.slice();
  r[4] = '7';
  dec.decodificar(r);
  const { valores, alertas } = dec.decodificar(r);
  assert.equal(valores[4], '7');
  assert.deepEqual(alertas, [4]);
  assert.deepEqual(dec.listarInconsistencias(), [
    { coluna: 'FEBRE', rotulo: 'Febre', valor: '7', motivo: 'Código não encontrado no dicionário', quantidade: 2 },
  ]);
});

test('campo em branco continua em branco (nunca vira "Ignorado")', () => {
  const { dec } = preparar();
  const { valores, alertas } = dec.decodificar(['X99', '', '', '', '', '', '', '', '']);
  assert.deepEqual(valores.slice(0, 2), ['Fictício', 'X99']); // agravo preenchido, com o código ao lado
  assert.ok(valores.slice(2).every((v) => v === null), JSON.stringify(valores));
  assert.equal(alertas, null);
});

test('data e idade inválidas não quebram: ficam como vieram e são registradas', () => {
  const { dec } = preparar({ manterOriginais: false });
  const r = REGISTRO.slice();
  r[1] = '20250230';
  r[2] = '9999';
  const { valores, alertas } = dec.decodificar(r);
  assert.equal(valores[1], '20250230');
  assert.equal(valores[2], '9999');
  assert.deepEqual(alertas, [1, 2]);
  const motivos = dec.listarInconsistencias().map((i) => `${i.coluna}: ${i.motivo}`);
  assert.deepEqual(motivos, ['DT_NOTIFIC: Data inexistente no calendário', 'NU_IDADE_N: Unidade de idade desconhecida (1º dígito)']);
});

test('município: IBGE primeiro, complemento do DATASUS depois; código sem tabela é registrado', () => {
  const { dec } = preparar({ manterOriginais: false, colunas: ['ID_MN_RESI', 'REGIAO_RES', 'ID_REGIONA'] });
  assert.deepEqual(dec.decodificar(['X99', '', '', '', '', '', '990000', '', '']).valores, [
    'Municipio Ignorado - Ficticio', null, null,
  ]);
  const { valores, alertas } = dec.decodificar(['X99', '', '', '', '', '', '123456', '', '']);
  assert.deepEqual(valores, ['123456', null, null]);
  assert.deepEqual(alertas, [0]);
  const colunas = dec.listarInconsistencias().map((i) => i.coluna);
  assert.deepEqual(colunas, ['ID_MN_RESI', 'REGIAO_RES', 'REGIAO_RES']);
});

test('filtros por valor (UF) e por período de data', () => {
  const { dec } = preparar({ filtros: [{ coluna: 'SG_UF', valores: ['99'] }, { coluna: 'DT_NOTIFIC', de: '20250101', ate: '20250131' }] });
  assert.equal(dec.aceita(REGISTRO), true);
  assert.equal(dec.aceita(REGISTRO.map((v, i) => (i === 5 ? '11' : v))), false);
  assert.equal(dec.aceita(REGISTRO.map((v, i) => (i === 1 ? '20250201' : v))), false);
  assert.equal(dec.aceita(REGISTRO.map((v, i) => (i === 1 ? '' : v))), false);
});

test('arquivo de outro agravo (colunas diferentes) é recusado com mensagem clara', () => {
  const dec = criarDecodificador(dicionarioFicticio(), tabelasFicticias());
  assert.throws(() => dec.prepararColunas(['TP_NOT', 'OUTRA', 'MAIS_UMA', 'CS_SEXO']), (e) => {
    assert.ok(e instanceof ErroDecodificacao);
    assert.match(e.message, /não parece ser de Agravo Fictício/);
    assert.match(e.message, /Nenhuma planilha foi gerada/);
    return true;
  });
});

test('arquivo com as mesmas colunas mas de outro agravo é recusado após a amostra', () => {
  const { dec } = preparar();
  const outro = REGISTRO.map((v, i) => (i === 0 ? 'Y11' : v));
  assert.throws(() => {
    for (let i = 0; i < 1000; i++) dec.decodificar(outro);
  }, /agravo não é X99/);
});

test('aceita mais de uma forma do código do agravo (ex.: com e sem ponto)', () => {
  const dic = dicionarioFicticio();
  dic.agravo.codigos = ['X99', 'X9.9'];
  const dec = criarDecodificador(dic, tabelasFicticias());
  dec.prepararColunas(COLUNAS_ARQUIVO);
  const comPonto = REGISTRO.map((v, i) => (i === 0 ? 'X9.9' : v));
  assert.doesNotThrow(() => {
    for (let i = 0; i < 1000; i++) dec.decodificar(i % 2 ? comPonto : REGISTRO);
  });
});

test('dicionário não conferido não pode ser usado', () => {
  const dic = dicionarioFicticio();
  dic.conferencia.conferido = false;
  assert.throws(() => criarDecodificador(dic, tabelasFicticias()), /ainda não foi conferido/);
});

test('coluna do arquivo sem tradução é mantida e registrada', () => {
  const dec = criarDecodificador(dicionarioFicticio(), tabelasFicticias(), { manterOriginais: false });
  const colunas = dec.prepararColunas([...COLUNAS_ARQUIVO, 'NOVA_COL']);
  assert.equal(colunas.at(-1).cabecalho, 'NOVA_COL');
  assert.deepEqual(dec.decodificar([...REGISTRO, 'abc']).valores.at(-1), 'abc');
  assert.deepEqual(dec.listarInconsistencias().map((i) => [i.coluna, i.motivo]), [['NOVA_COL', 'Coluna sem tradução no dicionário']]);
});

test('coluna extra ainda em conferência não entra na planilha', () => {
  const dic = dicionarioFicticio();
  dic.derivadas_em_conferencia = [{ nome: 'MACRO_RES', rotulo: 'Macrorregião de residência', de: 'ID_MN_RESI', tabela: 'regioes', depois_de: 'ID_REGIONA' }];
  const colunas = criarDecodificador(dic, tabelasFicticias()).prepararColunas(COLUNAS_ARQUIVO);
  assert.ok(!colunas.some((c) => c.cabecalho === 'Macrorregião de residência'));
  assert.equal(colunas.at(-1).cabecalho, 'Região de residência');
});

test('tabela com complemento: a principal tem prioridade; o complemento só cobre o que falta', () => {
  const dic = dicionarioFicticio();
  dic.tabelas.unidades_extra = { arquivo: 'x', fonte: 'F' };
  dic.colunas.find((c) => c.nome === 'ID_UNIDADE').complemento = 'unidades_extra';
  const tabelas = tabelasFicticias();
  tabelas.unidades_extra = { valores: { 1234567: 'Não deve aparecer', 7654321: 'Posto Extra Fictício' } };
  const dec = criarDecodificador(dic, tabelas, { manterOriginais: false });
  dec.prepararColunas(COLUNAS_ARQUIVO);
  const i = 7; // ID_UNIDADE
  const r = REGISTRO.slice();
  assert.equal(dec.decodificar(r).valores[i], 'Posto Fictício');
  r[i] = '7654321';
  assert.equal(dec.decodificar(r).valores[i], 'Posto Extra Fictício');
  r[i] = '1111111';
  assert.equal(dec.decodificar(r).valores[i], '1111111');
  assert.equal(dec.listarInconsistencias()[0].motivo, 'Código não encontrado na tabela unidades nem na unidades_extra');
});

test('"fora_do_campo": código que o campo não comporta sai com o rótulo explícito, destacado e nas inconsistências', () => {
  const dic = dicionarioFicticio();
  dic.colunas.find((c) => c.nome === 'FEBRE').fora_do_campo = { rotulo: 'Inconsistência/Não preenchido', motivo: 'Código que o campo não comporta (só 1 e 2)' };
  const dec = criarDecodificador(dic, tabelasFicticias(), { manterOriginais: false });
  dec.prepararColunas(COLUNAS_ARQUIVO);
  const r = REGISTRO.slice();
  r[4] = '0';
  const { valores, alertas } = dec.decodificar(r);
  assert.equal(valores[4], 'Inconsistência/Não preenchido');
  assert.deepEqual(alertas, [4]);
  assert.deepEqual(dec.listarInconsistencias(), [
    { coluna: 'FEBRE', rotulo: 'Febre', valor: '0', motivo: 'Código que o campo não comporta (só 1 e 2)', quantidade: 1 },
  ]);
  // em branco continua em branco
  r[4] = '';
  assert.equal(dec.decodificar(r).valores[4], null);
});

test('"completar_zeros": código de tabela sem os zeros à esquerda é encontrado; sem a regra, não', () => {
  const tabs = tabelasFicticias();
  tabs.unidades.valores['0004567'] = 'Unidade Com Zeros';
  const r = REGISTRO.slice();
  r[7] = '4567';
  const sem = criarDecodificador(dicionarioFicticio(), tabs, { manterOriginais: false });
  sem.prepararColunas(COLUNAS_ARQUIVO);
  assert.equal(sem.decodificar(r).valores[7], '4567');
  const dic = dicionarioFicticio();
  dic.tabelas.unidades.completar_zeros = 7;
  const com = criarDecodificador(dic, tabs, { manterOriginais: true });
  const colunas = com.prepararColunas(COLUNAS_ARQUIVO);
  const { valores, alertas } = com.decodificar(r);
  const i = colunas.findIndex((c) => c.cabecalho === 'Unidade');
  assert.equal(valores[i], 'Unidade Com Zeros');
  assert.equal(valores[i + 1], '4567'); // o código original fica como veio
  assert.equal(alertas, null);
});

test('valor só com asteriscos vale como campo em branco (também na coluna do código) e é contado', () => {
  const { dec, colunas } = preparar();
  const r = REGISTRO.slice();
  r[1] = '********'; // data
  r[4] = '*'; // categoria
  const { valores, alertas } = dec.decodificar(r);
  const iData = colunas.findIndex((c) => c.cabecalho === 'Data da notificação');
  const iFebre = colunas.findIndex((c) => c.cabecalho === 'Febre');
  assert.equal(valores[iData], null);
  assert.equal(valores[iFebre], null);
  assert.equal(valores[iFebre + 1], null); // código original também em branco
  assert.equal(alertas, null);
  assert.deepEqual(dec.listarInconsistencias(), []);
  assert.equal(dec.contarAsteriscos(), 2);
  // asterisco no meio de outro texto não é tocado
  r[1] = '2025*0115';
  assert.equal(dec.decodificar(r).valores[iData], '2025*0115');
});

test('valor só com bytes nulos vale como campo em branco (também na coluna do código) e é contado', () => {
  const { dec, colunas } = preparar();
  const r = REGISTRO.slice();
  r[1] = '\0\0\0\0\0\0\0\0'; // data
  r[4] = '\0'; // categoria
  const { valores, alertas } = dec.decodificar(r);
  const iData = colunas.findIndex((c) => c.cabecalho === 'Data da notificação');
  const iFebre = colunas.findIndex((c) => c.cabecalho === 'Febre');
  assert.equal(valores[iData], null);
  assert.equal(valores[iFebre], null);
  assert.equal(valores[iFebre + 1], null); // código original também em branco
  assert.equal(alertas, null);
  assert.deepEqual(dec.listarInconsistencias(), []);
  assert.equal(dec.contarNulos(), 2);
  assert.equal(dec.contarAsteriscos(), 0);
  // byte nulo junto de outro texto não é tocado
  r[1] = '2025\x000115';
  assert.equal(dec.decodificar(r).valores[iData], '2025\x000115');
});

test('coluna extra calculada: semana epidemiológica a partir de uma data', () => {
  const dic = dicionarioFicticio();
  dic.derivadas.push({ nome: 'SEM_CALC', rotulo: 'Semana calculada', de: 'DT_NOTIFIC', calculo: 'semana_epidemiologica', depois_de: 'DT_NOTIFIC' });
  const dec = criarDecodificador(dic, tabelasFicticias(), { manterOriginais: false });
  const colunas = dec.prepararColunas(COLUNAS_ARQUIVO);
  const k = colunas.findIndex((c) => c.cabecalho === 'Semana calculada');
  assert.equal(colunas[k - 1].cabecalho, 'Data da notificação');
  assert.equal(dec.decodificar(REGISTRO).valores[k], '202503');
  const r = REGISTRO.slice();
  r[1] = '20250231';
  const { valores, alertas } = dec.decodificar(r);
  assert.equal(valores[k], null);
  assert.ok(!alertas?.includes(k));
  assert.ok(dec.listarInconsistencias().some((i) => i.coluna === 'SEM_CALC' && /^Semana não calculada/.test(i.motivo)));
});

test('"texto_livre": códigos da fonte são traduzidos; o resto fica como veio, sem destaque', () => {
  const dic = dicionarioFicticio();
  const col = dic.colunas.find((c) => c.nome === 'CS_ESCOL');
  col.texto_livre = true;
  const dec = criarDecodificador(dic, tabelasFicticias(), { manterOriginais: false });
  dec.prepararColunas(COLUNAS_ARQUIVO);
  const r = REGISTRO.slice();
  r[3] = '9';
  assert.equal(dec.decodificar(r).valores[3], 'Ignorado');
  r[3] = 'TEXTO QUALQUER';
  const { valores, alertas } = dec.decodificar(r);
  assert.equal(valores[3], 'TEXTO QUALQUER');
  assert.equal(alertas, null);
  assert.deepEqual(dec.listarInconsistencias(), []);
});

test('colunas de texto: acentos consertados (contados) e número fora do campo vira inconsistência', () => {
  const dic = dicionarioFicticio();
  Object.assign(dic.colunas.find((c) => c.nome === 'ID_REGIONA'), {
    tipo: 'texto', corrigir_acentos: true,
    numero_fora_do_campo: { rotulo: 'Inconsistência/Preenchido erroneamente', motivo: 'Campo de texto' },
  });
  const dec = criarDecodificador(dic, tabelasFicticias(), { manterOriginais: false });
  const colunas = dec.prepararColunas(COLUNAS_ARQUIVO);
  const k = colunas.findIndex((c) => c.cabecalho === 'Regional (código)');
  const r = REGISTRO.slice();
  r[8] = 'MamÆo';
  assert.equal(dec.decodificar(r).valores[k], 'Mamão');
  r[8] = 'Fictício';
  assert.equal(dec.decodificar(r).valores[k], 'Fictício');
  assert.equal(dec.contarAcentos(), 1);
  r[8] = '0042';
  const { valores, alertas } = dec.decodificar(r);
  assert.equal(valores[k], 'Inconsistência/Preenchido erroneamente');
  assert.ok(alertas.includes(k));
  assert.deepEqual(dec.listarInconsistencias().map((i) => [i.coluna, i.valor, i.motivo]), [['ID_REGIONA', '0042', 'Campo de texto']]);
});

test('data marcada "mes_dia_ano": M/D/AAAA vira data, também no filtro de período', () => {
  const dic = dicionarioFicticio();
  dic.colunas.find((c) => c.nome === 'DT_NOTIFIC').mes_dia_ano = true;
  const dec = criarDecodificador(dic, tabelasFicticias(), { manterOriginais: false, filtros: [{ coluna: 'DT_NOTIFIC', de: '20250101', ate: '20250131' }] });
  const colunas = dec.prepararColunas(COLUNAS_ARQUIVO);
  const k = colunas.findIndex((c) => c.cabecalho === 'Data da notificação');
  const r = REGISTRO.slice();
  r[1] = '1/15/2025';
  assert.equal(dec.aceita(r), true);
  assert.equal(dec.decodificar(r).valores[k], dec.decodificar(REGISTRO).valores[k]);
  r[1] = '2/1/2025';
  assert.equal(dec.aceita(r), false);
});

test('coluna extra "codigo_com_ponto_vezes_100": só valores com ponto, multiplicados por 100 e procurados na tabela', () => {
  const dic = dicionarioFicticio();
  dic.derivadas.push({ nome: 'REG_X100', rotulo: 'Regional x 100', de: 'ID_REGIONA', calculo: 'codigo_com_ponto_vezes_100', tabela: 'unidades', tamanho: 7, depois_de: 'ID_REGIONA' });
  const dec = criarDecodificador(dic, tabelasFicticias(), { manterOriginais: false });
  const colunas = dec.prepararColunas(COLUNAS_ARQUIVO);
  const k = colunas.findIndex((c) => c.cabecalho === 'Regional x 100');
  const r = REGISTRO.slice();
  r[8] = '12345.67';
  assert.equal(dec.decodificar(r).valores[k], '1234567 – Posto Fictício');
  r[8] = '0042';
  assert.equal(dec.decodificar(r).valores[k], null);
  r[8] = '99.9';
  const { valores, alertas } = dec.decodificar(r);
  assert.equal(valores[k], null);
  assert.ok(!alertas?.includes(k));
  assert.ok(dec.listarInconsistencias().some((i) => i.coluna === 'REG_X100' && /99.9 × 100 = 0009990/.test(i.motivo)));
});

test('coluna extra "alerta_condicional": aviso só quando as duas colunas batem; o dado original não muda', () => {
  const dic = dicionarioFicticio();
  dic.derivadas.push({ nome: 'ALERTA_X', rotulo: 'Alerta fictício', de: 'ID_AGRAVO', calculo: 'alerta_condicional', valores: ['X99'], e: { coluna: 'FEBRE', valores: ['1'] },
    texto: 'Possível caso de outro agravo', motivo: 'Agravo X99 com febre', depois_de: 'ID_AGRAVO' });
  const dec = criarDecodificador(dic, tabelasFicticias(), { manterOriginais: false });
  const colunas = dec.prepararColunas(COLUNAS_ARQUIVO);
  const k = colunas.findIndex((c) => c.cabecalho === 'Alerta fictício');
  const iAgravo = colunas.findIndex((c) => c.cabecalho === 'Agravo');
  const r = REGISTRO.slice();
  r[4] = '1';
  const a = dec.decodificar(r);
  assert.equal(a.valores[k], 'Possível caso de outro agravo');
  assert.equal(a.valores[iAgravo], 'Fictício');
  assert.ok(a.alertas.includes(k));
  r[4] = '2';
  const b = dec.decodificar(r);
  assert.equal(b.valores[k], null);
  assert.ok(!b.alertas?.includes(k));
  assert.deepEqual(dec.listarInconsistencias().filter((i) => i.coluna === 'ALERTA_X').map((i) => [i.valor, i.motivo, i.quantidade]), [['X99', 'Agravo X99 com febre', 1]]);
});
