// Modelos de projeto do Code Studio. runtime: js | python | php | java | web | sqlite | postgres.
// real: true quando a tecnologia roda de verdade no navegador.

const exp = String.raw;

export const MODELOS = [
  {
    id: 'node', nome: 'JavaScript (Node)', grupo: 'Linguagens', icone: 'codigo', runtime: 'js', entrada: 'index.js', testes: ['notas.test.js'], real: true,
    descricao: 'Módulos CommonJS/ES, console e testes no estilo Jest (describe/it/expect).',
    arquivos: {
      'index.js': exp`const { media, situacao } = require('./notas');

const candidatos = [
  { nome: 'Ana', notas: [8, 7.5, 9] },
  { nome: 'Bruno', notas: [5, 6, 4.5] },
  { nome: 'Carla', notas: [7, 6.5, 7] },
];

for (const c of candidatos) {
  const m = media(c.notas);
  console.log(c.nome.padEnd(6), m.toFixed(2), situacao(m));
}

// Métodos de array que caem em prova: map, filter, reduce
const aprovados = candidatos.filter((c) => media(c.notas) >= 7).map((c) => c.nome);
console.log('Aprovados:', aprovados);
`,
      'notas.js': exp`function media(notas) {
  if (!notas.length) return 0;
  return notas.reduce((soma, n) => soma + n, 0) / notas.length;
}

function situacao(m) {
  if (m >= 7) return 'Aprovado';
  if (m >= 5) return 'Recuperação';
  return 'Reprovado';
}

module.exports = { media, situacao };
`,
      'notas.test.js': exp`const { media, situacao } = require('./notas');

describe('media', () => {
  it('calcula a média aritmética', () => expect(media([7, 8, 9])).toBe(8));
  it('lista vazia vale 0', () => expect(media([])).toBe(0));
});

describe('situacao', () => {
  it('7 é aprovado', () => expect(situacao(7)).toBe('Aprovado'));
  it('5 é recuperação', () => expect(situacao(5)).toBe('Recuperação'));
  it('4.9 é reprovado', () => expect(situacao(4.9)).toBe('Reprovado'));
});
`,
    },
  },
  {
    id: 'typescript', nome: 'TypeScript', grupo: 'Linguagens', icone: 'codigo', runtime: 'js', entrada: 'index.ts', testes: ['fila.test.ts'], real: true,
    descricao: 'Tipos, interfaces, genéricos e classes. Erros de tipo aparecem no editor; a execução usa o Babel para remover os tipos.',
    arquivos: {
      'index.ts': exp`import { Fila } from './fila';

interface Processo {
  numero: string;
  assunto: string;
  prioridade: 'normal' | 'urgente';
}

const protocolo = new Fila<Processo>();
protocolo.entrar({ numero: '23066.000001/2026-11', assunto: 'Férias', prioridade: 'normal' });
protocolo.entrar({ numero: '23066.000002/2026-55', assunto: 'Licença capacitação', prioridade: 'urgente' });

const proximo = protocolo.sair();
console.log('Atendendo:', proximo?.numero, '-', proximo?.assunto);
console.log('Restam', protocolo.tamanho, 'processo(s)');
`,
      'fila.ts': exp`// Fila genérica (FIFO): o primeiro a entrar é o primeiro a sair.
export class Fila<T> {
  private itens: T[] = [];

  entrar(item: T): void {
    this.itens.push(item);
  }

  sair(): T | undefined {
    return this.itens.shift();
  }

  get tamanho(): number {
    return this.itens.length;
  }
}
`,
      'fila.test.ts': exp`import { Fila } from './fila';

describe('Fila', () => {
  it('é FIFO', () => {
    const f = new Fila<number>();
    f.entrar(1); f.entrar(2);
    expect(f.sair()).toBe(1);
    expect(f.tamanho).toBe(1);
  });
});
`,
    },
  },
  {
    id: 'express', nome: 'API REST (Express)', grupo: 'Back-end', icone: 'servidor', runtime: 'js', entrada: 'server.js', testes: [], real: false, http: true,
    descricao: 'Rotas, middleware, JSON, status HTTP e CRUD. O código roda de verdade sobre uma implementação compatível com a API do Express; as requisições são feitas pelo cliente HTTP do painel (nenhuma porta é aberta).',
    arquivos: {
      'server.js': exp`const express = require('express');
const app = express();
app.use(express.json());

// "Banco" em memória
let proximoId = 3;
const candidatos = [
  { id: 1, nome: 'Ana Souza', cargo: '402', inscricaoPaga: true },
  { id: 2, nome: 'Bruno Lima', cargo: '206', inscricaoPaga: false },
];

// Middleware de log
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.path);
  next();
});

app.get('/api/candidatos', (req, res) => {
  const { cargo } = req.query;
  res.json(cargo ? candidatos.filter((c) => c.cargo === cargo) : candidatos);
});

app.get('/api/candidatos/:id', (req, res) => {
  const c = candidatos.find((x) => x.id === Number(req.params.id));
  if (!c) return res.status(404).json({ erro: 'Candidato não encontrado' });
  res.json(c);
});

app.post('/api/candidatos', (req, res) => {
  const { nome, cargo } = req.body;
  if (!nome || !cargo) return res.status(400).json({ erro: 'nome e cargo são obrigatórios' });
  const novo = { id: proximoId++, nome, cargo, inscricaoPaga: false };
  candidatos.push(novo);
  res.status(201).json(novo);
});

app.delete('/api/candidatos/:id', (req, res) => {
  const i = candidatos.findIndex((x) => x.id === Number(req.params.id));
  if (i < 0) return res.sendStatus(404);
  candidatos.splice(i, 1);
  res.sendStatus(204);
});

app.listen(3000, () => console.log('API ouvindo na porta 3000'));
`,
      'requisicoes.http': exp`# Use o painel "Cliente HTTP" para enviar:
GET /api/candidatos
GET /api/candidatos?cargo=402
GET /api/candidatos/1
POST /api/candidatos  {"nome": "Carla", "cargo": "201"}
DELETE /api/candidatos/2
`,
    },
  },
  {
    id: 'python', nome: 'Python', grupo: 'Linguagens', icone: 'codigo', runtime: 'python', entrada: 'main.py', testes: ['test_concurso.py'], real: true,
    descricao: 'CPython 3.12 de verdade (Pyodide). Funções, classes, dataclasses, testes com assert no estilo pytest.',
    arquivos: {
      'main.py': exp`from concurso import Candidato, classificar

candidatos = [
    Candidato("Ana", objetiva=48, redacao=50),
    Candidato("Bruno", objetiva=41, redacao=38),
    Candidato("Carla", objetiva=52, redacao=29),  # eliminada na redação (< 30)
]

for posicao, c in enumerate(classificar(candidatos), start=1):
    print(f"{posicao}º {c.nome:<6} total={c.total:>5.1f}")
`,
      'concurso.py': exp`from dataclasses import dataclass


@dataclass
class Candidato:
    nome: str
    objetiva: float  # 0 a 60
    redacao: float   # 0 a 60

    @property
    def eliminado(self) -> bool:
        return self.objetiva < 30 or self.redacao < 30

    @property
    def total(self) -> float:
        return self.objetiva + self.redacao


def classificar(candidatos):
    """Remove eliminados e ordena pelo total (maior primeiro)."""
    validos = [c for c in candidatos if not c.eliminado]
    return sorted(validos, key=lambda c: c.total, reverse=True)
`,
      'test_concurso.py': exp`from concurso import Candidato, classificar


def test_eliminado_na_redacao():
    assert Candidato("X", 50, 29).eliminado


def test_classificacao_ordena_pelo_total():
    a = Candidato("A", 40, 40)
    b = Candidato("B", 50, 45)
    assert [c.nome for c in classificar([a, b])] == ["B", "A"]
`,
    },
  },
  {
    id: 'pandas', nome: 'Análise de dados (pandas)', grupo: 'Dados', icone: 'grafico', runtime: 'python', entrada: 'analise.py', testes: [], real: true,
    descricao: 'pandas, numpy e matplotlib reais. Os gráficos aparecem no painel de saída.',
    arquivos: {
      'analise.py': exp`import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("inscricoes.csv")
print(df.head(), "\n")

print("Inscritos por cargo:")
por_cargo = df.groupby("cargo")["inscritos"].sum().sort_values(ascending=False)
print(por_cargo, "\n")

df["concorrencia"] = (df["inscritos"] / df["vagas"]).round(1)
print(df.sort_values("concorrencia", ascending=False)[["cargo", "concorrencia"]].head(3))

por_cargo.plot(kind="bar", color="#4f46e5", title="Inscritos por cargo")
plt.ylabel("inscritos")
plt.tight_layout()
plt.show()
`,
      'inscricoes.csv': 'cargo,nivel,vagas,inscritos\nAssistente em Administração,D,30,4210\nTécnico de TI,D,6,1180\nAnalista de TI,E,4,1520\nAdministrador,E,5,980\nContador,E,2,610\nEnfermeiro,E,8,1350\nPedagogo,E,3,720\n',
    },
  },
  {
    id: 'flask', nome: 'API com Flask', grupo: 'Back-end', icone: 'servidor', runtime: 'python', entrada: 'app.py', testes: ['test_app.py'], real: true, http: true,
    descricao: 'Flask real (instalado do PyPI no navegador). As requisições usam o test client do Flask — nenhuma porta de rede é aberta.',
    arquivos: {
      'app.py': exp`from flask import Flask, jsonify, request, abort

app = Flask(__name__)

livros = {
    1: {"id": 1, "titulo": "Manual de Redação da Presidência", "ano": 2018},
    2: {"id": 2, "titulo": "Constituição Federal", "ano": 1988},
}


@app.get("/api/livros")
def listar():
    return jsonify(list(livros.values()))


@app.get("/api/livros/<int:livro_id>")
def obter(livro_id):
    livro = livros.get(livro_id) or abort(404)
    return jsonify(livro)


@app.post("/api/livros")
def criar():
    dados = request.get_json(silent=True) or {}
    if "titulo" not in dados:
        return jsonify(erro="titulo é obrigatório"), 400
    novo = {"id": max(livros) + 1, "titulo": dados["titulo"], "ano": dados.get("ano")}
    livros[novo["id"]] = novo
    return jsonify(novo), 201


print("App Flask pronto. Use o Cliente HTTP: GET /api/livros")
`,
      'test_app.py': exp`from app import app


def test_listar():
    r = app.test_client().get("/api/livros")
    assert r.status_code == 200
    assert len(r.get_json()) >= 2


def test_criar_exige_titulo():
    r = app.test_client().post("/api/livros", json={})
    assert r.status_code == 400
`,
      'requirements.txt': 'flask\n',
    },
  },
  {
    id: 'fastapi', nome: 'API com FastAPI', grupo: 'Back-end', icone: 'servidor', runtime: 'python', entrada: 'main.py', testes: [], real: true, http: true,
    descricao: 'FastAPI + Pydantic reais (PyPI). Validação automática de dados e respostas 422. Requisições via TestClient.',
    arquivos: {
      'main.py': exp`from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Protocolo UFBA")


class Requerimento(BaseModel):
    interessado: str = Field(min_length=3)
    assunto: str
    urgente: bool = False


banco: list[dict] = []


@app.get("/requerimentos")
def listar(urgente: bool | None = None):
    if urgente is None:
        return banco
    return [r for r in banco if r["urgente"] == urgente]


@app.post("/requerimentos", status_code=201)
def criar(req: Requerimento):
    item = {"numero": len(banco) + 1, **req.model_dump()}
    banco.append(item)
    return item


@app.get("/requerimentos/{numero}")
def obter(numero: int):
    for r in banco:
        if r["numero"] == numero:
            return r
    raise HTTPException(status_code=404, detail="Requerimento não encontrado")


print("FastAPI pronta. Teste: POST /requerimentos com JSON {\"interessado\": \"Ana\", \"assunto\": \"Férias\"}")
`,
      'requirements.txt': 'fastapi==0.110.3\nhttpx==0.27.0\n',
    },
  },
  {
    id: 'php', nome: 'PHP 8', grupo: 'Linguagens', icone: 'codigo', runtime: 'php', entrada: 'index.php', testes: [], real: true,
    descricao: 'Interpretador oficial do PHP 8 compilado para WebAssembly: classes, enums, match, arrays e funções.',
    arquivos: {
      'index.php': exp`<?php

enum Situacao: string {
    case Deferido = 'deferido';
    case Indeferido = 'indeferido';
}

final class Inscricao
{
    public function __construct(
        public readonly string $candidato,
        public readonly bool $pagou,
        public readonly bool $documentos,
    ) {}

    public function situacao(): Situacao
    {
        return match (true) {
            $this->pagou && $this->documentos => Situacao::Deferido,
            default => Situacao::Indeferido,
        };
    }
}

$inscricoes = [
    new Inscricao('Ana', true, true),
    new Inscricao('Bruno', false, true),
];

foreach ($inscricoes as $i) {
    printf("%-6s %s\n", $i->candidato, $i->situacao()->value);
}

$deferidas = array_filter($inscricoes, fn($i) => $i->situacao() === Situacao::Deferido);
echo count($deferidas), " deferida(s)\n";
`,
    },
  },
  {
    id: 'java', nome: 'Java', grupo: 'Linguagens', icone: 'codigo', runtime: 'java', entrada: 'Main.java', principal: 'Main', testes: [], real: true,
    descricao: 'Compilado com o javac de verdade e executado numa JVM em WebAssembly (CheerpJ — Java 8). A primeira execução baixa a JVM e o compilador (~30 s).',
    arquivos: {
      'Main.java': exp`import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Servidor> equipe = new ArrayList<>();
        equipe.add(new Servidor("Ana", 4200.0));
        equipe.add(new Professor("Bruno", 5100.0));
        equipe.add(new Servidor("Carla", 3900.0));

        // Polimorfismo: cada objeto usa a sua versão de calcularSalario()
        for (Servidor s : equipe) {
            System.out.printf("%-6s R$ %.2f%n", s.getNome(), s.calcularSalario());
        }

        // Collections + Comparator
        equipe.sort(Comparator.comparing(Servidor::calcularSalario).reversed());
        System.out.println("Maior salário: " + equipe.get(0).getNome());
    }
}
`,
      'Servidor.java': exp`public class Servidor {
    private final String nome;
    protected final double salarioBase;

    public Servidor(String nome, double salarioBase) {
        this.nome = nome;
        this.salarioBase = salarioBase;
    }

    public String getNome() {
        return nome;
    }

    public double calcularSalario() {
        return salarioBase;
    }
}
`,
      'Professor.java': exp`public class Professor extends Servidor {
    public Professor(String nome, double salarioBase) {
        super(nome, salarioBase);
    }

    @Override
    public double calcularSalario() {
        return super.calcularSalario() * 1.2; // gratificação de 20%
    }
}
`,
    },
  },
  {
    id: 'sqlite', nome: 'SQL (SQLite)', grupo: 'Banco de dados', icone: 'banco', runtime: 'sqlite', entrada: 'consultas.sql', testes: [], real: true,
    descricao: 'SQLite real. Execute o script inteiro; os resultados de cada SELECT aparecem em tabelas.',
    arquivos: {
      'consultas.sql': exp`CREATE TABLE setor (id INTEGER PRIMARY KEY, sigla TEXT NOT NULL UNIQUE);
CREATE TABLE servidor (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  setor_id INTEGER REFERENCES setor(id),
  salario NUMERIC CHECK (salario > 0)
);

INSERT INTO setor (sigla) VALUES ('STI'), ('PROAD'), ('BIBLIO');
INSERT INTO servidor (nome, setor_id, salario) VALUES
  ('Ana', 1, 7200), ('Bruno', 1, 5400), ('Carla', 2, 4800), ('Davi', NULL, 3900);

-- INNER JOIN x LEFT JOIN: Davi não tem setor
SELECT s.nome, st.sigla FROM servidor s LEFT JOIN setor st ON st.id = s.setor_id;

-- Agregação com HAVING
SELECT st.sigla, COUNT(*) AS qtd, AVG(s.salario) AS media
FROM servidor s JOIN setor st ON st.id = s.setor_id
GROUP BY st.sigla
HAVING COUNT(*) >= 1
ORDER BY media DESC;
`,
    },
  },
  {
    id: 'postgres', nome: 'PostgreSQL 17', grupo: 'Banco de dados', icone: 'banco', runtime: 'postgres', entrada: 'script.sql', testes: [], real: true,
    descricao: 'PostgreSQL 17 de verdade (PGlite). Funções PL/pgSQL, triggers, views, CTEs e funções de janela.',
    arquivos: {
      'script.sql': exp`CREATE TABLE IF NOT EXISTS conta (
  id serial PRIMARY KEY,
  titular text NOT NULL,
  saldo numeric(12,2) NOT NULL DEFAULT 0 CHECK (saldo >= 0)
);
CREATE TABLE IF NOT EXISTS auditoria (
  id serial PRIMARY KEY, conta_id int, antes numeric, depois numeric, em timestamptz DEFAULT now()
);

-- Trigger: registra toda alteração de saldo
CREATE OR REPLACE FUNCTION auditar() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO auditoria (conta_id, antes, depois) VALUES (NEW.id, OLD.saldo, NEW.saldo);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_auditar ON conta;
CREATE TRIGGER trg_auditar AFTER UPDATE OF saldo ON conta FOR EACH ROW EXECUTE FUNCTION auditar();

TRUNCATE conta, auditoria RESTART IDENTITY;
INSERT INTO conta (titular, saldo) VALUES ('Ana', 1000), ('Bruno', 250);
UPDATE conta SET saldo = saldo - 100 WHERE titular = 'Ana';

SELECT * FROM auditoria;

-- Função de janela: ranking por saldo
SELECT titular, saldo, RANK() OVER (ORDER BY saldo DESC) AS posicao FROM conta;
`,
    },
  },
  {
    id: 'web', nome: 'HTML, CSS e JavaScript', grupo: 'Web', icone: 'globo', runtime: 'web', entrada: 'index.html', testes: [], real: true,
    descricao: 'Página com pré-visualização ao vivo num iframe isolado. Console do navegador no painel de saída.',
    arquivos: {
      'index.html': exp`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Contagem para a prova</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="cartao">
    <h1>UFBA 2026</h1>
    <p>Faltam <strong id="dias">…</strong> dias para a prova.</p>
    <label>Horas por dia <input id="horas" type="number" value="3" min="1" max="12"></label>
    <p id="total"></p>
  </main>
  <script src="app.js"></script>
</body>
</html>
`,
      'style.css': exp`:root { font-family: system-ui, sans-serif; color-scheme: light dark; }
body { display: grid; place-items: center; min-height: 100vh; margin: 0; background: #eef0ff; }
.cartao { background: white; padding: 24px 32px; border-radius: 16px; box-shadow: 0 10px 30px #0002; }
h1 { color: #4f46e5; margin-top: 0; }
#dias { font-size: 2rem; }
`,
      'app.js': exp`const prova = new Date(2026, 11, 20);
const dias = Math.ceil((prova - new Date()) / 86400000);
document.getElementById('dias').textContent = dias;

const horas = document.getElementById('horas');
const total = document.getElementById('total');
function atualizar() {
  total.textContent = 'Total até a prova: ' + dias * Number(horas.value) + ' horas de estudo';
}
horas.addEventListener('input', atualizar);
atualizar();
console.log('Página carregada!');
`,
    },
  },
  {
    id: 'react', nome: 'React 18', grupo: 'Web', icone: 'globo', runtime: 'web', entrada: 'index.html', testes: [], real: true,
    descricao: 'React 18 real com JSX (Babel no navegador): componentes, props, useState, useEffect e listas.',
    arquivos: {
      'index.html': exp`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>React</title>
  <link rel="stylesheet" href="style.css">
  <script src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.development.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.development.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script src="App.jsx"></script>
</body>
</html>
`,
      'App.jsx': exp`const { useState, useEffect } = React;

function Tarefa({ texto, feita, alternar }) {
  return (
    <li onClick={alternar} className={feita ? 'feita' : ''}>
      {feita ? '✅' : '⬜'} {texto}
    </li>
  );
}

function App() {
  const [tarefas, setTarefas] = useState([
    { texto: 'Revisar Lei 8.112', feita: false },
    { texto: 'Simulado de TI', feita: true },
  ]);
  const [nova, setNova] = useState('');

  useEffect(() => {
    document.title = tarefas.filter((t) => !t.feita).length + ' pendente(s)';
  }, [tarefas]);

  function adicionar(e) {
    e.preventDefault();
    if (!nova.trim()) return;
    setTarefas([...tarefas, { texto: nova, feita: false }]);
    setNova('');
  }

  return (
    <main>
      <h1>Plano de estudos</h1>
      <form onSubmit={adicionar}>
        <input value={nova} onChange={(e) => setNova(e.target.value)} placeholder="Nova tarefa" />
        <button>Adicionar</button>
      </form>
      <ul>
        {tarefas.map((t, i) => (
          <Tarefa key={i} {...t} alternar={() => setTarefas(tarefas.map((x, j) => (j === i ? { ...x, feita: !x.feita } : x)))} />
        ))}
      </ul>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
`,
      'style.css': exp`body { font-family: system-ui, sans-serif; max-width: 520px; margin: 40px auto; padding: 0 16px; }
li { cursor: pointer; padding: 6px 0; list-style: none; }
li.feita { color: #888; text-decoration: line-through; }
input { padding: 6px; margin-right: 6px; }
`,
    },
  },
  {
    id: 'vue', nome: 'Vue 3', grupo: 'Web', icone: 'globo', runtime: 'web', entrada: 'index.html', testes: [], real: true,
    descricao: 'Vue 3 real (build com compilador de templates): reatividade, v-model, v-for, computed.',
    arquivos: {
      'index.html': exp`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Vue</title>
  <script src="https://cdn.jsdelivr.net/npm/vue@3.5.13/dist/vue.global.js"></script>
  <style>body{font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px} .ok{color:green}</style>
</head>
<body>
  <div id="app">
    <h1>Simulador de nota</h1>
    <label>Objetiva (0–60): <input type="number" v-model.number="objetiva"></label><br>
    <label>Redação (0–60): <input type="number" v-model.number="redacao"></label>
    <p>Total: <strong>{{ total }}</strong></p>
    <p :class="{ ok: aprovado }">{{ aprovado ? 'Classificado' : 'Eliminado' }}</p>
    <ul><li v-for="r in regras" :key="r">{{ r }}</li></ul>
  </div>
  <script src="app.js"></script>
</body>
</html>
`,
      'app.js': exp`const { createApp, ref, computed } = Vue;

createApp({
  setup() {
    const objetiva = ref(36);
    const redacao = ref(40);
    const total = computed(() => objetiva.value + redacao.value);
    const aprovado = computed(() => objetiva.value >= 30 && redacao.value >= 30);
    const regras = ['Objetiva: mínimo de 50% (30 de 60 pontos)', 'Redação: mínimo de 30 de 60 pontos'];
    return { objetiva, redacao, total, aprovado, regras };
  },
}).mount('#app');
`,
    },
  },
];

export const GRUPOS = ['Linguagens', 'Web', 'Back-end', 'Dados', 'Banco de dados'];
export const modelo = (id) => MODELOS.find((m) => m.id === id);
