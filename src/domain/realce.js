// Realce de sintaxe leve (sem dependências) para slides, leitura e editor reserva.
// Devolve HTML com <span class="tk-..."> já escapado.

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const KW = {
  js: 'async await break case catch class const continue debugger default delete do else export extends false finally for from function get if import in instanceof let new null of return set static super switch this throw true try typeof undefined var void while yield',
  ts: 'abstract any as async await boolean break case catch class const continue declare default do else enum export extends false finally for from function if implements import in infer instanceof interface keyof let namespace never new null number of private protected public readonly return static string super switch this throw true try type typeof undefined unknown var void while',
  java: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new null package private protected public record return short static strictfp super switch synchronized this throw throws transient true false try var void volatile while',
  kotlin: 'abstract as break by class companion const constructor continue data do else enum false final for fun if import in interface internal is lateinit null object open operator override package private protected public return sealed super suspend this throw true try typealias val var when while',
  dart: 'abstract as async await break case catch class const continue default do dynamic else enum extends false final finally for if implements import in is late new null required return static super switch this throw true try var void while with',
  python: 'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return self True try while with yield',
  php: 'abstract and array as break callable case catch class clone const continue declare default do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile enum extends false final finally fn for foreach function global goto if implements include instanceof insteadof interface isset list match namespace new null or print private protected public readonly require require_once return static switch throw trait true try unset use var while xor yield',
  sql: 'add all alter and any as asc begin between by case cascade check column commit constraint create cross database default delete desc distinct drop else end exists foreign from full function grant group having if in index inner insert into is join key left like limit not null offset on or order outer primary procedure references replace returns revoke right rollback select set table then transaction trigger truncate union unique update values view when where with',
  bash: 'case do done elif else esac exit export fi for function if in local read return select shift then until while echo cd sudo',
  c: 'auto break case char const continue default do double else enum extern float for goto if int long register return short signed sizeof static struct switch typedef union unsigned void volatile while bool true false nullptr class public private protected namespace using new delete template',
  go: 'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var true false nil',
  yaml: 'true false null yes no on off',
  dockerfile: 'FROM RUN CMD LABEL EXPOSE ENV ADD COPY ENTRYPOINT VOLUME USER WORKDIR ARG ONBUILD STOPSIGNAL HEALTHCHECK SHELL AS',
  nginx: 'server location listen server_name root index proxy_pass upstream return rewrite try_files include http events worker_processes ssl_certificate ssl_certificate_key access_log error_log add_header proxy_set_header if set',
};
const ALIAS = { javascript: 'js', jsx: 'js', mjs: 'js', node: 'js', typescript: 'ts', tsx: 'ts', py: 'python', sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash', postgres: 'sql', postgresql: 'sql', mysql: 'sql', sqlite: 'sql', plsql: 'sql', kt: 'kotlin', cpp: 'c', 'c++': 'c', cs: 'c', csharp: 'c', yml: 'yaml', docker: 'dockerfile', html: 'html', xml: 'html', vue: 'html', svelte: 'html', jsonc: 'json', powershell: 'bash', ps1: 'bash', flutter: 'dart', spring: 'java', groovy: 'java', conf: 'nginx' };

const cacheRe = {};
function regex(lang) {
  if (cacheRe[lang]) return cacheRe[lang];
  const kw = KW[lang] ?? '';
  const hash = ['python', 'bash', 'yaml', 'php', 'dockerfile', 'nginx'].includes(lang);
  const sqlCom = lang === 'sql' ? '|--[^\\n]*' : '';
  const blocoCom = ['python', 'bash', 'yaml', 'dockerfile', 'nginx'].includes(lang) ? '' : '|\\/\\*[\\s\\S]*?\\*\\/';
  const linhaCom = ['sql', 'python', 'bash', 'yaml', 'dockerfile', 'nginx'].includes(lang) ? '' : '|\\/\\/[^\\n]*';
  const triplas = lang === 'python' ? `"""[\\s\\S]*?"""|'''[\\s\\S]*?'''|` : '';
  const crase = ['js', 'ts', 'go', 'kotlin', 'dart', 'bash'].includes(lang) ? '|`(?:\\\\.|[^`\\\\])*`' : '';
  const nunca = '|((?!))'; // grupo que nunca casa (mantém a numeração dos grupos)
  const vars = ['php', 'bash'].includes(lang) ? '|(\\$\\{?[A-Za-z_]\\w*\\}?)' : nunca;
  const anot = ['java', 'kotlin', 'python', 'ts', 'dart'].includes(lang) ? '|(@[A-Za-z_][\\w.]*)' : nunca;
  const flags = lang === 'sql' || lang === 'dockerfile' ? 'gi' : 'g';
  const re = new RegExp(
    `(${hash ? '#[^\\n]*' : '(?!x)x'}${sqlCom}${blocoCom}${linhaCom})` +
    `|(${triplas}"(?:\\\\.|[^"\\\\\\n])*"|'(?:\\\\.|[^'\\\\\\n])*'${crase})` +
    `${vars}${anot}` +
    `|\\b(\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?[a-zA-Z%]*)\\b` +
    `|\\b(${kw ? kw.split(' ').join('|') : '(?!x)x'})\\b` +
    `|\\b([A-Za-z_]\\w*)(?=\\s*\\()`,
    flags,
  );
  return (cacheRe[lang] = re);
}

function realcarHtml(codigo) {
  const re = /(<!--[\s\S]*?-->)|(<\/?)([\w:-]+)|([\w:-]+)(=)|("[^"]*"|'[^']*')|(\/?>)/g;
  let out = '';
  let i = 0;
  for (const m of codigo.matchAll(re)) {
    out += esc(codigo.slice(i, m.index));
    if (m[1]) out += `<span class="tk-com">${esc(m[1])}</span>`;
    else if (m[3]) out += `${esc(m[2])}<span class="tk-tag">${esc(m[3])}</span>`;
    else if (m[4]) out += `<span class="tk-at">${esc(m[4])}</span>=`;
    else if (m[6]) out += `<span class="tk-str">${esc(m[6])}</span>`;
    else out += esc(m[0]);
    i = m.index + m[0].length;
  }
  return out + esc(codigo.slice(i));
}

function realcarCss(codigo) {
  const re = /(\/\*[\s\S]*?\*\/)|("[^"]*"|'[^']*')|(@[\w-]+)|(#[0-9a-fA-F]{3,8}\b)|([\w-]+)(?=\s*:[^:{;]*[;}\n])|(-?\d*\.?\d+(?:px|rem|em|%|vh|vw|s|ms|deg|fr)?)/g;
  let out = '';
  let i = 0;
  for (const m of codigo.matchAll(re)) {
    out += esc(codigo.slice(i, m.index));
    const cls = m[1] ? 'com' : m[2] ? 'str' : m[3] ? 'kw' : m[4] ? 'num' : m[5] ? 'at' : 'num';
    out += `<span class="tk-${cls}">${esc(m[0])}</span>`;
    i = m.index + m[0].length;
  }
  return out + esc(codigo.slice(i));
}

function realcarJson(codigo) {
  return codigo.replace(/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([^"\w-]+|[\w-]+)/g, (m, s, dois, kw, num) => {
    if (s) return dois ? `<span class="tk-at">${esc(s)}</span>${dois}` : `<span class="tk-str">${esc(s)}</span>`;
    if (kw) return `<span class="tk-kw">${kw}</span>`;
    if (num) return `<span class="tk-num">${num}</span>`;
    return esc(m);
  });
}

export function realcar(codigo, linguagem = '') {
  const lang = ALIAS[String(linguagem).toLowerCase()] ?? String(linguagem).toLowerCase();
  if (lang === 'html') return realcarHtml(codigo);
  if (lang === 'css' || lang === 'scss') return realcarCss(codigo);
  if (lang === 'json') return realcarJson(codigo);
  if (!KW[lang]) return esc(codigo);
  let out = '';
  let i = 0;
  for (const m of codigo.matchAll(regex(lang))) {
    out += esc(codigo.slice(i, m.index));
    const cls = m[1] ? 'com' : m[2] ? 'str' : m[3] ? 'var' : m[4] ? 'at' : m[5] ? 'num' : m[6] ? 'kw' : 'fn';
    out += `<span class="tk-${cls}">${esc(m[0])}</span>`;
    i = m.index + m[0].length;
  }
  return out + esc(codigo.slice(i));
}
