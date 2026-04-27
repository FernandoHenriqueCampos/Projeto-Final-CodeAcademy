# 📸 InstaClone (backend) — Organização de Tasks

## Backend (API Laravel)

### 1 - Setup do Projeto
- [X] Criar projeto Laravel
- [X] Inicializar repositório Git
- [X] Configurar database (MySQL dockerizado)
- [X] Configurar .env e .env.example
- [X] Criar migrations iniciais (users, password_resets)

### 2 - Autenticação (Sanctum)
- [X] Instalar e configurar sanctum
- [X] Migration da tabela users
- [X] Seeder de usuários fake
- [X] POST /api/auth/register
- [X] POST /api/auth/login
- [X] POST /api/auth/logout
- [X] POST /api/auth/refresh
- [X] GET /api/auth/me
- [X] Middleware de autenticação
- [X] AuthService (lógica de negócio separada do controller)

### 3 - Perfil de Usuário
- [X] Migration: adicionar campos (username, bio, avatar_url) na tabela users
- [X] GET /api/users/{username} — perfil por username
- [X] PUT /api/users/me — editar próprio perfil
- [X] POST /api/users/me/avatar — upload de foto de perfil
- [X] GET /api/users/search?q= — buscar usuários
- [X] GET /api/users/suggestions — sugestões de usuários
- [X] UserService
- [X] Configurar storage (local ou S3) pra uploads de imagem

### 4 - Follow
- [X] Migration: tabela follows (follower_id, following_id)
- [X] Model Follow + relacionamentos no User
- [X] POST /api/users/{id}/follow
- [X] DELETE /api/users/{id}/follow
- [X] GET /api/users/{id}/followers
- [X] GET /api/users/{id}/following
- [X] GET /api/users/{id}/is-following — checar se segue
- [X] FollowService
- [X] Impedir de seguir a si mesmo (validação no FollowService via SelfFollowException)

### 5 - Posts
- [X] Migration: tabela posts (user_id, image_url, caption)
- [X] Model Post + relacionamentos
- [X] POST /api/posts — criar post (upload de imagem + legenda)
- [X] GET /api/posts/{id} — detalhe do post
- [X] PUT /api/posts/{id} — editar legenda
- [X] DELETE /api/posts/{id} — deletar post
- [X] GET /api/users/{id}/posts — posts de um usuário
- [X] PostService
- [X] Policy: só o dono edita/deleta (PostPolicy)

### 6 - Feed
- [X] GET /api/feed — posts de quem o usuário segue, ordenado por data
- [X] Paginação com cursor ou offset
- [X] FeedService (query otimizada com joins/subqueries)
- [X] Incluir contagem de likes e comentários em cada post

### 7 - Curtidas
- [X] Migration: tabela likes (user_id, post_id) com unique constraint
- [X] Model Like + relacionamentos
- [X] POST /api/posts/{id}/like
- [X] DELETE /api/posts/{id}/like
- [X] GET /api/posts/{id}/likes — quem curtiu
- [X] LikeService
- [X] Operações idempotentes: curtir repetido mantém curtido, descurtir repetido mantém descurtido

### 8 - Comentários
- [X] Migration: tabela comments (user_id, post_id, body)
- [X] Model Comment + relacionamentos
- [X] POST /api/posts/{id}/comments
- [X] PUT /api/comments/{id}
- [X] DELETE /api/comments/{id}
- [X] GET /api/posts/{id}/comments — listagem paginada
- [X] CommentService
- [X] Policy: só o dono edita/deleta (CommentPolicy)

### 9 - Finalização
- [X] Seeders completos (usuários, posts, follows, likes, comentários)
- [X] Testar todos os endpoints (Postman/Insomnia/Curl)
- [X] Documentar API (Swagger UI)
- [X] Revisar middlewares e policies
- [X] Revisar tratamento de erros (try/catch, HTTP status codes corretos)
- [X] Configurar CORS pra aceitar requests do frontend

### 10 - Dockerização
- [X] Dockerfile multi-stage (Composer + FrankenPHP/PHP 8.4 alpine)
- [X] Stage de vendor: `composer install --no-dev` com cache de build e `dump-autoload` otimizado
- [X] Stage de runtime: extensões PHP (`pdo_mysql`, `intl`, `zip`, `bcmath`, `opcache`, `pcntl`, `gd`, `redis`)
- [X] Instalar `mysql-client`, `tini` e `bash` no runtime
- [X] Expor porta 8000 e configurar `HEALTHCHECK` contra `/up`
- [X] compose.yaml com serviços `mysql` e `app`
- [X] Volume nomeado `mysql_data` pra persistir o banco
- [X] Volume nomeado `app_storage` montado em `/app/storage`
- [X] `depends_on` pra garantir ordem de boot (app depende do mysql)
- [X] `docker/entrypoint.sh` — bootstrap do `.env`, `key:generate`, wait-for-mysql, `migrate --force`, caches do Laravel e `storage:link`
- [X] `docker/php.ini` — overrides de `memory_limit`, uploads, timezone e OPcache/JIT
- [X] Configurar `env_file: .env` no serviço `app` e sobrescrever `DB_HOST: mysql`
- [X] Validar subida completa da stack com `docker compose up -d --build`
