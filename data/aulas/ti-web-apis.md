---
id: ti-web-apis
titulo: Desenvolvimento web, HTTP e APIs REST
area: ti
disciplina: Tecnologia da Informação
cargos: 206, 402
labs: http, code, regex
resumo: Cliente e servidor, métodos e códigos HTTP, REST, JSON, autenticação com tokens (JWT, OAuth 2.0), CORS, HTML semântico, CSS e acessibilidade.
ordem: 15
busca: desenvolvimento web http métodos get post put patch delete códigos de status rest restful json api stateless jwt oauth 2.0 cors cookies sessão html semântico css acessibilidade wcag emag
---
# HTTP

- Protocolo **sem estado** (stateless) de requisição e resposta; HTTPS = HTTP sobre **TLS**
- Métodos: **GET** (ler), **POST** (criar), **PUT** (substituir), **PATCH** (alterar parte), **DELETE** (remover)
- Status: **2xx** sucesso, **3xx** redirecionamento, **4xx** erro do cliente (401 sem autenticação, 403 sem permissão, 404 não encontrado), **5xx** erro do servidor

---

# REST

- Recursos identificados por **URIs** (ex.: /processos/123)
- Interface uniforme com os métodos HTTP, **sem estado** no servidor, cacheável, em camadas
- Representação comum em **JSON**
- Idempotentes: GET, PUT, DELETE (repetir não muda o resultado); **POST** não

---

# Autenticação e segurança

- **Sessão com cookie**: o servidor guarda o estado; **token** (ex.: **JWT**): o cliente envia a cada requisição, assinado pelo servidor
- **OAuth 2.0**: **autorização** delegada (ex.: "entrar com" outra conta); **OpenID Connect** acrescenta identidade
- **CORS**: o navegador só permite chamadas entre origens diferentes se o servidor autorizar (cabeçalhos Access-Control-Allow-*)
- OWASP: validar entradas, usar consultas parametrizadas (contra **SQL injection**), escapar saídas (contra **XSS**)

---

# Front-end

- **HTML semântico** (header, nav, main, article, button) ajuda leitores de tela e SEO
- **CSS**: seletores, box model, flexbox e grid; responsividade com media queries
- **Acessibilidade**: WCAG e o **eMAG** (governo federal) — texto alternativo, contraste, navegação por teclado

::: quiz
? A requisição foi feita sem credenciais válidas para um recurso protegido. O código HTTP adequado é:
- [ ] 200
- [x] 401
- [ ] 404
- [ ] 500
= 401 Unauthorized: falta autenticação. 403: autenticado, mas sem permissão.
:::

::: cartoes
HTTP stateless :: Cada requisição é independente; o servidor não guarda estado da conversa.
REST :: Recursos por URI, métodos HTTP uniformes, sem estado.
JWT :: Token assinado enviado pelo cliente a cada requisição.
CORS :: Controle do navegador para chamadas entre origens diferentes.
SQL injection :: Evitada com consultas parametrizadas.
:::
