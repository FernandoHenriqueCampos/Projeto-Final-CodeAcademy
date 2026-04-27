# InstaClone (frontend) - Especificacao de build

Lista de tarefas para reconstruir o frontend. Cada item descreve comportamento esperado, endpoints consumidos e restricoes de UI. Os nomes de rota, endpoints e limites sao contratos com o backend e devem ser respeitados.

## 1 - Setup do Projeto

- [x] Inicializar projeto com Vue 3 + Vite
- [x] Estrutura de pastas por dominio: `components/`, `composables/`, `layouts/`, `router/`, `services/`, `stores/`, `views/`
- [x] Vue Router com rota curinga `/:pathMatch(.*)*` servindo uma view `NotFound`
- [x] Pinia para estado compartilhado (`auth`, `feed`)
- [x] Tema global em `src/assets/styles/theme.css` (importado no `main.js` apos Bootstrap)
- [x] Cliente axios centralizado em `src/services/api.js`:
  - baseURL lida de `import.meta.env.VITE_API_URL`
  - interceptor de request injeta `Authorization: Bearer <token>` quando existe token
  - interceptor de response trata `401`: limpa token, redireciona para `/login`
- [x] `.env.example` com `VITE_API_URL=http://localhost:8000/api`
- [x] `.dockerignore` excluindo `node_modules`, `dist`, `.env`, mantendo `.env.example`

## 2 - Autenticacao

- [x] Tela `/login` com campos `email` e `password`
- [x] Tela `/cadastro` com campos `name`, `username`, `email`, `password`, `password_confirmation`
- [x] Store `auth` (Pinia) com estado `user`, `token`, `isAuthenticated`, actions `login`, `register`, `logout`, `fetchMe`
- [x] `POST /auth/login` devolve `access_token` e `user`; salvar token em `localStorage` com chave fixa (ex.: `instaclone.token`)
- [x] `POST /auth/register` cria conta e ja autentica
- [x] `POST /auth/logout` limpa sessao local mesmo se o token ja estiver invalido
- [x] `GET /auth/me` hidrata o usuario atual a partir do token salvo ao entrar em rota protegida
- [x] Guards de rota:
  - `requiresAuth`: sem token, redireciona para `/login`
  - `requiresGuest`: com token, redireciona para `/feed`
- [x] Mensagens de erro exibidas inline abaixo do formulario

## 3 - Layout e Navegacao

- [x] `AuthLayout` para telas de visitante (`/login`, `/cadastro`)
- [x] `AppLayout` para area autenticada
- [x] Shell autenticado responsivo:
  - mobile: barra de navegacao inferior fixa
  - desktop: sidebar lateral
- [x] Entradas de navegacao: `Home` (`/feed`), `Buscar` (`/descobrir`), `Criar` (`/criar`), `Perfil` (`/perfil`)
- [x] `RouterView` usando `v-slot="{ Component }"` + `<component :is="Component" />` para troca de views

## 4 - Feed (`/feed`)

- [x] `GET /feed` retorna `{ items: [...], next_cursor: string|null }`
- [x] Store `feed` normaliza os posts em um dicionario por id e mantem uma lista ordenada
- [x] Actions do store: `fetchFeed`, `loadMoreFeed(cursor)`, `toggleLike(postId)`, `addComment(postId, body)`, `createPost(formData)`
- [x] Botao "carregar mais" visivel enquanto `next_cursor !== null`
- [x] Card de post exibe:
  - avatar + username do autor (link para `/perfil?user=<username>`)
  - imagem do post
  - contador de curtidas e botao de like
  - legenda
  - data relativa (ex.: "ha 2h")
  - contador de comentarios
  - campo inline para adicionar comentario
- [x] Curtir: `POST /posts/:id/like`. Descurtir: `DELETE /posts/:id/unlike`. Atualizar contador de forma otimista
- [x] Comentar inline: `POST /posts/:id/comments` com `{ body }`

## 5 - Descobrir (`/descobrir`)

- [x] `GET /users/suggestions` lista perfis sugeridos
- [x] `GET /users/:viewerId/following` carrega quem o viewer ja segue para marcar o estado do botao
- [x] Botao "Seguir" / "Seguindo" por card
  - seguir: `POST /users/:id/follow`
  - deixar de seguir: `DELETE /users/:id/unfollow`
- [x] Clique no card abre `/perfil?user=<username>` ou `/perfil` se for o proprio
- [x] Paginacao por pagina (`?page=<n>`)

## 6 - Criar Post (`/criar`)

