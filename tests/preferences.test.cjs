'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULTS, STORAGE_KEY, read, save, clear, sanitize } = require('../preferences.js');
function memory() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
test('salva somente preferências permitidas, nunca senhas ou outros campos', () => {
  const storage = memory();
  const config = { ...DEFAULTS, length: 32, mode: 'words', wordCount: 8, theme: 'dark', password: 'sensitive-test-value', token: 'secret-test-value' };
  assert.equal(save(storage, config), true);
  const json = storage.getItem(STORAGE_KEY);
  assert.ok(!json.includes('sensitive-test-value') && !json.includes('secret-test-value'));
  assert.deepEqual(Object.keys(JSON.parse(json)).sort(), Object.keys(DEFAULTS).sort());
  const restored = read(storage).values;
  assert.equal(restored.length, 32);
  assert.equal(restored.wordCount, 8);
  assert.equal(restored.mode, 'words');
  assert.equal(restored.theme, 'dark');
});
test('desativar remove os ajustes e preserva apenas a escolha de não lembrar', () => {
  const storage = memory();
  save(storage, { ...DEFAULTS, length: 32 });
  assert.equal(clear(storage), true);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)), { version: 1, remember: false });
  const restored = read(storage).values;
  assert.equal(restored.remember, false);
  assert.equal(restored.length, 20);
});
test('JSON inválido, versões desconhecidas e valores manipulados não quebram a geração', () => {
  const storage = memory();
  storage.setItem(STORAGE_KEY, '{broken');
  assert.deepEqual(read(storage).values, DEFAULTS);
  assert.deepEqual(sanitize({ ...DEFAULTS, version: 2 }), DEFAULTS);
  const malformed = sanitize({ ...DEFAULTS, length: 1000, wordCount: '8', mode: 'invalid', theme: 'invalid', separator: '<', numbers: 'yes', allowedSymbols: '<script>' });
  assert.deepEqual(malformed, DEFAULTS);
  storage.setItem(STORAGE_KEY, 'x'.repeat(3000));
  assert.deepEqual(read(storage).values, DEFAULTS);
});
test('armazenamento bloqueado é tratado sem interromper a interface', () => {
  const storage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.equal(read(storage).available, false);
  assert.equal(save(storage, DEFAULTS), false);
  assert.equal(clear(storage), false);
  assert.equal(read(null).available, false);
});
