export const MISSOES_SERVIDOR = [
  { id: 'servidor-ligar', titulo: 'Ligar o servidor', xp: 50, description: 'Use o comando "ligar" no terminal.', dica: 'Use o comando "ligar" no terminal.' },
  { id: 'servidor-nginx', titulo: 'Instalar e iniciar nginx', xp: 75, description: 'Instale o pacote nginx e inicie o serviço.', dica: 'Use "instalar nginx" e depois "instalar-servico nginx".' },
  { id: 'servidor-pgsql', titulo: 'Instalar PostgreSQL', xp: 75, description: 'Instale o pacote postgresql.', dica: 'Use "instalar postgresql".' },
  { id: 'servidor-usuario', titulo: 'Criar um usuário com sudo', xp: 60, description: 'Crie um novo usuário.', dica: 'Use "add-usuario nome tipo sudo".' },
  { id: 'servidor-rede', titulo: 'Configurar a rede', xp: 80, description: 'Configure o IP e a máscara.', dica: 'Use "config-rede 192.168.1.10/24".' },
  { id: 'servidor-status', titulo: 'Consultar status do servidor', xp: 40, description: 'Exiba o status do servidor.', dica: 'Use "status" a qualquer momento.' },
];