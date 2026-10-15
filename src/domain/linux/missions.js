// Missões do laboratório Linux: cada uma verifica o ESTADO do servidor simulado,
// não os comandos digitados — qualquer caminho correto é aceito, como na vida real.
import { existe, lerArquivo, modo, testarNginx, usoVar } from './shell.js';

const linhasCom = (txt, termo) => txt.split('\n').filter((l) => l.includes(termo));

export const MISSOES_LINUX = [
  {
    id: 'organizar', titulo: 'Organizar o projeto', xp: 20,
    descricao: 'Crie a estrutura ~/projetos/site com as subpastas css e js.',
    dica: 'mkdir -p cria diretórios intermediários. Tente: mkdir -p ~/projetos/site/{css,js}',
    check: (st) => existe(st, '/home/aluno/projetos/site/css', 'd') && existe(st, '/home/aluno/projetos/site/js', 'd'),
  },
  {
    id: 'index', titulo: 'Primeira página', xp: 20,
    descricao: 'Crie ~/projetos/site/index.html contendo o texto Bem-vindo.',
    dica: 'echo "<h1>Bem-vindo</h1>" > ~/projetos/site/index.html  (ou use nano)',
    check: (st) => (lerArquivo(st, '/home/aluno/projetos/site/index.html') ?? '').includes('Bem-vindo'),
  },
  {
    id: 'deploy', titulo: 'Permissão de execução', xp: 30,
    descricao: 'O script ~/deploy.sh não executa. Dê permissão de execução ao dono e rode-o com ./deploy.sh.',
    dica: 'Veja as permissões com ls -l. Depois: chmod u+x deploy.sh (ou chmod 755) e ./deploy.sh',
    check: (st) => ((modo(st, '/home/aluno/deploy.sh') ?? 0) & 0o100) !== 0 && !!st.executados['/home/aluno/deploy.sh'] && existe(st, '/home/aluno/releases/v1/status.txt', 'f'),
  },
  {
    id: 'logs', titulo: 'Investigar logs', xp: 30,
    descricao: 'Grave em ~/erros.txt somente as linhas com ERROR do arquivo /var/log/app.log.',
    dica: 'grep filtra linhas; > redireciona a saída para um arquivo.',
    check: (st) => {
      const esperado = linhasCom(lerArquivo(st, '/var/log/app.log') ?? '', 'ERROR');
      const feito = (lerArquivo(st, '/home/aluno/erros.txt') ?? '').split('\n').filter(Boolean);
      return esperado.length > 0 && feito.join('\n') === esperado.join('\n');
    },
  },
  {
    id: 'ip-top', titulo: 'Quem mais acessa?', xp: 40,
    descricao: 'Descubra qual IP fez mais requisições em /var/log/nginx/access.log e grave somente o IP em ~/ip.txt.',
    dica: 'Combine com pipes: cut -d" " -f1 arquivo | sort | uniq -c | sort -nr | head -1',
    check: (st) => {
      const cont = {};
      for (const l of (lerArquivo(st, '/var/log/nginx/access.log') ?? '').split('\n').filter(Boolean)) {
        const ip = l.split(' ')[0];
        cont[ip] = (cont[ip] ?? 0) + 1;
      }
      const top = Object.entries(cont).sort((a, b) => b[1] - a[1])[0]?.[0];
      return !!top && (lerArquivo(st, '/home/aluno/ip.txt') ?? '').trim() === top;
    },
  },
  {
    id: 'disco', titulo: 'Disco cheio', xp: 40,
    descricao: 'A partição /var está quase lotada. Encontre o arquivo gigante esquecido em /var/log e libere espaço até ficar abaixo de 80%.',
    dica: 'df -h mostra o uso; find /var -size +1G localiza arquivos grandes; ls -lh mostra tamanhos. Remover em /var/log exige sudo.',
    check: (st) => usoVar(st) < 80,
  },
  {
    id: 'processo', titulo: 'Processo suspeito', xp: 40,
    descricao: 'Algo está consumindo 99% da CPU. Identifique o processo e encerre-o.',
    dica: 'top ou ps aux mostram consumo. kill PID encerra; processos de outro usuário exigem sudo.',
    check: (st) => !st.procs.some((p) => p.cmd.includes('cryptominer')),
  },
  {
    id: 'nginx', titulo: 'Subir o servidor web', xp: 50,
    descricao: 'O nginx não inicia. Encontre o erro de configuração, corrija, inicie o serviço e habilite-o no boot.',
    dica: 'sudo systemctl start nginx → falha. nginx -t aponta arquivo e linha. Corrija com sudo nano. Depois sudo systemctl enable nginx.',
    check: (st) => testarNginx(st).ok && st.servicos.nginx.ativo && st.servicos.nginx.habilitado,
  },
  {
    id: 'firewall', titulo: 'Firewall mínimo', xp: 40,
    descricao: 'Ative o firewall (ufw) liberando apenas SSH (22) e HTTP (80).',
    dica: 'Libere ANTES de ativar para não perder o acesso: sudo ufw allow 22, sudo ufw allow 80, sudo ufw enable.',
    check: (st) => {
      const portas = st.ufw.regras.filter((r) => r.acao === 'ALLOW').map((r) => r.porta).sort();
      return st.ufw.ativo && portas.join(',') === '22,80';
    },
  },
  {
    id: 'ssh', titulo: 'Endurecer o SSH', xp: 40,
    descricao: 'Proíba o login direto do root via SSH e reinicie o serviço para aplicar.',
    dica: 'Edite /etc/ssh/sshd_config (PermitRootLogin no) e rode sudo systemctl restart ssh. Configuração só vale após reiniciar.',
    check: (st) => /^\s*PermitRootLogin\s+no\s*$/m.test(st.servicos.ssh.carregado ?? '') && st.servicos.ssh.ativo,
  },
  {
    id: 'dns', titulo: 'Resolução de nomes', xp: 30,
    descricao: 'ping concursos.gov.br falha com "Falha temporária na resolução de nome". Configure um servidor DNS.',
    dica: 'O resolvedor lê /etc/resolv.conf. Adicione uma linha nameserver IP (ex.: 1.1.1.1). Dica: echo ... | sudo tee -a',
    check: (st) => /^\s*nameserver\s+\d+\.\d+\.\d+\.\d+/m.test(lerArquivo(st, '/etc/resolv.conf') ?? ''),
  },
];
