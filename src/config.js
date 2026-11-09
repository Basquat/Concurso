// Endereço da API (mesma origem na Vercel e no `npm run dev`). Vazio = modo só local, sem contas na nuvem nem
// assinatura. No GitHub Pages antigo não há API: ele segue em modo local até ser desligado.
export const NUVEM_URL = location.hostname.endsWith('.github.io') ? '' : '/api';

// Endereço novo (Vercel). Preenchido, o site antigo do GitHub Pages mostra o aviso de mudança com o caminho do backup.
export const NOVO_ENDERECO = '';
