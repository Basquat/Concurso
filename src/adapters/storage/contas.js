// Contas LOCAIS deste navegador (sem servidor). Senhas viram hash PBKDF2-SHA256 (600 mil iterações, sal aleatório)
// pela Web Crypto API. Protege contra uso casual no mesmo aparelho; NÃO é autenticação remota: quem controla o
// navegador pode apagar ou editar o localStorage. Plano e papel são demonstrativos e não liberam nada de forma segura.
import { preferencias, PREFIXO, perfil } from './local.js';

export const PLANOS = {
  gratuito: { nome: 'Gratuito', recursos: ['Questões', 'Simulados', 'Aulas', 'Todos os laboratórios'] },
  completo_gratuito: { nome: 'Completo (concedido gratuitamente)', recursos: ['Tudo do gratuito', 'Recursos futuros que dependam de servidor'] },
  completo_pago: { nome: 'Completo (pago)', recursos: ['Tudo do completo', 'Sincronização entre aparelhos (exige backend autorizado)'] },
};
export const PAPEIS = { estudante: 'Estudante', administrador: 'Administrador local' };

const b64 = (u8) => btoa(String.fromCharCode(...u8));
const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function derivar(senha, sal) {
  const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: 600000 }, chave, 256));
}
const iguais = (a, b) => a.length === b.length && a.reduce((d, x, i) => d | (x ^ b[i]), 0) === 0;

export const listar = () => preferencias.ler('contas') ?? [];
const salvarTodas = (l) => preferencias.gravar('contas', l);
export const atual = () => listar().find((c) => c.id === perfil()) ?? null;

export function validarSenha(s) {
  if (s.length < 8) return 'A senha precisa de pelo menos 8 caracteres.';
  if (!/[A-Za-z]/.test(s) || !/\d/.test(s)) return 'Use letras e números.';
  return null;
}

export async function criar({ nome, senha }) {
  nome = String(nome).trim();
  if (!/^[\p{L}\d ._-]{3,30}$/u.test(nome)) throw new Error('Nome: 3 a 30 caracteres (letras, números, espaço, ponto, hífen).');
  const l = listar();
  if (l.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) throw new Error('Já existe uma conta com esse nome neste navegador.');
  const erro = validarSenha(senha); if (erro) throw new Error(erro);
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const conta = { id: crypto.randomUUID(), nome, sal: b64(sal), hash: b64(await derivar(senha, sal)), papel: l.length ? 'estudante' : 'administrador', plano: 'gratuito', criadaEm: new Date().toISOString(), falhas: 0, bloqueadaAte: 0 };
  salvarTodas([...l, conta]);
  return conta;
}

export async function entrar(nome, senha, lembrar) {
  const l = listar();
  const c = l.find((x) => x.nome.toLowerCase() === String(nome).trim().toLowerCase());
  if (!c) throw new Error('Nome ou senha incorretos.');
  if (Date.now() < c.bloqueadaAte) throw new Error(`Muitas tentativas. Aguarde ${Math.ceil((c.bloqueadaAte - Date.now()) / 1000)} s.`);
  const ok = iguais(await derivar(senha, deB64(c.sal)), deB64(c.hash));
  c.falhas = ok ? 0 : c.falhas + 1;
  if (c.falhas >= 5) { c.bloqueadaAte = Date.now() + 60000; c.falhas = 0; }
  salvarTodas(l);
  if (!ok) throw new Error('Nome ou senha incorretos.');
  sessionStorage.setItem(PREFIXO + 'sessao', c.id);
  if (lembrar) localStorage.setItem(PREFIXO + 'lembrar', c.id); else localStorage.removeItem(PREFIXO + 'lembrar');
  return c;
}

export function sair() { sessionStorage.removeItem(PREFIXO + 'sessao'); localStorage.removeItem(PREFIXO + 'lembrar'); }

export async function trocarSenha(atualSenha, nova) {
  const c = atual(); if (!c) throw new Error('Entre na conta primeiro.');
  if (!iguais(await derivar(atualSenha, deB64(c.sal)), deB64(c.hash))) throw new Error('Senha atual incorreta.');
  const erro = validarSenha(nova); if (erro) throw new Error(erro);
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const hash = b64(await derivar(nova, sal));
  salvarTodas(listar().map((x) => (x.id === c.id ? { ...x, sal: b64(sal), hash } : x)));
}

export function excluir(id) {
  salvarTodas(listar().filter((c) => c.id !== id));
  Object.keys(localStorage).filter((k) => k.startsWith(`${PREFIXO}u:${id}:`)).forEach((k) => localStorage.removeItem(k));
  if (perfil() === id) sair();
}

// Administrador local pode alterar plano/papel de perfis DESTE navegador (demonstração, sem valor de segurança).
export function definir(id, campos) {
  const a = atual();
  if (a?.papel !== 'administrador') throw new Error('Apenas o administrador local pode alterar planos e papéis.');
  salvarTodas(listar().map((c) => (c.id === id ? { ...c, ...campos } : c)));
}
