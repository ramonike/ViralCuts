# ViralCuts Dashboard - Roadmap de Implementação

> Documento gerado em: 28/12/2024  
> Status: Planejamento

---

## 📋 Visão Geral

Este documento organiza todas as melhorias sugeridas em tasks e subtasks priorizadas para o desenvolvimento do ViralCuts Dashboard.

---

## 🔴 Alta Prioridade

### Task 1: Persistência de Dados no Backend

**Objetivo:** Migrar dados do localStorage para PostgreSQL via Prisma

#### Subtasks:

- [ ] **1.1** Criar models no Prisma
  - [ ] Model `Video` (id, title, description, youtubeId, thumbnail, status, userId)
  - [ ] Model `Upload` (id, videoId, platform, status, scheduledAt, publishedAt, userId)
  - [ ] Model `UserProgress` (id, currentStage, completedMilestones, experienceLevel, userId)
  - [ ] Model `Achievement` (id, achievementId, unlockedAt, userId)
  - [ ] Model `UserSettings` (id, theme, notifications, defaultPrivacy, userId)

- [ ] **1.2** Criar endpoints no Hono
  - [ ] `GET/POST /api/progress` - Buscar/salvar progresso da jornada
  - [ ] `GET/POST/DELETE /api/uploads` - CRUD da fila de uploads
  - [ ] `GET/POST /api/achievements` - Buscar/desbloquear conquistas
  - [ ] `GET/PUT /api/settings` - Configurações do usuário
  - [ ] `GET /api/videos` - Listar vídeos do usuário

- [ ] **1.3** Atualizar hooks do frontend
  - [ ] Modificar `useJourneyContext` para usar API
  - [ ] Modificar `useUploadQueue` para persistir no backend
  - [ ] Modificar `useSettings` para sincronizar com servidor
  - [ ] Implementar estratégia de fallback (offline-first)

- [ ] **1.4** Migração de dados existentes
  - [ ] Criar script de migração localStorage → PostgreSQL
  - [ ] Implementar detecção de dados locais no primeiro login

---

### Task 2: Upload Real para YouTube

**Objetivo:** Implementar upload funcional de vídeos para YouTube

#### Subtasks:

- [ ] **2.1** Configurar OAuth 2.0 completo
  - [ ] Implementar fluxo de refresh token
  - [ ] Armazenar tokens de forma segura no backend
  - [ ] Criar endpoint `/api/auth/youtube/refresh`

- [ ] **2.2** Implementar upload resumível
  - [ ] Usar YouTube Resumable Upload API
  - [ ] Implementar progress tracking
  - [ ] Tratar erros e retentativas automáticas

- [ ] **2.3** Suporte a metadados completos
  - [ ] Upload de thumbnail customizada
  - [ ] Tags e categorias
  - [ ] Legendas/closed captions
  - [ ] Playlists

- [ ] **2.4** Agendamento de publicação
  - [ ] Validar horários permitidos pela API
  - [ ] Implementar fila de processamento (background jobs)
  - [ ] Notificar usuário quando publicado

---

### Task 3: Testes Automatizados

**Objetivo:** Aumentar cobertura de testes para >70%

#### Subtasks:

- [ ] **3.1** Testes unitários de hooks
  - [ ] `useYouTubeAuth.test.js`
  - [ ] `useDashboardState.test.js`
  - [ ] `usePipeline.test.js`
  - [ ] `useUploadQueue.test.js`
  - [ ] `useErrorHandler.test.js`

- [ ] **3.2** Testes de componentes
  - [ ] Componentes de autenticação (LoginPage, RegisterPage)
  - [ ] Componentes de journey (CreatorJourney, OnboardingWizard)
  - [ ] Componentes de upload (UploadQueuePanel, UploadProgress)

- [ ] **3.3** Testes de integração
  - [ ] Fluxo completo de login → dashboard
  - [ ] Fluxo de conexão YouTube
  - [ ] Fluxo de upload de vídeo

- [ ] **3.4** Testes E2E
  - [ ] Configurar Playwright ou Cypress
  - [ ] Cenários críticos de usuário
  - [ ] CI/CD integration (GitHub Actions)

---

## 🟡 Média Prioridade

### Task 4: Analytics Real

**Objetivo:** Integrar YouTube Analytics API com dados reais

#### Subtasks:

- [ ] **4.1** Integração com YouTube Analytics API
  - [ ] Configurar escopo `yt-analytics.readonly`
  - [ ] Implementar `fetchRealAnalytics()` em `youtube.js`
  - [ ] Cachear dados para reduzir chamadas API

- [ ] **4.2** Novas métricas
  - [ ] CTR (Click-Through Rate) por vídeo
  - [ ] Retenção média de audiência
  - [ ] Melhores horários de publicação
  - [ ] Crescimento de inscritos

- [ ] **4.3** Visualizações avançadas
  - [ ] Gráfico comparativo semanal/mensal
  - [ ] Heatmap de horários de visualização
  - [ ] Top 5 vídeos por performance
  - [ ] Exportar relatórios (PDF/CSV)

- [ ] **4.4** Atualizar AnalyticsPage
  - [ ] Substituir dados mock por dados reais
  - [ ] Adicionar filtros de período
  - [ ] Implementar loading states

---

### Task 5: Sistema de Notificações

**Objetivo:** Implementar notificações in-app e push

#### Subtasks:

