// Desafios de expressões regulares com o motor RegExp real do JavaScript (o mesmo do navegador e do Node).

export const DESAFIOS = [
  { id: 'cep', titulo: 'CEP', descricao: 'Case CEPs no formato 00000-000 e nada mais.', casar: ['40170-110', '01310-100'], recusar: ['4017-0110', '40170110', '40170-11a', 'x40170-110'], dica: '`^\\d{5}-\\d{3}$` — use ^ e $ para exigir a linha inteira.' },
  { id: 'cpf', titulo: 'CPF formatado', descricao: 'Formato 000.000.000-00.', casar: ['123.456.789-09', '000.111.222-33'], recusar: ['12345678909', '123.456.789-0', '123-456-789.09'], dica: 'O ponto é especial: escape com `\\.`.' },
  { id: 'data', titulo: 'Data dd/mm/aaaa', descricao: 'Dia de 01 a 31 e mês de 01 a 12, com quatro dígitos no ano.', casar: ['20/12/2026', '01/01/2027', '31/10/2026'], recusar: ['32/01/2026', '2026-12-20', '1/1/2026', '15/13/2026'], dica: 'Grupos com alternativas: `(0[1-9]|[12]\\d|3[01])`.' },
  { id: 'placa', titulo: 'Placa Mercosul', descricao: 'Três letras maiúsculas, um dígito, uma letra e dois dígitos (ex.: ABC1D23).', casar: ['ABC1D23', 'RIO2A18'], recusar: ['ABC-1234', 'AB1C234', 'abc1d23', 'ABC1D234'], dica: '`[A-Z]{3}` casa três letras maiúsculas.' },
  { id: 'email', titulo: 'E-mail institucional', descricao: 'Apenas endereços do domínio ufba.br.', casar: ['ana.souza@ufba.br', 'joao@ufba.br'], recusar: ['ana@gmail.com', 'ana@ufba.br.com', '@ufba.br', 'ana@ufbaxbr'], dica: 'Escape o ponto do domínio e ancore o fim: `@ufba\\.br$`.' },
  { id: 'nup', titulo: 'Número de processo (NUP)', descricao: 'Formato 23066.012345/2026-11.', casar: ['23066.012345/2026-11', '00000.000001/2025-00'], recusar: ['23066012345/2026-11', '23066.012345-2026-11', '2306.012345/2026-11'], dica: 'A barra pode ser escrita como `\\/`.' },
  { id: 'telefone', titulo: 'Telefone com DDD', descricao: 'Fixo (71) 3333-4444 ou celular (71) 99999-8888.', casar: ['(71) 3333-4444', '(11) 98765-4321'], recusar: ['71 3333-4444', '(71)3333-4444', '(71) 333-4444', '(7) 99999-8888'], dica: 'Parênteses são especiais: `\\(` e `\\)`. Use `\\d{4,5}`.' },
  { id: 'log', titulo: 'Erros no log', descricao: 'Encontre as linhas que contêm a palavra ERROR (maiúscula), em qualquer posição.', casar: ['2026-10-29 10:01 ERROR timeout', 'ERROR: disco cheio'], recusar: ['INFO tudo certo', 'error em minúsculas', 'WARN quase ERRO'], dica: 'Sem âncoras, a busca acontece em qualquer parte da linha.' },
  { id: 'ipv4', titulo: 'Formato de IPv4', descricao: 'Quatro grupos de 1 a 3 dígitos separados por ponto (não precisa validar o limite 255).', casar: ['192.168.0.1', '10.0.0.254', '8.8.8.8'], recusar: ['192.168.0', '1.2.3.4.5', 'a.b.c.d', '192.168.0.1234'], dica: '`(\\d{1,3}\\.){3}\\d{1,3}` com âncoras.' },
  { id: 'senha', titulo: 'Senha forte', descricao: 'Pelo menos 8 caracteres, com letra minúscula, maiúscula e dígito.', casar: ['Concurso2026', 'aB3defgh'], recusar: ['concurso2026', 'CONCURSO2026', 'Concurso', 'aB3'], dica: 'Lookaheads: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$`.' },
];

// Avalia um padrão contra um desafio: { ok, erro?, linhas: [{ texto, deve, casou }] }.
export function avaliar(padrao, flags, desafio) {
  let re;
  try { re = new RegExp(padrao, flags.replace(/[^gimsuy]/g, '').replace('g', '')); } catch (e) { return { ok: false, erro: e.message, linhas: [] }; }
  if (!padrao) return { ok: false, erro: 'Digite um padrão.', linhas: [] };
  const linhas = [...desafio.casar.map((t) => ({ texto: t, deve: true })), ...desafio.recusar.map((t) => ({ texto: t, deve: false }))].map((l) => ({ ...l, casou: re.test(l.texto) }));
  return { ok: linhas.every((l) => l.casou === l.deve), linhas };
}

// Todas as ocorrências num texto livre (para o modo exploração): [{ inicio, fim, texto, grupos }].
export function ocorrencias(padrao, flags, texto, limite = 200) {
  const re = new RegExp(padrao, flags.includes('g') ? flags : `${flags}g`);
  const out = [];
  for (const m of texto.matchAll(re)) {
    out.push({ inicio: m.index, fim: m.index + m[0].length, texto: m[0], grupos: m.slice(1) });
    if (out.length >= limite || m[0] === '') break;
  }
  return out;
}
