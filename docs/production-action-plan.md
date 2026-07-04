# Plano de Acao de Correcao e Hardening

> Atualizado: 2026-07-04
> Contexto: producao ativa com `Vercel` (frontend), `Render` (backend principal) e `Supabase` (db/storage), com usuarios limitados no Google OAuth.

## Objetivo

Este plano transforma a analise anterior em um backlog executavel, priorizando baixo risco operacional. A ordem recomendada e:

1. estabilizar o ambiente real de producao
2. corrigir riscos de seguranca e autorizacao
3. recuperar confiabilidade de testes e docs
4. unificar arquitetura e reduzir duplicacoes
5. tratar escala, performance e manutencao

## Suposicoes operacionais

- O backend oficial hoje deve ser o processo Node/Hono em `Render`.
- O frontend oficial hoje deve ser a app React/Vite em `Vercel`.
- O handler serverless em `api/[[...route]].js` deve ser tratado como superficie secundaria ate confirmacao de uso.
- Como o Google OAuth ainda esta restrito a usuarios de teste, podemos validar ajustes de auth e upload com seguranca antes de expandir acesso.

## Fase 0 - Confirmacao do ambiente real

### Checklist

- [ ] Confirmar quais variaveis de ambiente existem em `Render`, `Vercel` e `Supabase`.
- [x] Confirmar qual valor real de `VITE_API_URL` esta apontando o frontend.
- [x] Verificar se `api/[[...route]].js` esta sendo usado em producao ou e apenas fallback.
- [x] Registrar o fluxo oficial `Vercel -> Render -> Supabase`.
- [x] Tirar uma baseline local de `build` e `tests`.
- [x] Tirar uma baseline local de `audit`.

### Arquivos para revisar primeiro

- `package.json`
- `vercel.json`
- `server/index.js`
- `api/[[...route]].js`
- `README.md`

### Resultado esperado

- Um mapa simples do runtime em producao.
- Decisao temporaria formal: `Render` como backend oficial ate unificacao.

### Status atual

- `VITE_API_URL` local aponta para `https://viralcuts-ke8u.onrender.com`.
- `FRONTEND_URL` local aponta para `https://viral-cuts-20.vercel.app`.
- O `vercel.json` reescreve `/api/*` para `api/[[...route]].js`, mas o handler serverless expõe apenas `auth` e `health`.
- O fluxo operacional atual fica registrado como `Vercel -> Render -> Supabase`.
- O projeto Supabase confirmado via plugin e `.env` e `viralcuts-production` (`wpguzmkmxpwlliksyauv`).
- `build` e `test` exigem execucao fora do sandbox local porque `vite/vitest` usam `esbuild` para resolver configs e tentam acessar diretorios ancestrais bloqueados pelo ambiente restrito.
- `npm run build` passa com Vite 5.4.21; restam apenas avisos de bundle acima de 500 kB, `baseline-browser-mapping` antigo e `caniuse-lite` antigo.
- `npm test` passa com Vitest 4.0.16: 20 arquivos e 328 testes aprovados.
- `npm audit` inicial encontrou 30 vulnerabilidades: 4 criticas, 17 altas, 8 moderadas e 1 baixa.
- `npm audit fix` sem `--force` reduziu para 5 vulnerabilidades restantes; as demais exigem breaking changes (`vite@8` ou downgrade/alteracao maior em `prisma`).

## Fase 1 - Seguranca P0

### 1. Dependencias vulneraveis

#### Acao

- [x] Atualizar dependencias vulneraveis corrigiveis sem breaking change via lockfile.
- [x] Rodar `npm audit fix` sem `--force`.
- [x] Revalidar `build` e `test`.
- [ ] Revalidar fluxos de login/upload.

#### Arquivos impactados

- `package.json`
- `package-lock.json`

#### Observacao

O projeto mistura `npm` com scripts `bun`, entao a padronizacao de runtime deve acontecer junto dessa etapa.

#### Status atual

