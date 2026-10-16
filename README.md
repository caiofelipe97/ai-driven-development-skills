# AI Driven Development — projeto do zero com skills

Exercício do curso **AI Driven Development** (módulo *Agents, Skills & Engenharia de Contexto*): um monorepo fullstack criado do zero executando, em ordem, as skills de `.agents/skills`, sem escrever a estrutura manualmente.

O resultado é uma base de **autenticação no backend** (cadastro, login com JWT e rotas protegidas) organizada em domínio, persistência e HTTP. Cada skill executada virou um commit, e cada correção feita em uma skill virou um commit `fix(<skill>)` separado, então o histórico do git conta o passo a passo.

## Stack

- **Monorepo:** Turborepo + npm workspaces, namespace `@app`
- **Frontend:** Next.js (`apps/frontend`, porta 3000)
- **Backend:** NestJS 11 (`apps/backend`, porta 4000)
- **Banco:** PostgreSQL 16 via Docker Compose + Prisma 7 (adapter `pg`)
- **Auth:** bcrypt (hash de senha) + jsonwebtoken (JWT)
- **Testes:** Jest em todos os workspaces

## Estrutura

```text
apps/
  backend/            NestJS: Prisma, filtro de erros, guard JWT, controllers
  frontend/           Next.js (estrutura base do módulo auth)
modules/
  auth/               domínio de autenticação (@app/auth)
    src/user/
      model/          entidade User (validação lazy)
      provider/       contratos: UserRepository, CryptoProvider, TokenProvider
      usecase/        CRUD + RegisterUser + LoginUser
    test/             testes unitários + fakes em memória (test/mock)
packages/
  shared/             base compartilhada (@app/shared): Entity, erros, UseCase,
                      contratos de repositório e ~60 regras de validação
.agents/skills/       skills do curso (com as correções feitas no exercício)
```

O domínio (`modules/auth`) não conhece Nest nem Prisma. O backend implementa os contratos do domínio (`PrismaUserRepository`, `BcryptCryptoProvider`, `JwtTokenProvider`) e os entrega aos casos de uso.

## Como rodar

Pré-requisitos: Node.js 22.18+ (funciona em 22.15 com avisos de engine) e Docker.

```bash
npm install
```

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edite `apps/backend/.env` e defina um `JWT_SECRET` longo e aleatório (por exemplo, `openssl rand -hex 32`). Sem ele, o backend não sobe. Faça o mesmo para o frontend: `cp apps/frontend/.env.example apps/frontend/.env`.

```bash
npm --workspace apps/backend run db:start
```

```bash
npm --workspace apps/backend run prisma:migrate:deploy
```

```bash
npm run dev
```

Outros comandos úteis:

```bash
npm run build
```

```bash
npm run test --workspace @app/auth
```

```bash
npm run test --workspace @app/backend
```

```bash
npm run test --workspace @app/shared
```

## API

