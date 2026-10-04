'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const { generate, entropy, randomIndex, groupsFor } = require('../generator.js');
const defaults = { length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeSimilar: true };
const words = require('../words.js');
const { generatePhrase, phraseEntropy } = require('../generator.js');

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

test('símbolos personalizados limitam o alfabeto e a entropia', () => {
  const config = { ...defaults, uppercase: false, lowercase: false, numbers: false, allowedSymbols: '!@' };
  for (let i = 0; i < 30; i++) assert.match(generate(config, webcrypto), /^[!@]{20}$/);
  assert.equal(entropy(config), 20);
  assert.equal(entropy({ ...config, allowedSymbols: '!!' }), 0);
  for (const allowedSymbols of ['', 'abc', '<script>', null, 123, '!'.repeat(100)]) assert.throws(() => generate({ ...config, allowedSymbols }, webcrypto));
  assert.doesNotThrow(() => generate({ ...defaults, symbols: false, allowedSymbols: '' }, webcrypto));
});

test('lista portuguesa contém 7776 palavras únicas e separáveis', () => {
  assert.equal(words.length, 7776);
  assert.equal(new Set(words).size, 7776);
  assert.ok(words.every(word => /^[a-z]+$/.test(word)));
  assert.ok(Object.isFrozen(words));
});

test('frases respeitam a quantidade, o separador e a entropia', () => {
  for (const wordCount of [6, 8, 10]) for (const separator of ['-', ' ', '.']) {
    const phrase = generatePhrase({ wordCount, separator }, webcrypto);
    const parts = phrase.split(separator);
    assert.equal(parts.length, wordCount);
    assert.ok(parts.every(word => words.includes(word)));
    assert.equal(phraseEntropy({ wordCount, separator }), wordCount * Math.log2(7776));
  }
});

test('frases rejeitam configurações e fonte de aleatoriedade inválidas', () => {
  for (const wordCount of [0, 5, 11, 6.1, '6', null]) assert.throws(() => generatePhrase({ wordCount, separator: '-' }, webcrypto));
  for (const separator of ['', '_', '<', undefined]) assert.throws(() => generatePhrase({ wordCount: 6, separator }, webcrypto));
  assert.throws(() => generatePhrase({ wordCount: 6, separator: '-' }, {}), /geração segura/);
});

test('sorteio de palavras rejeita a faixa incompleta de 32 bits', () => {
  const max = 7776;
  const limit = 4294967296 - (4294967296 % max);
  const samples = [4294967295, limit, max - 1];
  const provider = { getRandomValues(array) { assert.ok(array instanceof Uint32Array); array[0] = samples.shift(); return array; } };
  assert.equal(randomIndex(max, provider), max - 1);
  assert.equal(samples.length, 0);
});
