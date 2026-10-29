// Criptografia para o laboratório: cifra de César (histórica), Base64 com UTF-8, e AES-GCM/SHA com a Web Crypto API
// real (disponível no navegador e no Node 20+). Material didático: não use para proteger dados reais.

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function cesar(texto, k) {
  const d = ((k % 26) + 26) % 26;
  return [...String(texto)].map((c) => {
    const up = c.toUpperCase();
    const i = A.indexOf(up);
    if (i < 0) return c;
    const n = A[(i + d) % 26];
    return c === up ? n : n.toLowerCase();
  }).join('');
}

const bytesB64 = (bytes) => btoa(String.fromCharCode(...bytes));
const b64Bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
export const paraBase64 = (texto) => bytesB64(new TextEncoder().encode(texto));
export const deBase64 = (b64) => new TextDecoder('utf-8', { fatal: true }).decode(b64Bytes(String(b64).trim()));

export const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
export const resumo = async (alg, texto) => hex(await crypto.subtle.digest(alg, new TextEncoder().encode(texto)));

// Quantos bits diferem entre dois resumos em hexadecimal (efeito avalanche).
export function bitsDiferentes(h1, h2) {
  let n = 0;
  for (let i = 0; i < Math.min(h1.length, h2.length); i++) n += (parseInt(h1[i], 16) ^ parseInt(h2[i], 16)).toString(2).replace(/0/g, '').length;
  return n;
}
// Dois textos diferem em exatamente um caractere (mesma posição)?
export const umCaractere = (a, b) => a.length === b.length && [...a].filter((c, i) => c !== b[i]).length === 1;

async function chave(senha, sal) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: sal, iterations: 100000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
// Pacote = Base64(sal 16 bytes | IV 12 bytes | texto cifrado + tag).
export async function cifrar(texto, senha) {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const c = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await chave(senha, sal), new TextEncoder().encode(texto)));
  return bytesB64(new Uint8Array([...sal, ...iv, ...c]));
}
export async function decifrar(pacote, senha) {
  const b = b64Bytes(String(pacote).trim());
  const p = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(16, 28) }, await chave(senha, b.slice(0, 16)), b.slice(28));
  return new TextDecoder().decode(p);
}

export const SEGREDOS = { base64: 'QXByb3ZhZG8gbm8gY29uY3Vyc28h', cesar: { texto: 'Frqfxuvr Ode', k: 3 } };
