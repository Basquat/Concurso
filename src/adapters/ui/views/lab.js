import { LABS } from '../labs/registro.js';

export default async function lab(el, ctx, { args: [id] }) {
  const meta = LABS[id];
  if (!meta) { el.innerHTML = '<p>Laboratório não encontrado. <a href="#/laboratorios">Ver todos</a></p>'; return; }
  document.title = `${meta.nome} · Concurso Lab`;
  const mod = await meta.carregar();
  const limpar = await mod.default(el, ctx);
  return () => { document.title = 'Concurso Lab — estudos e laboratórios práticos'; if (typeof limpar === 'function') limpar(); };
}
