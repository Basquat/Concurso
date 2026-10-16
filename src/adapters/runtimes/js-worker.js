// Executor JavaScript/TypeScript isolado (Web Worker clássico): módulos CommonJS do projeto, mini Express,
// mini Jest (describe/it/expect) e saída em tempo real. Não tem acesso à página nem aos dados da conta.
/* eslint-disable no-restricted-globals */
const BABEL = 'https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js';
let arquivos = {};
let cache = {};
let app = null;
const enviar = (m) => self.postMessage(m);

function fmt(v, prof = 0) {
  if (typeof v === 'string') return prof ? JSON.stringify(v) : v;
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  if (typeof v === 'function') return `[Function: ${v.name || 'anônima'}]`;
  if (v === undefined) return 'undefined';
  if (typeof v === 'bigint') return `${v}n`;
  if (v instanceof Map) return `Map(${v.size}) {${[...v].map(([k, x]) => ` ${fmt(k, 1)} => ${fmt(x, 1)}`).join(',')} }`;
  if (v instanceof Set) return `Set(${v.size}) {${[...v].map((x) => ` ${fmt(x, 1)}`).join(',')} }`;
  if (v && typeof v === 'object') {
    if (prof > 3) return Array.isArray(v) ? '[Array]' : '[Object]';
    if (Array.isArray(v)) return `[ ${v.map((x) => fmt(x, prof + 1)).join(', ')} ]`;
    const nome = v.constructor && v.constructor !== Object ? `${v.constructor.name} ` : '';
    const ch = Object.keys(v);
    return ch.length ? `${nome}{ ${ch.map((k) => `${k}: ${fmt(v[k], prof + 1)}`).join(', ')} }` : `${nome}{}`;
  }
  return String(v);
}
const linha = (args) => args.map((a) => fmt(a)).join(' ');
const consoleFalso = {
  log: (...a) => enviar({ tipo: 'saida', texto: `${linha(a)}\n` }),
  info: (...a) => enviar({ tipo: 'saida', texto: `${linha(a)}\n` }),
  debug: (...a) => enviar({ tipo: 'saida', texto: `${linha(a)}\n` }),
  warn: (...a) => enviar({ tipo: 'saida', texto: `${linha(a)}\n`, nivel: 'aviso' }),
  error: (...a) => enviar({ tipo: 'saida', texto: `${linha(a)}\n`, nivel: 'erro' }),
  table: (d) => enviar({ tipo: 'saida', texto: `${JSON.stringify(d, null, 2)}\n` }),
  clear: () => enviar({ tipo: 'limpar' }),
};

function transpilar(codigo, nome) {
  if (!/\.(ts|tsx|jsx)$/.test(nome) && !/^\s*(import|export)\b/m.test(codigo)) return codigo;
  if (!self.Babel) importScripts(BABEL);
  return self.Babel.transform(codigo, { filename: nome, presets: [['env', { targets: { chrome: '100' }, modules: 'commonjs' }], 'typescript', ...(/x$/.test(nome) ? ['react'] : [])], sourceType: 'module' }).code;
}