Todas as rotas exigem `Authorization: Bearer <token>`, exceto as marcadas como públicas.

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/` | pública | health-check |
| POST | `/auth/register` | pública | cadastro → `201` com o usuário (sem senha) |
| POST | `/auth/login` | pública | login → `200 { accessToken, user }` |
| GET | `/auth/me` | autenticada | usuário logado |
| GET | `/auth/users?page&perPage` | autenticada | lista paginada |
| GET | `/auth/users/:id` | autenticada | busca por id |
| PATCH | `/auth/users/:id` | autenticada | atualiza `name` e/ou `email` |
| DELETE | `/auth/users/:id` | autenticada | remove → `204` |

Regras principais:

- **Senha:** obrigatória, forte (8+ caracteres com maiúscula, minúscula, número e símbolo) e fora da lista de senhas comuns; é armazenada apenas como hash bcrypt.
- **E-mail:** normalizado (trim + minúsculas) e único; um e-mail duplicado retorna `409`.
- **Login:** retorna o mesmo `401 auth.invalid.credentials` para e-mail inexistente, senha errada ou usuário excluído, sem revelar qual foi o caso.
- **Respostas:** nunca incluem o hash da senha.

Os erros seguem um formato único, aplicado pelo filtro global:

```json
{
  "statusCode": 422,
  "error": "UNPROCESSABLE_ENTITY",
  "message": "Validation failed",
  "details": [{ "code": "user.email.invalid.email" }],
  "path": "/auth/register",
  "timestamp": "2026-10-16T00:58:27.469Z"
}
```

O arquivo [`apps/backend/src/modules/auth/auth.integration.http`](apps/backend/src/modules/auth/auth.integration.http) traz todos os cenários no formato do plugin **Rest Client** do VS Code, executáveis de cima para baixo: registro → login (o token é capturado da resposta) → rotas protegidas.

## Trilha das skills

Ordem sugerida pelo curso (`prompts/00-resumo.md`) e o que cada skill produziu:

| # | Skill | Resultado |
|---|---|---|
| 1 | `config-project-fullstack` | monorepo Turbo com Next.js e NestJS, CORS e `@nestjs/config` |
| 2 | `config-prisma` | Prisma 7, Postgres no Docker, `DbModule` e `PrismaService` |
| 3 | `config-package-shared` | pacote `@app/shared` (96 testes) |
| 4 | `config-new-module` | módulo `auth` no domínio, no backend e no frontend |
| 5 | `module-aggregate` | agregado `user` com a base CRUD |
| 6 | `module-entity` | entidade `User` (`name`, `email`, `password`) com 100% de cobertura |
| 7 | `shared-validation-rule` | não foi necessária: todas as regras já existiam no shared |
| 8 | `module-repository` | `UserRepository` (CRUD + `findByEmail`) e repositório fake |
| 9 | `module-use-case` | 5 casos de uso CRUD com 100% de cobertura |
| 10 | `backend-prisma-sync-module` | model `User` → tabela `users`, migration `auth` |
| 11 | `backend-prisma-repository` | `PrismaUserRepository` |
| 12 | `backend-provider-implementation` | `BcryptCryptoProvider` e `JwtTokenProvider` |
| 13 | `backend-nest-config` | filtro global de erros, guard JWT global, `@Public()` e `@CurrentUser()` |
| 14 | `backend-nest-controller` | rotas `/auth/me` e `/auth/users` + arquivo `.http` |
| 15 | `spec-backend-auth-basic` | `RegisterUser`, `LoginUser` e as rotas `register` e `login` |

Testes ao final: **59** no domínio `auth` (100% de cobertura nos casos de uso), **27** no backend e **96** no shared. O fluxo completo também foi validado por HTTP contra o Postgres.

## Correções feitas nas skills

Ao executar as skills em um projeto novo, alguns problemas apareceram. Eles foram corrigidos nas próprias skills (ver os commits `fix(...)`):

- **`config-project-fullstack`:**
  - passou a usar o Nest CLI 11 via `npx`, porque o CLI global v12 gera vitest/oxlint e o install falhava dentro do workspace;
  - o rewrite de namespace não altera mais os templates em `.agents/`.
- **`config-prisma`:** passou a rodar `prisma generate` após `--install`, com nova flag `--generate`.
- **`config-package-shared`:** o template não exportava `PageResult` em `db/index.ts`.
- **`module-aggregate`:** os templates tinham `@poupig/shared` fixo; agora o scope é detectado do módulo e a dependência do shared é adicionada.
- **`backend-prisma-repository`:** o caminho do `PrismaService` no exemplo estava errado.
- **`backend-nest-controller`:** os few-shots tinham imports com caminhos inválidos.
- **Várias skills:** o namespace `@poupig` estava fixo em comandos e exemplos e foi trocado pelo scope do projeto (`@app`).

## Fora do escopo / próximos passos

- **Autorização:** hoje qualquer usuário autenticado pode editar ou excluir qualquer outro; falta limitar `PATCH`/`DELETE` ao próprio usuário ou a um perfil admin.
- **Soft delete × e-mail único:** um usuário com `deletedAt` continua ocupando o e-mail; a solução seria um índice único parcial (`WHERE "deletedAt" IS NULL`).
- **Não incluído nesta versão:** refresh token, recuperação de senha, confirmação de e-mail e as telas de autenticação no frontend.