- [x] Input `<input type="file">` aceita apenas `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- [x] Limite de 5 MB (validar no cliente antes do upload)
- [x] Preview local com `URL.createObjectURL`; revogar o blob ao trocar imagem, limpar ou desmontar
- [x] Campo de legenda com limite de `2200` caracteres e contador visivel
- [x] Botao de publicar desabilitado enquanto imagem ou legenda estao ausentes
- [x] `POST /posts` com `FormData` contendo `image` e `caption`
- [x] Exibir feedback de sucesso (redirecionar para `/feed`) e mensagens de erro

## 7 - Perfil (`/perfil` e `/perfil?user=<username>`)

- [x] `GET /users/{username}` resolve o perfil alvo
- [x] Em paralelo, carregar:
  - `GET /users/{id}/posts` (grid de posts)
  - `GET /users/{id}/followers` (contador)
  - `GET /users/{id}/following` (contador)
- [x] Para perfis de terceiros, consultar `GET /users/{id}/is-following` para decidir o estado do botao
- [x] Acoes:
  - seguir: `POST /users/:id/follow`
  - deixar de seguir: `DELETE /users/:id/unfollow`
- [x] Botao "Editar perfil" aparece apenas no proprio perfil e leva a `/perfil/editar`
- [x] Contadores de seguidores e seguindo levam a `/perfil/lista/seguidores` e `/perfil/lista/seguindo` (preservando o `?user=` quando for perfil de terceiros)
- [x] Grid de posts: clicar em um post abre `/posts/:postId`

## 7.1 - Editar Perfil (`/perfil/editar`)

- [x] `PUT /users/me` com `{ name, username, bio }`
- [x] `POST /users/me/avatar` com `FormData` contendo `avatar`
- [x] Limites validados no cliente:
  - `name`: 255 caracteres
  - `username`: 30 caracteres, regex `^[A-Za-z0-9._]+$`
  - `bio`: 500 caracteres
  - avatar: 2 MB
- [x] Mensagens de erro por campo vindas do backend

## 8 - Listas de Conexao (`/perfil/lista/:type`)

- [x] `:type` aceita `seguidores` ou `seguindo`
- [x] Respeita `?user=<username>` para listar conexoes de outro perfil
- [x] `GET /users/{id}/followers` e `GET /users/{id}/following` com paginacao por pagina
- [x] Cada linha mostra avatar, nome, username e botao de seguir / deixar de seguir
- [x] Botao de voltar para o perfil de origem

## 9 - Detalhes do Post (`/posts/:postId`)

- [x] `GET /posts/:id` carrega o post
- [x] `GET /posts/:id/comments` carrega comentarios com paginacao por pagina
- [x] Botao "carregar mais" para comentarios
- [x] Campo para adicionar comentario: `POST /posts/:id/comments`
- [x] `DELETE /comments/:id` disponivel apenas para o autor do comentario
- [x] `DELETE /posts/:id` disponivel apenas para o autor do post; redireciona para `/feed` apos sucesso
- [x] Contadores de curtidas e comentarios vem do payload do backend

## 10 - 404

- [x] View `NotFound` com link para `/feed` (autenticado) ou `/login` (visitante)

## 11 - Docker e Entrega

- [x] `Dockerfile` multi-stage:
  - stage `build`: `node:22-alpine`, roda `npm ci` e `npm run build`
  - stage runtime: `nginx:1.27-alpine` servindo `/usr/share/nginx/html`
- [x] `docker/nginx.conf` com `try_files $uri $uri/ /index.html` para o history mode do Vue Router
- [x] `compose.yaml` expondo `3000:80` e passando `VITE_API_URL` como build-arg
- [x] `.dockerignore` excluindo `node_modules`, `dist`, `.env`, preservando `.env.example`
- [x] `npm run build` gera bundle de producao em `dist/`

## Endpoints consumidos (resumo)

| Recurso | Metodo | Rota |
| --- | --- | --- |
| Auth | POST | `/auth/login` |
| Auth | POST | `/auth/register` |
| Auth | POST | `/auth/logout` |
| Auth | GET | `/auth/me` |
| Feed | GET | `/feed?cursor=<c>` |
| Posts | POST | `/posts` (multipart) |
| Posts | GET | `/posts/:id` |
| Posts | DELETE | `/posts/:id` |
| Posts | POST | `/posts/:id/like` |
| Posts | DELETE | `/posts/:id/unlike` |
| Comments | GET | `/posts/:id/comments` |
| Comments | POST | `/posts/:id/comments` |
| Comments | DELETE | `/comments/:id` |
| Users | GET | `/users/suggestions` |
| Users | GET | `/users/:username` |
| Users | GET | `/users/:id/posts` |
| Users | GET | `/users/:id/followers` |
| Users | GET | `/users/:id/following` |
| Users | GET | `/users/:id/is-following` |
| Users | POST | `/users/:id/follow` |
| Users | DELETE | `/users/:id/unfollow` |
| Users | PUT | `/users/me` |
| Users | POST | `/users/me/avatar` (multipart) |
