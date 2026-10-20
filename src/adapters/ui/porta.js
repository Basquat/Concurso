// Tela de entrada: escolher conta, entrar, criar conta, recuperar acesso, importar backup ou seguir como visitante.
// Resolve com a sessão aberta.
import { esc, ic, toast, baixarArquivo, copiar, escolherArquivo } from './dom.js';

const RECURSOS = [
  ['frasco', 'Laboratórios com tecnologia real', 'Python, PostgreSQL, PHP, Java, React e o editor do VS Code rodando no seu navegador.'],
  ['slides', 'Aulas em slides pelo edital', 'Conteúdo organizado por cargo, com questões e flashcards em cada aula.'],
  ['cerebro', 'Revisão espaçada', 'O sistema agenda o que você precisa revisar para não esquecer.'],
  ['escudoOk', 'Seus dados cifrados', 'Progresso protegido por senha com AES-256; só você abre.'],
];

const quando = (ms) => (ms ? new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'nunca');
const iniciais = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

export function avatar(conta, cls = '') {
  if (!conta) return `<span class="avatar visitante ${cls}" aria-hidden="true">${ic('usuario')}</span>`;
  return `<span class="avatar ${cls}" style="--cor:${esc(conta.cor)}" aria-hidden="true">${esc(iniciais(conta.nome))}</span>`;
}

function campoSenha(nome, rotulo, auto, extra = '') {
  return `<label class="campo">${rotulo}<span class="senha-caixa"><input type="password" name="${nome}" autocomplete="${auto}" required ${extra}><button type="button" data-ver aria-label="Mostrar senha">${ic('olho')}</button></span></label>`;
}

export function telaCodigo(el, { codigo, titulo = 'Guarde seu código de recuperação', texto }) {
  return new Promise((ok) => {
    el.innerHTML = `<div class="porta-card pilha g">
      <div><span class="sobretitulo">Passo importante</span><h2>${esc(titulo)}</h2>
      <p class="muted">${texto ?? 'Sem servidor, ninguém consegue redefinir sua senha por e-mail. Este código é a <strong>única forma</strong> de recuperar o acesso se você esquecer a senha. Ele aparece só agora.'}</p></div>
      <div class="codigo-rec" id="codigoRec">${esc(codigo)}</div>
      <div class="linha"><button class="btn" type="button" data-copiar>${ic('copiar')} Copiar</button><button class="btn" type="button" data-baixar>${ic('baixar')} Baixar .txt</button></div>
      <label class="opcao"><input type="checkbox" data-guardei> Guardei o código em um lugar seguro (gerenciador de senhas, papel, arquivo).</label>
      <button class="btn primario grande" type="button" data-seguir disabled>Continuar ${ic('seta')}</button></div>`;
    el.querySelector('[data-copiar]').onclick = () => copiar(codigo);
    el.querySelector('[data-baixar]').onclick = () => baixarArquivo('concurso-lab-codigo-de-recuperacao.txt', `Concurso Lab — código de recuperação\n\n${codigo}\n\nUse em "Esqueci minha senha". Quem tiver este código e acesso ao seu navegador pode redefinir a senha: guarde-o com cuidado.\n`, 'text/plain');
    el.querySelector('[data-guardei]').onchange = (e) => { el.querySelector('[data-seguir]').disabled = !e.target.checked; };
    el.querySelector('[data-seguir]').onclick = () => ok();
  });
}

