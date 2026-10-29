// Laboratório de criptografia com a Web Crypto API real: hashes (SHA), AES-GCM com chave derivada por PBKDF2,
// Base64 e a cifra de César para entender a ideia de chave.
import { esc, ic, copiar, toast } from '../dom.js';
import { cesar, paraBase64, deBase64, resumo, bitsDiferentes, umCaractere, cifrar, decifrar, SEGREDOS } from '../../../domain/cripto.js';

export default async function cripto(el, ctx, kit) {
  const st = { feito: {}, ...(kit.estado.carregar() ?? {}) };
  const marcar = (k) => { if (!st.feito[k]) { st.feito[k] = true; kit.estado.salvar(st); missoes.verificar(st); } };
  const missoes = kit.missoes([
    { id: 'hash', titulo: 'Calcule um SHA-256', descricao: 'Gere o hash SHA-256 de qualquer texto.', xp: 15, checar: (s) => s.feito.hash },
    { id: 'avalanche', titulo: 'Efeito avalanche', descricao: 'Compare os hashes de dois textos que diferem em um único caractere.', dica: 'Ex.: "concurso" e "concursa". Cerca de metade dos bits muda.', xp: 20, checar: (s) => s.feito.avalanche },
    { id: 'aes', titulo: 'Cifre e decifre com AES-GCM', descricao: 'Cifre um texto com uma senha e depois recupere o original.', xp: 25, checar: (s) => s.feito.aes },
    { id: 'senha-errada', titulo: 'Senha errada', descricao: 'Tente decifrar com outra senha e veja a autenticação do GCM falhar.', xp: 15, checar: (s) => s.feito.errada },
    { id: 'base64', titulo: 'Base64 não é criptografia', descricao: `Decodifique a mensagem ${SEGREDOS.base64}.`, xp: 15, checar: (s) => s.feito.base64 },
    { id: 'cesar', titulo: 'Quebre a cifra de César', descricao: `Descubra a mensagem "${SEGREDOS.cesar.texto}" testando deslocamentos.`, xp: 15, checar: (s) => s.feito.cesar },
  ]);
  kit.teoria('**Hash** (SHA-256): resumo de tamanho fixo, irreversível — garante **integridade**. **AES-GCM**: criptografia **simétrica** autenticada — garante **confidencialidade** e detecta alteração. **PBKDF2** deriva a chave a partir da senha com sal e muitas iterações. **Base64** é só codificação, qualquer um reverte. Tudo aqui usa a **Web Crypto API** do navegador.');
  kit.referencia('<dl><dt>Hash</dt><dd>integridade, senhas (com sal)</dd><dt>Simétrica</dt><dd>AES — mesma chave para cifrar e decifrar</dd><dt>Assimétrica</dt><dd>RSA/ECC — chave pública e privada; assinatura digital</dd><dt>Codificação</dt><dd>Base64 — sem segredo</dd></dl>');
  kit.aoReiniciar(() => { kit.estado.limpar(); st.feito = {}; desenhar(); });

  function desenhar() {
    el.innerHTML = `<div class="grade-2" style="max-width:1100px;margin:0 auto">
      <section class="card pilha"><h2 class="mt0 mb0" style="font-size:1.05rem">${ic('chave')} Hash</h2>
        <select id="alg" aria-label="Algoritmo"><option>SHA-256</option><option>SHA-1</option><option>SHA-512</option></select>
        <input id="h1" value="concurso" aria-label="Texto 1"><input id="h2" value="concursa" aria-label="Texto 2">
        <button class="btn primario" type="button" id="calcHash">Calcular</button><div id="outHash" class="mono pequeno" style="word-break:break-all"></div></section>
      <section class="card pilha"><h2 class="mt0 mb0" style="font-size:1.05rem">${ic('cadeado')} AES-GCM com senha</h2>
        <textarea id="claro" rows="3" aria-label="Texto claro">Gabarito do simulado: C, E, C, C, E</textarea>
        <input id="senha" type="password" value="minha frase secreta" aria-label="Senha" autocomplete="off">
        <div class="linha"><button class="btn primario" type="button" id="cifrar">Cifrar</button><button class="btn" type="button" id="decifrar">Decifrar pacote</button></div>
        <textarea id="pacote" rows="3" class="mono pequeno" placeholder="pacote cifrado (Base64)" aria-label="Pacote cifrado"></textarea><div id="outAes" class="pequeno"></div></section>
      <section class="card pilha"><h2 class="mt0 mb0" style="font-size:1.05rem">${ic('documento')} Base64</h2>
        <input id="b64" class="mono" value="${esc(SEGREDOS.base64)}" aria-label="Texto ou Base64">
        <div class="linha"><button class="btn" type="button" id="codificar">Codificar</button><button class="btn" type="button" id="decodificar">Decodificar</button></div><div id="outB64" class="mono pequeno" style="word-break:break-all"></div></section>
      <section class="card pilha"><h2 class="mt0 mb0" style="font-size:1.05rem">${ic('git')} Cifra de César</h2>
        <input id="cesarTxt" value="${esc(SEGREDOS.cesar.texto)}" aria-label="Texto">
        <label class="campo">Deslocamento: <output id="kOut">0</output><input id="k" type="range" min="-25" max="25" value="0"></label><div id="outCesar" class="mono forte"></div></section></div>`;
    const $ = (s) => el.querySelector(s);
    $('#calcHash').onclick = async () => {
      const alg = $('#alg').value; const [a, b] = [$('#h1').value, $('#h2').value];
      const [x, y] = await Promise.all([resumo(alg, a), resumo(alg, b)]);
      const bits = bitsDiferentes(x, y);
      $('#outHash').innerHTML = `<div>${esc(a)} →<br>${x}</div><div class="mt1">${esc(b)} →<br>${y}</div><div class="mt1 sans">${bits} de ${x.length * 4} bits diferentes.</div>`;
      if (alg === 'SHA-256') marcar('hash');
      if (umCaractere(a, b)) marcar('avalanche');
    };
    $('#cifrar').onclick = async () => { $('#pacote').value = await cifrar($('#claro').value, $('#senha').value); $('#outAes').innerHTML = '<span class="ok">Cifrado. Sal e IV aleatórios: cifre de novo e o pacote muda.</span>'; st.cifrou = $('#claro').value; };
    $('#decifrar').onclick = async () => {
      let t;
      try { t = await decifrar($('#pacote').value, $('#senha').value); } catch {
        $('#outAes').innerHTML = '<div class="aviso erro">Falha na autenticação: senha errada ou pacote alterado.</div>';
        if ($('#pacote').value) marcar('errada');
        return;
      }
      $('#outAes').innerHTML = `<div class="aviso ok">Recuperado: ${esc(t)}</div>`;
      if (st.cifrou && t === st.cifrou) marcar('aes');
    };
    $('#codificar').onclick = () => { $('#outB64').textContent = paraBase64($('#b64').value); };
    $('#decodificar').onclick = () => {
      try { const t = deBase64($('#b64').value); $('#outB64').textContent = t; if ($('#b64').value.trim() === SEGREDOS.base64) marcar('base64'); } catch { $('#outB64').textContent = 'Base64 inválido.'; }
    };
    $('#outB64').addEventListener('dblclick', () => copiar($('#outB64').textContent).then(() => toast('Copiado.')));
    const rodar = () => { const k = Number($('#k').value); $('#kOut').textContent = k; const t = cesar($('#cesarTxt').value, k); $('#outCesar').textContent = t; if ($('#cesarTxt').value === SEGREDOS.cesar.texto && k === -SEGREDOS.cesar.k) marcar('cesar'); };
    $('#k').addEventListener('input', rodar); $('#cesarTxt').addEventListener('input', rodar); rodar();
  }
  desenhar();
  missoes.verificar(st);
}