// ---------- mini Express ----------
function express() {
  const pilha = [];
  const rotas = [];
  const casar = (padrao, caminho) => {
    if (padrao === '*' ) return {};
    const nomes = [];
    const re = new RegExp(`^${padrao.replace(/\/$/, '').replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\$/g, '$').replace(/:(\w+)/g, (_, n) => { nomes.push(n); return '([^/]+)'; }).replace(/\*/g, '.*')}/?$`);
    const m = caminho.match(re);
    return m ? Object.fromEntries(nomes.map((n, k) => [n, decodeURIComponent(m[k + 1])])) : null;
  };
  const a = {
    _express: true,
    locals: {},
    use(p, ...fns) { if (typeof p === 'function') { pilha.push({ prefixo: '', fn: p }); fns.forEach((f) => pilha.push({ prefixo: '', fn: f })); } else fns.forEach((f) => pilha.push({ prefixo: p, fn: f._router ? f._handler : f })); return a; },
    listen(porta, cb) { app = a; enviar({ tipo: 'servidor', porta: porta ?? 3000 }); if (typeof cb === 'function') cb(); return { close() {} }; },
    async _tratar(req) {
      const res = criarRes();
      const caminho = req.path;
      const cadeia = [];
      for (const m of pilha) if (!m.prefixo || caminho === m.prefixo || caminho.startsWith(`${m.prefixo}/`)) cadeia.push({ tipo: 'mw', ...m });
      for (const r of rotas) cadeia.push({ tipo: 'rota', ...r });
      let erro = null;
      for (const c of cadeia) {
        if (res._fim) break;
        if (c.tipo === 'rota') {
          if (c.metodo !== 'ALL' && c.metodo !== req.method) continue;
          const params = casar(c.caminho, caminho);
          if (!params) continue;
          req.params = params;
          for (const fn of c.fns) {
            if (res._fim) break;
            let seguiu = false;
            try { await fn(req, res, (e) => { seguiu = true; if (e) erro = e; }); } catch (e) { erro = e; }
            if (erro || !seguiu) break;
          }
          if (erro || res._fim) break;
          continue;
        }
        const req2 = c.prefixo ? Object.assign(Object.create(req), { path: caminho.slice(c.prefixo.length) || '/', url: caminho.slice(c.prefixo.length) || '/' }) : req;
        if (c.fn.length === 4) { if (erro) { try { await c.fn(erro, req, res, (e) => { erro = e ?? null; }); } catch (e) { erro = e; } } continue; }
        if (erro) continue;
        let seguiu = false;
        try { await c.fn(req2, res, (e) => { seguiu = true; if (e) erro = e; }); } catch (e) { erro = e; }
        if (!seguiu && !res._fim && !erro) break;
      }
      if (!res._fim) {
        if (erro) { consoleFalso.error(erro); res.status(500).send(`Erro interno: ${erro.message ?? erro}`); } else res.status(404).send(`Cannot ${req.method} ${caminho}`);
      }
      return { status: res.statusCode, cabecalhos: res._cab, corpo: res._corpo };
    },
  };
  for (const m of ['get', 'post', 'put', 'patch', 'delete', 'all']) a[m] = (caminho, ...fns) => { rotas.push({ metodo: m.toUpperCase(), caminho, fns }); return a; };
  return a;
}
function criarRes() {
  const res = {
    statusCode: 200, _cab: {}, _corpo: '', _fim: false, locals: {},
    status(c) { res.statusCode = c; return res; },
    set(k, v) { res._cab[k.toLowerCase()] = String(v); return res; },
    header(k, v) { return res.set(k, v); },
    json(o) { res.set('content-type', 'application/json; charset=utf-8'); res._corpo = JSON.stringify(o, null, 2); res._fim = true; return res; },
    send(b) { if (typeof b === 'object' && b !== null) return res.json(b); if (!res._cab['content-type']) res.set('content-type', 'text/html; charset=utf-8'); res._corpo = String(b ?? ''); res._fim = true; return res; },
    sendStatus(c) { res.statusCode = c; return res.send(String(c)); },
    end(b = '') { res._corpo = String(b); res._fim = true; return res; },
    redirect(a, b) { const [c, u] = b ? [a, b] : [302, a]; res.statusCode = c; res.set('location', u); res._fim = true; return res; },
  };
  return res;
}
express.json = () => (req, res, next) => { if (typeof req.body === 'string' && /json/.test(req.headers['content-type'] ?? '')) { try { req.body = req.body ? JSON.parse(req.body) : {}; } catch { return res.status(400).json({ erro: 'JSON inválido' }); } } next(); };
express.urlencoded = () => (req, res, next) => { if (typeof req.body === 'string' && /urlencoded/.test(req.headers['content-type'] ?? '')) req.body = Object.fromEntries(new URLSearchParams(req.body)); next(); };
express.Router = () => {
  const r = express();
  r._router = true;
  r._handler = (req, res, next) => r._tratar(req).then((x) => { if (x.status === 404 && /^Cannot/.test(x.corpo)) return next(); Object.assign(res, { statusCode: x.status, _cab: { ...res._cab, ...x.cabecalhos }, _corpo: x.corpo, _fim: true }); });
  return r;
};

