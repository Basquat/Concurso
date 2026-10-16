// Plano de estudos até a prova: distribui o tempo disponível de cada dia entre revisões, aulas, questões,
// redação e simulados, proporcional ao peso de cada área no edital e inverso ao domínio atual.

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const deIso = (s) => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d); };

/**
 * @param {{ hoje: string, prova: string, minutos: number[], areas: {area: string, peso: number, dominio: number, nome: string}[],
 *   aulas: {id: string, area: string, titulo: string, duracao: number}[], concluidas?: Set<string>, redacao?: boolean }} p
 *   minutos: disponibilidade por dia da semana (0 = domingo ... 6 = sábado).
 */
export function gerarPlano({ hoje, prova, minutos, areas, aulas, concluidas = new Set(), redacao = false }) {
  const dias = [];
  const fila = {};
  for (const a of areas) fila[a.area] = aulas.filter((x) => x.area === a.area && !concluidas.has(x.id));
  const prioridade = Object.fromEntries(areas.map((a) => [a.area, Math.max(0.05, a.peso * (1.25 - Math.min(1, a.dominio)))]));
  const credito = Object.fromEntries(areas.map((a) => [a.area, 0]));
  const fim = deIso(prova);
  let semanaSimulado = null;
  let semanaRedacao = null;

  for (let d = deIso(hoje); d < fim; d.setDate(d.getDate() + 1)) {
    const data = iso(d);
    let livre = minutos[d.getDay()] ?? 0;
    const blocos = [];
    const diasParaProva = Math.round((fim - d) / 86400000);
    const semana = `${d.getFullYear()}-${Math.floor((d - new Date(d.getFullYear(), 0, 1)) / (7 * 86400000))}`;
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
    if (redacao && semanaRedacao !== semana && livre >= 60 && d.getDay() !== 6) {
      blocos.push({ tipo: 'redacao', titulo: 'Redação: um texto dissertativo cronometrado', min: 60, href: '#/lab/redacao' });
      livre -= 60;
      semanaRedacao = semana;
    }
    // Reta final (7 dias): sem conteúdo novo, só questões.
    const retaFinal = diasParaProva <= 7;
    let guarda = 0;
    while (livre >= 15 && guarda++ < 8) {
      for (const a of areas) credito[a.area] += prioridade[a.area];
      const alvo = [...areas].sort((x, y) => credito[y.area] - credito[x.area])[0];
      if (!alvo) break;
      credito[alvo.area] -= Object.values(prioridade).reduce((s, v) => s + v, 0);
      const proxAula = !retaFinal && fila[alvo.area].length ? fila[alvo.area][0] : null;
      if (proxAula && livre >= Math.min(proxAula.duracao, 40)) {
        const m = Math.min(livre, proxAula.duracao);
        blocos.push({ tipo: 'aula', area: alvo.area, titulo: `Aula: ${proxAula.titulo}`, min: m, href: `#/aulas/${proxAula.id}` });
        fila[alvo.area].shift();
        livre -= m;
        if (livre >= 15) { const q = Math.min(livre, 20); blocos.push({ tipo: 'questoes', area: alvo.area, titulo: `Questões de ${alvo.nome}`, min: q, href: `#/questoes?area=${alvo.area}` }); livre -= q; }
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
