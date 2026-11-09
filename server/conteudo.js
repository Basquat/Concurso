// Banco de questões com controle de acesso. Os arquivos ficam fora da pasta pública (o build não os copia):
// assinante recebe tudo; visitante e aluno sem assinatura recebem uma amostra fixa por disciplina.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { quem } from './base.js';
import { perfil } from './acesso.js';
import { parseBanco } from '../src/domain/banco.js';

export const AMOSTRA_POR_DISCIPLINA = 10;
let banco = null;

// Parse uma vez por instância da função; a ordem dos arquivos define a amostra (estável entre requisições).
export function carregarBanco(dir = path.join(process.cwd(), 'data', 'questoes')) {
  return (banco ??= (async () => {
    const arquivos = (await readdir(dir)).filter((f) => f.endsWith('.txt')).sort();
    const todas = (await Promise.all(arquivos.map(async (a) => parseBanco(await readFile(path.join(dir, a), 'utf8'), a).questoes))).flat();
    const vistas = {};
    const amostra = todas.filter((q) => (vistas[q.disciplina] = (vistas[q.disciplina] ?? 0) + 1) <= AMOSTRA_POR_DISCIPLINA);
    return { todas, amostra };
  })().catch((e) => { banco = null; throw e; }));
}

export const ROTAS = {
  'GET /questoes': async (_b, req, env) => {
    const p = await perfil(env, await quem(req, env, { opcional: true }));
    const { todas, amostra } = await (env.banco ?? carregarBanco)();
    const premium = p.direitos.includes('conteudo:premium');
    return { premium, total: todas.length, questoes: premium ? todas : amostra };
  },
};
