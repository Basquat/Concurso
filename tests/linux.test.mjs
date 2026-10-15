import assert from 'node:assert/strict';
import { criarServidor, executar as ex, salvarArquivo } from '../src/domain/linux/shell.js';
import { MISSOES_LINUX } from '../src/domain/linux/missions.js';

const st = criarServidor();
const ok = (id) => MISSOES_LINUX.find((m) => m.id === id).check(st);
const run = (l) => ex(st, l).saida;

// navegação e arquivos
assert.equal(run('pwd'), '/home/aluno');
run('mkdir -p ~/projetos/site/{css,js}');
assert.ok(ok('organizar'));
run('echo "<h1>Bem-vindo</h1>" > ~/projetos/site/index.html');
assert.ok(ok('index'));
assert.match(run('cat /etc/shadow'), /Permissão negada/);
assert.match(run('cd /root'), /Permissão negada/);
assert.match(run('mkdir ~/projetos'), /Arquivo existe/);

// permissões e script
assert.match(run('./deploy.sh'), /Permissão negada/);
assert.ok(!ok('deploy'));
run('chmod u+x deploy.sh');
assert.match(run('ls -l deploy.sh'), /^-rwxr--r--/);
assert.match(run('./deploy.sh'), /Deploy concluído/);
assert.ok(ok('deploy'));

// logs e pipes
run('grep ERROR /var/log/app.log > ~/erros.txt');
assert.ok(ok('logs'));
assert.equal(run('grep -c ERROR /var/log/app.log'), '3');
const top = run('cut -d" " -f1 /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -1');
assert.match(top, /9 203\.0\.113\.45/);
run('echo 203.0.113.45 > ip.txt');
assert.ok(ok('ip-top'));

// disco
assert.match(run('df -h'), /96% \/var/);
assert.match(run('find /var -size +1G'), /\/var\/log\/app\.log\.1/);
assert.match(run('rm /var/log/app.log.1'), /Permissão negada/);
run('sudo rm /var/log/app.log.1');
assert.ok(ok('disco'));

// processo
assert.match(run('kill 1337'), /Operação não permitida/);
run('sudo kill -9 1337');
assert.ok(ok('processo'));

// nginx
assert.match(run('sudo systemctl start nginx'), /failed/);
assert.match(run('nginx -t'), /invalid parameter "server_name" in \/etc\/nginx\/sites-enabled\/default:3/);
assert.match(run('curl localhost'), /Failed to connect/);
assert.equal(salvarArquivo(st, '/etc/nginx/sites-enabled/default', 'x', false), '/etc/nginx/sites-enabled/default: Permissão negada');
assert.equal(salvarArquivo(st, '/etc/nginx/sites-enabled/default', 'server {\n    listen 80;\n    root /var/www/html;\n}\n', true), null);
run('sudo systemctl start nginx && sudo systemctl enable nginx');
assert.ok(ok('nginx'));
assert.match(run('curl localhost'), /Bem-vindo ao nginx/);

// firewall
assert.match(run('ufw status'), /need to be root/);
run('sudo ufw allow ssh; sudo ufw allow 80/tcp; sudo ufw enable');
assert.ok(ok('firewall'));

// ssh: só vale após restart
salvarArquivo(st, '/etc/ssh/sshd_config', 'Port 22\nPermitRootLogin no\n', true);
assert.ok(!ok('ssh'));
run('sudo systemctl restart ssh');
assert.ok(ok('ssh'));

// dns
assert.match(run('ping -c 1 concursos.gov.br'), /Falha temporária/);
assert.match(run('echo "nameserver 1.1.1.1" > /etc/resolv.conf'), /Permissão negada/);
run('echo "nameserver 1.1.1.1" | sudo tee -a /etc/resolv.conf');
assert.ok(ok('dns'));
assert.match(run('ping -c 1 concursos.gov.br'), /1 received/);

// segurança do simulador
assert.match(run('rm -rf /'), /Bloqueado/);
assert.match(run(':(){ :|:& };:'), /bloqueado/);
assert.match(run('xpto'), /comando não encontrado/);
assert.match(run('ls /nada 2>/dev/null; echo fim'), /^fim$/);

assert.ok(MISSOES_LINUX.every((m) => m.check(st)), 'todas as missões concluídas');
console.log('linux ok');
