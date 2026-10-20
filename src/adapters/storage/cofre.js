// Contas e cofre local cifrado.
//
// Modelo (o mesmo dos gerenciadores de senha):
//  - cada conta tem uma chave de dados (DEK) AES-GCM-256 aleatória;
//  - a DEK fica guardada "embrulhada" pela senha (PBKDF2-SHA256, 600 mil iterações, sal de 16 bytes) e pelo
//    código de recuperação (160 bits aleatórios). A senha nunca é guardada e não existe hash comparável:
//    senha errada = falha de autenticação do AES-GCM ao desembrulhar a DEK;
//  - cada registro é cifrado com IV próprio e dado associado "conta:chave" (impede trocar registros de lugar);
//  - "manter conectado" guarda a DEK como CryptoKey NÃO extraível no IndexedDB (o JavaScript usa, mas não lê os bytes).
// Limite honesto: protege os dados em repouso neste aparelho (outra pessoa no mesmo navegador não lê o seu
// progresso sem a senha). Não protege contra código malicioso rodando no navegador enquanto a conta está aberta.

const enc = new TextEncoder();
const dec = new TextDecoder();
const subtle = () => globalThis.crypto.subtle;
const aleatorio = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));

export const ITERACOES = 600_000;
const ITER_REC = 210_000;
const VISITANTE = 'visitante';
const P = 'concurso-lab:';
const DIA = 86_400_000;
const LEMBRAR_MS = 30 * DIA;
const ABA_MS = DIA / 2;

export function b64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
}
export const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

// JSON que preserva Uint8Array (bancos SQLite exportados, arquivos binários dos laboratórios).
export const serializar = (v) => JSON.stringify(v, (_, x) => (x instanceof Uint8Array ? { $u8: b64(x) } : x));
export const desserializar = (s) => JSON.parse(s, (_, x) => (x && typeof x === 'object' && !Array.isArray(x) && typeof x.$u8 === 'string' && Object.keys(x).length === 1 ? deB64(x.$u8) : x));

// Código de recuperação: 20 bytes em base32 de Crockford (sem I, L, O, U), em 8 grupos de 4.
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function base32(u8) {
  let bits = 0;
  let valor = 0;
  let s = '';
  for (const b of u8) {
    valor = ((valor << 8) | b) & 0xfff;
    bits += 8;
    while (bits >= 5) { s += B32[(valor >>> (bits - 5)) & 31]; bits -= 5; }
  }
  return bits ? s + B32[(valor << (5 - bits)) & 31] : s;
}
export const novoCodigo = () => base32(aleatorio(20)).match(/.{4}/g).join('-');
export const normalizarCodigo = (c) => String(c ?? '').toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');

const COMUNS = ['senha', 'password', '123456', 'qwerty', 'abc123', 'concurso', 'ufba', 'brasil', 'admin', '111111', 'iloveyou', '123123', 'teste'];
export function forcaSenha(s = '') {
  const motivos = [];
  if (s.length < 8) motivos.push('Use pelo menos 8 caracteres.');
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(s)).length;
  let pontos = Math.min(4, Math.floor(s.length / 4)) + classes - 1;
  if (COMUNS.some((c) => s.toLowerCase().includes(c))) { pontos -= 2; motivos.push('Evite palavras e sequências comuns (senha, 123456, concurso...).'); }
  if (/(.)\1{2,}/.test(s)) { pontos -= 1; motivos.push('Evite repetir o mesmo caractere.'); }
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|qwer|asdf)/i.test(s)) { pontos -= 1; motivos.push('Evite sequências do teclado.'); }
  if (classes < 2) motivos.push('Misture letras com números ou símbolos.');
  const nivel = s.length < 8 ? Math.min(1, Math.max(0, pontos)) : Math.max(0, Math.min(4, pontos));
  return { nivel, rotulo: ['muito fraca', 'fraca', 'razoável', 'boa', 'forte'][nivel], ok: s.length >= 8 && nivel >= 2, motivos };
}

async function derivar(segredo, sal, iteracoes) {
  const base = await subtle().importKey('raw', enc.encode(String(segredo).normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  return subtle().deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteracoes }, base, { name: 'AES-GCM', length: 256 }, false, ['wrapKey', 'unwrapKey']);
}
async function embrulhar(dek, kek) {
  const iv = aleatorio(12);
  return { iv, ct: new Uint8Array(await subtle().wrapKey('raw', dek, kek, { name: 'AES-GCM', iv })) };
}
const desembrulhar = (emb, kek, extraivel = true) => subtle().unwrapKey('raw', emb.ct, kek, { name: 'AES-GCM', iv: emb.iv }, { name: 'AES-GCM', length: 256 }, extraivel, ['encrypt', 'decrypt']);
const novaDek = () => subtle().generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);

// Segredo de autenticação na nuvem: PBKDF2 com sal PRÓPRIO (≠ do que embrulha a chave), então o servidor
// que guarda o hash dele não consegue abrir o cofre.
async function derivarAuth(segredo, sal, iteracoes) {
  const base = await subtle().importKey('raw', enc.encode(String(segredo).normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  return b64(new Uint8Array(await subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteracoes }, base, 256)));
}

