// Análise estática didática de Java e PHP. NÃO é um compilador: aponta problemas comuns
// usando as mesmas mensagens que javac/php mostrariam, para treinar a leitura de erros.

// Troca comentários e textos por espaços, preservando quebras de linha (colunas e linhas batem).
export function limpar(codigo, lang) {
  const re = lang === 'php' ? /\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g : /\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g;
  return codigo.replace(re, (m) => (m.startsWith('"') || m.startsWith("'") ? m[0] + ' '.repeat(Math.max(0, m.length - 2)) + m[0] : m.replace(/[^\n]/g, ' ')));
}

function balanceamento(limpo) {
  const pares = { ')': '(', ']': '[', '}': '{' };
  const pilha = [];
  const linhas = limpo.split('\n');
  for (let l = 0; l < linhas.length; l++) {
    for (const ch of linhas[l]) {
      if ('([{'.includes(ch)) pilha.push({ ch, l });
      else if (pares[ch]) {
        if (pilha.at(-1)?.ch !== pares[ch]) return { linha: l + 1, extra: ch };
        pilha.pop();
      }
    }
  }
  return pilha.length ? { linha: linhas.length, falta: pilha.at(-1) } : null;
}

const CONTROLE = /^(if|else|for|foreach|while|switch|try|catch|finally|do|case\b.*:|default\s*:)\b/;

function pontoEVirgula(limpo) {
  const out = [];
  const linhas = limpo.split('\n');
  for (let i = 0; i < linhas.length; i++) {
    const t = linhas[i].trim();
    if (!t || /[{};,(\[]$/.test(t) || /^[@}]/.test(t) || /^<\?php/.test(t) || t === '?>' || CONTROLE.test(t)) continue;
    if (/^(import|package|use|namespace)\b/.test(t)) { out.push(i + 1); continue; } // exigem ;
    if (/\b(class|interface|enum|record|trait)\b/.test(t)) continue; // cabeçalho com { na linha seguinte
    if (/(\+|-|\*|\/|&&|\|\||\.|=|\?|:|->)$/.test(t)) continue; // expressão continua na próxima linha
    const prox = linhas.slice(i + 1).find((x) => x.trim())?.trim() ?? '';
    if (/^(\.|->|\+|-|\*|\/|&&|\|\||\?|:|\))/.test(prox)) continue;
    if (/\)\s*(throws\s+[\w.,\s]+)?$/.test(t) && prox.startsWith('{')) continue; // assinatura com { na linha seguinte
    out.push(i + 1);
  }
  return out;
}

export function analisarJava(codigo, arquivo = 'Main.java') {
  const p = [];
  const limpo = limpar(codigo, 'java');
  const b = balanceamento(limpo);
  if (b?.extra) p.push({ linha: b.linha, nivel: 'erro', msg: b.extra === '}' ? 'class, interface, enum, or record expected' : `illegal start of expression ('${b.extra}' sem abertura)` });
  if (b?.falta) p.push({ linha: b.linha, nivel: 'erro', msg: 'reached end of file while parsing' });
  for (const l of pontoEVirgula(limpo)) p.push({ linha: l, nivel: 'erro', msg: "';' expected" });
  const pub = /\bpublic\s+(?:final\s+|abstract\s+)*(class|interface|enum|record)\s+(\w+)/.exec(limpo);
  const esperado = arquivo.replace(/\.java$/, '');
  if (pub && pub[2] !== esperado) p.push({ linha: limpo.slice(0, pub.index).split('\n').length, nivel: 'erro', msg: `${pub[1]} ${pub[2]} is public, should be declared in a file named ${pub[2]}.java` });
  const strings = new Set([...limpo.matchAll(/\bString\s+(\w+)/g)].map((m) => m[1]));
  codigo.split('\n').forEach((linha, i) => {
    for (const m of linha.replace(/\/\/.*$/, '').matchAll(/(\w+|"[^"]*")\s*[!=]=\s*(\w+|"[^"]*")/g)) {
      if ([m[1], m[2]].some((x) => x.startsWith('"') || strings.has(x))) { p.push({ linha: i + 1, nivel: 'aviso', msg: 'Comparação de String com == / != compara referências, não o conteúdo. Use equals().' }); break; }
    }
  });
  if (/\bclass\b/.test(limpo) && !/public\s+static\s+void\s+main\s*\(\s*String\s*(\[\]\s*\w+|\w+\s*\[\]|\.\.\.\s*\w+)\s*\)/.test(limpo)) p.push({ linha: 1, nivel: 'info', msg: 'Nenhum método main(String[] args): a classe compila, mas não é executável diretamente.' });
  return p.sort((a, b2) => a.linha - b2.linha);
}

export function analisarPhp(codigo) {
  const p = [];
  if (!/^\s*<\?php/.test(codigo)) p.push({ linha: 1, nivel: 'aviso', msg: 'O arquivo não começa com <?php: tudo seria enviado como texto puro.' });
  const limpo = limpar(codigo, 'php');
  const b = balanceamento(limpo);
  if (b?.extra) p.push({ linha: b.linha, nivel: 'erro', msg: `PHP Parse error: syntax error, unexpected token "${b.extra}"` });
  if (b?.falta) p.push({ linha: b.linha, nivel: 'erro', msg: 'PHP Parse error: Unclosed \'' + b.falta.ch + '\'' });
  for (const l of pontoEVirgula(limpo)) p.push({ linha: l, nivel: 'erro', msg: 'PHP Parse error: syntax error, unexpected end of line, expecting ";"' });
  codigo.split('\n').forEach((linha, i) => {
    if (/\bmysql_\w+\s*\(/.test(linha)) p.push({ linha: i + 1, nivel: 'erro', msg: 'Funções mysql_* foram removidas no PHP 7. Use PDO ou mysqli.' });
    if (/(SELECT|INSERT|UPDATE|DELETE)\b/i.test(linha) && /\$_(GET|POST|REQUEST)|\.\s*\$\w+|\{\$\w+|'\$\w+'/.test(linha) && !/prepare\s*\(/.test(linha)) p.push({ linha: i + 1, nivel: 'aviso', msg: 'Possível SQL injection: dados concatenados na consulta. Use prepared statements (PDO::prepare + execute).' });
    if (/\becho\b.*\$_(GET|POST|REQUEST)/.test(linha) && !/htmlspecialchars/.test(linha)) p.push({ linha: i + 1, nivel: 'aviso', msg: 'Possível XSS: entrada do usuário impressa sem htmlspecialchars().' });
  });
  return p.sort((a, b2) => a.linha - b2.linha);
}

// Formatação simples por profundidade de chaves (didática, não substitui um formatador real).
export function formatar(codigo, lang, tab = '    ') {
  let prof = 0;
  return codigo.split('\n').map((linha) => {
    const t = linha.trim();
    const l = limpar(t, lang === 'javascript' ? 'java' : lang);
    if (/^[}\])]/.test(l)) prof = Math.max(0, prof - 1);
    const out = t ? tab.repeat(prof) + t : '';
    const abre = (l.match(/[{[(]/g) ?? []).length;
    const fecha = (l.match(/[}\])]/g) ?? []).length - (/^[}\])]/.test(l) ? 1 : 0);
    prof = Math.max(0, prof + abre - fecha);
    return out;
  }).join('\n');
}
