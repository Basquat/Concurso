// Cargo-alvo: seletor, dados da prova e laboratórios ligados ao conteúdo programático.
import { esc } from '../dom.js';
import { mapear } from '../../../domain/cobertura.js';

export const cargoAlvo = (p, concurso) => (p.alvo?.concurso === concurso.id ? concurso.cargos.find((c) => c.codigo === p.alvo.cargo) ?? null : null);
// Concurso do cargo-alvo (sem alvo, o edital da UFBA continua sendo o padrão).
export const concursoAlvoId = (p) => p.alvo?.concurso ?? 'ufba-2026';

// Compatibilidade com telas antigas: estudar não exige escolher cargo. O acervo completo é aberto por padrão;
// quando há cargo definido, cada tela oferece a opção de restringir ao edital.
export function semCargo() {
  return false;
}

// Níveis: D/E são as classes do PCCTAE (UFBA); F/M/S, escolaridade dos concursos-modelo.
const NIVEIS = { F: ['fundamental', 'Nível fundamental'], M: ['médio', 'Nível médio'], D: ['médio', 'Nível médio (classe D)'], S: ['superior', 'Nível superior'], E: ['superior', 'Nível superior (classe E)'] };
export const nomeNivel = (n) => NIVEIS[n]?.[0] ?? n;
// Cargos de edital real têm código numérico (ex.: 201 – Assistente); nos concursos-modelo o código é interno.
export const rotuloCargo = (cg) => (/^\d/.test(cg.codigo) ? `${cg.codigo} – ${cg.nome}` : cg.nome);

export function seletorCargo(concurso, atual = '') {
  const niveis = Object.keys(NIVEIS).filter((n) => concurso.cargos.some((c) => c.nivel === n));
  const grupo = (n) => `<optgroup label="${NIVEIS[n][1]}">${concurso.cargos.filter((c) => c.nivel === n).map((c) => `<option value="${esc(c.codigo)}" ${c.codigo === atual ? 'selected' : ''}>${concurso.modelo ? '' : `${esc(c.codigo)} – `}${esc(c.nome)}</option>`).join('')}</optgroup>`;
  return `<select name="cargo" required><option value="">Selecione o cargo</option>${niveis.map(grupo).join('')}</select>`;
}

export function labsDoCargo(concurso, cargo) {
  const labs = new Set();
  for (const pid of cargo.programas) for (const b of concurso.programas[pid].blocos) for (const it of b.itens) mapear(`${b.titulo ?? ''} ${it}`).labs.forEach((l) => labs.add(l));
  return [...labs];
}

// Data da prova do cargo (dd/mm/aaaa) a partir do cronograma; concursos-modelo não têm data (null).
export function dataProva(concurso, cargo) {
  const ev = (re) => concurso.cronograma?.find((e) => re.test(e.evento))?.data?.match(/\d{2}\/\d{2}\/\d{4}/)?.[0];
  if (cargo?.tabela === '10.8') return ev(/prática – músicos/i) ?? '10/01/2027';
  return ev(/objetiva e redação/i) ?? concurso.dataProva ?? null;
}