- `package-lock.json` foi atualizado pelo `npm audit fix`; `package.json` manteve os ranges atuais.
- Vulnerabilidades restantes: `@hono/node-server` via `prisma`, `esbuild` via `vite`, `vite` e dependencias relacionadas.
- Nao foi usado `npm audit fix --force` porque exigiria mudancas potencialmente quebradoras (`vite@8` e alteracao maior no caminho do Prisma).
- `npm run build` passa apos a atualizacao.
- `npm test` passa apos a atualizacao: 20 arquivos e 328 testes.

### 2. OAuth state e exposicao de tokens

#### Acao

- [x] Substituir `state` serializado com `userId` por nonce opaco e expiravel.
- [x] Persistir o nonce em cookie `httpOnly` de curta duracao com armazenamento server-side em memoria.
- [x] Validar o nonce no callback antes de trocar `code` por token.
- [x] Repetir a mesma estrategia em `YouTube` e `TikTok`.
- [x] Remover ou restringir retorno de `access_token` ao frontend em refresh e no endpoint legado `/api/youtube/token`.

#### Arquivos impactados

- `server/index.js`
- `server/routes/youtube.js`
- `server/routes/tiktok.js`
- `server/services/youtube-auth.js`
- `server/services/oauth-state.js`

#### Status atual

- `server/index.js` agora delega o callback do YouTube para a rota endurecida compartilhada.
- `server/routes/youtube.js` e `server/routes/tiktok.js` validam nonce opaco com cookie `httpOnly`.
- `server/routes/youtube.js` nao devolve mais `access_token` em `/token` e restringe o refresh para resposta sem token.
- `server/routes/tiktok.js` restringe o refresh para resposta sem token.
- Ainda resta tratar o fluxo de upload YouTube que trafega token no browser.

### 3. Upload com token no browser

#### Acao

- [x] Escolher um fluxo oficial de upload YouTube.
- [x] Priorizar upload resumable iniciado/controlado no backend.
- [x] Descontinuar o fluxo ativo que dependia de `token` trafegando pelo browser no agendamento do calendario.
- [x] Se mantido temporariamente, proteger com flag e escopos minimos.

#### Arquivos impactados

- `server/routes/youtube.js`
- `src/api/realUpload.js`
- `src/api/upload.js`
- `src/pages/CalendarPage.jsx`
- `src/components/calendar/ScheduleVideoModal.jsx`

#### Status atual

- `src/pages/CalendarPage.jsx` agora inicia a sessao resumable via backend autenticado e faz apenas o `PUT` binario direto para o Google.
- `src/components/calendar/ScheduleVideoModal.jsx` deixou de repassar `_accessToken` no fluxo de agendamento.
- `server/routes/youtube.js` valida ownership em `/upload-complete`.
- `server/routes/youtube.js` bloqueia token vindo do browser no endpoint legado `/upload-init`, exceto se `ALLOW_LEGACY_BROWSER_YOUTUBE_TOKEN=true`.
- Ainda restam caminhos legados em `src/api/realUpload.js` e `server/routes/youtube.js` para consolidacao futura, mas sem token client-side habilitado por padrao.

### 4. Falhas de ownership e autorizacao

#### Acao

- [x] Passar `userId` para `updateTaskProgress` e `completeTask`.
- [x] Atualizar queries para `where: { id, userId }` ou equivalente com `updateMany`.
- [x] Retornar `404` ou `403` quando o recurso nao pertencer ao usuario autenticado.
- [x] Revisar todas as rotas que atualizam por `id` simples.

#### Arquivos impactados

- `server/routes/commandCenter.js`
- `server/services/commandCenterService.js`
- `server/routes/uploads.js`
- `server/routes/youtube.js`

#### Riscos observados hoje

- `server/routes/commandCenter.js` usa `taskId` sem vinculo com `user.id`.
- `server/services/commandCenterService.js` atualiza `dailyTask` apenas por `id`.

#### Status atual