export function abrirPorta(raiz, contas) {
  return new Promise((resolver) => {
    raiz.innerHTML = `<div class="porta">
      <section class="porta-marca">
        <div><div class="linha" style="gap:12px;margin-bottom:40px"><span class="logo">${ic('formatura')}</span><strong style="font-size:1.2rem">Concurso Lab <small style="opacity:.7;font-weight:600">2.0</small></strong></div>
        <h1>Estude pelo edital. Pratique como no trabalho.</h1>
        <p>Plataforma gratuita para concursos públicos — UFBA 2026 e outros — com aulas, questões e laboratórios práticos que rodam inteiramente no seu navegador.</p>
        <ul>${RECURSOS.map(([i, t, d]) => `<li>${ic(i)}<div><strong>${esc(t)}</strong><br><span style="opacity:.8">${esc(d)}</span></div></li>`).join('')}</ul></div>
        <p class="rod pequeno" style="opacity:.6;margin:24px 0 0">Projeto educacional independente. Sem anúncios, sem rastreamento.</p>
      </section>
      <section class="porta-form" id="portaForm" aria-live="polite"></section></div>`;
    const area = raiz.querySelector('#portaForm');
    let lista = contas.listar();

    const ligarOlhos = () => area.querySelectorAll('[data-ver]').forEach((b) => {
      b.onclick = () => {
        const i = b.previousElementSibling;
        const ver = i.type === 'password';
        i.type = ver ? 'text' : 'password';
        b.innerHTML = ic(ver ? 'olhoFechado' : 'olho');
        b.setAttribute('aria-label', ver ? 'Ocultar senha' : 'Mostrar senha');
      };
    });

    const enviar = (form, fn) => form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');
      const txt = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="gira"></span> Aguarde…';
      try { await fn(Object.fromEntries(new FormData(form))); } catch (err) { toast(err.message, { tipo: 'erro', ms: 6000 }); btn.disabled = false; btn.innerHTML = txt; }
    });

    const finalizar = async (r) => {
      if (r.codigo) {
        await telaCodigo(area, {
          codigo: r.codigo,
          titulo: r.migrada ? 'Conta migrada para a 2.0' : undefined,
          texto: r.migrada ? 'Seus dados agora ficam cifrados com a sua senha. Guarde o código abaixo: é a única forma de recuperar o acesso se esquecer a senha.' : undefined,
        });
      }
      if (r.avisoNuvem) toast(r.avisoNuvem, { tipo: 'erro', ms: 9000 });
      resolver(r.sessao);
    };
    const botaoNuvem = () => (contas.nuvemDisponivel ? `<button class="btn w100" type="button" data-nuvem>${ic('nuvem')} Entrar com conta de outro aparelho</button>` : '');

    async function inicio() {
      const cs = await lista;
      if (!cs.length) return criar(true);
      area.innerHTML = `<div class="porta-card">
        <h2>Quem está estudando?</h2><p class="muted">Escolha sua conta neste aparelho.</p>
        <div class="contas-lista">${cs.map((c) => `<button class="conta-item" type="button" data-conta="${esc(c.id)}">${avatar(c)}<span><span class="nome">${esc(c.nome)}</span><br><span class="det">${c.legado ? 'Conta da versão 1.0 — entre para migrar' : `Último acesso: ${quando(c.ultimoAcesso)}`}</span></span>${ic('dir', 'seta')}</button>`).join('')}</div>
        <div class="pilha p">${botaoNuvem()}<button class="btn w100" type="button" data-criar>${ic('mais')} Criar outra conta</button>
        <button class="btn fantasma w100" type="button" data-visitante>Continuar sem conta</button>
        <button class="btn fantasma w100 peq" type="button" data-importar>${ic('enviar')} Importar backup de outro aparelho</button></div></div>`;
      area.querySelectorAll('[data-conta]').forEach((b) => { b.onclick = () => entrar(cs.find((c) => c.id === b.dataset.conta)); });
      area.querySelector('[data-criar]').onclick = () => criar(false);
      area.querySelector('[data-nuvem]')?.addEventListener('click', () => entrarNuvem(false));
      area.querySelector('[data-visitante]').onclick = async () => resolver(await contas.visitante());
      area.querySelector('[data-importar]').onclick = importar;
    }

    function entrar(c) {
      area.innerHTML = `<form class="porta-card pilha g" novalidate>
        <button class="btn fantasma peq" type="button" data-voltar style="align-self:flex-start">${ic('esq')} Voltar</button>
        <div class="linha" style="gap:14px">${avatar(c, 'g')}<div><h2 class="mb0">${esc(c.nome)}</h2><span class="muted pequeno">${c.legado ? 'Use a senha da versão 1.0' : 'Digite sua senha'}</span></div></div>
        ${campoSenha('senha', 'Senha', 'current-password', 'autofocus')}
        <label class="opcao"><input type="checkbox" name="lembrar"> Manter conectado neste aparelho por 30 dias</label>
        <button class="btn primario grande" type="submit">${ic('entrar')} Entrar</button>
        ${c.legado ? '' : '<button class="btn fantasma" type="button" data-esqueci>Esqueci minha senha</button>'}
        <p class="mini sutil mb0">${ic('cadeado')} A senha abre a chave que cifra seus dados; ela nunca é guardada.</p></form>`;
      ligarOlhos();
      area.querySelector('input[name=senha]').focus();
      area.querySelector('[data-voltar]').onclick = inicio;
      area.querySelector('[data-esqueci]')?.addEventListener('click', () => recuperar(c));
      enviar(area.querySelector('form'), async (f) => finalizar(await contas.entrar(c.id, f.senha, { lembrar: !!f.lembrar })));
    }

    async function criar(primeira) {
      const temVisitante = await contas.temDadosVisitante();
      area.innerHTML = `<form class="porta-card pilha" novalidate>
        ${primeira ? '' : `<button class="btn fantasma peq" type="button" data-voltar style="align-self:flex-start">${ic('esq')} Voltar</button>`}
        <div><h2>${primeira ? 'Crie sua conta' : 'Nova conta'}</h2><p class="muted mb0">Cada pessoa tem seu progresso, cargo-alvo e laboratórios separados e cifrados.${contas.nuvemDisponivel ? ' Depois é só entrar com o mesmo nome e senha em qualquer aparelho.' : ''}</p></div>
        <label class="campo">Como quer ser chamado(a)<input name="nome" autocomplete="nickname" required minlength="2" maxlength="40" autofocus></label>
        <label class="campo">E-mail <span class="ajuda">Opcional.</span><input name="email" type="email" autocomplete="email"></label>
        ${campoSenha('senha', 'Senha', 'new-password', 'minlength="8"')}
        <div class="forca" data-n="0" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
        <span class="mini sutil" id="forcaTxt">Use 8+ caracteres misturando letras, números e símbolos. Frases longas são ótimas.</span>
        ${campoSenha('senha2', 'Confirmar senha', 'new-password')}
        <label class="opcao"><input type="checkbox" name="lembrar"> Manter conectado neste aparelho</label>
        ${temVisitante ? '<label class="opcao"><input type="checkbox" name="levar" checked> Levar o progresso feito sem conta para a nova conta</label>' : ''}
        <button class="btn primario grande" type="submit">Criar conta</button>
        ${primeira ? `${contas.nuvemDisponivel ? `<button class="btn" type="button" data-nuvem>${ic('nuvem')} Já tenho conta em outro aparelho</button>` : ''}<button class="btn fantasma" type="button" data-visitante>Continuar sem conta</button><button class="btn fantasma peq" type="button" data-importar>${ic('enviar')} Tenho um backup de outro aparelho</button>` : ''}
      </form>`;
      ligarOlhos();
      const s = area.querySelector('input[name=senha]');
      const forca = area.querySelector('.forca');
      s.addEventListener('input', () => {
        const f = contas.forcaSenha(s.value);
        forca.dataset.n = s.value ? Math.max(1, f.nivel) : 0;
        area.querySelector('#forcaTxt').textContent = s.value ? `Força: ${f.rotulo}. ${f.motivos[0] ?? 'Ótimo.'}` : 'Use 8+ caracteres misturando letras, números e símbolos.';
      });
      area.querySelector('[data-voltar]')?.addEventListener('click', inicio);
      area.querySelector('[data-visitante]')?.addEventListener('click', async () => resolver(await contas.visitante()));
      area.querySelector('[data-importar]')?.addEventListener('click', importar);
      area.querySelector('[data-nuvem]')?.addEventListener('click', () => entrarNuvem(true));
      enviar(area.querySelector('form'), async (f) => {
        if (f.senha !== f.senha2) throw new Error('As senhas não conferem.');
        await finalizar(await contas.criar({ nome: f.nome, email: f.email, senha: f.senha, lembrar: !!f.lembrar, levarVisitante: !!f.levar }));
      });
    }

    // Conta criada em outro aparelho: o nome e a senha bastam; as chaves e os dados cifrados vêm da nuvem.
    function entrarNuvem(primeira) {
      area.innerHTML = `<form class="porta-card pilha g" novalidate>
        <button class="btn fantasma peq" type="button" data-voltar style="align-self:flex-start">${ic('esq')} Voltar</button>
        <div><h2>Entrar em qualquer aparelho</h2><p class="muted mb0">Use o mesmo nome e a mesma senha da conta criada em outro aparelho. Seu progresso é baixado e decifrado aqui.</p></div>
        <label class="campo">Nome da conta<input name="nome" autocomplete="username" required autofocus></label>
        ${campoSenha('senha', 'Senha', 'current-password')}
        <label class="opcao"><input type="checkbox" name="lembrar"> Manter conectado neste aparelho por 30 dias</label>
        <button class="btn primario grande" type="submit">${ic('entrar')} Entrar</button>
        <p class="mini sutil mb0">${ic('cadeado')} Os dados saem do seu aparelho já cifrados; o servidor não consegue lê-los.</p></form>`;
      ligarOlhos();
      area.querySelector('[data-voltar]').onclick = () => (primeira ? criar(true) : inicio());
      enviar(area.querySelector('form'), async (f) => finalizar(await contas.entrarNuvem({ nome: f.nome, senha: f.senha, lembrar: !!f.lembrar })));
    }

    function recuperar(c) {
      area.innerHTML = `<form class="porta-card pilha" novalidate>
        <button class="btn fantasma peq" type="button" data-voltar style="align-self:flex-start">${ic('esq')} Voltar</button>
        <div><h2>Recuperar acesso</h2><p class="muted mb0">Digite o código de recuperação de <strong>${esc(c.nome)}</strong> (32 caracteres, recebido ao criar a conta) e escolha uma nova senha.</p></div>
        <label class="campo">Código de recuperação<input name="codigo" required autocomplete="off" spellcheck="false" class="mono" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"></label>
        ${campoSenha('senha', 'Nova senha', 'new-password', 'minlength="8"')}
        ${campoSenha('senha2', 'Confirmar nova senha', 'new-password')}
        <button class="btn primario grande" type="submit">Redefinir senha</button>
        <p class="mini sutil mb0">Sem o código não há como recuperar: os dados são cifrados e não existe cópia da chave fora deste aparelho.</p></form>`;
      ligarOlhos();
      area.querySelector('[data-voltar]').onclick = () => entrar(c);
      enviar(area.querySelector('form'), async (f) => {
        if (f.senha !== f.senha2) throw new Error('As senhas não conferem.');
        const r = await contas.recuperar(c.id, f.codigo, f.senha);
        await telaCodigo(area, { codigo: r.codigo, titulo: 'Senha redefinida', texto: 'O código antigo foi invalidado. Este é o seu novo código de recuperação — guarde-o.' });
        resolver(r.sessao);
      });
    }

    async function importar() {
      const arq = await escolherArquivo('.json,.clab,application/json');
      if (!arq) return;
      try {
        const r = await contas.importar(arq.texto);
        toast(r.tipo === 'conta' ? `Backup de "${r.nome}" importado. Entre com a senha dessa conta.` : 'Progresso de visitante importado.', { tipo: 'ok', ms: 6000 });
        lista = contas.listar();
        inicio();
      } catch (e) { toast(e.message, { tipo: 'erro', ms: 6000 }); }
    }

    inicio();
  });
}