// Formato de transporte (JSON/base64) das chaves embrulhadas: backups e nuvem.
const emb = (e) => ({ iv: b64(e.iv), ct: b64(e.ct) });
const deEmb = (e) => ({ iv: deB64(e.iv), ct: deB64(e.ct) });
const cripto = (c) => ({ kdf: { ...c.kdf, sal: b64(c.kdf.sal) }, dekSenha: emb(c.dekSenha), rec: { ...emb(c.rec), sal: b64(c.rec.sal), iteracoes: c.rec.iteracoes } });
const deCripto = (k) => ({
  kdf: { alg: 'PBKDF2-SHA256', iteracoes: Number(k.kdf.iteracoes), sal: deB64(k.kdf.sal) },
  dekSenha: deEmb(k.dekSenha),
  rec: { ...deEmb(k.rec), sal: deB64(k.rec.sal), iteracoes: Number(k.rec.iteracoes) },
});
const paraNuvem = (r) => ({ chave: r.chave, iv: b64(r.iv), ct: b64(r.ct), em: r.em });
const MAX_CT_NUVEM = 1_900_000;

const aad = (dono, chave) => enc.encode(`${dono}:${chave}`);
export async function cifrar(dek, dono, chave, valor, em = Date.now()) {
  const iv = aleatorio(12);
  const ct = await subtle().encrypt({ name: 'AES-GCM', iv, additionalData: aad(dono, chave) }, dek, enc.encode(serializar(valor)));
  return { dono, chave, iv, ct: new Uint8Array(ct), em };
}
export async function decifrar(dek, r) {
  const pt = await subtle().decrypt({ name: 'AES-GCM', iv: r.iv, additionalData: aad(r.dono, r.chave) }, dek, r.ct);
  return desserializar(dec.decode(pt));
}

const CORES = ['#4f46e5', '#0e7490', '#b45309', '#be185d', '#15803d', '#7c3aed', '#c2410c', '#0369a1'];
const corDe = (id) => CORES[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % CORES.length];
const publica = (c) => ({ id: c.id, nome: c.nome, email: c.email ?? '', cor: c.cor, criadaEm: c.criadaEm, ultimoAcesso: c.ultimoAcesso ?? 0, legado: !!c.legado, bloqueadaAte: c.bloqueadaAte ?? 0, acessos: c.acessos ?? [], nuvem: !!c.nuvem });

function minutos(ms) {
  const s = Math.ceil(ms / 1000);
  return s < 60 ? `${s} s` : `${Math.ceil(s / 60)} min`;
}

// Armazenamento de chave-valor do navegador (sessionStorage/localStorage) com falha silenciosa.
const kv = (st) => ({
  ler: (k) => { try { return st?.getItem(P + k) ?? null; } catch { return null; } },
  gravar: (k, v) => { try { st?.setItem(P + k, v); } catch { /* modo privado */ } },
  apagar: (k) => { try { st?.removeItem(P + k); } catch { /* ignora */ } },
});

/**
 * @param {{ armazem: ReturnType<import('./idb.js').armazemMemoria>, aba?: Storage, local?: Storage, agora?: () => number, nuvem?: ReturnType<import('./nuvem.js').criarNuvem> | null }} deps
 *   `nuvem` liga contas acessíveis de qualquer aparelho (login e sincronização cifrada); sem ele tudo fica local.
 */
