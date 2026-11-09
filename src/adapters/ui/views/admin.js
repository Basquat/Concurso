// Administração: contas, papéis e situação das assinaturas. A API recusa (403) quem não é admin;
// esta tela só apresenta o que o servidor devolver.
import { esc, ic, cabecalho, toast, confirmar } from '../dom.js';
import { rotuloStatus } from './conta.js';

export default async function admin(el, { api, casca, acesso }) {
  casca?.definirTitulo('Administração');
  if (!api) { el.innerHTML = '<div class="aviso">Administração exige o servidor (API) ligado.</div>'; return; }
  let busca = '';

  const render = async () => {
    const lista = el.querySelector('#lista');
    lista.innerHTML = '<div class="carregando"><span class="gira"></span> Carregando…</div>';
    try {
      const { usuarios } = await api.usuarios(busca);
      lista.innerHTML = usuarios.length ? `<div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Conta</th><th>Papel</th><th>Assinatura</th><th>Criada em</th><th></th></tr></thead><tbody>
        ${usuarios.map((u) => `<tr><td><strong>${esc(u.nome)}</strong>${u.email ? `<br><span class="mini sutil">${esc(u.email)}</span>` : ''}</td>
          <td><span class="tag ${u.papel === 'admin' ? 'prim' : ''}">${u.papel}</span></td>
          <td>${u.assinatura ? `<span class="tag ${u.assinatura.premium ? 'ok' : ''}">${esc(rotuloStatus(u.assinatura))}</span>${u.assinatura.plano ? ` <span class="mini sutil">${u.assinatura.plano}</span>` : ''}` : '<span class="mini sutil">—</span>'}</td>
          <td class="mini">${new Date(u.criadaEm).toLocaleDateString('pt-BR')}</td>
          <td>${u.id === acesso.eu?.id ? '<span class="mini sutil">você</span>' : `<button class="btn peq" type="button" data-papel="${u.papel === 'admin' ? 'aluno' : 'admin'}" data-id="${esc(u.id)}" data-nome="${esc(u.nome)}">${u.papel === 'admin' ? 'Tornar aluno' : 'Tornar admin'}</button>`}</td></tr>`).join('')}
        </tbody></table></div>` : '<div class="vazio"><p>Nenhuma conta encontrada.</p></div>';
    } catch (e) {
      lista.innerHTML = `<div class="aviso erro">${esc(e.status === 403 ? 'Sua conta não tem permissão de administrador.' : e.message)}</div>`;
    }
  };

  el.innerHTML = `${cabecalho({ sobre: 'Administração', titulo: 'Usuários e assinaturas', texto: 'Contas sincronizadas, papéis e situação no Stripe. Dados de estudo são cifrados por cada aluno e não aparecem aqui. Reembolsos e faturas: painel do Stripe.' })}
    <div class="filtros"><input type="search" id="busca" placeholder="Buscar por nome ou e-mail…" style="max-width:320px"></div>
    <div id="lista"></div>`;
  let t;
  el.querySelector('#busca').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { busca = e.target.value; render(); }, 300); });
  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-papel]');
    if (!b || !await confirmar(`Mudar ${b.dataset.nome} para ${b.dataset.papel}?`)) return;
    try { await api.papel(b.dataset.id, b.dataset.papel); toast('Papel atualizado.', { tipo: 'ok' }); render(); } catch (err) { toast(err.message, { tipo: 'erro' }); }
  });
  render();
}
