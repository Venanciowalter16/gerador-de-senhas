'use strict';
const $ = id => document.getElementById(id);
const password = $('password');
const status = $('result-note');
const copy = $('copy');
const length = $('length');
const lengthNumber = $('length-number');
const keys = ['uppercase', 'lowercase', 'numbers', 'symbols'];
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const stored = PasswordPreferences.read(storage);
let state = stored.values;
let revision = 0;
let currentPassword = '';
let hidden = false;
const profiles = {
  standard: { length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true },
  'no-symbols': { length: 20, uppercase: true, lowercase: true, numbers: true, symbols: false },
  numbers: { length: 12, uppercase: false, lowercase: false, numbers: true, symbols: false },
  long: { length: 32, uppercase: true, lowercase: true, numbers: true, symbols: true }
};
function options() {
  return { ...state, length: Number(length.value), ...Object.fromEntries(keys.map(key => [key, $(key).checked])), excludeSimilar: $('exclude-similar').checked, allowedSymbols: $('allowed-symbols').value, wordCount: Number($('word-count').value), separator: $('separator').value, remember: $('remember').checked };
}
function persist() {
  state = options();
  const ok = state.remember ? PasswordPreferences.save(storage, state) : PasswordPreferences.clear(storage);
  $('preference-status').textContent = ok ? (state.remember ? 'Preferências salvas.' : 'Preferências desativadas.') : 'Armazenamento bloqueado. Os ajustes valem só nesta sessão.';
}
function renderPassword() {
  password.value = hidden ? '•'.repeat(currentPassword.length) : currentPassword;
  $('visibility').textContent = hidden ? 'Mostrar' : 'Ocultar';
  $('visibility').setAttribute('aria-pressed', String(hidden));
}
function fail(message) {
  revision++;
  currentPassword = '';
  renderPassword();
  copy.disabled = true;
  copy.querySelector('span').textContent = 'Copiar senha';
  $('entropy').textContent = 'Nenhuma senha gerada';
  $('character-count').textContent = '—';
  status.textContent = message;
  status.classList.remove('sr-only');
  status.classList.add('error');
}
function regenerate(announce = true) {
  revision++;
  copy.querySelector('span').textContent = 'Copiar senha';
  try {
    const config = options();
    const words = state.mode === 'words';
    currentPassword = words ? PasswordGenerator.generatePhrase(config) : PasswordGenerator.generate(config);
    renderPassword();
    copy.disabled = false;
    const bits = Math.floor(words ? PasswordGenerator.phraseEntropy(config) : PasswordGenerator.entropy(config));
    $('entropy').textContent = `${bits} bits de entropia estimada`;
    $('character-count').textContent = `${currentPassword.length} caracteres`;
    status.textContent = announce ? 'Nova senha gerada.' : '';
    status.classList.add('sr-only');
    status.classList.remove('error');
  } catch (error) { fail(error.message); }
}
function renderMode() {
  const words = state.mode === 'words';
  $('character-settings').hidden = words;
  $('word-settings').hidden = !words;
  $('mode-characters').setAttribute('aria-pressed', String(!words));
  $('mode-words').setAttribute('aria-pressed', String(words));
  $('allowed-symbols').disabled = words || !$('symbols').checked;
  $('reset-symbols').disabled = words || !$('symbols').checked;
}
function renderTheme() {
  const dark = state.theme === 'dark' || (state.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  $('theme').setAttribute('aria-pressed', String(dark));
  $('theme').querySelector('span').textContent = dark ? 'Tema claro' : 'Tema escuro';
}
function changed(custom = true) {
  lengthNumber.value = length.value;
  lengthNumber.setCustomValidity('');
  if (custom) $('profile').value = 'custom';
  renderMode();
  regenerate();
  persist();
}
length.addEventListener('input', () => changed());
lengthNumber.addEventListener('input', () => {
  const value = Number(lengthNumber.value);
  if (!Number.isInteger(value) || value < 8 || value > 64 || !lengthNumber.value) {
    lengthNumber.setCustomValidity('Use um número inteiro entre 8 e 64.');
    fail('Use um comprimento inteiro entre 8 e 64.');
    return;
  }
  length.value = String(value);
  changed();
});
for (const id of [...keys, 'exclude-similar', 'word-count', 'separator']) $(id).addEventListener('change', () => changed());
$('allowed-symbols').addEventListener('input', () => changed());
$('reset-symbols').addEventListener('click', () => {
  $('allowed-symbols').value = PasswordGenerator.CHARSETS.symbols;
  changed();
});
$('profile').addEventListener('change', () => {
  const profile = profiles[$('profile').value];
  if (!profile) return;
  length.value = profile.length;
  for (const key of keys) $(key).checked = profile[key];
  $('exclude-similar').checked = $('profile').value !== 'numbers';
  if (profile.symbols && !$('allowed-symbols').value) $('allowed-symbols').value = PasswordGenerator.CHARSETS.symbols;
  changed(false);
});
for (const mode of ['characters', 'words']) $(`mode-${mode}`).addEventListener('click', () => {
  state.mode = mode;
  changed(false);
});
$('generate').addEventListener('click', () => changed(false));
$('visibility').addEventListener('click', () => { hidden = !hidden; renderPassword(); });
$('remember').addEventListener('change', persist);
$('theme').addEventListener('click', () => {
  state.theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  renderTheme();
  persist();
});
copy.addEventListener('click', async () => {
  if (!currentPassword) return;
  const copiedRevision = revision;
  const value = currentPassword;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(value);
    if (revision !== copiedRevision) return;
    copy.querySelector('span').textContent = 'Copiada!';
    status.textContent = 'Copiada para a área de transferência.';
    status.classList.remove('sr-only');
    status.classList.remove('error');
  } catch {
    if (revision !== copiedRevision) return;
    hidden = false;
    renderPassword();
    password.focus();
    password.select();
    status.textContent = 'Cópia automática indisponível. A senha foi selecionada: use Ctrl+C, ⌘C ou o menu Copiar.';
    status.classList.remove('sr-only');
  }
});
length.value = state.length;
lengthNumber.value = state.length;
for (const key of keys) $(key).checked = state[key];
$('exclude-similar').checked = state.excludeSimilar;
$('allowed-symbols').value = state.allowedSymbols;
$('allowed-symbols').maxLength = PasswordGenerator.CHARSETS.symbols.length;
$('symbol-list').textContent = PasswordGenerator.CHARSETS.symbols;
$('word-count').value = state.wordCount;
$('separator').value = state.separator;
$('remember').checked = state.remember;
$('profile').value = Object.keys(profiles).find(name => profiles[name].length === state.length && keys.every(key => profiles[name][key] === state[key]) && state.excludeSimilar === (name !== 'numbers')) || 'custom';
$('preference-status').textContent = stored.available ? (state.remember ? 'Os ajustes serão lembrados neste navegador.' : 'Preferências desativadas.') : 'Armazenamento indisponível. Os ajustes valem só nesta sessão.';
renderMode();
renderTheme();
regenerate(false);