export function criarGerenciador({ armazem, aba = globalThis.sessionStorage, local = globalThis.localStorage, agora = () => Date.now(), nuvem = null }) {
  const sAba = kv(aba);
  const sLocal = kv(local);

  async function salvarConta(c) { await armazem.gravar('contas', c); }
  function acesso(c, como, ok) { c.acessos = [{ em: agora(), como, ok }, ...(c.acessos ?? [])].slice(0, 20); }
  function verificarBloqueio(c) {
    const resta = (c.bloqueadaAte ?? 0) - agora();
    if (resta > 0) throw new Error(`Muitas tentativas erradas. Tente de novo em ${minutos(resta)}.`);
  }
  async function falhou(c, como, msg) {
    c.falhas = (c.falhas ?? 0) + 1;
    if (c.falhas >= 5) c.bloqueadaAte = agora() + Math.min(15 * 60_000, 30_000 * 2 ** (c.falhas - 5));
    acesso(c, como, false);
    await salvarConta(c);
    const restam = 5 - c.falhas;
    throw new Error(restam > 0 ? `${msg} Restam ${restam} tentativa(s) antes de um bloqueio temporário.` : `${msg} Conta bloqueada por ${minutos(c.bloqueadaAte - agora())}.`);
  }
  async function obterConta(id) {
    const c = await armazem.obter('contas', id);
    if (!c) throw new Error('Conta não encontrada neste aparelho.');
    return c;
  }
  function validarNome(nome) {
    nome = String(nome ?? '').trim().replace(/\s+/g, ' ');
    if (!/^[\p{L}\p{N} ._'-]{2,40}$/u.test(nome)) throw new Error('Nome: de 2 a 40 caracteres (letras, números, espaço, ponto, hífen).');
    return nome;
  }
  function validarSenha(senha) {
    const f = forcaSenha(senha);
    if (!f.ok) throw new Error(`Senha ${f.rotulo}. ${f.motivos[0] ?? 'Misture letras, números e símbolos.'}`);
  }
  async function embrulharRecuperacao(dek) {
    const codigo = novoCodigo();
    const sal = aleatorio(16);
    return { codigo, rec: { sal, iteracoes: ITER_REC, ...(await embrulhar(dek, await derivar(normalizarCodigo(codigo), sal, ITER_REC))) } };
  }
  async function embrulharSenha(dek, senha) {
    const sal = aleatorio(16);
    return { kdf: { alg: 'PBKDF2-SHA256', iteracoes: ITERACOES, sal }, dekSenha: await embrulhar(dek, await derivar(senha, sal, ITERACOES)) };
  }

  // ---- Nuvem (opcional) ----
  const pausa = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const precisaNuvem = () => { if (!nuvem) throw new Error('A nuvem não está configurada neste site.'); };
  const msgNuvem = (e) => (e.rede ? 'Sem conexão com a nuvem. Tente de novo quando estiver online.' : e.message);

  // Envia registros cifrados em lotes pequenos (limite de corpo do servidor). Devolve quantos ficaram de fora por tamanho.
  async function enviarRegistros(token, regs) {
    const cabem = regs.filter((r) => Math.ceil(r.ct.length / 3) * 4 <= MAX_CT_NUVEM);
    let lote = [];
    let bytes = 0;
    const descarregar = async () => { if (lote.length) await nuvem.enviar(token, lote); lote = []; bytes = 0; };
    for (const r of cabem) {
      if (lote.length >= 50 || bytes + r.ct.length > 1_200_000) await descarregar();
      lote.push(paraNuvem(r));
      bytes += r.ct.length;
    }
    await descarregar();
    return regs.length - cabem.length;
  }

  // Compara o índice (chave + data) local e remoto: baixa o que for mais novo lá, envia o que for mais novo aqui.
  async function sincronizar(c) {
    const t = c.nuvem.token;
    const idx = await nuvem.indice(t);
    const locais = new Map((await armazem.doDono(c.id)).map((r) => [r.chave, r]));
    const remoto = new Map(idx.map((x) => [x.chave, x.em]));
    const baixar = idx.filter((x) => (locais.get(x.chave)?.em ?? -1) < x.em).map((x) => x.chave);
    const subir = [...locais.values()].filter((r) => (remoto.get(r.chave) ?? -1) < (r.em ?? 0));
    const novos = [];
    for (let i = 0; i < baixar.length; i += 10) {
      for (const r of await nuvem.buscar(t, baixar.slice(i, i + 10))) novos.push({ dono: c.id, chave: r.chave, ...deEmb(r), em: r.em });
    }
    await armazem.gravarVarios('registros', novos);
    const grandes = await enviarRegistros(t, subir);
    return { novos, baixados: novos.length, enviados: subir.length - grandes, grandes };
  }
  async function tokenExpirou(c, e) {
    if (e.status !== 401 || !c.nuvem) return;
    c.nuvem.token = null;
    await salvarConta(c);
  }
  async function sincronizarEstado(c, estado) {
    try {
      const r = await sincronizar(c);
      Object.assign(estado, { ultimo: agora(), erro: null, grandes: r.grandes });
      return r;
    } catch (e) {
      estado.erro = e.rede ? 'Sem conexão: sincroniza quando voltar a internet.' : e.message;
      await tokenExpirou(c, e);
      return null;
    }
  }
  async function empurrar(c, regs, estado) {
    if (!c.nuvem?.token) return;
    try {
      estado.grandes = await enviarRegistros(c.nuvem.token, regs);
      Object.assign(estado, { ultimo: agora(), erro: null });
    } catch (e) {
      estado.erro = e.rede ? 'Sem conexão: será enviado depois.' : e.message;
      await tokenExpirou(c, e);
    }
  }
  // Cadastra a conta no servidor com a senha e o código de recuperação já definidos.
  async function registrarNuvem(conta, senha, codigo) {
    const authSal = aleatorio(16);
    const recSal = aleatorio(16);
    const r = await nuvem.criar({
      id: conta.id, nome: conta.nome, email: conta.email ?? '', cor: conta.cor, criadaEm: conta.criadaEm,
      authSal: b64(authSal), auth: await derivarAuth(senha, authSal, ITERACOES),
      recSal: b64(recSal), recAuth: await derivarAuth(normalizarCodigo(codigo), recSal, ITER_REC),
      ...cripto(conta),
    });
    conta.nuvem = { token: r.token };
  }
  // Prova a senha ao servidor. Devolve { token, conta } (dados cripto atuais do servidor).
  async function loginNuvem(nome, senha) {
    const salts = await nuvem.salts(nome);
    return nuvem.entrar(nome, await derivarAuth(senha, deB64(salts.authSal), ITERACOES));
  }
  const credencial = async (c, senha) => {
    const { authSal } = await nuvem.salts(c.nome);
    return { nome: c.nome, auth: await derivarAuth(senha, deB64(authSal), ITERACOES) };
  };
  async function novasCredenciais(senha) {
    const authSal = aleatorio(16);
    return { authSal: b64(authSal), auth: await derivarAuth(senha, authSal, ITERACOES) };
  }
  async function novoRecAuth(codigo) {
    const recSal = aleatorio(16);
    return { recSal: b64(recSal), recAuth: await derivarAuth(normalizarCodigo(codigo), recSal, ITER_REC) };
  }

  // Guarda a chave para reabrir a aba (12 h) e, se pedido, o aparelho (30 dias), sempre como chave não extraível.
  async function guardarChave(conta, dek, lembrar) {
    const bruto = new Uint8Array(await subtle().exportKey('raw', dek));
    const fixa = await subtle().importKey('raw', bruto, 'AES-GCM', false, ['encrypt', 'decrypt']);
    bruto.fill(0);
    const token = b64(aleatorio(18));
    await armazem.gravar('sessoes', { id: `${conta.id}:aba:${token}`, conta: conta.id, tipo: 'aba', chave: fixa, expira: agora() + ABA_MS });
    sAba.gravar('sessao', JSON.stringify({ conta: conta.id, token }));
    if (lembrar) await armazem.gravar('sessoes', { id: `${conta.id}:lembrar`, conta: conta.id, tipo: 'lembrar', chave: fixa, expira: agora() + LEMBRAR_MS });
    sLocal.gravar('ultimo', conta.id);
  }
  async function esquecerChaves(contaId) {
    for (const s of await armazem.todos('sessoes')) if (s.conta === contaId) await armazem.apagar('sessoes', s.id);
    const atual = JSON.parse(sAba.ler('sessao') ?? 'null');
    if (atual?.conta === contaId) sAba.apagar('sessao');
  }

  async function abrirSessao(conta, dek, { lembrar = false, guardar = true } = {}) {
    const estado = { ativa: !!(nuvem && conta.nuvem), ultimo: null, erro: null, grandes: 0 };
    if (estado.ativa && conta.nuvem.token) await Promise.race([sincronizarEstado(conta, estado), pausa(6000)]);
    else if (estado.ativa) estado.erro = 'Entre com a senha para sincronizar.';
    let corrompidos = 0;
    const dados = new Map();
    for (const r of await armazem.doDono(conta.id)) {
      try { dados.set(r.chave, await decifrar(dek, r)); } catch { corrompidos++; }
    }
    if (guardar) await guardarChave(conta, dek, lembrar);
    const sessao = criarSessao({ armazem, conta: publica(conta), dek, dados, corrompidos });
    if (estado.ativa) ligarNuvem(sessao, conta, estado);
    return sessao;
  }
  function ligarNuvem(sessao, conta, estado) {
    sessao.nuvem = estado;
    sessao.aoPersistir((regs) => empurrar(conta, regs, estado));
    sessao.sincronizar = async () => {
      if (!conta.nuvem.token) throw new Error('Entre de novo com a senha para sincronizar.');
      const r = await sincronizarEstado(conta, estado);
      if (!r) throw new Error(estado.erro);
      await sessao.aplicar(r.novos);
      return r;
    };
  }

  async function sessaoVisitante() {
    const dados = new Map((await armazem.doDono(VISITANTE)).map((r) => [r.chave, r.valor]));
    sLocal.gravar('ultimo', VISITANTE);
    return criarSessao({ armazem, conta: null, dek: null, dados, corrompidos: 0 });
  }

  async function copiarVisitantePara(sessao) {
    const regs = await armazem.doDono(VISITANTE);
    for (const r of regs) if (sessao.ler(r.chave) == null) sessao.gravar(r.chave, r.valor);
    await sessao.salvarAgora();
    await armazem.apagarDoDono(VISITANTE);
  }

  // Conta da versão 1.0: senha conferida com o hash PBKDF2 antigo; os dados migram para o cofre cifrado.
  async function migrarLegado(c, senha, lembrar) {
    verificarBloqueio(c);
    const base = await subtle().importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: deB64(c.legado.sal), iterations: 600000 }, base, 256));
    const esperado = deB64(c.legado.hash);
    if (bits.length !== esperado.length || bits.reduce((d, x, i) => d | (x ^ esperado[i]), 0) !== 0) return falhou(c, 'senha', 'Senha incorreta.');
    const dek = await novaDek();
    const { codigo, rec } = await embrulharRecuperacao(dek);
    const conta = { ...c, ...(await embrulharSenha(dek, senha)), rec, falhas: 0, bloqueadaAte: 0, ultimoAcesso: agora(), versao: 2 };
    delete conta.legado;
    acesso(conta, 'migração 1.0', true);
    await salvarConta(conta);
    const sessao = await abrirSessao(conta, dek, { lembrar });
    const prefixo = `${P}u:${c.id}:`;
    try {
      for (const k of Object.keys(local ?? {})) {
        if (!k.startsWith(prefixo)) continue;
        const chave = k.slice(prefixo.length);
        try { sessao.gravar(chave, JSON.parse(local.getItem(k))); } catch { /* valor inválido: ignora */ }
        local.removeItem(k);
      }
    } catch { /* sem localStorage */ }
    await sessao.salvarAgora();
    return { sessao, codigo, migrada: true };
  }

  return {
    forcaSenha,

    async listar() {
      return (await armazem.todos('contas')).map(publica).sort((a, b) => b.ultimoAcesso - a.ultimoAcesso || a.nome.localeCompare(b.nome));
    },

    async temDadosVisitante() { return (await armazem.doDono(VISITANTE)).length > 0; },

    ultimo: () => sLocal.ler('ultimo'),

    async criar({ nome, email = '', senha, lembrar = false, levarVisitante = false }) {
      nome = validarNome(nome);
      email = String(email ?? '').trim().toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('E-mail inválido.');
      validarSenha(senha);
      if ((await armazem.todos('contas')).some((c) => c.nome.toLowerCase() === nome.toLowerCase())) throw new Error('Já existe uma conta com esse nome neste aparelho.');
      const dek = await novaDek();
      const { codigo, rec } = await embrulharRecuperacao(dek);
      const id = globalThis.crypto.randomUUID();
      const conta = { id, nome, email, cor: corDe(id), criadaEm: agora(), ultimoAcesso: agora(), ...(await embrulharSenha(dek, senha)), rec, falhas: 0, bloqueadaAte: 0, acessos: [], versao: 2 };
      acesso(conta, 'criação', true);
      let avisoNuvem = null;
      if (nuvem) {
        try { await registrarNuvem(conta, senha, codigo); } catch (e) {
          if (!e.rede) throw e;
          avisoNuvem = 'Sem conexão: a conta foi criada só neste aparelho. Ative a sincronização depois, em Conta e segurança.';
        }
      }
      await salvarConta(conta);
      const sessao = await abrirSessao(conta, dek, { lembrar });
      if (levarVisitante) await copiarVisitantePara(sessao);
      return { sessao, codigo, avisoNuvem };
    },

    nuvemDisponivel: !!nuvem,

    // Entra numa conta que existe na nuvem, mesmo sem cópia local (outro aparelho): baixa as chaves embrulhadas e os dados.
    async entrarNuvem({ nome, senha, lembrar = false }) {
      precisaNuvem();
      nome = String(nome ?? '').trim().replace(/\s+/g, ' ');
      let r;
      try { r = await loginNuvem(nome, senha); } catch (e) {
        if (e.status === 404) throw new Error('Nome ou senha incorretos.');
        throw new Error(msgNuvem(e));
      }
      const k = r.conta;
      const antiga = await armazem.obter('contas', k.id);
      const c = {
        ...antiga, id: k.id, nome: k.nome, email: k.email ?? '', cor: k.cor, criadaEm: k.criadaEm, ultimoAcesso: agora(),
        ...deCripto(k), nuvem: { token: r.token }, falhas: 0, bloqueadaAte: 0, acessos: antiga?.acessos ?? [], versao: 2,
      };
      delete c.legado;
      let dek;
      try { dek = await desembrulhar(c.dekSenha, await derivar(senha, c.kdf.sal, c.kdf.iteracoes)); } catch { throw new Error('Não foi possível abrir os dados desta conta com essa senha.'); }
      acesso(c, 'senha (nuvem)', true);
      await salvarConta(c);
      return { sessao: await abrirSessao(c, dek, { lembrar }) };
    },

    // Liga uma conta que só existia neste aparelho à nuvem. Gera um NOVO código de recuperação (o antigo não é conhecido).
    async ativarNuvem(sessao, senha) {
      precisaNuvem();
      const c = await obterConta(sessao.conta.id);
      let dek;
      try { dek = await desembrulhar(c.dekSenha, await derivar(senha, c.kdf.sal, c.kdf.iteracoes)); } catch { throw new Error('Senha incorreta.'); }
      const { codigo, rec } = await embrulharRecuperacao(dek);
      c.rec = rec;
      try { await registrarNuvem(c, senha, codigo); } catch (e) { throw new Error(msgNuvem(e)); }
      acesso(c, 'nuvem ativada', true);
      await salvarConta(c);
      sessao.conta.nuvem = true;
      const estado = { ativa: true, ultimo: null, erro: null, grandes: 0 };
      await sincronizarEstado(c, estado);
      ligarNuvem(sessao, c, estado);
      return { codigo };
    },

    async entrar(id, senha, { lembrar = false } = {}) {
      const c = await obterConta(id);
      if (c.legado) return migrarLegado(c, senha, lembrar);
      verificarBloqueio(c);
      if (c.nuvem && nuvem) {
        // O servidor é a referência da senha: se ela mudou em outro aparelho, a nova vale aqui também.
        try {
          const r = await loginNuvem(c.nome, senha);
          Object.assign(c, deCripto(r.conta), { nuvem: { token: r.token } });
        } catch (e) {
          if (e.status === 401) return falhou(c, 'senha', 'Senha incorreta.');
          if (e.status === 429) throw new Error(e.message);
          // sem conexão ou conta ausente no servidor: segue só com a verificação local
        }
      }
      let dek;
      try { dek = await desembrulhar(c.dekSenha, await derivar(senha, c.kdf.sal, c.kdf.iteracoes)); } catch { return falhou(c, 'senha', 'Senha incorreta.'); }
      c.falhas = 0;
      c.bloqueadaAte = 0;
      c.ultimoAcesso = agora();
      acesso(c, 'senha', true);
      await salvarConta(c);
      return { sessao: await abrirSessao(c, dek, { lembrar }) };
    },

    async recuperar(id, codigo, novaSenha, { lembrar = false } = {}) {
      const c = await obterConta(id);
      if (c.legado) throw new Error('Contas da versão 1.0 não têm código de recuperação. Entre com a senha antiga.');
      verificarBloqueio(c);
      let dek;
      try { dek = await desembrulhar(c.rec, await derivar(normalizarCodigo(codigo), c.rec.sal, c.rec.iteracoes)); } catch { return falhou(c, 'recuperação', 'Código de recuperação incorreto.'); }
      validarSenha(novaSenha);
      const nova = await embrulharRecuperacao(dek);
      const novoCripto = await embrulharSenha(dek, novaSenha);
      if (c.nuvem && nuvem) {
        // A nuvem precisa saber da nova senha, senão outros aparelhos ficariam presos na antiga.
        try {
          const { recSal } = await nuvem.salts(c.nome);
          const r = await nuvem.recuperar({
            nome: c.nome, recAuth: await derivarAuth(normalizarCodigo(codigo), deB64(recSal), ITER_REC),
            novo: { ...(await novasCredenciais(novaSenha)), ...(await novoRecAuth(nova.codigo)), ...cripto({ ...novoCripto, rec: nova.rec }) },
          });
          c.nuvem = { token: r.token };
        } catch (e) { throw new Error(e.status === 401 ? 'Código de recuperação incorreto.' : msgNuvem(e)); }
      }
      Object.assign(c, novoCripto, { rec: nova.rec, falhas: 0, bloqueadaAte: 0, ultimoAcesso: agora() });
      acesso(c, 'recuperação', true);
      await salvarConta(c);
      await esquecerChaves(c.id);
      return { sessao: await abrirSessao(c, dek, { lembrar }), codigo: nova.codigo };
    },

    // Reabre a conta sem senha se esta aba já estava autenticada ou se o aparelho foi lembrado.
    async retomar() {
      const agoraMs = agora();
      const sessoes = await armazem.todos('sessoes');
      for (const s of sessoes) if (s.expira < agoraMs) await armazem.apagar('sessoes', s.id);
      const vivas = sessoes.filter((s) => s.expira >= agoraMs);
      const daAba = JSON.parse(sAba.ler('sessao') ?? 'null');
      let alvo = daAba && vivas.find((s) => s.id === `${daAba.conta}:aba:${daAba.token}`);
      if (!alvo) {
        const ultimo = sLocal.ler('ultimo');
        if (ultimo === VISITANTE) return sessaoVisitante();
        alvo = vivas.find((s) => s.tipo === 'lembrar' && s.conta === ultimo) ?? vivas.find((s) => s.tipo === 'lembrar');
      }
      if (!alvo) return null;
      const c = await armazem.obter('contas', alvo.conta);
      if (!c) { await armazem.apagar('sessoes', alvo.id); return null; }
      c.ultimoAcesso = agoraMs;
      if (alvo.tipo === 'lembrar') acesso(c, 'aparelho lembrado', true);
      await salvarConta(c);
      const precisaAba = alvo.tipo === 'lembrar' && !daAba;
      const sessao = await abrirSessao(c, alvo.chave, { guardar: false });
      if (precisaAba) {
        const token = b64(aleatorio(18));
        await armazem.gravar('sessoes', { id: `${c.id}:aba:${token}`, conta: c.id, tipo: 'aba', chave: alvo.chave, expira: agoraMs + ABA_MS });
        sAba.gravar('sessao', JSON.stringify({ conta: c.id, token }));
      }
      return sessao;
    },

    visitante: sessaoVisitante,

    // Bloquear e sair esquecem a chave (inclusive "manter conectado"): só a senha reabre.
    async sair(sessao) {
      await sessao?.salvarAgora();
      if (sessao?.conta) {
        await esquecerChaves(sessao.conta.id);
        const c = nuvem && await armazem.obter('contas', sessao.conta.id);
        if (c?.nuvem?.token) {
          nuvem.sair(c.nuvem.token).catch(() => {});
          c.nuvem.token = null;
          await salvarConta(c);
        }
      }
      sLocal.apagar('ultimo');
      sessao?.fechar();
    },

    async trocarSenha(sessao, atual, nova) {
      const c = await obterConta(sessao.conta.id);
      let dek;
      try { dek = await desembrulhar(c.dekSenha, await derivar(atual, c.kdf.sal, c.kdf.iteracoes)); } catch { throw new Error('Senha atual incorreta.'); }
      validarSenha(nova);
      const novoCripto = await embrulharSenha(dek, nova);
      if (c.nuvem && nuvem) {
        try {
          const r = await nuvem.senha({ ...(await credencial(c, atual)), novo: { ...(await novasCredenciais(nova)), ...cripto({ ...novoCripto, rec: c.rec }) } });
          c.nuvem = { token: r.token };
        } catch (e) { throw new Error(e.status === 401 ? 'Senha atual incorreta.' : msgNuvem(e)); }
      }
      Object.assign(c, novoCripto);
      acesso(c, 'troca de senha', true);
      await salvarConta(c);
    },

    async novoCodigoRecuperacao(sessao, senha) {
      const c = await obterConta(sessao.conta.id);
      let dek;
      try { dek = await desembrulhar(c.dekSenha, await derivar(senha, c.kdf.sal, c.kdf.iteracoes)); } catch { throw new Error('Senha incorreta.'); }
      const { codigo, rec } = await embrulharRecuperacao(dek);
      if (c.nuvem && nuvem) {
        try { await nuvem.codigo({ ...(await credencial(c, senha)), ...(await novoRecAuth(codigo)), rec: cripto({ ...c, rec }).rec }); } catch (e) { throw new Error(e.status === 401 ? 'Senha incorreta.' : msgNuvem(e)); }
      }
      c.rec = rec;
      acesso(c, 'novo código de recuperação', true);
      await salvarConta(c);
      return codigo;
    },

    async atualizarPerfil(sessao, { nome, email }) {
      const c = await obterConta(sessao.conta.id);
      if (nome != null) {
        nome = validarNome(nome);
        if ((await armazem.todos('contas')).some((x) => x.id !== c.id && x.nome.toLowerCase() === nome.toLowerCase())) throw new Error('Já existe uma conta com esse nome neste aparelho.');
      }
      if (email != null) {
        email = String(email).trim().toLowerCase();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('E-mail inválido.');
      }
      // O nome é a chave de login na nuvem: renomear lá primeiro (o servidor recusa nomes já usados).
      if (c.nuvem?.token && nuvem) {
        try { await nuvem.perfil(c.nuvem.token, { nome, email }); } catch (e) { await tokenExpirou(c, e); throw new Error(msgNuvem(e)); }
      }
      if (nome != null) c.nome = nome;
      if (email != null) c.email = email;
      await salvarConta(c);
      Object.assign(sessao.conta, publica(c));
    },

    async excluir(id, senha) {
      const c = await obterConta(id);
      if (!c.legado) {
        try { await desembrulhar(c.dekSenha, await derivar(senha, c.kdf.sal, c.kdf.iteracoes)); } catch { throw new Error('Senha incorreta.'); }
      }
      if (c.nuvem && nuvem) {
        try { await nuvem.excluir(await credencial(c, senha)); } catch (e) { if (e.status !== 404) throw new Error(e.status === 401 ? 'Senha incorreta.' : msgNuvem(e)); }
      }
      await armazem.apagarDoDono(id);
      await esquecerChaves(id);
      await armazem.apagar('contas', id);
      if (sLocal.ler('ultimo') === id) sLocal.apagar('ultimo');
    },

    async apagarVisitante() { await armazem.apagarDoDono(VISITANTE); },
    levarVisitantePara: copiarVisitantePara,

    // Backup portátil: continua cifrado; abre em outro aparelho com a mesma senha (ou o código de recuperação).
    async exportar(sessao) {
      await sessao.salvarAgora();
      if (!sessao.conta) {
        return { app: 'concurso-lab', tipo: 'visitante', versao: 2, criadoEm: new Date(agora()).toISOString(), registros: (await armazem.doDono(VISITANTE)).map((r) => ({ chave: r.chave, valor: r.valor })) };
      }
      const c = await obterConta(sessao.conta.id);
      return {
        app: 'concurso-lab', tipo: 'backup-cifrado', versao: 2, criadoEm: new Date(agora()).toISOString(),
        conta: { id: c.id, nome: c.nome, email: c.email, cor: c.cor, criadaEm: c.criadaEm, ...cripto(c) },
        registros: (await armazem.doDono(c.id)).map((r) => ({ chave: r.chave, iv: b64(r.iv), ct: b64(r.ct), em: r.em })),
      };
    },

    // Importa um backup cifrado (sem precisar da senha) ou dados de visitante. Mescla pelo registro mais recente.
    async importar(texto) {
      let d;
      try { d = typeof texto === 'string' ? JSON.parse(texto) : texto; } catch { throw new Error('Arquivo inválido: não é JSON.'); }
      if (d?.app !== 'concurso-lab') throw new Error('Arquivo não reconhecido como backup do Concurso Lab.');
      if (d.tipo === 'visitante') {
        const atuais = new Set((await armazem.doDono(VISITANTE)).map((r) => r.chave));
        await armazem.gravarVarios('registros', d.registros.filter((r) => !atuais.has(r.chave)).map((r) => ({ dono: VISITANTE, chave: String(r.chave), valor: r.valor, em: agora() })));
        return { tipo: 'visitante', nome: 'Visitante' };
      }
      if (d.tipo !== 'backup-cifrado' || !d.conta?.id || !Array.isArray(d.registros)) throw new Error('Backup incompleto ou corrompido.');
      const k = d.conta;
      if (!/^[\w-]{8,64}$/.test(k.id)) throw new Error('Identificador de conta inválido.');
      const existente = await armazem.obter('contas', k.id);
      if (!existente) {
        let nome = validarNome(k.nome);
        const nomes = new Set((await armazem.todos('contas')).map((c) => c.nome.toLowerCase()));
        if (nomes.has(nome.toLowerCase())) nome = validarNome(`${nome.slice(0, 28)} (importada)`);
        await salvarConta({
          id: k.id, nome, email: k.email ?? '', cor: k.cor ?? corDe(k.id), criadaEm: k.criadaEm ?? agora(), ultimoAcesso: 0,
          ...deCripto(k), falhas: 0, bloqueadaAte: 0, acessos: [], versao: 2,
        });
      }
      const locais = new Map((await armazem.doDono(k.id)).map((r) => [r.chave, r]));
      const novos = d.registros
        .filter((r) => !locais.has(r.chave) || (locais.get(r.chave).em ?? 0) < (r.em ?? 0))
        .map((r) => ({ dono: k.id, chave: String(r.chave), iv: deB64(r.iv), ct: deB64(r.ct), em: Number(r.em) || agora() }));
      await armazem.gravarVarios('registros', novos);
      return { tipo: 'conta', nome: existente?.nome ?? k.nome, id: k.id, registros: novos.length };
    },
  };
}