- `server/routes/notifications.js` agora marca e remove notificacoes com filtro simultaneo por `id` e `userId`.
- `server/routes/uploads.js` agora aplica `updateMany` e `deleteMany` amarrados ao `userId` nas rotas de fila e status por plataforma.
- `server/routes/youtube.js` agora restringe atualizacoes de progresso, agendamento, cancelamento e `upload-complete` ao `userId` autenticado.
- `server/routes/tiktok.js` agora restringe desconexao de conta, reconciliacao de status e exclusao de upload ao `userId` autenticado.

### 5. Mensagens de erro e segredos

#### Acao

- [x] Trocar respostas com `error.message` por mensagens genericas em rotas prioritarias de producao.
- [x] Introduzir helper padrao de erro com `requestId`.
- [x] Deixar detalhes somente em `development`.

#### Arquivos impactados

- `server/index.js`
- `server/routes/youtube.js`
- `server/routes/uploads.js`
- `server/routes/subscription.js`
- `server/routes/ai.js`
- `server/utils/http-error.js`
- `api/[[...route]].js`

#### Status atual

- `server/utils/http-error.js` centraliza `requestId`, log estruturado basico e resposta segura.
- `server/routes/ai.js`, `server/routes/uploads.js`, `server/routes/subscription.js`, `server/routes/youtube.js`, `server/routes/tiktok.js`, `server/routes/notifications.js`, `server/routes/progress.js`, `server/routes/settings.js`, `server/routes/videos.js` e `server/routes/achievements.js` ja usam respostas padronizadas nas falhas mais sensiveis.
- `server/index.js` e `api/[[...route]].js` nao expoem mais `error.message` cru no health check.
- `server/routes/youtube.js` e `server/routes/tiktok.js` deixaram de repassar mensagens cruas de OAuth para o frontend em producao.
- O detalhe tecnico agora fica restrito ao log server-side e ao campo `detail` apenas quando `NODE_ENV=development`.

### 6. Supabase server-side

#### Acao

- [x] Exigir `SUPABASE_SERVICE_KEY` no backend para storage.
- [x] Falhar explicitamente quando a chave nao existir.
- [x] Revisar se `scheduled-videos` precisa permanecer privado.
- [x] Avaliar troca de `getPublicUrl` por URL assinada ou leitura autenticada.

#### Arquivos impactados

- `server/db/supabase.js`
- `server/routes/uploads.js`

#### Status atual

- `server/routes/uploads.js` agora retorna `storagePath`, nao URL publica.
- `server/jobs/scheduled-uploads.js` gera URL assinada curta somente na hora de baixar o video para publicar no TikTok.
- O job preserva fallback para `metadata.fileUrl` antigo, para nao quebrar uploads ja agendados antes da mudanca.
- `scheduled-videos` pode operar como bucket privado; nao depende mais de `getPublicUrl`.

### 7. Cookies, CORS e rate limit de auth

#### Acao

- [x] Ajustar cookies Better Auth por ambiente.
- [x] Mover origens CORS para env como lista controlada.
- [x] Aplicar `authRateLimiter` de forma segura nas rotas de auth, sem quebrar o Better Auth.

#### Arquivos impactados

- `server/auth.js`
- `server/index.js`
- `api/[[...route]].js`

## Fase 2 - Confiabilidade e pipeline

### 1. Corrigir a suite de testes

Status atual: frente descontinuada. O pacote legado `command-center` foi removido por nao estar ligado a nenhuma rota ativa da aplicacao.

#### Acao

- [x] Remover a suite de testes do `command-center` junto com a feature legada.
- [x] Encerrar manutencao de mocks e asserts desse modulo nao utilizado.
- [x] Corrigir testes desalinhados de `Button`, `WidgetWrapper` e `ExportButton`.
- [x] Confirmar suite completa verde com `npm test`.

#### Arquivos impactados