// ---------- mini Jest ----------
const testes = [];
let grupos = [];
const antes = [];
function igual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => igual(a[k], b[k]));
}
function expect(v) {
  const falha = (msg) => { throw new Error(msg); };
  const m = (neg) => ({
    toBe: (e) => (Object.is(v, e) !== neg) || falha(`esperado ${neg ? 'diferente de ' : ''}${fmt(e, 1)}, recebido ${fmt(v, 1)}`),
    toEqual: (e) => (igual(v, e) !== neg) || falha(`esperado ${neg ? 'diferente de ' : ''}${fmt(e, 1)}, recebido ${fmt(v, 1)}`),
    toStrictEqual: (e) => (igual(v, e) !== neg) || falha(`esperado ${fmt(e, 1)}, recebido ${fmt(v, 1)}`),
    toBeTruthy: () => (!!v !== neg) || falha(`esperado ${neg ? 'falsy' : 'truthy'}, recebido ${fmt(v, 1)}`),
    toBeFalsy: () => (!v !== neg) || falha(`esperado ${neg ? 'truthy' : 'falsy'}, recebido ${fmt(v, 1)}`),
    toBeNull: () => ((v === null) !== neg) || falha(`esperado null, recebido ${fmt(v, 1)}`),
    toBeUndefined: () => ((v === undefined) !== neg) || falha(`esperado undefined, recebido ${fmt(v, 1)}`),
    toBeDefined: () => ((v !== undefined) !== neg) || falha('esperado valor definido'),
    toBeGreaterThan: (e) => ((v > e) !== neg) || falha(`esperado > ${e}, recebido ${fmt(v, 1)}`),
    toBeLessThan: (e) => ((v < e) !== neg) || falha(`esperado < ${e}, recebido ${fmt(v, 1)}`),
    toBeCloseTo: (e, d = 2) => ((Math.abs(v - e) < 10 ** -d / 2) !== neg) || falha(`esperado ≈ ${e}, recebido ${fmt(v, 1)}`),
    toContain: (e) => ((v?.includes?.(e) ?? false) !== neg) || falha(`esperado conter ${fmt(e, 1)}`),
    toHaveLength: (n) => ((v?.length === n) !== neg) || falha(`esperado tamanho ${n}, recebido ${v?.length}`),
    toHaveProperty: (k) => ((v != null && k in Object(v)) !== neg) || falha(`esperado ter a propriedade ${k}`),
    toMatch: (re) => ((typeof re === 'string' ? String(v).includes(re) : re.test(v)) !== neg) || falha(`esperado casar com ${re}`),
    toBeInstanceOf: (C) => ((v instanceof C) !== neg) || falha(`esperado instância de ${C.name}`),
    toThrow: (msg) => {
      let lancou = false;
      let erro;
      try { v(); } catch (e) { lancou = true; erro = e; }
      if (lancou && msg && !String(erro?.message).includes(msg instanceof RegExp ? '' : msg) && !(msg instanceof RegExp && msg.test(erro?.message))) return falha(`lançou "${erro?.message}", esperado conter "${msg}"`);
      return (lancou !== neg) || falha(neg ? 'não deveria lançar erro' : 'esperado lançar erro');
    },
  });
  const r = m(false);
  r.not = m(true);
  r.resolves = new Proxy({}, { get: (_, k) => async (...a) => expect(await v)[k](...a) });
  r.rejects = new Proxy({}, { get: (_, k) => async (...a) => { try { await v; } catch (e) { return expect(() => { throw e; })[k](...a); } throw new Error('esperado rejeitar'); } });
  return r;
}
const it = (nome, fn) => testes.push({ nome: [...grupos, nome].join(' › '), fn, antes: [...antes] });
const describe = (nome, fn) => { grupos.push(nome); fn(); grupos.pop(); };
const beforeEach = (fn) => antes.push(fn);

