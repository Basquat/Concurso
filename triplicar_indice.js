/**
 * Triplica todo o conteúdo do data/indice.json:
 * - Cada aula aparece 3x (com sufixos -v1, -v2, -v3)
 * - Cada arquivo de questões tem versão triplicada
 * - Contagens são multiplicadas por 3
 */

const fs = require('fs');

const indicePath = './data/indice.json';
const rawData = fs.readFileSync(indicePath, 'utf8');
const data = JSON.parse(rawData);

// 1. Triplicar aulas
const novasAulas = [];

data.aulas.forEach((aula, index) => {
  // Create 3 versions of each aula
  for (let v = 1; v <= 3; v++) {
    const sufixo = v === 1 ? '' : `-v${v}`;
    const novoId = `${aula.id}${sufixo}`;
    const novoTitulo = `${aula.titulo} (${v})`;
    
    novasAulas.push({
      id: novoId,
      titulo: novoTitulo,
      area: aula.area,
      disciplina: aula.disciplina,
      cargos: aula.cargos,
      labs: aula.labs,
      resumo: `${aula.resumo} Versão ${v}.`,
      nivel: aula.nivel,
      duracao: aula.duracao,
      ordem: aula.ordem + (index * 3 + v - 1),
      busca: `${novoTitulo} ${aula.busca}`,
      slides: aula.slides,
      cartoes: aula.cartoes,
      quizzes: aula.quizzes
    });
  }
});

// Replace aulas with triplicated version
data.aulas = novasAulas;

// 2. Atualizar total de questões (multiplicar por 3)
const areaKeys = Object.keys(data.questoes.porArea);
data.questoes.total = data.questoes.total * 3;

// 3. Multiplicar porArea por 3
const newPorArea = {};
areaKeys.forEach(key => {
  newPorArea[key] = data.questoes.porArea[key] * 3;
});
data.questoes.porArea = newPorArea;

// 4. Multiplicar porDisciplina por 3
const newPorDisciplina = {};
const disciplinaKeys = Object.keys(data.questoes.porDisciplina);
disciplinaKeys.forEach(key => {
  newPorDisciplina[key] = data.questoes.porDisciplina[key] * 3;
});
data.questoes.porDisciplina = newPorDisciplina;

// 5. Adicionar novos arquivos de referência
const novosArquivos = [
  'adm-publica-triplicado.txt',
  'contabil-triplicado.txt', 
  'direito-triplicado.txt',
  'educacao-triplicado.txt',
  'financas-triplicado.txt',
  'gestao-triplicado.txt',
  'informatica-triplicado.txt',
  'investimentos-triplicado.txt',
  'logica-triplicado.txt',
  'portugues-triplicado.txt',
  'rh-triplicado.txt',
  'saude-triplicado.txt',
  'ti-triplicado.txt',
  'comuns-banca-triplicado.txt',
  'comuns-v2-triplicado.txt',
  'comuns-v3-triplicado.txt'
];

// Adicionar ao final da lista, sem duplicatas
const arquivosExistentes = new Set(data.questoes.arquivos);
novosArquivos.forEach(arquivo => {
  if (!arquivosExistentes.has(arquivo)) {
    data.questoes.arquivos.push(arquivo);
  }
});

// 6. Salvar
fs.writeFileSync(indicePath, JSON.stringify(data, null, 2));
console.log('Indice triplicado com sucesso!');
console.log(`Total de aulas: ${data.aulas.length} (original had ${data.aulas.length / 3} base aulas)`);
console.log(`Total de questões: ${data.questoes.total}`);
console.log(`porArea:`, JSON.stringify(data.questoes.porArea, null, 2));
console.log(`porDisciplina count: ${Object.keys(data.questoes.porDisciplina).length} disciplinas`);