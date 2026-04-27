# Projeto-Final-CodeAcademy - CodeNet

Este projeto e uma aplicacao de rede social desenvolvida como meu projeto de conclusao do curso Code Academy com foco em Front-end, realizado na empresa 3C.

A proposta original era construir o frontend de uma rede social, mas eu quis dar uma direcao mais especifica ao projeto e transformar a ideia em uma plataforma voltada para desenvolvedores. Assim nasceu o `CodeNet`, uma rede social pensada para que devs possam compartilhar problemas, mostrar como resolveram, trocar experiencia e fortalecer uma comunidade tecnica.

A proposta central do projeto e unir:

- autenticacao, perfis e interacao social;
- publicacoes com foco em troca de conhecimento;
- experiencia visual moderna para desktop e mobile;
- integracao entre frontend e API;
- execucao simplificada via Docker.

Ao longo do desenvolvimento, o projeto evoluiu com melhorias de arquitetura e entrega, incluindo:

- frontend completo em Vue com navegacao protegida;
- integracao com backend Laravel;
- busca e descoberta de usuarios;
- feed com filtro visual e interacoes sociais;
- dockerizacao unificada de frontend + backend;
- populacao automatica do backend com dados mockados para demonstracao.

## Contexto e autoria

Este projeto representa a minha entrega final no curso de Code Academy (Front-end), realizado na 3C.

Minha responsabilidade principal foi:

- desenvolver o frontend da aplicacao;
- integrar as telas aos endpoints da API;
- adaptar a experiencia para a proposta do `CodeNet`;
- organizar a versao final do projeto com execucao unificada via Docker.