- `src/components/command-center/**`
- `src/hooks/useCommandCenterAPI.js`
- `src/services/commandCenterService.js`
- `src/types/command-center.ts`
- `server/routes/commandCenter.js`
- `server/services/commandCenterService.js`
- `server/index.js`
- `prisma/schema.prisma`
- `src/components/ui/button.test.jsx`
- `src/components/shared/WidgetWrapper.test.jsx`
- `src/components/analytics/ExportButton.jsx`
- `src/components/analytics/ExportButton.test.jsx`

### 2. Adicionar validacoes de qualidade

#### Acao

- [ ] Adicionar `lint`.
- [ ] Adicionar `format:check`.
- [ ] Adicionar `typecheck` se o plano de TS continuar.

#### Arquivos impactados

- `package.json`
- `vitest.config.js`
- `tsconfig.json`

#### Status atual

- Ainda nao ha `eslint`, `prettier` ou `typescript` instalados no projeto.
- `tsconfig.json` existe, mas `tsc` nao esta disponivel como dependencia.
- Esta frente deve instalar tooling antes de ativar scripts para evitar scripts falsamente verdes.

### 3. Atualizar onboarding e documentacao

#### Acao

- [x] Reescrever `README.md` com fluxo real via `npm`.
- [x] Explicar `Render`, `Vercel`, `Supabase`, `Prisma`, `Google OAuth`, `Stripe`.
- [x] Remover a referencia atual a `bun run index.ts`.
- [x] Apontar este plano como backlog tecnico de curto prazo.

#### Arquivos impactados

- `README.md`
- `index.ts`

## Fase 3 - Arquitetura e deploy

### 1. Unificar a app Hono

#### Acao

- [ ] Extrair montagem de middlewares e rotas para `server/app.js`.
- [ ] Fazer `server/index.js` apenas iniciar o servidor.
- [ ] Fazer `api/[[...route]].js` consumir a mesma app compartilhada.
- [ ] Remover duplicacao de health/auth/cors entre os dois entrypoints.

#### Arquivos impactados

- `server/index.js`
- `api/[[...route]].js`
- `server/app.js` (novo)

#### Ordem segura

1. extrair app compartilhada
2. validar `Render`
3. validar handler `Vercel`
4. so depois considerar desligar codigo duplicado

### 2. Definir o modelo oficial de jobs agendados

#### Acao

- [x] Confirmar se o job atual deve continuar apenas em `Render`.
- [ ] Se houver plano de serverless puro, mover para cron externo ou endpoint protegido.
- [x] Adicionar locking no banco para evitar execucoes duplicadas.

#### Arquivos impactados

- `server/index.js`
- `server/jobs/scheduled-uploads.js`

#### Status atual

- Modelo oficial mantido como processo Node/Hono em `Render`.
- `server/jobs/scheduled-uploads.js` agora faz lock otimista via transicao `scheduled -> processing`.
- O lock nao exigiu migration Prisma; usa `updateMany` condicionado ao status atual.
- Rotas serverless/cron externo seguem pendentes apenas se houver decisao futura de sair do job em `Render`.

### 3. Centralizar cliente HTTP do frontend

#### Acao

- [x] Escolher um unico client base.
- [x] Consolidar fetch wrappers e tratamento de erro.
- [ ] Separar adaptadores `real`, `mock` e `offline`.

#### Arquivos impactados

- `src/lib/api-client.js`
- `src/api/backend.js`
- `src/api/upload.js`
- `src/api/realUpload.js`
- `src/api/youtube.js`
- `src/api/tiktokUpload.js`

#### Status atual

- `src/lib/api-client.js` virou o client base para chamadas internas ao backend.
- `src/api/notifications.js`, `src/api/admin.js`, `src/api/youtube.js`, `src/api/tiktokUpload.js`, `src/hooks/useSubscription.js` e `src/hooks/useTikTokAuth.js` usam `fetchAPI` nos endpoints internos migrados.
- Chamadas externas diretas para Google/Opus foram mantidas fora do client interno.
- Separacao formal de adaptadores `real`, `mock` e `offline` segue pendente.
- `npm run build` passa apos a migracao.