- [ ] **5.1** Notificações in-app
  - [ ] Expandir `NotificationContext` existente
  - [ ] Criar componente `NotificationCenter`
  - [ ] Histórico de notificações
  - [ ] Marcar como lida/não lida

- [ ] **5.2** Tipos de notificações
  - [ ] Upload concluído com sucesso/erro
  - [ ] Vídeo agendado foi publicado
  - [ ] Nova conquista desbloqueada
  - [ ] Lembrete de consistência (streak)
  - [ ] Quota YouTube próxima do limite

- [ ] **5.3** Push notifications (opcional)
  - [ ] Configurar Service Worker
  - [ ] Integrar Web Push API
  - [ ] Permitir opt-in/opt-out por tipo

---

### Task 6: Suporte Multi-plataforma

**Objetivo:** Adicionar TikTok e Instagram Reels

#### Subtasks:

- [ ] **6.1** Integração TikTok
  - [ ] Configurar TikTok for Developers
  - [ ] Implementar OAuth TikTok
  - [ ] API de upload TikTok
  - [ ] Adaptar UI para seleção de plataforma

- [ ] **6.2** Integração Instagram Reels
  - [ ] Configurar Meta for Developers
  - [ ] Implementar OAuth Instagram Business
  - [ ] API de upload via Graph API
  - [ ] Suporte a cross-posting

- [ ] **6.3** Fila unificada
  - [ ] Modificar model `Upload` para multi-plataforma
  - [ ] UI de seleção múltipla de destinos
  - [ ] Status individual por plataforma

---

## 🟢 Baixa Prioridade

### Task 7: PWA / Mobile

**Objetivo:** Transformar em Progressive Web App

#### Subtasks:

- [ ] **7.1** Configuração PWA
  - [ ] Criar `manifest.json`
  - [ ] Implementar Service Worker
  - [ ] Configurar cache strategies
  - [ ] Ícones para diferentes dispositivos

- [ ] **7.2** Otimização mobile
  - [ ] Revisar responsividade de todos os componentes
  - [ ] Implementar gestos touch (swipe, pull-to-refresh)
  - [ ] Otimizar performance em conexões lentas

- [ ] **7.3** Funcionalidades offline
  - [ ] Visualizar dashboard offline
  - [ ] Queue de uploads offline
  - [ ] Sincronização quando reconectar

---

### Task 8: Sistema de Colaboração

**Objetivo:** Permitir equipes e workspaces

#### Subtasks:

- [ ] **8.1** Models de colaboração
  - [ ] Model `Team` (id, name, ownerId)
  - [ ] Model `TeamMember` (teamId, userId, role)
  - [ ] Model `Invitation` (teamId, email, status)

- [ ] **8.2** Permissões
  - [ ] Roles: Owner, Admin, Editor, Viewer
  - [ ] Permissões granulares por funcionalidade
  - [ ] Audit log de ações

- [ ] **8.3** UI de equipes
  - [ ] Página de gerenciamento de equipe
  - [ ] Convites por email
  - [ ] Switcher de workspace

---

### Task 9: IA Integrada

**Objetivo:** Adicionar funcionalidades de IA nativas

#### Subtasks:

- [ ] **9.1** Geração de conteúdo
  - [ ] Integrar OpenAI API ou similar
  - [ ] Gerar títulos otimizados para SEO
  - [ ] Gerar descrições automáticas
  - [ ] Sugerir tags baseadas no conteúdo

- [ ] **9.2** Análise de tendências
  - [ ] Identificar trending topics no nicho
  - [ ] Sugerir ideias de vídeos
  - [ ] Prever performance de títulos

- [ ] **9.3** Otimização automática
  - [ ] Análise de thumbnail (cores, texto, faces)
  - [ ] Score de "viralidade" estimado
  - [ ] Recomendações de melhoria

---

## 🔧 Melhorias Técnicas

### Task 10: Segurança e Performance

#### Subtasks:

- [ ] **10.1** Segurança
  - [ ] Criptografar tokens armazenados
  - [ ] Implementar rate limiting nos endpoints
  - [ ] Adicionar CSRF protection
  - [ ] Audit de dependências (npm audit)

- [ ] **10.2** Performance
  - [ ] Implementar lazy loading de rotas
  - [ ] Otimizar bundle size (code splitting)
  - [ ] Adicionar caching de API responses
  - [ ] Implementar virtual scrolling em listas longas

- [ ] **10.3** Observabilidade
  - [ ] Integrar Sentry para error tracking
  - [ ] Adicionar logging estruturado
  - [ ] Métricas de performance (Web Vitals)
  - [ ] Dashboard de uso de quota YouTube

- [ ] **10.4** Acessibilidade
  - [ ] Auditoria com axe-core
  - [ ] Navegação por teclado completa
  - [ ] Suporte a screen readers
  - [ ] Contraste e tamanhos de fonte

---

## 📅 Sugestão de Cronograma

| Fase | Tasks | Estimativa |
|------|-------|------------|
| **Fase 1** | Tasks 1, 2, 3 | 4-6 semanas |
| **Fase 2** | Tasks 4, 5 | 2-3 semanas |
| **Fase 3** | Task 6 | 3-4 semanas |
| **Fase 4** | Tasks 7, 8, 9 | 4-6 semanas |
| **Contínuo** | Task 10 | Ongoing |

---

## 📝 Notas

- Prioridades podem ser ajustadas conforme feedback dos usuários
- Tasks de alta prioridade são bloqueantes para produção
- Considerar feature flags para rollout gradual
- Documentar APIs conforme implementação
