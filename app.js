'use strict';
const $ = id => document.getElementById(id);
const password = $('password');
const status = $('result-note');
const copy = $('copy');
const length = $('length');
const lengthNumber = $('length-number');
const keys = ['uppercase', 'lowercase', 'numbers', 'symbols'];
let revision = 0;

function options() {
  return { length: Number(length.value), ...Object.fromEntries(keys.map(key => [key, $(key).checked])), excludeSimilar: $('exclude-similar').checked };
}

function regenerate(announce = true) {
  revision++;
  copy.querySelector('span').textContent = 'Copiar senha';
  try {
    const config = options();
    password.value = PasswordGenerator.generate(config);
    copy.disabled = false;
    const bits = Math.floor(PasswordGenerator.entropy(config));
    $('entropy').textContent = `${bits} bits de entropia estimada`;
    $('character-count').textContent = `${config.length} caracteres`;
    status.textContent = announce ? 'Nova senha gerada. Pronta para copiar.' : 'Pronta para usar. Copie e guarde em um gerenciador de senhas.';
    status.classList.remove('error');
  } catch (error) {
    password.value = '';
    copy.disabled = true;
    $('entropy').textContent = 'Nenhuma senha gerada';
    status.textContent = error.message;
    status.classList.add('error');
  }
}

length.addEventListener('input', () => {
  lengthNumber.value = length.value;
  lengthNumber.setCustomValidity('');
  regenerate();
});
lengthNumber.addEventListener('input', () => {
  const value = Number(lengthNumber.value);
  if (!Number.isInteger(value) || value < 8 || value > 64 || !lengthNumber.value) {
    lengthNumber.setCustomValidity('Use um número inteiro entre 8 e 64.');
    status.textContent = 'Use um comprimento inteiro entre 8 e 64.';
    status.classList.add('error');
    password.value = '';
    copy.disabled = true;
    $('entropy').textContent = 'Comprimento inválido';
    revision++;
    return;
  }
  lengthNumber.setCustomValidity('');
  length.value = String(value);
  regenerate();
});
for (const id of [...keys, 'exclude-similar']) $(id).addEventListener('change', () => {
  // Commit the last valid slider length when a partially edited number is invalid.
  lengthNumber.value = length.value;
  lengthNumber.setCustomValidity('');
  regenerate();
});
$('generate').addEventListener('click', () => {
  lengthNumber.value = length.value;
  lengthNumber.setCustomValidity('');
  regenerate();
});
$('visibility').addEventListener('click', () => {
  const hidden = password.type === 'text';
  password.type = hidden ? 'password' : 'text';
  $('visibility').textContent = hidden ? 'Mostrar' : 'Ocultar';
  $('visibility').setAttribute('aria-pressed', String(hidden));
});
copy.addEventListener('click', async () => {
  if (!password.value) return;
  const copiedRevision = revision;
  const value = password.value;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(value);
    if (revision !== copiedRevision) return;
    copy.querySelector('span').textContent = 'Copiada!';
    status.textContent = 'Senha copiada. O conteúdo fica na área de transferência do dispositivo.';
    status.classList.remove('error');
  } catch {
    if (revision !== copiedRevision) return;
    password.type = 'text';
    $('visibility').textContent = 'Ocultar';
    $('visibility').setAttribute('aria-pressed', 'false');
    password.focus();
    password.select();
    status.textContent = 'Cópia automática indisponível. A senha foi selecionada: use Ctrl+C, ⌘C ou o menu Copiar.';
  }
});
$('theme').addEventListener('click', () => {
  const dark = !document.documentElement.classList.contains('dark');
  document.documentElement.classList.toggle('dark', dark);
  $('theme').setAttribute('aria-pressed', String(dark));
  $('theme').querySelector('span').textContent = dark ? 'Tema claro' : 'Tema escuro';
});
if (window.matchMedia('(prefers-color-scheme: dark)').matches) $('theme').click();
regenerate(false);
