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

  function groupsFor(options) {
    if (!options || typeof options !== 'object') throw new TypeError('Configuração inválida.');
    if (!Number.isInteger(options.length) || options.length < 8 || options.length > 64) {
      throw new RangeError('Escolha um comprimento inteiro entre 8 e 64.');
    }
    for (const key of [...KEYS, 'excludeSimilar']) {
      if (typeof options[key] !== 'boolean') throw new TypeError('Seleção de caracteres inválida.');
    }
    const groups = KEYS.filter(key => options[key]).map(key =>
      options.excludeSimilar ? CHARSETS[key].replace(SIMILAR, '') : CHARSETS[key]);
    if (groups.length === 0) throw new RangeError('Selecione pelo menos um tipo de caractere.');
    return groups;
  }

  function randomIndex(max, cryptoProvider = root.crypto) {
    if (!Number.isInteger(max) || max < 1 || max > 256) throw new RangeError('Intervalo inválido.');
    if (!cryptoProvider || typeof cryptoProvider.getRandomValues !== 'function') {
      throw new Error('Este navegador não oferece geração segura. Use um navegador atualizado.');
    }
    // Discard the incomplete interval to avoid modulo bias.
    const limit = 256 - (256 % max);
    const bytes = new Uint8Array(1);
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

  const api = Object.freeze({ generate, entropy, randomIndex, groupsFor, CHARSETS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PasswordGenerator = api;
})(globalThis);
