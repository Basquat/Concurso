import { esc, cabecalho, toast } from '../dom.js';
import * as C from '../../storage/contas.js';

const recarregar = () => { location.hash = '#/'; location.reload(); };

export default async function conta(el) {
  const render = () => {
    const eu = C.atual();
    const todas = C.listar();
    el.innerHTML = `<div class="conteudo">
      ${cabecalho({ sobre: 'Conta', titulo: eu ? `Olá, ${eu.nome}` : 'Entrar ou criar conta', texto: 'Cada conta tem progresso, cargo-alvo e laboratórios separados neste navegador.' })}
      <div class="callout aviso" style="margin-bottom:16px"><strong>Contas locais.</strong> Não existe servidor: a senha vira hash PBKDF2 (600 mil iterações) e protege contra uso casual neste aparelho, mas quem controla o navegador pode apagar ou alterar os dados. Plano e papel são demonstrativos e não funcionam como controle de acesso. Login real com JWT, sincronização e pagamento exigem um backend autorizado por você (detalhes em Sobre e limites).</div>
      ${eu ? `
      <div class="grid">
        <div class="card"><h3>Sua conta</h3><p class="pequeno">Papel: <strong>${esc(C.PAPEIS[eu.papel])}</strong><br>Plano: <strong>${esc(C.PLANOS[eu.plano].nome)}</strong><br>Criada em ${new Date(eu.criadaEm).toLocaleDateString('pt-BR')}</p>
          <button class="btn perigo" data-sair>Sair</button></div>
        <form class="card pilha" data-senha><h3>Trocar senha</h3>
          <label class="campo">Senha atual<input type="password" name="a" autocomplete="current-password" required></label>
          <label class="campo">Nova senha<input type="password" name="n" autocomplete="new-password" required minlength="8"></label>
          <button class="btn primario">Salvar</button></form>
      </div>
      <h2>Planos</h2>
      <div class="grid">${Object.entries(C.PLANOS).map(([k, p]) => `<div class="card"><h3>${esc(p.nome)}${eu.plano === k ? ' <span class="tag ok">atual</span>' : ''}</h3><ul class="pequeno">${p.recursos.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>`).join('')}</div>
      ${eu.papel === 'administrador' ? `<h2>Contas deste navegador</h2><div class="rolagem"><table class="tabela"><thead><tr><th>Nome</th><th>Papel</th><th>Plano</th><th></th></tr></thead><tbody>
        ${todas.map((c) => `<tr data-id="${c.id}"><td>${esc(c.nome)}</td>
          <td><select data-campo="papel">${Object.entries(C.PAPEIS).map(([k, v]) => `<option value="${k}" ${c.papel === k ? 'selected' : ''}>${v}</option>`).join('')}</select></td>
          <td><select data-campo="plano">${Object.entries(C.PLANOS).map(([k, v]) => `<option value="${k}" ${c.plano === k ? 'selected' : ''}>${v.nome}</option>`).join('')}</select></td>
          <td><button class="btn peq perigo" data-excluir>Excluir</button></td></tr>`).join('')}</tbody></table></div>` : ''}`
      : `<div class="grid">
        <form class="card pilha" data-entrar><h3>Entrar</h3>
          <label class="campo">Nome<input name="nome" autocomplete="username" required></label>
          <label class="campo">Senha<input type="password" name="senha" autocomplete="current-password" required></label>
          <label class="opcao"><input type="checkbox" name="lembrar"> Manter conectado neste aparelho</label>
          <button class="btn primario">Entrar</button></form>
        <form class="card pilha" data-criar><h3>Criar conta</h3>
          <label class="campo">Nome<input name="nome" autocomplete="username" required minlength="3" maxlength="30"></label>
          <label class="campo">Senha (8+ caracteres, letras e números)<input type="password" name="senha" autocomplete="new-password" required minlength="8"></label>
          <label class="campo">Confirmar senha<input type="password" name="senha2" autocomplete="new-password" required></label>
          <button class="btn primario">Criar conta</button>
          <p class="pequeno muted">A primeira conta criada vira administrador local. Sem conta, o progresso fica no modo visitante.</p></form>
      </div>`}
    </div>`;

    const form = (sel, fn) => el.querySelector(sel)?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.currentTarget));
      const btn = e.currentTarget.querySelector('button'); btn.disabled = true;
      try { await fn(f); } catch (err) { toast(err.message, 5000); } finally { btn.disabled = false; }
    });
    form('[data-entrar]', async (f) => { await C.entrar(f.nome, f.senha, !!f.lembrar); recarregar(); });
    form('[data-criar]', async (f) => {
      if (f.senha !== f.senha2) throw new Error('As senhas não conferem.');
      await C.criar(f); await C.entrar(f.nome, f.senha, false); recarregar();
    });
    form('[data-senha]', async (f) => { await C.trocarSenha(f.a, f.n); toast('Senha alterada.'); render(); });
    el.querySelector('[data-sair]')?.addEventListener('click', () => { C.sair(); recarregar(); });
    el.querySelectorAll('[data-campo]').forEach((s) => s.addEventListener('change', () => {
      try { C.definir(s.closest('tr').dataset.id, { [s.dataset.campo]: s.value }); toast('Atualizado (local).'); } catch (err) { toast(err.message); }
    }));
    el.querySelectorAll('[data-excluir]').forEach((b) => b.addEventListener('click', () => {
      const id = b.closest('tr').dataset.id;
      if (confirm('Excluir esta conta e todo o progresso dela neste navegador?')) { C.excluir(id); id === C.atual()?.id ? recarregar() : render(); }
    }));
  };
  render();
}
