// Executor Python real: CPython 3.12 compilado para WebAssembly (Pyodide), num Web Worker persistente.
// Projetos com vários arquivos, requirements.txt (micropip/PyPI), gráficos do matplotlib, testes no estilo pytest
// e cliente HTTP para apps Flask/FastAPI (via test client — nenhuma porta de rede é aberta).
const INDICE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
let py = null;
const enviar = (m) => self.postMessage(m);

const PRELUDIO = `
import sys, io, os, base64, json, runpy, traceback, importlib
def __clab_mostrar(*a, **k):
    import matplotlib.pyplot as plt
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=110, bbox_inches='tight')
    plt.close('all')
    __clab_imagem(base64.b64encode(buf.getvalue()).decode())
def __clab_preparar_mpl():
    if 'matplotlib' in sys.modules or importlib.util.find_spec('matplotlib'):
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        plt.show = __clab_mostrar
def __clab_rodar(entrada):
    for m in [m for m in list(sys.modules) if getattr(sys.modules[m], '__file__', '') and str(getattr(sys.modules[m], '__file__', '')).startswith('/home/pyodide/projeto')]:
        del sys.modules[m]
    g = runpy.run_path(entrada, run_name='__main__')
    globals()['__clab_ns'] = g
def __clab_testes(arquivos):
    res = []
    for arq in arquivos:
        nome = arq[:-3].replace('/', '.')
        if nome in sys.modules: del sys.modules[nome]
        try:
            mod = importlib.import_module(nome)
        except Exception as e:
            res.append({'nome': arq, 'ok': False, 'erro': f'{type(e).__name__}: {e}'})
            continue
        for k in sorted(dir(mod)):
            f = getattr(mod, k)
            if k.startswith('test') and callable(f):
                try:
                    f()
                    res.append({'nome': f'{arq}::{k}', 'ok': True})
                except AssertionError as e:
                    res.append({'nome': f'{arq}::{k}', 'ok': False, 'erro': str(e) or 'assert falhou'})
                except Exception as e:
                    res.append({'nome': f'{arq}::{k}', 'ok': False, 'erro': f'{type(e).__name__}: {e}'})
    return json.dumps(res)
def __clab_http(metodo, url, cab, corpo):
    g = globals().get('__clab_ns') or {}
    app = g.get('app')
    if app is None:
        return json.dumps({'erro': 'Nenhuma variável app (Flask ou FastAPI) no arquivo principal.'})
    cab = json.loads(cab)
    if hasattr(app, 'test_client'):
        c = app.test_client()
        r = c.open(url, method=metodo, headers=cab, data=corpo.encode() if corpo else None)
        return json.dumps({'status': r.status_code, 'cabecalhos': dict(r.headers), 'corpo': r.get_data(as_text=True)})
    from fastapi.testclient import TestClient
    c = globals().setdefault('__clab_cli', {}).get(id(app)) or TestClient(app)
    globals()['__clab_cli'][id(app)] = c
    r = c.request(metodo, url, headers=cab, content=corpo.encode() if corpo else None)
    return json.dumps({'status': r.status_code, 'cabecalhos': dict(r.headers), 'corpo': r.text})
`;

async function iniciar() {
  if (py) return py;
  enviar({ tipo: 'status', texto: 'Baixando o Python 3.12 (WebAssembly, ~10 MB na primeira vez)…' });
  importScripts(`${INDICE}pyodide.js`);
  py = await self.loadPyodide({ indexURL: INDICE });
  py.setStdout({ batched: (t) => enviar({ tipo: 'saida', texto: `${t}\n` }) });
  py.setStderr({ batched: (t) => enviar({ tipo: 'saida', texto: `${t}\n`, nivel: 'erro' }) });
  py.globals.set('__clab_imagem', (b64) => enviar({ tipo: 'imagem', png: b64 }));
  await py.runPythonAsync(PRELUDIO);
  enviar({ tipo: 'status', texto: '' });
  return py;
}

function escreverProjeto(arquivos) {
  const fs = py.FS;
  const raiz = '/home/pyodide/projeto';
  try { py.runPython(`import shutil, os\nshutil.rmtree('${raiz}', ignore_errors=True)\nos.makedirs('${raiz}', exist_ok=True)`); } catch { /* primeira vez */ }
  for (const [caminho, conteudo] of Object.entries(arquivos)) {
    const partes = caminho.split('/');
    let dir = raiz;
    for (const p of partes.slice(0, -1)) { dir += `/${p}`; try { fs.mkdir(dir); } catch { /* existe */ } }
    fs.writeFile(`${raiz}/${caminho}`, conteudo instanceof Uint8Array ? conteudo : String(conteudo));
  }
  py.runPython(`import os, sys\nos.chdir('${raiz}')\nsys.path.insert(0, '${raiz}') if '${raiz}' not in sys.path else None`);
}

async function instalar(arquivos) {
  const codigo = Object.entries(arquivos).filter(([k]) => k.endsWith('.py')).map(([, v]) => v).join('\n');
  await py.loadPackagesFromImports(codigo, { messageCallback: (t) => enviar({ tipo: 'status', texto: t }) });
  const req = (arquivos['requirements.txt'] ?? '').split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean);
  if (req.length) {
    await py.loadPackage('micropip');
    const micropip = py.pyimport('micropip');
    enviar({ tipo: 'status', texto: `Instalando do PyPI: ${req.join(', ')}…` });
    await micropip.install(req);
  }
  enviar({ tipo: 'status', texto: '' });
}

self.onmessage = async (e) => {
  const m = e.data;
  try {
    await iniciar();
    if (m.tipo === 'executar') {
      escreverProjeto(m.arquivos);
      await instalar(m.arquivos);
      if (m.entrada) py.setStdin(m.stdin != null ? { stdin: (() => { const linhas = String(m.stdin).split('\n'); let k = 0; return () => (k < linhas.length ? linhas[k++] : undefined); })() } : { error: true });
      py.runPython('__clab_preparar_mpl()');
      let erro;
      try {
        if (m.entrada) await py.runPythonAsync(`__clab_rodar(${JSON.stringify(m.entrada)})`);
      } catch (err) {
        erro = String(err.message ?? err).split('\n').filter((l) => !/\/lib\/python|_pyodide|pyodide\.asm|File "<exec>"/.test(l)).join('\n').trim();
      }
      let testes = [];
      if (m.arquivosTeste?.length) testes = JSON.parse(py.runPython(`__clab_testes(${JSON.stringify(m.arquivosTeste)})`));
      const servidor = py.runPython("bool((globals().get('__clab_ns') or {}).get('app') is not None)");
      enviar({ tipo: 'fim', erro, testes, servidor });
    }
    if (m.tipo === 'requisicao') {
      const t0 = performance.now();
      const r = JSON.parse(await py.runPythonAsync(`__clab_http(${JSON.stringify(m.metodo)}, ${JSON.stringify(m.url)}, ${JSON.stringify(JSON.stringify(m.cabecalhos ?? {}))}, ${JSON.stringify(m.corpo ?? '')})`));
      enviar({ tipo: 'resposta', id: m.id, ...r, ms: Math.round(performance.now() - t0) });
    }
  } catch (err) {
    enviar(m.tipo === 'requisicao' ? { tipo: 'resposta', id: m.id, erro: String(err.message ?? err) } : { tipo: 'fim', erro: String(err.message ?? err), testes: [] });
  }
};