O backend foi desenvolvido pelo meu professor, [Victor Raphael](https://github.com/victor-raphael17).

Na parte do backend, a minha participacao foi:

- popular a aplicacao com dados mockados;
- ajustar a integracao entre frontend e API;
- adaptar a dockerizacao final para apresentacao e uso local.

## Conceito do Projeto

O `CodeNet` foi pensado como uma rede social para desenvolvedores.

Em vez de ser apenas uma rede social generica de fotos e interacoes, a proposta foi usar a estrutura de perfis, posts, comentarios e relacoes entre usuarios para criar um espaco onde devs possam:

- relatar problemas encontrados em projetos;
- compartilhar como resolveram esses problemas;
- registrar aprendizados tecnicos;
- acompanhar outros perfis com interesses parecidos;
- construir comunidade em torno de tecnologia.

## Tecnologias Utilizadas

- Vue 3 + Composition API: estrutura do frontend e reatividade das telas.
- Vue Router: navegacao entre login, feed, descobrir, criar post, perfil e detalhes.
- Pinia: estado global de autenticacao e feed.
- Vite: ambiente de desenvolvimento e build de producao do frontend.
- Axios: consumo centralizado da API.
- Laravel: API backend com autenticacao, usuarios, posts, likes, comentarios e follow.
- Laravel Sanctum: autenticacao baseada em token.
- MySQL: persistencia dos dados.
- Docker + Docker Compose: execucao padronizada da stack.
- FrankenPHP: runtime do backend em producao.

## Funcionalidades

### 1. Autenticacao e Area Protegida

- Login e cadastro de usuarios.
- Persistencia local do token de autenticacao.
- Rotas protegidas para a area autenticada.
- Redirecionamento automatico quando o token expira ou fica invalido.

### 2. Feed e Interacao Social

- Feed principal com publicacoes ordenadas.
- Curtidas em posts.
- Comentarios em publicacoes.
- Criacao de posts com imagem e legenda.
- Visualizacao detalhada de post.

### 3. Descoberta e Relacao entre Usuarios

- Lista de sugestoes de perfis.
- Busca por nome ou username.
- Seguir e deixar de seguir usuarios.
- Paginação de resultados.

### 4. Perfil

- Visualizacao do proprio perfil e de terceiros.
- Edicao de dados basicos do perfil.
- Upload de avatar.
- Listagem de seguidores e seguindo.

### 5. Dados Mockados para Demonstracao

- Usuarios de exemplo criados automaticamente.
- Posts, likes, comentarios e follows populados no backend.
- Imagens mockadas geradas automaticamente para demonstracao visual.

## Adaptacoes que eu fiz no projeto

### 1. Rede social voltada para devs

Embora a base do sistema fosse a de uma rede social tradicional, eu direcionei o projeto para o universo de desenvolvimento. Isso mudou a forma como pensei o frontend, o tom da interface e a proposta de uso da plataforma.

### 2. "Forum" sem classe propria no backend

Uma das ideias que eu queria no `CodeNet` era ter uma dinamica parecida com forum ou discussao tecnica. Como eu nao criei uma classe nova no backend para isso, reaproveitei a estrutura de posts no frontend para representar tambem publicacoes mais voltadas a debate.

Na pratica, foi uma adaptacao para permitir uma experiencia de comunidade tecnica sem alterar toda a modelagem da API. Nao e uma implementacao de forum no sentido formal do backend, mas funcionou como uma camada de apresentacao para aproximar o projeto da proposta que eu queria.

### 3. GitHub na bio

Como o backend nao possuia um campo especifico para GitHub no perfil, usei a bio como espaco flexivel para o usuario informar seu link ou identificacao do GitHub.

Nao e a modelagem ideal, mas foi uma decisao pratica para manter a proposta do `CodeNet` sem exigir alteracao estrutural na API.

## Estrutura do Projeto

```text
.
├── Backend/
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── docker/
│   ├── public/
│   ├── resources/
│   ├── routes/
│   └── tests/
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── router/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── utils/
│   │   └── views/
├── Dockerfile
├── compose.yaml
└── README.md
```

## Como o projeto funciona

O sistema foi dividido em duas partes:

- `Frontend/`: interface responsavel pelas telas, navegacao, autenticacao e consumo da API.
- `Backend/`: API responsavel pelas regras de negocio, autenticacao, usuarios, posts, comentarios, curtidas e relacoes entre perfis.

Na versao final, o frontend e compilado e servido junto com o backend no mesmo container de aplicacao, enquanto o banco MySQL roda em um container separado.

Essa decisao foi tomada para:

- simplificar a execucao local;
- facilitar a apresentacao do projeto;
- permitir que a aplicacao suba com um unico comando;
- deixar o ambiente mais facil de reproduzir em outra maquina.

## Dados Mockados

O backend foi configurado para iniciar com dados de demonstracao automaticamente quando o banco estiver vazio.

Isso inclui:

- usuarios;
- posts;
- comentarios;
- curtidas;
- relacoes de follow;
- imagens mockadas para os posts.

Essa escolha foi importante para que o sistema pudesse ser apresentado ja com conteudo visivel, sem depender de cadastro e alimentacao manual logo no primeiro uso.

## Como Executar Localmente

Na raiz do projeto:

```powershell
docker compose up -d --build
```

Depois disso, a aplicacao fica disponivel em:

```text
http://localhost:8000
```

Se for necessario recriar tudo do zero, incluindo banco e dados mockados:

```powershell
docker compose down -v
docker compose up -d --build
```

## Conta Demo

Para testes no ambiente populado:

```text
email: demo@instaclone.test
senha: password
```

## Objetivo do Projeto

Este projeto consolida a minha entrega final no curso Code Academy (Front-end) com foco em:

- desenvolvimento de interface com Vue;
- integracao com uma API real;
- organizacao de uma experiencia completa de autenticacao e interacao social;
- adaptacao de uma proposta generica para uma comunidade de devs;
- empacotamento final da aplicacao para apresentacao e reproducao local.

Mais do que reproduzir uma rede social comum, a ideia do `CodeNet` foi transformar a base do projeto em algo mais alinhado com o universo de tecnologia e comunidade entre desenvolvedores.
