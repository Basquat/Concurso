// Cargo-alvo: seletor, dados da prova e laboratórios ligados ao conteúdo programático.
import { esc } from '../dom.js';
import { mapear } from '../../../domain/cobertura.js';

export const cargoAlvo = (p, concurso) => (p.alvo?.concurso === concurso.id ? concurso.cargos.find((c) => c.codigo === p.alvo.cargo) ?? null : null);

export function seletorCargo(concurso, atual = '') {
  const grupo = (n, rot) => `<optgroup label="${rot}">${concurso.cargos.filter((c) => c.nivel === n).map((c) => `<option value="${esc(c.codigo)}" ${c.codigo === atual ? 'selected' : ''}>${esc(c.codigo)} – ${esc(c.nome)}</option>`).join('')}</optgroup>`;
  return `<select name="cargo" required><option value="">Selecione o cargo</option>${grupo('D', 'Nível médio (classe D)')}${grupo('E', 'Nível superior (classe E)')}</select>`;
}

export function labsDoCargo(concurso, cargo) {
  const labs = new Set();
  for (const pid of cargo.programas) for (const b of concurso.programas[pid].blocos) for (const it of b.itens) mapear(`${b.titulo ?? ''} ${it}`).labs.forEach((l) => labs.add(l));
  return [...labs];
}

// Data da prova do cargo (dd/mm/aaaa) a partir do cronograma.
export function dataProva(concurso, cargo) {
  const ev = (re) => concurso.cronograma?.find((e) => re.test(e.evento))?.data?.match(/\d{2}\/\d{2}\/\d{4}/)?.[0];
  if (cargo?.tabela === '10.8') return ev(/prática – músicos/i) ?? '10/01/2027';
  return ev(/objetiva e redação/i) ?? '20/12/2026';
}
