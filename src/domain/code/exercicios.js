// Exercícios da IDE. Modos de verificação:
//  testes   → JavaScript executado de verdade num Web Worker isolado, com asserções;
//  saida    → PHP executado de verdade (PHP 8 compilado para WebAssembly) e saída comparada;
//  estatico → Java: verificação estrutural do código-fonte (não compila nem executa).

export const EXERCICIOS = [
  {
    id: 'js-media', lang: 'javascript', titulo: 'Média das notas', xp: 30,
    enunciado: 'Implemente media(notas): devolve a média aritmética do array; para array vazio, devolva 0.',
    arquivos: { 'media.js': 'function media(notas) {\n  // seu código aqui\n}\n\nconsole.log(media([7, 8, 9]));\n' },
    verificar: { tipo: 'testes', testes: [
      ['media([7, 8, 9]) === 8', 'media([7, 8, 9]) === 8'],
      ['media([10]) === 10', 'media([10]) === 10'],
      ['media([]) === 0', 'media([]) === 0'],
      ['media([5, 6]) === 5.5', 'media([5, 6]) === 5.5'],
    ] },
  },
  {
    id: 'js-situacao', lang: 'javascript', titulo: 'Situação do candidato', xp: 30,
    enunciado: 'Implemente situacao(nota): "Aprovado" se nota ≥ 7, "Recuperação" se 5 ≤ nota < 7, senão "Reprovado". Nota fora de 0–10 lança Error.',
    arquivos: { 'situacao.js': 'function situacao(nota) {\n  \n}\n' },
    verificar: { tipo: 'testes', testes: [
      ['situacao(7) === "Aprovado"', 'situacao(7) === "Aprovado"'],
      ['situacao(6.9) === "Recuperação"', 'situacao(6.9) === "Recuperação"'],
      ['situacao(5) === "Recuperação"', 'situacao(5) === "Recuperação"'],
      ['situacao(4.99) === "Reprovado"', 'situacao(4.99) === "Reprovado"'],
      ['situacao(11) lança erro', '(() => { try { situacao(11); return false; } catch (e) { return true; } })()'],
    ] },
  },
  {
    id: 'js-cpf', lang: 'javascript', titulo: 'Máscara de CPF', xp: 30,
    enunciado: 'Implemente formatarCPF(s): recebe 11 dígitos (pode vir com pontos/traço) e devolve no formato 000.000.000-00. Entrada inválida devolve null.',
    arquivos: { 'cpf.js': 'function formatarCPF(s) {\n  \n}\n' },
    verificar: { tipo: 'testes', testes: [
      ['formatarCPF("12345678909")', 'formatarCPF("12345678909") === "123.456.789-09"'],
      ['formatarCPF("123.456.789-09")', 'formatarCPF("123.456.789-09") === "123.456.789-09"'],
      ['formatarCPF("123") === null', 'formatarCPF("123") === null'],
    ] },
  },
  {
    id: 'php-tabuada', lang: 'php', titulo: 'Tabuada do 7', xp: 30,
    enunciado: 'Imprima a tabuada do 7 de 1 a 10, uma linha por resultado, no formato "7 x 1 = 7".',
    arquivos: { 'tabuada.php': '<?php\n\nfor ($i = 1; $i <= 10; $i++) {\n    // seu código aqui\n}\n' },
    verificar: { tipo: 'saida', esperado: Array.from({ length: 10 }, (_, i) => `7 x ${i + 1} = ${7 * (i + 1)}`).join('\n') },
  },
  {
    id: 'php-classe', lang: 'php', titulo: 'Classe Servidor', xp: 40,
    enunciado: 'Crie a classe Servidor com construtor recebendo $salario e o método remuneracaoAnual(): 13 salários + 1/3 de férias (salário/3). Ao final, imprima a remuneração anual de um servidor com salário 3000 (resultado: 40000).',
    arquivos: { 'Servidor.php': '<?php\n\nclass Servidor\n{\n    // propriedades, construtor e método\n}\n\n$s = new Servidor(3000);\necho $s->remuneracaoAnual();\n' },
    verificar: { tipo: 'saida', esperado: '40000' },
  },
  {
    id: 'php-pdo', lang: 'php', titulo: 'Consulta segura com PDO', xp: 40,
    enunciado: 'Reescreva a consulta para evitar SQL injection usando prepare() com parâmetro nomeado (:cpf) e execute(). Verificação estrutural: o banco não é acessado.',
    arquivos: { 'busca.php': '<?php\n\n$pdo = new PDO(\'sqlite::memory:\');\n$cpf = $_GET[\'cpf\'];\n$stmt = $pdo->query("SELECT nome FROM candidatos WHERE cpf = \'$cpf\'");\n' },
    verificar: { tipo: 'estatico', regras: [
      [/->prepare\s*\(\s*["'][^"']*:cpf/, 'Use $pdo->prepare("... WHERE cpf = :cpf")'],
      [/->execute\s*\(\s*\[\s*['"]?:?cpf['"]?\s*=>\s*\$cpf/, "Passe o valor no execute([':cpf' => $cpf])"],
      [/^(?![\s\S]*->query\s*\([^)]*\$cpf)/, 'Não concatene/interpole $cpf dentro de query()'],
    ] },
  },
  {
    id: 'java-ola', lang: 'java', titulo: 'Olá, concurso!', xp: 20,
    enunciado: 'Corrija o programa para que compile e imprima Olá, concurso! (verificação estática: o código não é compilado no navegador).',
    arquivos: { 'Main.java': 'public class Programa {\n    public static void main(String[] args) {\n        System.out.println("Olá, concurso!")\n    }\n}\n' },
    verificar: { tipo: 'estatico', semErros: true, regras: [
      [/public\s+class\s+Main\b/, 'A classe pública deve se chamar Main (nome do arquivo).'],
      [/System\.out\.println\s*\(\s*"Olá, concurso!"\s*\)\s*;/, 'Imprima exatamente "Olá, concurso!" com System.out.println e ;'],
    ] },
  },
  {
    id: 'java-heranca', lang: 'java', titulo: 'Herança e sobrescrita', xp: 40,
    enunciado: 'Crie Professor que herda de Servidor e sobrescreve calcularSalario() somando uma gratificação de 20% (return super.calcularSalario() * 1.2). Use @Override.',
    arquivos: { 'Main.java': 'class Servidor {\n    protected double salarioBase = 3000;\n\n    double calcularSalario() {\n        return salarioBase;\n    }\n}\n\n// crie a classe Professor aqui\n\npublic class Main {\n    public static void main(String[] args) {\n        Servidor s = new Professor();\n        System.out.println(s.calcularSalario());\n    }\n}\n' },
    verificar: { tipo: 'estatico', semErros: true, regras: [
      [/class\s+Professor\s+extends\s+Servidor/, 'Declare: class Professor extends Servidor'],
      [/@Override\s+(public\s+|protected\s+)?double\s+calcularSalario\s*\(\s*\)/, 'Sobrescreva double calcularSalario() com @Override'],
      [/super\.calcularSalario\s*\(\s*\)\s*\*\s*1\.2/, 'Reaproveite a regra do pai: super.calcularSalario() * 1.2'],
    ] },
  },
  {
    id: 'java-interface', lang: 'java', titulo: 'Interface e polimorfismo', xp: 40,
    enunciado: 'Crie a interface Autenticavel com boolean autenticar(String senha) e faça Gestor implementá-la comparando a senha com equals (nunca com ==).',
    arquivos: { 'Main.java': '// interface Autenticavel\n\n// class Gestor implements ...\n\npublic class Main {\n    public static void main(String[] args) {\n        Autenticavel a = new Gestor("s3gura");\n        System.out.println(a.autenticar("s3gura"));\n    }\n}\n' },
    verificar: { tipo: 'estatico', semErros: true, semAvisos: true, regras: [
      [/interface\s+Autenticavel\s*\{[\s\S]*boolean\s+autenticar\s*\(\s*String\s+\w+\s*\)\s*;/, 'Declare a interface com boolean autenticar(String senha);'],
      [/class\s+Gestor\s+implements\s+Autenticavel/, 'Gestor deve implementar Autenticavel'],
      [/\.equals\s*\(/, 'Compare Strings com equals()'],
      [/Gestor\s*\(\s*String\s+\w+\s*\)/, 'Crie o construtor Gestor(String senha)'],
    ] },
  },
];