// Tela de bloqueio (inatividade): mesma conta, só pede a senha.
export function telaBloqueio(raiz, contas, conta) {
  return new Promise((resolver) => {
    raiz.innerHTML = `<div class="porta-form" style="min-height:100dvh"><form class="porta-card pilha g card" novalidate style="padding:28px">
      <div class="centro">${avatar(conta, 'g')}<h2 style="margin-top:12px">${esc(conta.nome)}</h2><p class="muted mb0">${ic('cadeado')} Sessão bloqueada por inatividade.</p></div>
      ${campoSenha('senha', 'Senha', 'current-password', 'autofocus')}
      <button class="btn primario grande" type="submit">Desbloquear</button>
      <button class="btn fantasma" type="button" data-trocar>Usar outra conta</button></form></div>`;
    const form = raiz.querySelector('form');
    raiz.querySelector('[data-ver]').onclick = (e) => { const i = e.currentTarget.previousElementSibling; i.type = i.type === 'password' ? 'text' : 'password'; };
    raiz.querySelector('input').focus();
    raiz.querySelector('[data-trocar]').onclick = () => resolver(null);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      try { resolver((await contas.entrar(conta.id, new FormData(form).get('senha'))).sessao); } catch (err) { toast(err.message, { tipo: 'erro', ms: 6000 }); btn.disabled = false; }
    });
  });
}
