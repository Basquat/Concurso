// Conta e segurança: perfil, senha, código de recuperação, bloqueio automático, histórico de acessos,
// backup cifrado, preferências e exclusão.
import { esc, ic, cabecalho, toast, modal, confirmar, baixarArquivo, escolherArquivo, diaIso, copiar } from '../dom.js';
import { avatar } from '../porta.js';
import { prefs, aplicarTema } from '../casca.js';

const COMO = { senha: 'Senha', 'aparelho lembrado': 'Aparelho lembrado', criação: 'Criação da conta', recuperação: 'Código de recuperação', 'troca de senha': 'Troca de senha', 'novo código de recuperação': 'Novo código de recuperação', 'migração 1.0': 'Migração da 1.0' };
const quando = (ms) => new Date(ms).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function campoSenha(nome, rotulo, auto) {
  return `<label class="campo">${rotulo}<span class="senha-caixa"><input type="password" name="${nome}" autocomplete="${auto}" required><button type="button" data-ver aria-label="Mostrar senha">${ic('olho')}</button></span></label>`;
}

export default async function conta(el, ctx) {
  const { sessao, contas, servico, casca, acoes } = ctx;
  casca?.definirTitulo('Conta e segurança');

  const render = async () => {
    const eu = sessao.conta;
    const cfg = sessao.ler('config') ?? {};
    const bloqueio = cfg.bloqueioMin ?? 30;
    const lista = eu ? (await contas.listar()).find((c) => c.id === eu.id) : null;
    const acessos = lista?.acessos ?? [];
    const tema = prefs.ler('tema') ?? 'sistema';
    const fonte = prefs.ler('fonte') ?? 'm';

    el.innerHTML = `${cabecalho({ sobre: 'Você', titulo: 'Conta e segurança', texto: 'Seus dados de estudo ficam cifrados neste aparelho. Aqui você gerencia senha, recuperação, backups e preferências.' })}
      <div class="split">
        <div class="pilha g">
          <section class="card"><div class="linha" style="gap:16px">${avatar(eu, 'g')}<div style="flex:1;min-width:0"><h2 class="mt0 mb0">${esc(eu?.nome ?? 'Visitante')}</h2>
            <div class="mini sutil">${eu ? `${eu.email ? `${esc(eu.email)} · ` : ''}conta criada em ${new Date(eu.criadaEm).toLocaleDateString('pt-BR')}` : 'Sem senha: dados neste navegador, sem cifra.'}</div></div>
            ${eu ? `<button class="btn" type="button" data-editar>${ic('redacao')} Editar perfil</button>` : `<button class="btn primario" type="button" data-criar>${ic('usuario')} Criar conta / entrar</button>`}</div></section>

          ${eu ? `<section class="card"><div class="card-cab"><h2>${ic('chave')} Senha</h2></div>
            <form class="pilha" data-senha style="max-width:460px">${campoSenha('atual', 'Senha atual', 'current-password')}${campoSenha('nova', 'Nova senha', 'new-password')}
              <div class="forca" data-n="0"><span></span><span></span><span></span><span></span></div><span class="mini sutil" id="forcaTxt">Use 8+ caracteres; frases longas são ótimas.</span>
              ${campoSenha('nova2', 'Confirmar nova senha', 'new-password')}
              <div><button class="btn primario" type="submit">Trocar senha</button></div></form></section>

          <section class="card"><div class="card-cab"><h2>${ic('escudoOk')} Código de recuperação</h2></div>
            <p class="muted">É a única forma de voltar a acessar a conta se você esquecer a senha. Se perdeu o código atual, gere um novo — o anterior deixa de valer.</p>
            <button class="btn" type="button" data-codigo>${ic('recarregar')} Gerar novo código</button></section>

          <section class="card"><div class="card-cab"><h2>${ic('cadeado')} Bloqueio automático</h2></div>
            <p class="muted">Depois de um tempo sem uso, a conta é bloqueada e a chave sai da memória; só a senha reabre.</p>
            <div class="segmentado" role="group" aria-label="Bloquear após">${[[0, 'Nunca'], [5, '5 min'], [15, '15 min'], [30, '30 min'], [60, '1 h']].map(([v, n]) => `<button type="button" data-bloqueio="${v}" aria-pressed="${v === bloqueio}">${n}</button>`).join('')}</div>
            <div class="linha mt2"><button class="btn" type="button" data-bloquear>${ic('cadeado')} Bloquear agora</button></div></section>

          <section class="card"><div class="card-cab"><h2>${ic('historico')} Acessos recentes</h2><span class="mini sutil">neste aparelho</span></div>
            ${acessos.length ? `<div class="rolagem"><table class="tabela compacta"><thead><tr><th>Quando</th><th>Como</th><th>Resultado</th></tr></thead><tbody>${acessos.map((a) => `<tr><td class="nowrap">${quando(a.em)}</td><td>${esc(COMO[a.como] ?? a.como)}</td><td>${a.ok ? '<span class="tag ok">ok</span>' : '<span class="tag erro">falhou</span>'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted mb0">Sem registros.</p>'}
            <p class="mini sutil mt1 mb0">Cinco falhas seguidas bloqueiam a conta por 30 s, dobrando a cada nova falha (até 15 min).</p></section>` : ''}

          <section class="card"><div class="card-cab"><h2>${ic('baixar')} Backup e outros aparelhos</h2></div>
            <p class="muted">${eu ? 'O backup continua <strong>cifrado</strong>: pode ser guardado em pendrive, nuvem ou enviado para você mesmo. Para usar em outro aparelho: tela de entrada → <em>Importar backup</em> → entre com a sua senha.' : 'Baixe seu progresso de visitante em arquivo para não perder ao limpar o navegador.'}</p>
            <div class="linha"><button class="btn primario" type="button" data-backup>${ic('baixar')} Baixar backup</button><button class="btn" type="button" data-importar>${ic('enviar')} Importar backup</button></div></section>

          <section class="card" style="border-color:color-mix(in srgb, var(--erro) 35%, var(--borda))"><div class="card-cab"><h2 class="erro">${ic('alerta')} Zona de risco</h2></div>
            <div class="linha"><button class="btn perigo" type="button" data-zerar>Zerar progresso</button>${eu ? `<button class="btn perigo cheio" type="button" data-excluir>${ic('lixeira')} Excluir conta</button>` : '<button class="btn perigo" type="button" data-apagar-vis>Apagar dados de visitante</button>'}</div></section>
        </div>

        <aside class="pilha g">
          <section class="card"><h3 class="mt0">Preferências</h3>
            <div class="campo">Tema<div class="segmentado" role="group">${[['sistema', 'Sistema'], ['light', 'Claro'], ['dark', 'Escuro']].map(([v, n]) => `<button type="button" data-tema="${v}" aria-pressed="${v === tema}">${n}</button>`).join('')}</div></div>
            <div class="campo mt2">Tamanho do texto<div class="segmentado" role="group">${[['p', 'Menor'], ['m', 'Padrão'], ['g', 'Maior']].map(([v, n]) => `<button type="button" data-fonte="${v}" aria-pressed="${v === fonte}">${n}</button>`).join('')}</div></div></section>

          <section class="card"><h3 class="mt0">${ic('escudo')} Como seus dados são protegidos</h3>
            <ul class="pequeno muted mb0">
              <li>Cada conta tem uma chave aleatória <strong>AES-256-GCM</strong> que cifra progresso, anotações e laboratórios.</li>
              <li>A chave é guardada embrulhada pela sua senha (<strong>PBKDF2-SHA256, 600 mil iterações</strong>) e pelo código de recuperação. A senha nunca é armazenada.</li>
              <li>"Manter conectado" guarda a chave como <em>não extraível</em> no navegador por até 30 dias.</li>
              <li>Página com política de segurança de conteúdo (CSP) restritiva; código dos laboratórios roda isolado (Web Workers e iframes sem acesso aos seus dados).</li>
              <li><strong>Limite honesto:</strong> sem servidor, não há recuperação por e-mail nem proteção contra quem já controla o seu aparelho.</li>
            </ul></section>

          <section class="card"><h3 class="mt0">${ic('nuvem')} Sincronização na nuvem</h3>
            <p class="pequeno muted">Opcional. Quem publicar o site pode ligar contas na nuvem (Supabase) com criptografia de ponta a ponta: o servidor só recebe dados já cifrados. Veja <code>docs/NUVEM.md</code>.</p>
            <span class="tag">Não configurada neste site</span></section>
        </aside>
      </div>`;

    el.querySelectorAll('[data-ver]').forEach((b) => { b.onclick = () => { const i = b.previousElementSibling; i.type = i.type === 'password' ? 'text' : 'password'; b.innerHTML = ic(i.type === 'password' ? 'olho' : 'olhoFechado'); }; });
    const nova = el.querySelector('[name=nova]');
    nova?.addEventListener('input', () => {
      const f = contas.forcaSenha(nova.value);
      el.querySelector('.forca').dataset.n = nova.value ? Math.max(1, f.nivel) : 0;
      el.querySelector('#forcaTxt').textContent = nova.value ? `Força: ${f.rotulo}. ${f.motivos[0] ?? ''}` : 'Use 8+ caracteres; frases longas são ótimas.';
    });
    el.querySelector('[data-senha]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.currentTarget));
      const btn = e.currentTarget.querySelector('button[type=submit]');
      if (f.nova !== f.nova2) return toast('As senhas novas não conferem.', { tipo: 'erro' });
      btn.disabled = true;
      try { await contas.trocarSenha(sessao, f.atual, f.nova); toast('Senha trocada.', { tipo: 'ok' }); render(); } catch (err) { toast(err.message, { tipo: 'erro', ms: 6000 }); btn.disabled = false; }
    });
    el.querySelector('[data-codigo]')?.addEventListener('click', () => {
      const m = modal({ titulo: 'Gerar novo código', corpo: `<form class="pilha" id="fcod">${campoSenha('s', 'Confirme sua senha', 'current-password')}<p class="mini sutil mb0">O código atual deixará de funcionar.</p></form>`, rodape: '<button class="btn" type="button" data-fechar>Cancelar</button><button class="btn primario" form="fcod">Gerar</button>' });
      m.el.querySelector('input').focus();
      m.el.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const codigo = await contas.novoCodigoRecuperacao(sessao, new FormData(e.currentTarget).get('s'));
          m.fechar();
          const v = modal({ titulo: 'Seu novo código de recuperação', corpo: `<p class="muted">Guarde agora — ele não será mostrado de novo.</p><div class="codigo-rec">${esc(codigo)}</div>`, rodape: `<button class="btn" type="button" data-cp>${ic('copiar')} Copiar</button><button class="btn" type="button" data-bx>${ic('baixar')} Baixar .txt</button><button class="btn primario" type="button" data-fechar>Guardei</button>` });
          v.el.querySelector('[data-cp]').onclick = () => copiar(codigo);
          v.el.querySelector('[data-bx]').onclick = () => baixarArquivo('concurso-lab-codigo-de-recuperacao.txt', `Concurso Lab — código de recuperação\n\n${codigo}\n`, 'text/plain');
          render();
        } catch (err) { toast(err.message, { tipo: 'erro' }); }
      });
    });
    el.querySelectorAll('[data-bloqueio]').forEach((b) => b.addEventListener('click', () => { sessao.gravar('config', { ...cfg, bloqueioMin: Number(b.dataset.bloqueio) }); toast('Preferência salva.', { tipo: 'ok', ms: 1800 }); render(); }));
    el.querySelector('[data-bloquear]')?.addEventListener('click', () => acoes.bloquear());
    el.querySelectorAll('[data-tema]').forEach((b) => b.addEventListener('click', () => { const v = b.dataset.tema; prefs.gravar('tema', v === 'sistema' ? null : v); aplicarTema(); dispatchEvent(new CustomEvent('tema-mudou')); render(); }));
    el.querySelectorAll('[data-fonte]').forEach((b) => b.addEventListener('click', () => { prefs.gravar('fonte', b.dataset.fonte === 'm' ? null : b.dataset.fonte); aplicarTema(); render(); }));
    el.querySelector('[data-criar]')?.addEventListener('click', () => acoes.trocarConta());
    el.querySelector('[data-editar]')?.addEventListener('click', () => {
      const m = modal({ titulo: 'Editar perfil', corpo: `<form class="pilha" id="fperfil"><label class="campo">Nome<input name="nome" value="${esc(sessao.conta.nome)}" required maxlength="40"></label><label class="campo">E-mail (opcional)<input name="email" type="email" value="${esc(sessao.conta.email ?? '')}"></label></form>`, rodape: '<button class="btn" type="button" data-fechar>Cancelar</button><button class="btn primario" form="fperfil">Salvar</button>' });
      m.el.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try { await contas.atualizarPerfil(sessao, Object.fromEntries(new FormData(e.currentTarget))); m.fechar(); toast('Perfil atualizado.', { tipo: 'ok' }); render(); } catch (err) { toast(err.message, { tipo: 'erro' }); }
      });
    });
    el.querySelector('[data-backup]').addEventListener('click', async () => {
      const dados = await contas.exportar(sessao);
      baixarArquivo(`concurso-lab-${eu ? 'backup-cifrado' : 'visitante'}-${diaIso()}.json`, JSON.stringify(dados));
      toast('Backup baixado.', { tipo: 'ok' });
    });
    el.querySelector('[data-importar]').addEventListener('click', async () => {
      const arq = await escolherArquivo('.json,application/json');
      if (!arq) return;
      try {
        const r = await contas.importar(arq.texto);
        if (r.tipo === 'conta' && r.id === eu?.id) toast(`${r.registros} registro(s) mais recentes importados. Entre de novo para carregá-los.`, { tipo: 'ok', ms: 7000 });
        else toast(r.tipo === 'conta' ? `Conta "${r.nome}" adicionada a este aparelho. Use "Trocar de conta" para entrar.` : 'Dados de visitante importados.', { tipo: 'ok', ms: 7000 });
      } catch (err) { toast(err.message, { tipo: 'erro', ms: 6000 }); }
    });
    el.querySelector('[data-zerar]').addEventListener('click', async () => {
      if (await confirmar('Apagar XP, respostas, revisões, missões e aulas vistas desta conta? Laboratórios e anotações continuam.', { titulo: 'Zerar progresso', sim: 'Zerar', perigo: true })) { servico.zerar(); toast('Progresso zerado.'); }
    });
    el.querySelector('[data-apagar-vis]')?.addEventListener('click', async () => {
      if (await confirmar('Apagar todos os dados de visitante deste navegador?', { titulo: 'Apagar dados', sim: 'Apagar', perigo: true })) { await contas.apagarVisitante(); location.reload(); }
    });
    el.querySelector('[data-excluir]')?.addEventListener('click', () => {
      const m = modal({ titulo: 'Excluir conta', corpo: `<form class="pilha" id="fexc"><p>Isso apaga <strong>definitivamente</strong> a conta "${esc(eu.nome)}" e todos os dados dela neste aparelho. Backups que você baixou continuam valendo.</p>${campoSenha('s', 'Digite sua senha para confirmar', 'current-password')}</form>`, rodape: '<button class="btn" type="button" data-fechar>Cancelar</button><button class="btn perigo cheio" form="fexc">Excluir para sempre</button>' });
      m.el.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try { await contas.excluir(eu.id, new FormData(e.currentTarget).get('s')); sessao.fechar(); m.fechar(); toast('Conta excluída.'); acoes.trocarConta(); } catch (err) { toast(err.message, { tipo: 'erro' }); }
      });
    });
  };
  await render();
}