// ---------- módulos ----------
const BUILTINS = {
  express: () => express,
  assert: () => {
    const a = (c, m) => { if (!c) throw new Error(m ?? 'Assertion failed'); };
    a.equal = (x, y, m) => a(x == y, m ?? `${fmt(x, 1)} == ${fmt(y, 1)}`); // eslint-disable-line eqeqeq
    a.strictEqual = (x, y, m) => a(Object.is(x, y), m ?? `${fmt(x, 1)} === ${fmt(y, 1)}`);
    a.deepStrictEqual = (x, y, m) => a(igual(x, y), m ?? `${fmt(x, 1)} deepEqual ${fmt(y, 1)}`);
    a.deepEqual = a.deepStrictEqual;
    a.throws = (f, m) => { try { f(); } catch { return; } throw new Error(m ?? 'Esperava exceção'); };
    a.ok = a;
    return a;
  },
  path: () => ({ join: (...p) => p.join('/').replace(/\/+/g, '/'), basename: (p) => p.split('/').pop(), extname: (p) => (p.match(/\.[^./]+$/) ?? [''])[0], dirname: (p) => p.split('/').slice(0, -1).join('/') || '.' }),
  util: () => ({ format: (...a) => linha(a), inspect: (v) => fmt(v, 1) }),
  events: () => ({ EventEmitter: class { constructor() { this.l = {}; } on(e, f) { (this.l[e] ??= []).push(f); return this; } emit(e, ...a) { (this.l[e] ?? []).forEach((f) => f(...a)); return !!this.l[e]; } } }),
  fs: () => ({ readFileSync: (p) => { const k = resolver(p.replace(/^\.\//, ''), ''); if (k == null) throw new Error(`ENOENT: no such file or directory, open '${p}'`); return arquivos[k]; }, existsSync: (p) => resolver(p.replace(/^\.\//, ''), '') != null }),
};
function resolver(espec, de) {
  const base = de.includes('/') ? de.split('/').slice(0, -1) : [];
  const partes = espec.startsWith('.') ? [...base] : [];
  for (const p of espec.split('/')) { if (p === '..') partes.pop(); else if (p && p !== '.') partes.push(p); }
  const alvo = partes.join('/');
  for (const c of [alvo, `${alvo}.js`, `${alvo}.ts`, `${alvo}.jsx`, `${alvo}.tsx`, `${alvo}.json`, `${alvo}/index.js`, `${alvo}/index.ts`]) if (c in arquivos) return c;
  return null;
}
function requerer(espec, de) {
  const nome = espec.replace(/^node:/, '');
  if (BUILTINS[nome]) return BUILTINS[nome]();
  const k = resolver(espec, de);
  if (k == null) throw new Error(`Cannot find module '${espec}' (em ${de || 'raiz'}). Pacotes npm de terceiros não estão disponíveis; módulos internos: ${Object.keys(BUILTINS).join(', ')}.`);
  if (cache[k]) return cache[k].exports;
  const modulo = { exports: {} };
  cache[k] = modulo;
  if (k.endsWith('.json')) { modulo.exports = JSON.parse(arquivos[k]); return modulo.exports; }
  const codigo = transpilar(arquivos[k], k);
  const fn = new Function('require', 'module', 'exports', 'console', 'describe', 'it', 'test', 'expect', 'beforeEach', '__filename', 'process', `${codigo}\n//# sourceURL=${k}`);
  fn((e) => requerer(e, k), modulo, modulo.exports, consoleFalso, describe, it, it, expect, beforeEach, k, { env: { NODE_ENV: 'development' }, argv: ['node', k], exit: () => {}, version: 'v20 (simulado)' });
  return modulo.exports;
}

async function rodarTestes() {
  const res = [];
  for (const t of testes) {
    try { for (const b of t.antes) await b(); await t.fn(); res.push({ nome: t.nome, ok: true }); } catch (e) { res.push({ nome: t.nome, ok: false, erro: e.message }); }
  }
  return res;
}

self.onmessage = async (e) => {
  const m = e.data;
  if (m.tipo === 'executar') {
    arquivos = m.arquivos;
    cache = {};
    app = null;
    testes.length = 0;
    grupos = [];
    antes.length = 0;
    try {
      requerer(`./${m.entrada}`, '');
      for (const t of m.arquivosTeste ?? []) requerer(`./${t}`, '');
      // Testes em expressão (exercícios): ["descrição", "expressão que deve ser true"].
      const extra = [];
      if (m.expressoes?.length) {
        const escopo = cache[resolver(`./${m.entrada}`, '')]?.exports ?? {};
        for (const [nome, expr] of m.expressoes) {
          try { const f = new Function(...Object.keys(escopo), 'expect', `return (${expr});`); extra.push({ nome, ok: (await f(...Object.values(escopo), expect)) === true }); } catch (err) { extra.push({ nome, ok: false, erro: err.message }); }
        }
      }
      const r = [...extra, ...(await rodarTestes())];
      enviar({ tipo: 'fim', testes: r, servidor: !!app });
    } catch (err) {
      enviar({ tipo: 'fim', erro: `${err.name}: ${err.message}`, pilha: String(err.stack ?? '').split('\n').filter((l) => /\.(js|ts|jsx|tsx):\d+/.test(l)).slice(0, 4).join('\n'), testes: [] });
    }
  }
  if (m.tipo === 'requisicao') {
    if (!app) return enviar({ tipo: 'resposta', id: m.id, erro: 'Nenhum servidor ativo. Execute um app Express que chame app.listen().' });
    const [caminho, qs = ''] = m.url.split('?');
    const req = { method: m.metodo, url: m.url, path: caminho, originalUrl: m.url, query: Object.fromEntries(new URLSearchParams(qs)), headers: Object.fromEntries(Object.entries(m.cabecalhos ?? {}).map(([k, v]) => [k.toLowerCase(), v])), body: m.corpo ?? '', params: {}, get(k) { return this.headers[k.toLowerCase()]; } };
    const t0 = performance.now();
    const r = await app._tratar(req);
    enviar({ tipo: 'resposta', id: m.id, ...r, ms: Math.round(performance.now() - t0) });
  }
};
