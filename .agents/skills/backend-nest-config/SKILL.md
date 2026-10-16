---
name: backend-nest-config
description: Configura a base compartilhada do backend NestJS com tratamento centralizado de erros, autenticacao por JWT, decorators utilitarios e infraestrutura comum para endpoints protegidos da aplicacao.
---

# Backend Nest Config

## Objetivo

Estruturar a camada compartilhada do backend NestJS, preferencialmente em `apps/backend/src/shared/`, para centralizar tratamento de erros da API, autenticacao por JWT, guards, decorators e tipos reutilizaveis para controllers e endpoints protegidos.

Esta skill existe para remover repeticao nos controllers, evitar `try/catch` manual para erros de dominio e criar uma base segura e extensivel para rotas autenticadas, sempre respeitando a hierarquia de erros ja existente em `packages/shared`.

## Leituras obrigatorias

Antes de implementar, ler obrigatoriamente os arquivos listados em `references/mandatory-readings.md`.

Isso inclui, no minimo:

- `packages/shared/src/error/index.ts`
- `packages/shared/src/error/domain.error.ts`
- `packages/shared/src/error/validation.error.ts`
- `packages/shared/src/error/validation.exception.ts`
- `apps/backend/src/app.module.ts`
- `apps/backend/src/main.ts`
- `apps/backend/src/modules/auth/auth.controller.ts`

Tambem e obrigatorio procurar no projeto arquivos ja existentes relacionados a autenticacao, usuario autenticado, token, JWT, claims ou contexto do request antes de criar nova infraestrutura.

## Workflow

1. Validar contexto minimo do backend.
   - Confirmar a existencia de `apps/backend/src/app.module.ts` e `apps/backend/src/main.ts`.
   - Se o backend nao estiver em `apps/backend`, descobrir a raiz real do app Nest pelo contexto antes de editar.
2. Ler as referencias obrigatorias.
   - Entender como `DomainError`, `ValidationError` e `ValidationException` sao modelados no `packages/shared`.
   - Identificar como o bootstrap atual do Nest esta configurado.
   - Verificar se controllers atuais ja repetem conversao manual de erro para resposta HTTP.
3. Descobrir autenticacao existente.
   - Procurar por termos como `jwt`, `token`, `claims`, `passport`, `AuthGuard`, `CurrentUser`, `request.user`, `req.user`, `Authorization` e `Bearer`.
   - Reaproveitar o que ja existir quando for compativel.
   - So criar uma base minima nova quando o projeto ainda nao tiver infraestrutura equivalente.
4. Definir a camada compartilhada do backend.
   - Preferir `apps/backend/src/shared/` como raiz.
   - Criar subpastas como `errors`, `auth`, `decorators` e `types` quando fizer sentido.
   - Criar `index.ts` apenas quando isso ajudar a manter imports consistentes sem gerar ruido.
5. Centralizar o tratamento de erros.
   - Criar um filtro global de excecao do NestJS.
   - Padronizar a resposta HTTP para `ValidationException`, `ValidationError`, `DomainError`, `HttpException` do Nest e erros inesperados.
   - Remover de controllers a necessidade de `try/catch` apenas para traduzir erros de dominio.
6. Estruturar autenticacao JWT compartilhada.
   - Criar guard e utilitarios compartilhados para proteger endpoints.
   - Reaproveitar modulo, service, strategy ou provider de autenticacao existente quando compativel.
   - Se nao existir nada, criar uma base minima e extensivel, sem assumir claims alem do necessario.
7. Criar decorator do usuario autenticado.
   - Implementar algo no estilo `@CurrentUser()`.
   - Permitir retorno do payload inteiro ou de uma propriedade especifica quando isso fizer sentido no contexto real.
8. Integrar no bootstrap e nos modulos.
   - Registrar o filtro global preferencialmente em `apps/backend/src/main.ts`.
   - Registrar providers, modulos ou imports necessarios no `AppModule` ou em um modulo compartilhado do backend, conforme a estrutura encontrada.
9. Revisar controllers impactados.
   - Remover repeticao de tratamento manual de erro quando a nova infraestrutura ja cobrir o caso.
   - Manter controllers focados no fluxo do endpoint.
10. Validar resultado.
   - Rodar build e, se houver testes relevantes do backend, executa-los.
   - Reportar arquivos criados ou alterados e qualquer suposicao feita sobre o payload autenticado.

## Estrutura alvo

Preferir uma estrutura compartilhada como esta, adaptando ao projeto real quando necessario:

```text
apps/backend/src/shared/
  auth/
    jwt-auth.guard.ts
    jwt.strategy.ts
    auth-user.mapper.ts
    index.ts
  decorators/
    current-user.decorator.ts
    public.decorator.ts
    index.ts
  errors/
    api-exception.filter.ts
    error-response.type.ts
    index.ts
  types/
    authenticated-request.type.ts
    jwt-payload.type.ts
    current-user.type.ts
    index.ts
```

