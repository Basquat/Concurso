// Exercícios do Code Studio, corrigidos executando o código de verdade.
// verificar.tipo: 'testes' (arquivos de teste ocultos: Jest para JS/TS, funções test_ para Python),
//                 'expressoes' (JS: expressões que devem resultar em true), 'saida' (saída padrão esperada),
//                 'regras' (análise do código-fonte, quando não há execução).

const exp = String.raw;
const linhas = (...l) => l.join('\n');

export const EXERCICIOS = [
  // ---------------- JavaScript ----------------
  {
    id: 'js-media', modelo: 'node', titulo: 'Média das notas', nivel: 'basico', xp: 30,
    enunciado: 'Implemente `media(notas)`: devolve a média aritmética do array; para array vazio, devolva `0`.',
    arquivos: { 'media.js': 'function media(notas) {\n  // seu código aqui\n}\n\nconsole.log(media([7, 8, 9]));\n\nmodule.exports = { media };\n' }, entrada: 'media.js',
    verificar: { tipo: 'expressoes', expressoes: [['media([7, 8, 9]) === 8', 'media([7, 8, 9]) === 8'], ['media([10]) === 10', 'media([10]) === 10'], ['media([]) === 0', 'media([]) === 0'], ['media([5, 6]) === 5.5', 'media([5, 6]) === 5.5']] },
  },
  {
    id: 'js-situacao', modelo: 'node', titulo: 'Situação do candidato', nivel: 'basico', xp: 30,
    enunciado: 'Implemente `situacao(nota)`: "Aprovado" se nota ≥ 7, "Recuperação" se 5 ≤ nota < 7, senão "Reprovado". Nota fora de 0–10 lança `Error`.',
    arquivos: { 'situacao.js': 'function situacao(nota) {\n  \n}\n\nmodule.exports = { situacao };\n' }, entrada: 'situacao.js',
    verificar: { tipo: 'expressoes', expressoes: [['situacao(7) === "Aprovado"', 'situacao(7) === "Aprovado"'], ['situacao(6.9) === "Recuperação"', 'situacao(6.9) === "Recuperação"'], ['situacao(5) === "Recuperação"', 'situacao(5) === "Recuperação"'], ['situacao(4.99) === "Reprovado"', 'situacao(4.99) === "Reprovado"'], ['situacao(11) lança erro', '(() => { try { situacao(11); return false; } catch (e) { return true; } })()']] },
  },
  {
    id: 'js-cpf', modelo: 'node', titulo: 'Validador de CPF', nivel: 'intermediario', xp: 50,
    enunciado: 'Implemente `cpfValido(s)`: aceita "123.456.789-09" ou "12345678909", rejeita sequências repetidas (111.111.111-11) e confere os **dois dígitos verificadores** (pesos 10..2 e 11..2; resto < 2 → 0, senão 11 − resto).',
    arquivos: { 'cpf.js': 'function cpfValido(s) {\n  const d = String(s).replace(/\\D/g, \'\');\n  // seu código aqui\n}\n\nmodule.exports = { cpfValido };\n' }, entrada: 'cpf.js',
    verificar: { tipo: 'expressoes', expressoes: [['529.982.247-25 é válido', 'cpfValido("529.982.247-25") === true'], ['52998224725 é válido', 'cpfValido("52998224725") === true'], ['dígito errado é inválido', 'cpfValido("529.982.247-26") === false'], ['repetidos são inválidos', 'cpfValido("111.111.111-11") === false'], ['tamanho errado é inválido', 'cpfValido("123") === false']] },
  },
  {
    id: 'js-reduce', modelo: 'node', titulo: 'Relatório com filter/map/reduce', nivel: 'intermediario', xp: 40,
    enunciado: 'Implemente `relatorio(inscricoes)` que devolve `{ total, pagas, arrecadado }`: total de inscrições, quantas têm `pago: true` e a soma de `taxa` das pagas. Use `filter` e `reduce`.',
    arquivos: { 'relatorio.js': 'function relatorio(inscricoes) {\n  \n}\n\nmodule.exports = { relatorio };\n' }, entrada: 'relatorio.js',
    verificar: { tipo: 'testes', testes: { 'relatorio.test.js': exp`const { relatorio } = require('./relatorio');
const dados = [{ taxa: 130, pago: true }, { taxa: 100, pago: false }, { taxa: 130, pago: true }];
it('conta e soma', () => expect(relatorio(dados)).toEqual({ total: 3, pagas: 2, arrecadado: 260 }));
it('lista vazia', () => expect(relatorio([])).toEqual({ total: 0, pagas: 0, arrecadado: 0 }));` } },
  },
  {
    id: 'ts-generico', modelo: 'typescript', titulo: 'Pilha genérica em TypeScript', nivel: 'intermediario', xp: 50,
    enunciado: 'Crie em `pilha.ts` a classe exportada `Pilha<T>` (LIFO) com `empilhar(x: T)`, `desempilhar(): T | undefined`, `topo(): T | undefined` e o getter `vazia: boolean`.',
    arquivos: { 'pilha.ts': 'export class Pilha<T> {\n  // seu código aqui\n}\n' }, entrada: 'pilha.ts',
    verificar: { tipo: 'testes', testes: { 'pilha.test.ts': exp`import { Pilha } from './pilha';
it('é LIFO', () => { const p = new Pilha<number>(); p.empilhar(1); p.empilhar(2); expect(p.desempilhar()).toBe(2); expect(p.topo()).toBe(1); });
it('vazia', () => { const p = new Pilha<string>(); expect(p.vazia).toBe(true); p.empilhar('a'); expect(p.vazia).toBe(false); });
it('desempilhar vazia devolve undefined', () => expect(new Pilha().desempilhar()).toBeUndefined());` } },
  },
  {
    id: 'js-api', modelo: 'express', titulo: 'Rota GET com filtro', nivel: 'intermediario', xp: 60,
    enunciado: 'No `server.js`, crie `GET /api/vagas?nivel=E` que devolve só as vagas do nível pedido (sem o parâmetro, devolve todas) e `GET /api/vagas/:codigo` com **404** quando não existir. Teste no Cliente HTTP e depois clique em Executar para verificar.',
    arquivos: { 'server.js': exp`const express = require('express');
const app = express();

const vagas = [
  { codigo: '206', cargo: 'Técnico de TI', nivel: 'D' },
  { codigo: '402', cargo: 'Analista de TI', nivel: 'E' },
  { codigo: '401', cargo: 'Administrador', nivel: 'E' },
];

// crie as rotas aqui

app.listen(3000);
module.exports = app;
` }, entrada: 'server.js',
    verificar: { tipo: 'testes', testes: { 'api.test.js': exp`const app = require('./server');
const pedir = (url) => app._tratar({ method: 'GET', url, path: url.split('?')[0], query: Object.fromEntries(new URLSearchParams(url.split('?')[1] ?? '')), headers: {}, body: '', params: {} });
it('GET /api/vagas lista todas', async () => { const r = await pedir('/api/vagas'); expect(r.status).toBe(200); expect(JSON.parse(r.corpo)).toHaveLength(3); });
it('filtra por nível', async () => { const r = await pedir('/api/vagas?nivel=E'); expect(JSON.parse(r.corpo).map((v) => v.codigo)).toEqual(['402', '401']); });
it('busca por código', async () => { const r = await pedir('/api/vagas/206'); expect(JSON.parse(r.corpo).cargo).toBe('Técnico de TI'); });
it('404 para código inexistente', async () => { const r = await pedir('/api/vagas/999'); expect(r.status).toBe(404); });` } },
  },
  // ---------------- Python ----------------
  {
    id: 'py-notas', modelo: 'python', titulo: 'Funções e listas em Python', nivel: 'basico', xp: 30,
    enunciado: 'Em `notas.py`, implemente `media(notas)` (0 para lista vazia) e `aprovados(alunos)` que recebe uma lista de tuplas `(nome, media)` e devolve os nomes com média ≥ 7, em ordem alfabética. Use list comprehension.',
    arquivos: { 'notas.py': 'def media(notas):\n    pass\n\n\ndef aprovados(alunos):\n    pass\n\n\nprint(media([7, 8, 9]))\n' }, entrada: 'notas.py',
    verificar: { tipo: 'testes', testes: { 'test_notas.py': exp`from notas import media, aprovados
def test_media(): assert media([7, 8, 9]) == 8
def test_media_vazia(): assert media([]) == 0
def test_aprovados(): assert aprovados([("Caio", 7), ("Ana", 9.5), ("Bia", 6.9)]) == ["Ana", "Caio"]` } },
  },
  {
    id: 'py-cpf', modelo: 'python', titulo: 'Dígitos verificadores do CPF', nivel: 'intermediario', xp: 50,
    enunciado: 'Implemente `cpf_valido(s)` em Python com a mesma regra oficial (pesos 10..2 e 11..2; resto da divisão por 11; resto < 2 → 0, senão 11 − resto). Rejeite sequências repetidas.',
    arquivos: { 'cpf.py': 'import re\n\n\ndef cpf_valido(s: str) -> bool:\n    d = re.sub(r"\\D", "", s)\n    # seu código aqui\n' }, entrada: 'cpf.py',
    verificar: { tipo: 'testes', testes: { 'test_cpf.py': exp`from cpf import cpf_valido
def test_valido(): assert cpf_valido("529.982.247-25")
def test_digito(): assert not cpf_valido("529.982.247-26")
def test_repetido(): assert not cpf_valido("000.000.000-00")
def test_tamanho(): assert not cpf_valido("123")` } },
  },
  {
    id: 'py-classe', modelo: 'python', titulo: 'Classes e herança em Python', nivel: 'intermediario', xp: 50,
    enunciado: 'Crie `Servidor(nome, salario)` com `remuneracao_anual()` = 13 salários + 1/3 de férias, e `Professor(Servidor)` com gratificação de 20% sobre o salário (sobrescreva usando `super()`).',
    arquivos: { 'servidores.py': 'class Servidor:\n    pass\n\n\nclass Professor(Servidor):\n    pass\n' }, entrada: 'servidores.py',
    verificar: { tipo: 'testes', testes: { 'test_servidores.py': exp`from servidores import Servidor, Professor
def test_servidor(): assert round(Servidor("A", 3000).remuneracao_anual(), 2) == 40000
def test_professor(): assert round(Professor("B", 3000).remuneracao_anual(), 2) == 48000
def test_heranca(): assert issubclass(Professor, Servidor)` } },
  },
  {
    id: 'py-flask', modelo: 'flask', titulo: 'Endpoint Flask com validação', nivel: 'avancado', xp: 70,
    enunciado: 'Crie `POST /api/inscricoes` que recebe JSON com `nome` e `cpf` (11 dígitos). Responda **201** com `{"id": n, "nome": ...}`; **400** com `{"erro": ...}` se faltar campo ou o CPF não tiver 11 dígitos.',
    arquivos: { 'app.py': 'from flask import Flask, jsonify, request\n\napp = Flask(__name__)\ninscricoes = []\n\n# sua rota aqui\n', 'requirements.txt': 'flask\n' }, entrada: 'app.py',
    verificar: { tipo: 'testes', testes: { 'test_api.py': exp`from app import app
def test_cria():
    r = app.test_client().post("/api/inscricoes", json={"nome": "Ana", "cpf": "52998224725"})
    assert r.status_code == 201 and r.get_json()["nome"] == "Ana"
def test_falta_campo():
    assert app.test_client().post("/api/inscricoes", json={"nome": "Ana"}).status_code == 400
def test_cpf_curto():
    assert app.test_client().post("/api/inscricoes", json={"nome": "Ana", "cpf": "123"}).status_code == 400` } },
  },
  {
    id: 'py-pandas', modelo: 'pandas', titulo: 'Agrupamento com pandas', nivel: 'intermediario', xp: 50,
    enunciado: 'Implemente `resumo(df)` que devolve um DataFrame com a soma de `inscritos` e de `vagas` por `nivel` e a coluna `concorrencia` = inscritos/vagas arredondada a 1 casa, ordenado por `nivel`.',
    arquivos: { 'resumo.py': 'import pandas as pd\n\n\ndef resumo(df: pd.DataFrame) -> pd.DataFrame:\n    pass\n\n\nif __name__ == "__main__":\n    print(resumo(pd.read_csv("inscricoes.csv")))\n', 'inscricoes.csv': 'cargo,nivel,vagas,inscritos\nA,D,10,100\nB,E,2,50\nC,D,5,30\n' }, entrada: 'resumo.py',
    verificar: { tipo: 'testes', testes: { 'test_resumo.py': exp`import pandas as pd
from resumo import resumo
def test_resumo():
    r = resumo(pd.read_csv("inscricoes.csv")).reset_index()
    assert list(r["nivel"]) == ["D", "E"]
    assert list(r["inscritos"]) == [130, 50]
    assert list(r["concorrencia"]) == [8.7, 25.0]` } },
  },
  // ---------------- PHP ----------------
  {
    id: 'php-tabuada', modelo: 'php', titulo: 'Tabuada do 7', nivel: 'basico', xp: 30,
    enunciado: 'Imprima a tabuada do 7 de 1 a 10, uma linha por resultado, no formato `7 x 1 = 7`.',
    arquivos: { 'index.php': '<?php\n\nfor ($i = 1; $i <= 10; $i++) {\n    // seu código aqui\n}\n' }, entrada: 'index.php',
    verificar: { tipo: 'saida', esperado: Array.from({ length: 10 }, (_, i) => `7 x ${i + 1} = ${7 * (i + 1)}`).join('\n') },
  },
  {
    id: 'php-classe', modelo: 'php', titulo: 'Classe Servidor em PHP', nivel: 'intermediario', xp: 40,
    enunciado: 'Crie a classe `Servidor` com construtor recebendo `$salario` e o método `remuneracaoAnual()`: 13 salários + 1/3 de férias. Imprima a remuneração de um servidor com salário 3000 (resultado: `40000`).',
    arquivos: { 'index.php': '<?php\n\nclass Servidor\n{\n    // propriedades, construtor e método\n}\n\n$s = new Servidor(3000);\necho $s->remuneracaoAnual();\n' }, entrada: 'index.php',
    verificar: { tipo: 'saida', esperado: '40000' },
  },
  {
    id: 'php-array', modelo: 'php', titulo: 'array_filter e array_map', nivel: 'intermediario', xp: 40,
    enunciado: 'A partir de `$candidatos`, imprima (um por linha, em maiúsculas) os nomes dos candidatos com `nota >= 60`, usando `array_filter` e `array_map`.',
    arquivos: { 'index.php': "<?php\n\n$candidatos = [\n    ['nome' => 'ana', 'nota' => 72],\n    ['nome' => 'bruno', 'nota' => 58],\n    ['nome' => 'carla', 'nota' => 60],\n];\n\n// seu código aqui\n" }, entrada: 'index.php',
    verificar: { tipo: 'saida', esperado: 'ANA\nCARLA' },
  },
  // ---------------- Java ----------------
  {
    id: 'java-ola', modelo: 'java', titulo: 'Olá, concurso! (compilação)', nivel: 'basico', xp: 20,
    enunciado: 'O programa não compila. Leia a mensagem do **javac**, corrija e faça imprimir `Olá, concurso!`.',
    arquivos: { 'Main.java': 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Olá, concurso!")\n    }\n}\n' }, entrada: 'Main.java',
    verificar: { tipo: 'saida', esperado: 'Olá, concurso!' },
  },
  {
    id: 'java-heranca', modelo: 'java', titulo: 'Herança e sobrescrita', nivel: 'intermediario', xp: 40,
    enunciado: 'Crie `Professor extends Servidor` sobrescrevendo `calcularSalario()` com gratificação de 20% (`super.calcularSalario() * 1.2`) e `@Override`. A saída deve ser `3600.0`.',
    arquivos: { 'Main.java': 'class Servidor {\n    protected double salarioBase = 3000;\n\n    double calcularSalario() {\n        return salarioBase;\n    }\n}\n\n// crie a classe Professor aqui\n\npublic class Main {\n    public static void main(String[] args) {\n        Servidor s = new Professor();\n        System.out.println(s.calcularSalario());\n    }\n}\n' }, entrada: 'Main.java',
    verificar: { tipo: 'saida', esperado: '3600.0' },
  },
  {
    id: 'java-interface', modelo: 'java', titulo: 'Interface e equals', nivel: 'intermediario', xp: 40,
    enunciado: 'Crie a interface `Autenticavel` com `boolean autenticar(String senha)` e faça `Gestor` implementá-la comparando com `equals` (nunca `==`). A saída deve ser `true` e depois `false`.',
    arquivos: { 'Main.java': '// interface Autenticavel\n\n// class Gestor implements ...\n\npublic class Main {\n    public static void main(String[] args) {\n        Autenticavel a = new Gestor("s3gura");\n        System.out.println(a.autenticar(new String("s3gura")));\n        System.out.println(a.autenticar("outra"));\n    }\n}\n' }, entrada: 'Main.java',
    verificar: { tipo: 'saida', esperado: 'true\nfalse' },
  },
  {
    id: 'java-colecoes', modelo: 'java', titulo: 'Map e contagem', nivel: 'avancado', xp: 60,
    enunciado: 'Conte quantas vezes cada palavra aparece em `texto` (ignorando maiúsculas) usando `Map<String, Integer>` e imprima em ordem alfabética no formato `palavra=n`, uma por linha. Dica: `TreeMap` e `merge`.',
    arquivos: { 'Main.java': 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        String texto = "Lei Decreto lei portaria decreto LEI";\n        // seu código aqui\n    }\n}\n' }, entrada: 'Main.java',
    verificar: { tipo: 'saida', esperado: linhas('decreto=2', 'lei=3', 'portaria=1') },
  },
  // ---------------- Web ----------------
  {
    id: 'web-form', modelo: 'web', titulo: 'Formulário acessível', nivel: 'basico', xp: 30,
    enunciado: 'No `index.html`, crie um formulário com campo de **e-mail** (`type="email"`, obrigatório) associado a um `<label for>` e um botão de enviar. A verificação analisa o HTML.',
    arquivos: { 'index.html': '<!doctype html>\n<html lang="pt-BR">\n<head><meta charset="utf-8"><title>Inscrição</title></head>\n<body>\n  <h1>Receber avisos do concurso</h1>\n  <!-- seu formulário aqui -->\n</body>\n</html>\n' }, entrada: 'index.html',
    verificar: { tipo: 'regras', arquivo: 'index.html', regras: [['<form', 'Crie um elemento <form>'], ['type=["\']email["\']', 'Use <input type="email">'], ['\\brequired\\b', 'Torne o campo obrigatório (required)'], ['<label[^>]+for=["\'](\\w+)["\'][\\s\\S]*id=["\']\\1["\']|id=["\'](\\w+)["\'][\\s\\S]*<label[^>]+for=["\']\\2["\']', 'Associe o <label for> ao id do campo'], ['<button|type=["\']submit["\']', 'Inclua um botão de envio']] },
  },
  {
    id: 'react-contador', modelo: 'react', titulo: 'Componente com useState', nivel: 'intermediario', xp: 40,
    enunciado: 'No `App.jsx`, crie um componente `Contador` com `useState` e botões **+** e **−**, impedindo valores negativos, e renderize-o no `App`. A verificação analisa o código; veja funcionando na pré-visualização.',
    arquivos: null, entrada: 'index.html',
    verificar: { tipo: 'regras', arquivo: 'App.jsx', regras: [['function\\s+Contador|const\\s+Contador\\s*=', 'Crie o componente Contador'], ['useState\\(', 'Use o hook useState'], ['Math\\.max\\(|>\\s*0|<=\\s*0|>=\\s*1', 'Impeça valores negativos'], ['<Contador\\s*/?>', 'Renderize <Contador /> no App']] },
  },
  // ---------------- SQL ----------------
  {
    id: 'sql-join', modelo: 'sqlite', titulo: 'JOIN e GROUP BY', nivel: 'intermediario', xp: 40,
    enunciado: 'Escreva **uma** consulta que liste a sigla de cada setor e a quantidade de servidores (`qtd`), incluindo setores sem servidores (qtd 0), ordenada pela sigla. Dica: `LEFT JOIN` + `COUNT(s.id)`.',
    arquivos: { 'consulta.sql': "CREATE TABLE setor (id INTEGER PRIMARY KEY, sigla TEXT);\nCREATE TABLE servidor (id INTEGER PRIMARY KEY, nome TEXT, setor_id INTEGER);\nINSERT INTO setor VALUES (1,'STI'),(2,'PROAD'),(3,'BIBLIO');\nINSERT INTO servidor VALUES (1,'Ana',1),(2,'Bruno',1),(3,'Carla',2);\n\n-- sua consulta aqui\n" }, entrada: 'consulta.sql',
    verificar: { tipo: 'tabela', esperado: { colunas: ['sigla', 'qtd'], linhas: [['BIBLIO', 0], ['PROAD', 1], ['STI', 2]] } },
  },
];

export const exercicio = (id) => EXERCICIOS.find((e) => e.id === id);
