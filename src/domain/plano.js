// Plano de estudos até a prova: distribui o tempo disponível de cada dia entre revisões, aulas, questões,
// redação/discursiva, prática em laboratório e simulados, proporcional ao peso de cada área (ou bloco do edital)
// e inverso ao domínio atual.

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const deIso = (s) => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };

/**
 * @param {{ hoje: string, prova: string, minutos: number[],
 *   areas: {area: string, chave?: string, peso: number, dominio: number, nome: string, aulas?: string[], labs?: string[]}[],
 *   aulas: {id: string, area: string, titulo: string, duracao: number}[], concluidas?: Set<string>, redacao?: boolean,
 *   discursiva?: string[] }} p
 *   minutos: disponibilidade por dia da semana (0 = domingo ... 6 = sábado).
 *   chave: identifica um bloco do edital quando vários blocos são da mesma área (ex.: 6 blocos de TI); com `aulas`
 *   (ids) o bloco recebe só essas aulas, na ordem dada. labs: práticas intercaladas com as questões do bloco.
 *   discursiva: temas de prova discursiva, um por semana, em rodízio.
 */
export function gerarPlano({ hoje, prova, minutos, areas, aulas, concluidas = new Set(), redacao = false, discursiva = [] }) {
  const dias = [];
  const fila = {};
  const ch = (a) => a.chave ?? a.area;
  const porId = new Map(aulas.map((x) => [x.id, x]));
  for (const a of areas) {
    fila[ch(a)] = (a.aulas ? a.aulas.map((id) => porId.get(id)).filter(Boolean) : aulas.filter((x) => x.area === a.area)).filter((x) => !concluidas.has(x.id));
  }
  const prioridade = Object.fromEntries(areas.map((a) => [ch(a), Math.max(0.05, a.peso * (1.25 - Math.min(1, a.dominio)))]));
  const credito = Object.fromEntries(areas.map((a) => [ch(a), 0]));
  const vezLab = Object.fromEntries(areas.map((a) => [ch(a), 0]));
  let tema = 0;
  const fim = deIso(prova);
  let semanaSimulado = null;
  let semanaRedacao = null;

  for (let d = deIso(hoje); d < fim; d.setDate(d.getDate() + 1)) {
    const data = iso(d);
    let livre = minutos[d.getDay()] ?? 0;
    const blocos = [];
    const diasParaProva = Math.round((fim - d) / 86400000);
    const semana = iso(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)));
    if (livre <= 0) { dias.push({ data, blocos }); continue; }

    if (livre >= 30) {
      const rev = Math.min(30, Math.round(livre * 0.2));
      blocos.push({ tipo: 'revisao', titulo: 'Revisões do dia (cartões e questões vencidas)', min: rev, href: '#/revisoes' });
      livre -= rev;
    }
    const maxDia = Math.max(...minutos);
    if (semanaSimulado !== semana && livre >= 90 && (minutos[d.getDay()] === maxDia || d.getDay() === 6)) {
      const m = Math.min(livre, diasParaProva <= 14 ? 180 : 120);
      blocos.push({ tipo: 'simulado', titulo: diasParaProva <= 14 ? 'Simulado completo do cargo' : 'Simulado (rápido ou completo)', min: m, href: '#/simulado' });
      livre -= m;
      semanaSimulado = semana;
    }
    if ((redacao || discursiva.length) && semanaRedacao !== semana && livre >= 60 && d.getDay() !== 6) {
      if (discursiva.length) blocos.push({ tipo: 'discursiva', titulo: `Discursiva (30 linhas, 40 min): ${discursiva[tema++ % discursiva.length]}`, min: 60, href: '#/plano' });
      else blocos.push({ tipo: 'redacao', titulo: 'Redação: um texto dissertativo cronometrado', min: 60, href: '#/lab/redacao' });
      livre -= 60;
      semanaRedacao = semana;
    }
    // Reta final (7 dias): sem conteúdo novo, só questões.
    const retaFinal = diasParaProva <= 7;
    let guarda = 0;
    while (livre >= 15 && guarda++ < 8) {
      for (const a of areas) credito[ch(a)] += prioridade[ch(a)];
      const alvo = [...areas].sort((x, y) => credito[ch(y)] - credito[ch(x)])[0];
      if (!alvo) break;
      const k = ch(alvo);
      credito[k] -= Object.values(prioridade).reduce((s, v) => s + v, 0);
      const proxAula = !retaFinal && fila[k].length ? fila[k][0] : null;
      const lab = !retaFinal && alvo.labs?.length && vezLab[k]++ % 2 === 1 ? alvo.labs[(vezLab[k] >> 1) % alvo.labs.length] : null;
      if (proxAula && livre >= Math.min(proxAula.duracao, 40)) {
        const m = Math.min(livre, proxAula.duracao);
        blocos.push({ tipo: 'aula', area: alvo.area, titulo: `Aula: ${proxAula.titulo}`, min: m, href: `#/aulas/${proxAula.id}` });
        fila[k].shift();
        livre -= m;
        if (livre >= 15) { const q = Math.min(livre, 20); blocos.push({ tipo: 'questoes', area: alvo.area, titulo: `Questões de ${alvo.nome}`, min: q, href: `#/questoes?area=${alvo.area}` }); livre -= q; }
      } else if (lab && livre >= 25) {
        const m = Math.min(livre, 40);
        blocos.push({ tipo: 'pratica', area: alvo.area, titulo: `Prática de ${alvo.nome}: laboratório`, lab, min: m, href: `#/lab/${lab}` });
        livre -= m;
      } else {
        const q = Math.min(livre, 30);
        blocos.push({ tipo: 'questoes', area: alvo.area, titulo: `Questões de ${alvo.nome}`, min: q, href: `#/questoes?area=${alvo.area}` });
        livre -= q;
      }
    }
    dias.push({ data, blocos });
  }
  return { dias, pendentes: Object.values(fila).reduce((s, f) => s + f.length, 0) };
}

export const totalMin = (dias) => dias.reduce((s, d) => s + d.blocos.reduce((t, b) => t + b.min, 0), 0);

// Resumo semanal (semana começando na segunda): minutos por tipo de atividade.
export function porSemana(dias) {
  const semanas = [];
  for (const d of dias) {
    const dt = new Date(`${d.data}T12:00`);
    const ini = new Date(dt); ini.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
    const chave = iso(ini);
    let s = semanas[semanas.length - 1];
    if (!s || s.inicio !== chave) semanas.push(s = { inicio: chave, total: 0, tipos: {} });
    for (const b of d.blocos) {
      s.total += b.min; s.tipos[b.tipo] = (s.tipos[b.tipo] ?? 0) + b.min;
    }
  }
  return semanas;
}
