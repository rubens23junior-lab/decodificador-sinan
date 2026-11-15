// Testes de estrutura do projeto. Rodar com: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('a pasta de dados reais fica fora do controle de versões', () => {
  const regras = readFileSync(new URL('../.gitignore', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .map((linha) => linha.trim());
  assert.ok(regras.includes('dados_publicos/'), 'dados_publicos/ precisa estar no .gitignore');
});
