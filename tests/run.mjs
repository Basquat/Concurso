// Executa todos os testes do domínio: node tests/run.mjs
for (const t of ['linux', 'sheet', 'dominios', 'bi-codigo', 'cobertura', 'cofre', 'conteudo']) await import(`./${t}.test.mjs`);
console.log('todos os testes passaram');