// Sessão aberta: leitura síncrona (cache decifrado em memória) e gravação assíncrona, cifrada e agrupada.
export function criarSessao({ armazem, conta, dek, dados, corrompidos = 0 }) {
  const dono = conta?.id ?? VISITANTE;
  const sujos = new Set();
  const ouvintes = new Set();
  let timer = null;
  let gravando = Promise.resolve();
  let fechada = false;

  async function persistir() {
    clearTimeout(timer);
    timer = null;
    const lote = [...sujos];
    sujos.clear();
    const gravar = [];
    for (const chave of lote) {
      if (!dados.has(chave)) { await armazem.apagar('registros', [dono, chave]); continue; }
      const valor = dados.get(chave);
      gravar.push(dek ? await cifrar(dek, dono, chave, valor) : { dono, chave, valor, em: Date.now() });
    }
    if (gravar.length) await armazem.gravarVarios('registros', gravar);
    return gravar;
  }
  const agendar = () => { if (!timer && !fechada) timer = setTimeout(() => { gravando = gravando.then(persistir).then((g) => ouvintes.forEach((f) => f(g))).catch((e) => console.error('Falha ao salvar', e)); }, 400); };
  const copia = (v) => (v == null ? null : structuredClone(v));

  return {
    conta,
    visitante: !conta,
    corrompidos,
    ler: (chave) => copia(dados.get(chave)),
    gravar(chave, valor) {
      if (fechada) return;
      dados.set(chave, copia(valor));
      sujos.add(chave);
      agendar();
    },
    apagar(chave) {
      if (fechada) return;
      dados.delete(chave);
      sujos.add(chave);
      agendar();
    },
    chaves: (prefixo = '') => [...dados.keys()].filter((k) => k.startsWith(prefixo)),
    async salvarAgora() {
      if (!sujos.size) return gravando;
      gravando = gravando.then(persistir).then((g) => ouvintes.forEach((f) => f(g)));
      return gravando;
    },
    aoPersistir(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); },
    // Aplica registros cifrados vindos de outro aparelho (a edição local ainda não gravada tem prioridade).
    async aplicar(regs) {
      let n = 0;
      for (const r of regs) {
        if (fechada || sujos.has(r.chave)) continue;
        try { dados.set(r.chave, await decifrar(dek, r)); n++; } catch { /* registro de outra chave: ignora */ }
      }
      return n;
    },
    fechar() { fechada = true; clearTimeout(timer); sujos.clear(); dados.clear(); },
  };
}

