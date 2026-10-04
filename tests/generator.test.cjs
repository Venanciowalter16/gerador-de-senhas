'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const { generate, entropy, randomIndex, groupsFor } = require('../generator.js');
const defaults = { length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeSimilar: true };

test('todas as 15 combinações de tipos e comprimentos extremos respeitam as regras', () => {
  const keys = ['uppercase', 'lowercase', 'numbers', 'symbols'];
  for (let mask = 1; mask < 16; mask++) {
    for (const length of [8, 20, 64]) {
      for (const excludeSimilar of [false, true]) {
        const options = { length, excludeSimilar, ...Object.fromEntries(keys.map((key, i) => [key, Boolean(mask & (1 << i))])) };
        const groups = groupsFor(options);
        for (let i = 0; i < 20; i++) {
          const password = generate(options, webcrypto);
          assert.equal(password.length, length);
          assert.ok([...password].every(char => groups.join('').includes(char)));
          assert.ok(groups.every(group => [...password].some(char => group.includes(char))));
          if (excludeSimilar) assert.doesNotMatch(password, /[Il1Oo0]/);
        }
      }
    }
  }
});
test('rejeita entradas inválidas e nenhuma categoria', () => {
  for (const length of [0, 7, 65, 8.5, NaN, Infinity, '20', null]) assert.throws(() => generate({ ...defaults, length }, webcrypto));
  assert.throws(() => generate({ ...defaults, uppercase: false, lowercase: false, numbers: false, symbols: false }, webcrypto));
  assert.throws(() => generate({ ...defaults, numbers: 'true' }, webcrypto));
  assert.throws(() => generate(null, webcrypto));
});
test('não substitui Web Crypto por uma fonte insegura', () => {
  assert.throws(() => generate(defaults, {}), /geração segura/);
});
test('rejeita o resto incompleto antes do módulo', () => {
  const samples = [255, 250, 249];
  const provider = { getRandomValues(array) { array[0] = samples.shift(); return array; } };
  assert.equal(randomIndex(10, provider), 9);
  assert.equal(samples.length, 0);
});
test('limita tentativas quando a fonte não produz amostras válidas', () => {
  assert.throws(() => randomIndex(10, { getRandomValues(array) { array[0] = 255; return array; } }), /aleatoriedade segura/);
});
test('entropia usa o espaço válido com categorias obrigatórias', () => {
  const digits = { ...defaults, uppercase: false, lowercase: false, symbols: false, excludeSimilar: false, length: 8 };
  assert.ok(Math.abs(entropy(digits) - 8 * Math.log2(10)) < 1e-10);
  assert.ok(entropy(defaults) > 100);
  assert.ok(entropy(defaults) < 20 * Math.log2(groupsFor(defaults).join('').length));
  assert.ok(entropy({ ...defaults, length: 64 }) > entropy(defaults));
});
