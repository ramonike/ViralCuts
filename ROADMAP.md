# ViralCuts Dashboard — Roadmap de Implementação

> Atualizado: 02/07/2026
> Status: Em Desenvolvimento Ativo

---

## 📋 Visão Geral

Roadmap atualizado refletindo o estado real do código. Tasks já implementadas foram marcadas como concluídas. Novas tasks adicionadas com base no que falta.

---

## 🔴 Alta Prioridade — MVP

### Task 1: Redesign UI com 21st Magic

**Objetivo:** Modernizar todas as 16 páginas usando componentes do 21st.dev

- [ ] **1.1** Configurar design tokens (cores coral/amber/teal, fontes Inter + Space Grotesk)
- [ ] **1.2** Landing Page — hero, features grid, VAI method, pricing, testimonials
- [ ] **1.3** Auth pages — Login, Register, Forgot Password, Reset, Verify Email
- [ ] **1.4** Dashboard Home — stats, pipeline timeline, upload queue, insights
- [ ] **1.5** Videos page — channel strip, filters, video grid, channel switcher
- [ ] **1.6** Calendar page — visual calendar, scheduling, heatmap
- [ ] **1.7** Analytics page — tabs, charts, filters, export
- [ ] **1.8** Creation (IA Studio) — script, titles, thumbnail, checklist tabs
- [ ] **1.9** Settings + Profile — account, notifications, billing, theme
- [ ] **1.10** Admin — user management, config panels
- [ ] **1.11** Help + Legal (Privacy, Terms)

### Task 2: Segurança e Tokens

**Objetivo:** Proteger dados sensíveis e preparar para produção

- [ ] **2.1** Criptografar accessToken e refreshToken no banco (encryption at rest)
- [ ] **2.2** Implementar CSRF protection explícita
- [ ] **2.3** Rate limiting em todas as rotas (já parcial)
- [ ] **2.4** Audit de dependências (npm audit) e atualização
- [ ] **2.5** Implementar refresh token rotation no YouTube OAuth

### Task 3: Observabilidade

**Objetivo:** Monitoramento e debugging em produção

- [ ] **3.1** Integrar Sentry para error tracking (frontend + backend)
- [ ] **3.2** Logging estruturado no backend (pino ou winston)
- [ ] **3.3** Métricas de performance (Web Vitals)
- [ ] **3.4** Dashboard de uso de quota YouTube API
- [ ] **3.5** Health check endpoints aprimorados

### Task 4: Testes

**Objetivo:** Cobertura mínima de 60%

- [ ] **4.1** Testes unitários hooks existentes (useYouTubeAuth, useDashboardState, usePipeline, useUploadQueue, useErrorHandler)
- [ ] **4.2** Testes de componentes críticos (auth, journey, upload)
- [ ] **4.3** Testes de integração (login→dashboard, YouTube connection, upload flow)
- [ ] **4.4** Configurar CI/CD com GitHub Actions + Playwright/Cypress para E2E

---

## 🟡 Média Prioridade

### Task 5: Instagram Reels

**Objetivo:** Completar suporte multi-plataforma

- [ ] **5.1** Configurar Meta for Developers + OAuth Instagram Business
- [ ] **5.2** Implementar upload via Graph API (Reels)
- [ ] **5.3** Adaptar PlatformSelector e PlatformStatus para Instagram
- [ ] **5.4** Cross-posting e status tracking por plataforma

### Task 6: Analytics Real (YouTube Analytics API)

**Objetivo:** Substituir dados mock por dados reais

- [ ] **6.1** Configurar escopo yt-analytics.readonly
- [ ] **6.2** Implementar fetchRealAnalytics() em youtube.js
- [ ] **6.3** Cache com TTL para reduzir chamadas API
- [ ] **6.4** Novas visualizações: heatmap de horários, comparativo semanal/mensal
- [ ] **6.5** Exportar relatórios (PDF/CSV)

### Task 7: Code Splitting e Performance

**Objetivo:** Melhorar performance de carregamento