// Primeira execução da 2.0: leva os dados da 1.0 (localStorage) para o novo armazenamento.
export async function migrarV1({ armazem, local = globalThis.localStorage }) {
  try {
    if (!local || local.getItem(`${P}v2-migrado`)) return { migrou: false };
  } catch { return { migrou: false }; }
  const ler = (k) => { try { return JSON.parse(local.getItem(P + k)); } catch { return null; } };
  const registros = [];
  const apagar = [];
  for (const k of Object.keys(local)) {
    if (!k.startsWith(P) || k.startsWith(`${P}u:`)) continue;
    const chave = k.slice(P.length);
    if (chave === 'progresso' || chave.startsWith('lab:')) {
      const valor = ler(chave);
      if (valor != null) registros.push({ dono: VISITANTE, chave, valor, em: Date.now() });
      apagar.push(k);
    }
    if (['contas', 'sessao', 'lembrar'].includes(chave)) apagar.push(k);
  }
  const atuais = new Set((await armazem.doDono(VISITANTE)).map((r) => r.chave));
  await armazem.gravarVarios('registros', registros.filter((r) => !atuais.has(r.chave)));
  const contas = ler('contas') ?? [];
  for (const c of contas) {
    if (!c?.id || !c.sal || !c.hash || (await armazem.obter('contas', c.id))) continue;
    await armazem.gravar('contas', { id: c.id, nome: String(c.nome).slice(0, 40), email: '', cor: corDe(c.id), criadaEm: Date.parse(c.criadaEm) || Date.now(), ultimoAcesso: 0, legado: { sal: c.sal, hash: c.hash }, falhas: 0, bloqueadaAte: 0, acessos: [], versao: 1 });
  }
  apagar.forEach((k) => local.removeItem(k));
  local.setItem(`${P}v2-migrado`, '1');
  return { migrou: registros.length > 0 || contas.length > 0, visitante: registros.length, contas: contas.length };
}