### 4. Remover mocks acidentais de producao

#### Acao

- [x] Colocar mocks sob `VITE_USE_MOCKS=true`.
- [x] Falhar de forma honesta em producao quando a integracao real nao existir.
- [x] Eliminar `Math.random()` para URLs, views e metricas em caminhos ativos.

#### Arquivos impactados

- `src/api/upload.js`
- `src/api/analytics.js`
- `src/api/youtube.js`

#### Status atual

- `src/config/features.js` centraliza `VITE_USE_MOCKS`.
- `src/api/upload.js`, `src/api/youtube.js` e `src/api/analytics.js` so retornam simulacoes quando `VITE_USE_MOCKS=true`.
- Fallbacks de quota/erro em analytics agora falham em producao em vez de retornar metricas falsas.
- `Math.random()` foi removido dos dados/URLs simulados destes caminhos.
- `npm run build` passa apos a mudanca.

## Fase 4 - Hardening e escala

### 1. Uploads e validacao de payload

#### Acao

- [ ] Adicionar limite de tamanho de arquivo.
- [ ] Validar MIME type e, se possivel, assinatura magica.
- [ ] Evitar `arrayBuffer()` completo para arquivos grandes.
- [ ] Introduzir validacao de payload com `Zod` ou `Valibot`.

#### Arquivos impactados

- `server/routes/uploads.js`
- `server/routes/youtube.js`
- `server/routes/tiktok.js`

### 2. Banco e indices

#### Acao

- [ ] Revisar uso ambiguo de `Account.idToken`.
- [ ] Adicionar indices para consultas quentes.
- [ ] Planejar criptografia de tokens OAuth em repouso.
- [x] Preparar migration Prisma para remover tabelas legadas do `command-center` ja descontinuado.

#### Arquivos impactados

- `prisma/schema.prisma`
- `server/routes/youtube.js`
- `server/index.js`
- `prisma/migrations/20260704101500_remove_command_center_legacy_tables/migration.sql`

### 3. Rate limit distribuido e observabilidade

#### Acao

- [ ] Substituir rate limit em memoria por Redis/Upstash.
- [ ] Separar limites por rota de IA, upload e auth.
- [ ] Introduzir logging estruturado.

#### Arquivos impactados

- `server/middleware/rate-limit.js`
- `server/index.js`
- `server/routes/ai.js`
- `server/routes/uploads.js`

### 4. Performance e manutencao

#### Acao

- [ ] Fazer lazy load das paginas mais pesadas.
- [ ] Quebrar componentes e hooks com mais de 700 linhas.
- [ ] Reduzir bundle inicial e imports de icones.

#### Arquivos impactados

- `src/pages/CreationPage.jsx`
- `src/pages/CalendarPage.jsx`
- `src/hooks/useDashboardState.jsx`
- `src/components/calendar/ScheduleVideoModal.jsx`

## Ordem de execucao recomendada

1. confirmar topologia real de producao
2. atualizar dependencias criticas
3. corrigir OAuth, token exposure e ownership
4. corrigir suite de testes
5. atualizar README e scripts
6. unificar a app Hono
7. consolidar API client e mocks
8. fazer hardening de upload, rate limit e tokens

## Checklist de comandos

```bash
npm audit fix
npm run build
npm test
npm run prisma:generate
```

Se o fluxo `npm` virar oficial, adicionar tambem:

```bash
npm run lint
npm run format:check
```

## Dependencias externas e plugins

Hoje nao e obrigatorio instalar plugin para comecar as correcoes locais. Plugins podem ajudar depois em:

- validar configuracoes reais do `Supabase`
- consultar variaveis/config do deploy
- automatizar inspecao operacional

Se formos mexer diretamente em configuracoes hospedadas, os plugins mais uteis seriam os de `Supabase`, `Vercel` e possivelmente `GitHub`, mas o backlog acima pode ser iniciado sem eles.