- [ ] **7.1** Lazy loading de rotas (React.lazy + Suspense)
- [ ] **7.2** Code splitting por página
- [ ] **7.3** Virtual scrolling em listas longas (react-window)
- [ ] **7.4** Caching de API responses (SWR ou React Query)

### Task 8: Push Notifications

**Objetivo:** Expandir sistema de notificações

- [ ] **8.1** Configurar Service Worker
- [ ] **8.2** Web Push API
- [ ] **8.3** Opt-in/opt-out por tipo de notificação
- [ ] **8.4** Notificação push para upload concluído, agendamento, quota

---

## 🟢 Baixa Prioridade — Futuro

### Task 9: PWA / Mobile

**Objetivo:** Transformar em Progressive Web App

- [ ] **9.1** Criar manifest.json + Service Worker
- [ ] **9.2** Cache strategies (offline dashboard)
- [ ] **9.3** Funcionalidades offline (fila de uploads offline)
- [ ] **9.4** Responsividade avançada com gestos touch

### Task 10: Colaboração / Teams

**Objetivo:** Permitir equipes e workspaces

- [ ] **10.1** Models Team, TeamMember, Invitation
- [ ] **10.2** Roles e permissões granulares
- [ ] **10.3** UI de gerenciamento de equipe + workspace switcher

### Task 11: IA Avançada

**Objetivo:** Funcionalidades de IA mais profundas

- [ ] **11.1** Análise de tendências (trending topics no nicho)
- [ ] **11.2** Previsão de performance de títulos
- [ ] **11.3** Análise de thumbnail (cores, texto, faces)
- [ ] **11.4** Score de "viralidade" estimado

### Task 12: Acessibilidade

**Objetivo:** Tornar o app acessível

- [ ] **12.1** Auditoria com axe-core
- [ ] **12.2** Navegação por teclado completa
- [ ] **12.3** Suporte a screen readers (ARIA labels)
- [ ] **12.4** Contraste e tamanhos de fonte

---

## ✅ Concluído (do roadmap anterior)

| Task | Status | Observação |
|---|---|---|
| **1. Persistência DB** | ✅ Completo | Prisma + 17 models + endpoints REST |
| **2. Upload YouTube** | ✅ Completo | OAuth, resumable upload, retry, multi-conta, agendamento |
| **3. IA Integrada** | ✅ Completo | Gemini + Groq + Replicate (texto, thumbnail, vídeo, tasks) |
| **4. Sistema de Notificações** | ✅ In-app completo | Context + triggers + DB; Push ainda não |
| **5. Multi-plataforma** | ✅ YouTube + TikTok | Instagram pendente (Task 6) |
| **Analytics** | ⚠️ Parcial | Schema pronto, dados mock no frontend |
| **Subscriptions** | ✅ Completo | Stripe end-to-end com webhooks |
| **Command Center** | ✅ Completo | State, tasks, metrics, activity, widgets |
| **Rate Limiting** | ✅ Implementado | Nas principais rotas |

---

## 📅 Cronograma Sugerido

| Fase | Tasks | Estimativa |
|---|---|---|
| **Fase 1 — Imediata** | Task 1 (Redesign UI) + Task 2 (Segurança) | 3-4 semanas |
| **Fase 2 — Curto Prazo** | Tasks 3, 4 (Observabilidade + Testes) | 2-3 semanas |
| **Fase 3 — Médio Prazo** | Tasks 5, 6, 7 (Instagram + Analytics + Performance) | 4-5 semanas |
| **Fase 4 — Longo Prazo** | Tasks 8, 9, 10, 11, 12 | 6-8 semanas |
| **Contínuo** | Manutenção, dependências, refatoração | Ongoing |

---

## 📝 Notas

- **Roadmap antigo estava desatualizado**: Tasks 1, 2, 9 do roadmap original já estavam implementadas no código
- **Prioridade #1 agora é o Redesign UI** com 21st Magic components — ver `REDESIGN-ALL.html`
- Tokens OAuth estão em plaintext no DB — prioridade alta criptografar
- Instagram é o único gap no suporte multi-plataforma
- Considerar migrar de Vite para Next.js no futuro se necessidade SSR
