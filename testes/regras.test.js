import { test } from 'node:test';
import assert from 'node:assert/strict';
import { converterData, converterIdade, corrigirAcentos, idadeEmAnos, semanaEpidemiologica } from '../src/decodificacao/regras.js';

const UNIDADES = [
  { codigos: ['1'], rotulo: 'hora', plural: 'horas' },
  { codigos: ['2'], rotulo: 'dia', plural: 'dias' },
  { codigos: ['3'], rotulo: 'mês', plural: 'meses' },
  { codigos: ['4'], rotulo: 'ano', plural: 'anos' },
];

test('datas viram o número de série do Excel', () => {
  assert.deepEqual(converterData('19000301'), { valor: 61 });
  assert.deepEqual(converterData('20250115'), { valor: 45672 });
  assert.deepEqual(converterData('2025-01-15'), { valor: 45672 });
  assert.deepEqual(converterData('15/01/2025'), { valor: 45672 });
  assert.deepEqual(converterData('20240229'), { valor: 45351 });
});

test('data em branco continua em branco', () => {
  assert.deepEqual(converterData(''), { valor: null });
});

test('data inválida não quebra: devolve o motivo', () => {
  assert.match(converterData('20250230').erro, /inexistente/);
  assert.match(converterData('20251301').erro, /inexistente/);
  assert.match(converterData('2025011').erro, /formato/);
  assert.match(converterData('abc').erro, /formato/);
  assert.match(converterData('18991231').erro, /anterior a 1900/);
});

test('idade em horas, dias, meses e anos', () => {
  assert.deepEqual(converterIdade('1012', UNIDADES), { valor: '12 horas' });
  assert.deepEqual(converterIdade('2001', UNIDADES), { valor: '1 dia' });
  assert.deepEqual(converterIdade('3009', UNIDADES), { valor: '9 meses' });
  assert.deepEqual(converterIdade('4018', UNIDADES), { valor: '18 anos' });
  assert.deepEqual(converterIdade('4001', UNIDADES), { valor: '1 ano' });
  assert.deepEqual(converterIdade('4000', UNIDADES), { valor: '0 anos' });
});

test('idade em branco continua em branco; formato estranho devolve o motivo', () => {
  assert.deepEqual(converterIdade('', UNIDADES), { valor: null });
  assert.match(converterIdade('25', UNIDADES).erro, /4 dígitos/);
  assert.match(converterIdade('5025', UNIDADES).erro, /Unidade/);
  assert.match(converterIdade('40A5', UNIDADES).erro, /4 dígitos/);
});

test('idade acima do máximo da unidade vira inconsistência; no limite, traduz', () => {
  const limites = UNIDADES.map((u) => ({ ...u, maximo: { 1: 23, 2: 29, 3: 11, 4: 110 }[u.codigos[0]] }));
  assert.deepEqual(converterIdade('4110', limites), { valor: '110 anos' });
  assert.deepEqual(converterIdade('1023', limites), { valor: '23 horas' });
  assert.equal(converterIdade('4111', limites).erro, 'Idade implausível: acima de 110 anos');
  assert.equal(converterIdade('4405', limites).erro, 'Idade implausível: acima de 110 anos');
  assert.equal(converterIdade('1024', limites).erro, 'Idade implausível: acima de 23 horas');
  assert.equal(converterIdade('2030', limites).erro, 'Idade implausível: acima de 29 dias');
  assert.equal(converterIdade('3012', limites).erro, 'Idade implausível: acima de 11 meses');
  assert.deepEqual(converterIdade('2000', limites), { valor: '0 dias' });
});

test('idade em anos completos para análise: menor de 1 ano = 0; inválida ou implausível fica vazia', () => {
  const limites = UNIDADES.map((u) => ({ ...u, maximo: { 1: 23, 2: 29, 3: 11, 4: 110 }[u.codigos[0]] }));
  assert.equal(idadeEmAnos('4018', limites), 18);
  assert.equal(idadeEmAnos('4000', limites), 0);
  assert.equal(idadeEmAnos('4110', limites), 110);
  assert.equal(idadeEmAnos('3011', limites), 0);
  assert.equal(idadeEmAnos('2015', limites), 0);
  assert.equal(idadeEmAnos('1005', limites), 0);
  assert.equal(idadeEmAnos('4405', limites), null);
  assert.equal(idadeEmAnos('3012', limites), null);
  assert.equal(idadeEmAnos('5025', limites), null);
  assert.equal(idadeEmAnos('', limites), null);
});

test('semana epidemiológica: domingo a sábado, semana 1 é a que contém 4 de janeiro', () => {
  assert.deepEqual(semanaEpidemiologica('20250115'), { valor: '202503' });
  assert.deepEqual(semanaEpidemiologica('2025-01-04'), { valor: '202501' }); // sábado
  assert.deepEqual(semanaEpidemiologica('05/01/2025'), { valor: '202502' }); // domingo
  // Dias do fim de dezembro podem cair na semana 1 do ano seguinte, e vice-versa.
  assert.deepEqual(semanaEpidemiologica('20241231'), { valor: '202501' });
  assert.deepEqual(semanaEpidemiologica('20210102'), { valor: '202053' }); // ano de 53 semanas
  assert.deepEqual(semanaEpidemiologica('20201231'), { valor: '202053' });
});

test('semana epidemiológica: data em branco fica em branco; data inválida não vira semana', () => {
  assert.deepEqual(semanaEpidemiologica(''), { valor: null });
  assert.match(semanaEpidemiologica('20250231').erro, /^Semana não calculada: data inexistente/);
  assert.match(semanaEpidemiologica('abc').erro, /^Semana não calculada/);
});

test('data com barras no formato americano (mês/dia/ano), só quando a coluna pede', () => {
  const opc = { mesPrimeiro: true };
  assert.deepEqual(converterData('7/18/2023', opc), converterData('20230718'));
  assert.deepEqual(converterData('4/3/2023', opc), converterData('20230403'));
  assert.deepEqual(converterData('12/1/2022', opc), converterData('20221201'));
  assert.deepEqual(converterData('20240105', opc), converterData('20240105')); // AAAAMMDD continua valendo
  assert.ok(converterData('18/07/2023', opc).erro); // não existe como mês/dia/ano
  assert.deepEqual(converterData('04/03/2023'), converterData('20230304')); // sem a marca: dia/mês/ano
  assert.ok(converterData('4/3/2023').erro);
});

test('conserto de acentos estragados: só as duas formas conhecidas', () => {
  // UTF-8 lido como windows-1252
  assert.equal(corrigirAcentos('MamÃ£o'), 'Mamão');
  assert.equal(corrigirAcentos('Ãgua de coco'), 'Água de coco');
  assert.equal(corrigirAcentos('MelÃ£o e cafÃ©'), 'Melão e café');
  // página 850 (DOS) lida como windows-1252
  assert.equal(corrigirAcentos('MamÆo'), 'Mamão');
  assert.equal(corrigirAcentos('Bols¡nea'), 'Bolsínea');
  assert.equal(corrigirAcentos('µgua'), 'Água');
  assert.equal(corrigirAcentos('FeijÆo … moda'), 'Feijão à moda');
  assert.equal(corrigirAcentos('farin ceos'), 'farináceos');
  // texto certo ou estrago desconhecido: fica como veio
  for (const t of ['Açaí', 'Ãgua', 'Pão de queijo', 'AGLOMERAA-¿A-¿O', 'Café com ¡', 'texto  comum']) {
    assert.equal(corrigirAcentos(t), t);
  }
});
