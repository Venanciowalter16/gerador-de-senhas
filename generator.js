(function (root) {
  'use strict';
  const CHARSETS = Object.freeze({
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.?/'
  });
  const KEYS = Object.keys(CHARSETS);
  const SIMILAR = /[Il1Oo0]/g;

  function symbolsFor(value = CHARSETS.symbols) {
    if (typeof value !== 'string' || value.length > CHARSETS.symbols.length || [...value].some(char => !CHARSETS.symbols.includes(char))) {
      throw new TypeError('Use apenas os símbolos apresentados em Mais opções.');
    }
    const symbols = [...new Set(value)].join('');
    if (!symbols) throw new RangeError('Escolha pelo menos um símbolo ou desative Símbolos.');
    return symbols;
  }

  function groupsFor(options) {
    if (!options || typeof options !== 'object') throw new TypeError('Configuração inválida.');
    if (!Number.isInteger(options.length) || options.length < 8 || options.length > 64) {
      throw new RangeError('Escolha um comprimento inteiro entre 8 e 64.');
    }
    for (const key of [...KEYS, 'excludeSimilar']) {
      if (typeof options[key] !== 'boolean') throw new TypeError('Seleção de caracteres inválida.');
    }
    const groups = KEYS.filter(key => options[key]).map(key => {
      const chars = key === 'symbols' ? symbolsFor(options.allowedSymbols) : CHARSETS[key];
      return options.excludeSimilar ? chars.replace(SIMILAR, '') : chars;
    });
    if (groups.length === 0) throw new RangeError('Selecione pelo menos um tipo de caractere.');
    return groups;
  }

  function randomIndex(max, cryptoProvider = root.crypto) {
    if (!Number.isInteger(max) || max < 1 || max > 65536) throw new RangeError('Intervalo inválido.');
    if (!cryptoProvider || typeof cryptoProvider.getRandomValues !== 'function') {
      throw new Error('Este navegador não oferece geração segura. Use um navegador atualizado.');
    }
    // Discard the incomplete interval to avoid modulo bias.
    const range = max <= 256 ? 256 : 4294967296;
    const limit = range - (range % max);
    const bytes = max <= 256 ? new Uint8Array(1) : new Uint32Array(1);
    for (let attempt = 0; attempt < 10000; attempt++) {
      cryptoProvider.getRandomValues(bytes);
      if (bytes[0] < limit) return bytes[0] % max;
    }
    throw new Error('Não foi possível gerar aleatoriedade segura. Tente novamente.');
  }

  function generate(options, cryptoProvider = root.crypto) {
    const groups = groupsFor(options);
    const alphabet = groups.join('');
    // Reject whole candidates missing a group. Every valid password then
    // has the same probability, including the required-character rule.
    for (let attempt = 0; attempt < 10000; attempt++) {
      let password = '';
      for (let i = 0; i < options.length; i++) password += alphabet[randomIndex(alphabet.length, cryptoProvider)];
      if (groups.every(group => [...password].some(char => group.includes(char)))) return password;
    }
    throw new Error('Não foi possível gerar a senha. Tente novamente.');
  }

  function entropy(options) {
    const groups = groupsFor(options);
    const total = groups.reduce((sum, group) => sum + group.length, 0);
    let valid = 0n;
    // Inclusion-exclusion counts only passwords containing every group.
    for (let mask = 0; mask < 2 ** groups.length; mask++) {
      let removed = 0;
      let bits = 0;
      groups.forEach((group, index) => {
        if (mask & (1 << index)) { removed += group.length; bits++; }
      });
      const count = BigInt(total - removed) ** BigInt(options.length);
      valid += bits % 2 ? -count : count;
    }
    return Math.log2(Number(valid));
  }

  function phraseOptions(options) {
    if (!options || !Number.isInteger(options.wordCount) || options.wordCount < 6 || options.wordCount > 10) {
      throw new RangeError('Escolha entre 6 e 10 palavras.');
    }
    if (!['-', ' ', '.'].includes(options.separator)) throw new TypeError('Separador inválido.');
  }

  function generatePhrase(options, cryptoProvider = root.crypto) {
    phraseOptions(options);
    const words = typeof module !== 'undefined' && module.exports ? require('./words.js') : root.PasswordWords;
    if (!words || words.length !== 7776) throw new Error('A lista de palavras não carregou. Atualize a página.');
    return Array.from({ length: options.wordCount }, () => words[randomIndex(words.length, cryptoProvider)]).join(options.separator);
  }

  function phraseEntropy(options) {
    phraseOptions(options);
    return options.wordCount * Math.log2(7776);
  }

  const api = Object.freeze({ generate, entropy, randomIndex, groupsFor, CHARSETS, symbolsFor, generatePhrase, phraseEntropy });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PasswordGenerator = api;
})(globalThis);
