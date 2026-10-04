(function(root) {
  'use strict';
  const DEFAULTS = Object.freeze({ version: 1, remember: true, mode: 'characters', length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeSimilar: true, allowedSymbols: '!@#$%^&*()-_=+[]{};:,.?/', wordCount: 6, separator: '-', theme: 'system' });
  const STORAGE_KEY = 'chave.preferences.v1';

  function sanitize(raw) {
    const result = { ...DEFAULTS };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.version !== 1) return result;
    if (raw.remember === false) return { ...result, remember: false };
    for (const key of ['uppercase', 'lowercase', 'numbers', 'symbols', 'excludeSimilar']) {
      if (typeof raw[key] === 'boolean') result[key] = raw[key];
    }
    if (Number.isInteger(raw.length) && raw.length >= 8 && raw.length <= 64) result.length = raw.length;
    if (Number.isInteger(raw.wordCount) && raw.wordCount >= 6 && raw.wordCount <= 10) result.wordCount = raw.wordCount;
    if (['characters', 'words'].includes(raw.mode)) result.mode = raw.mode;
    if (['-', ' ', '.'].includes(raw.separator)) result.separator = raw.separator;
    if (['system', 'light', 'dark'].includes(raw.theme)) result.theme = raw.theme;
    if (typeof raw.allowedSymbols === 'string' && raw.allowedSymbols.length <= DEFAULTS.allowedSymbols.length && [...raw.allowedSymbols].every(char => DEFAULTS.allowedSymbols.includes(char))) {
      result.allowedSymbols = [...new Set(raw.allowedSymbols)].join('');
    }
    return result;
  }

  function read(storage) {
    try {
      const value = storage.getItem(STORAGE_KEY);
      if (value && value.length > 2048) return { values: { ...DEFAULTS }, available: true, saved: false };
      return { values: sanitize(value ? JSON.parse(value) : null), available: true, saved: Boolean(value) };
    } catch { return { values: { ...DEFAULTS }, available: false, saved: false }; }
  }

  function save(storage, values) {
    try { storage.setItem(STORAGE_KEY, JSON.stringify(sanitize(values))); return true; }
    catch { return false; }
  }

  function clear(storage) {
    try { storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, remember: false })); return true; }
    catch { return false; }
  }

  const api = Object.freeze({ DEFAULTS, STORAGE_KEY, sanitize, read, save, clear });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PasswordPreferences = api;
})(globalThis);