Nem todos os arquivos acima sao obrigatorios. Criar apenas o conjunto minimo que deixe a base clara, reutilizavel e coerente com o projeto.

## Regras do filtro global de excecao

- O filtro deve ser global e eliminar a necessidade de `try/catch` repetido em controllers.
- O filtro deve reconhecer ao menos:
  - `ValidationException`
  - `ValidationError`
  - `DomainError`
  - `HttpException` nativa do Nest
  - erros inesperados
- Para `ValidationException`, preservar a lista interna em formato estruturado e estavel para o frontend.
- Para `ValidationError`, retornar erro de validacao consistente com status `422`.
- Para `DomainError`, respeitar o `statusCode` definido na propria excecao.
- Para `HttpException`, preservar o status HTTP e normalizar o corpo para o shape padrao da API.
- Para erros inesperados, responder de forma segura, sem vazar stack trace ou detalhes internos sensiveis.
- Nao recriar uma nova hierarquia paralela de erros no backend. O backend deve consumir a hierarquia de `packages/shared`.

## Shape de erro recomendado

Quando nao houver padrao preexistente mais forte no projeto, usar um shape previsivel como:

```ts
type ApiErrorResponse = {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
  path?: string;
  timestamp: string;
};
```

Para `ValidationException`, `details` deve conter a colecao estruturada de erros internos em vez de apenas strings soltas.

## Regras da autenticacao JWT

- Criar uma base compartilhada para endpoints protegidos, com guard e utilitarios comuns.
- Antes de instalar ou criar qualquer infraestrutura nova, verificar se o projeto ja usa `JwtModule`, `PassportModule`, `passport-jwt`, `jsonwebtoken` ou mecanismo equivalente.
- Se ja existir estrategia compativel, integrar com ela em vez de duplicar implementacao.
- Se nao existir, criar o caminho minimo, claro e extensivel para:
  - extrair o token do header `Authorization`
  - validar o JWT com configuracao baseada no projeto
  - anexar o usuario autenticado ao request
- Nao assumir um payload rigido alem do necessario para autenticacao funcionar.
- Se o projeto tiver um formato local claro para claims, refletir esse formato nos tipos auxiliares.
- Proteger rotas e controllers de forma simples e padronizada, preferencialmente com um guard compartilhado e um decorator opcional para rotas publicas quando isso simplificar o uso.

## Regras do decorator de usuario autenticado

- Criar um decorator simples, como `@CurrentUser()`.
- O decorator deve ler o usuario autenticado do request ja validado pelo guard.
- Quando fizer sentido, permitir:
  - `@CurrentUser()` para o objeto inteiro
  - `@CurrentUser('id')` para uma propriedade especifica
- A implementacao deve ser robusta contra pequenas variacoes do payload autenticado entre projetos.
- Se houver mapeamento entre payload JWT e `request.user`, concentrar essa logica em `shared/auth` em vez de espalha-la por decorators e controllers.

## Regras de integracao

- Integrar o filtro global preferencialmente em `apps/backend/src/main.ts`.
- Integrar guard, strategy, decorators e tipos sem acoplar a um modulo de negocio especifico.
- Se a autenticacao depender de providers globais, usar `AppModule` ou um modulo compartilhado do backend.
- Se o projeto ja tiver `AuthModule`, preferir conectar a nova infraestrutura a ele quando isso reduzir duplicacao.
- Evitar alterar o dominio em `modules/` e evitar mover regras de negocio para o backend compartilhado.

## Guardrails

- Nao espalhar tratamento de erro pelos controllers.
- Nao recriar classes de erro que ja existem em `packages/shared`.
- Nao assumir que JWT payload sempre contem os mesmos campos entre projetos.
- Nao criar paths rigidos fora da estrutura padrao do backend sem antes descobrir o contexto real.
- Nao duplicar guard, strategy, decorator ou helper equivalente que ja exista no projeto.
- Nao acoplar a implementacao a um unico modulo de negocio.
- Nao esconder lacunas do projeto. Se faltar segredo JWT, provider de assinatura, modulo auth ou formato minimo do payload, implementar a base extensivel e explicitar a suposicao no resultado.

## Saida esperada

- Pasta compartilhada do backend criada ou consolidada, preferencialmente em `apps/backend/src/shared/`.
- Filtro global de excecao integrado ao bootstrap do NestJS.
- Resposta HTTP de erros padronizada para erros de dominio, validacao, HTTP e erros inesperados.
- Infraestrutura JWT reutilizavel para endpoints protegidos.
- Decorator de usuario autenticado criado e funcional.
- Controllers simplificados, sem `try/catch` repetido apenas para traduzir erros.

## Referencias

- Ler `references/mandatory-readings.md` antes de implementar.
- Se o projeto tiver convencoes locais fortes de autenticacao, ler tambem os arquivos encontrados na busca por `jwt`, `token`, `claims`, `CurrentUser`, `request.user` e `AuthGuard`.
