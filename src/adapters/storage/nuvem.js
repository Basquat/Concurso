// Cliente da API de contas na nuvem (nuvem/worker.js). Só trafegam dados já cifrados e segredos derivados da senha.
// Erros: `rede` = sem conexão; `status` = resposta HTTP de erro do servidor.
export function criarNuvem({ url, fetch: buscar = globalThis.fetch?.bind(globalThis) }) {
  const base = String(url).replace(/\/+$/, '');

  async function chamar(metodo, caminho, { corpo, token } = {}) {
    let r;
    try {
      r = await buscar(base + caminho, {
        method: metodo,
        headers: { ...(corpo ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: corpo ? JSON.stringify(corpo) : undefined,
      });
    } catch { throw Object.assign(new Error('Sem conexão com a nuvem.'), { rede: true }); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(d.erro ?? `Erro ${r.status} na nuvem.`), { status: r.status });
    return d;
  }

  return {
    salts: (nome) => chamar('POST', '/salts', { corpo: { nome } }),
    criar: (conta) => chamar('POST', '/conta', { corpo: conta }),
    entrar: (nome, auth) => chamar('POST', '/entrar', { corpo: { nome, auth } }),
    recuperar: (corpo) => chamar('POST', '/recuperar', { corpo }),
    senha: (corpo) => chamar('POST', '/senha', { corpo }),
    codigo: (corpo) => chamar('POST', '/codigo', { corpo }),
    excluir: (corpo) => chamar('DELETE', '/conta', { corpo }),
    perfil: (token, corpo) => chamar('POST', '/perfil', { corpo, token }),
    sair: (token) => chamar('POST', '/sair', { corpo: {}, token }),
    indice: async (token) => (await chamar('GET', '/indice', { token })).itens,
    buscar: async (token, chaves) => (await chamar('POST', '/buscar', { corpo: { chaves }, token })).registros,
    enviar: (token, registros) => chamar('PUT', '/dados', { corpo: { registros }, token }),
  };
}
