// Laboratório Docker: terminal + painel de contêineres, imagens e arquivos (Dockerfile e compose.yaml editáveis).
import { esc } from '../dom.js';
import { novoDocker, executar } from '../../../domain/docker.js';
import { terminal } from '../componentes/terminal.js';

export default async function docker(el, ctx, kit) {
  let d = kit.estado.carregar() ?? novoDocker();
  const missoes = kit.missoes([
    { id: 'hello', titulo: 'Hello, Docker', descricao: '`docker run hello-world`', xp: 10, checar: (x) => x.conteineres.some((c) => c.imagem.startsWith('hello-world')) },
    { id: 'nginx', titulo: 'Servidor web em contêiner', descricao: 'Suba o nginx em segundo plano publicando a porta 8080: `docker run -d -p 8080:80 --name web nginx` e teste com `curl localhost:8080`.', xp: 30, checar: (x) => x.conteineres.some((c) => c.imagem.startsWith('nginx') && c.estado === 'running' && c.portas.some((p) => p.host === 8080 && p.cont === 80)) },
    { id: 'env', titulo: 'Variáveis de ambiente', descricao: 'Rode um postgres que **não** falhe na inicialização (dica: `docker logs` explica o erro).', xp: 30, checar: (x) => x.conteineres.some((c) => c.imagem.startsWith('postgres') && c.estado === 'running') },
    { id: 'volume', titulo: 'Persistência com volume', descricao: 'Crie um contêiner com `-v dados:/var/lib/postgresql/data`.', xp: 20, checar: (x) => x.volumes.includes('dados') },
    { id: 'build', titulo: 'Sua própria imagem', descricao: '`docker build -t minha-api:1.0 .` a partir do Dockerfile.', xp: 30, checar: (x) => !!x.imagens['minha-api:1.0'] },
    { id: 'compose', titulo: 'Docker Compose', descricao: '`docker compose up -d` sobe web + banco do compose.yaml.', xp: 30, checar: (x) => x.conteineres.filter((c) => c.nome.startsWith('projeto-') && c.estado === 'running').length >= 2 },
    { id: 'limpeza', titulo: 'Limpeza', descricao: 'Pare e remova um contêiner (`docker stop`, `docker rm`).', xp: 20, checar: (x) => x._removeu },
  ]);
  kit.referencia('<dl><dt>docker run -d -p H:C img</dt><dd>cria e inicia; -d em segundo plano; publica porta</dd><dt>docker ps [-a]</dt><dd>contêineres (ativos/todos)</dd><dt>docker logs c</dt><dd>saída do contêiner</dd><dt>docker exec c cmd</dt><dd>comando dentro do contêiner</dd><dt>docker stop/start/rm</dt><dd>ciclo de vida</dd><dt>docker images / rmi</dt><dd>imagens locais</dd><dt>docker build -t n .</dt><dd>imagem a partir do Dockerfile</dd><dt>docker compose up -d</dt><dd>sobe vários serviços</dd></dl>');
  kit.teoria('**Imagem** é o molde imutável em camadas; **contêiner** é a instância em execução, isolada por *namespaces* e limitada por *cgroups*, compartilhando o kernel do host — por isso é mais leve que uma **máquina virtual** (que tem SO completo sobre um hipervisor).\n\n> [!prova] Cai em prova\n> `EXPOSE` só documenta a porta; quem publica é `-p host:contêiner`. `CMD` pode ser sobrescrito no `docker run`; `ENTRYPOINT` define o executável.');
  el.innerHTML = '<div class="dividido"><div id="t"></div><div class="pilha"><div class="card" id="cs"></div><div class="card"><h3 class="mt0">Arquivos</h3><label class="campo">Dockerfile<textarea id="df" class="mono" rows="7"></textarea></label><label class="campo mt1">compose.yaml<textarea id="cy" class="mono" rows="9"></textarea></label></div></div></div>';
  const pintar = () => {
    el.querySelector('#cs').innerHTML = `<h3 class="mt0">Contêineres</h3>${d.conteineres.length ? `<table class="tabela compacta"><tbody>${d.conteineres.map((c) => `<tr><td class="mono">${esc(c.nome)}</td><td>${esc(c.imagem)}</td><td><span class="tag ${c.estado === 'running' ? 'ok' : c.codigo ? 'erro' : ''}">${c.estado}</span></td><td class="mono mini">${c.portas.map((p) => `${p.host}→${p.cont}`).join(' ')}</td></tr>`).join('')}</tbody></table>` : '<p class="muted pequeno">Nenhum contêiner.</p>'}<p class="mini sutil mb0">Imagens: ${Object.keys(d.imagens).map(esc).join(', ') || 'nenhuma'} · Volumes: ${d.volumes.map(esc).join(', ') || 'nenhum'}</p>`;
  };
  const df = el.querySelector('#df');
  const cy = el.querySelector('#cy');
  df.value = d.arquivos.Dockerfile;
  cy.value = d.arquivos['compose.yaml'];
  df.oninput = () => { d.arquivos.Dockerfile = df.value; kit.estado.salvar(d); };
  cy.oninput = () => { d.arquivos['compose.yaml'] = cy.value; kit.estado.salvar(d); };
  terminal(el.querySelector('#t'), {
    prompt: () => 'aluno@docker-host:~/projeto$ ',
    boasVindas: 'Docker 27 (simulado). Experimente: docker run hello-world',
    aoComando: (c) => { const antes = d.conteineres.length; const s = executar(d, c); if (/docker rm\b/.test(c) && d.conteineres.length < antes) d._removeu = true; kit.estado.salvar(d); missoes.verificar(d); pintar(); return s; },
  });
  kit.aoReiniciar(() => { d = novoDocker(); kit.estado.salvar(d); location.reload(); });
  pintar();
}
