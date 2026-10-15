import { esc } from '../dom.js';
import { LABS } from '../labs/registro.js';

export default async function sobre(el) {
  el.innerHTML = `<h1>Sobre a plataforma</h1>
    <div class="pilha" style="max-width:860px">
      <p>O <strong>Concurso Lab</strong> é uma plataforma gratuita e de código aberto para estudar para concursos públicos combinando teoria, questões, simulados e laboratórios práticos. Funciona inteiramente no navegador (HTML, CSS e JavaScript), hospedada no GitHub Pages, sem servidor nem custos.</p>
      <div class="callout aviso"><strong>Transparência.</strong> Não é um sistema oficial e não tem vínculo com o Instituto Avalia, órgãos públicos ou fabricantes de software. Os laboratórios são simulações didáticas com dados fictícios: não criam recursos em nuvem, não executam comandos no seu computador, não acessam sistemas reais e não geram custos. Nomes de produtos (AWS, Power BI, Linux, PostgreSQL, MySQL etc.) são marcas de seus titulares e aparecem apenas para indicar o que está sendo estudado.</div>
      <h2>O que é real e o que é simulado</h2>
      <table class="tabela"><thead><tr><th>Laboratório</th><th>Fidelidade</th></tr></thead><tbody>
        ${Object.values(LABS).map((l) => `<tr><td style="white-space:nowrap">${l.icone} ${esc(l.nome)}</td><td class="pequeno">${esc(l.simulado)}</td></tr>`).join('')}
      </tbody></table>
      <h2>Questões</h2>
      <p>Nesta versão todas as questões são <strong>autorais</strong> (escritas para a plataforma) e trazem a base normativa ou técnica usada na explicação. A estrutura aceita questões oficiais com identificação de banca, concurso, ano e número — elas só devem ser incluídas quando for possível reproduzi-las respeitando direitos autorais e termos de uso; caso contrário, registra-se a referência e cria-se uma questão autoral equivalente.</p>
      <h2>Seus dados</h2>
      <p>Progresso e estado dos laboratórios ficam no <code>localStorage</code> deste navegador. Nada é enviado a servidores. Bibliotecas externas baixadas sob demanda: SQLite/WebAssembly (cdnjs) no laboratório de SQL e PHP/WebAssembly (jsDelivr) ao executar PHP.</p>
      <h2>Arquitetura</h2>
      <p class="pequeno">Hexagonal (portas e adaptadores): <code>src/domain</code> contém as regras puras e testáveis (interpretador Bash, motor de fórmulas, partidas dobradas, validação de nuvem, DAX, IPv4…); <code>src/application</code> define as portas e casos de uso; <code>src/adapters</code> implementa armazenamento, conteúdo, SQL, execução de código e a interface. Testes: <code>node tests/run.mjs</code>.</p>
    </div>`;
}
