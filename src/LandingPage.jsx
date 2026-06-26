import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Play, Star, TrendingUp, Zap, Shield, ArrowRight, Upload, BarChart2, Calendar } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      fontFamily: "var(--font-body)",
      color: "var(--text-primary)",
    }}>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(12,12,14,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-subtle)",
        height: 56,
        display: "flex", alignItems: "center",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo — idêntico ao dashboard */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="vc-logo-mark">VC</div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              ViralCuts
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/login")}
            className="vc-btn vc-btn-secondary vc-btn-sm"
          >
            Área de Membros
          </motion.button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 120, paddingBottom: 80, padding: "120px 24px 80px", position: "relative", overflow: "hidden" }}>
        {/* Glow coral — mais sutil e focado */}
        <div style={{
          position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
          width: 600, height: 400,
          background: "radial-gradient(ellipse, rgba(232,65,42,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>

          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="vc-badge vc-badge-live"
            style={{ margin: "0 auto 24px", display: "inline-flex" }}
          >
            Nova Estratégia 2025
          </motion.div>

          {/* Headline — usa Space Grotesk via font-display, mantém impacto */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              letterSpacing: "-0.04em",
              lineHeight: 1.0,
              margin: "0 0 20px",
              color: "var(--text-primary)",
            }}
          >
            Monetize seu canal em{" "}
            <span style={{ color: "var(--accent-coral)" }}>30 dias</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
              color: "var(--text-secondary)",
              lineHeight: 1.65,
              margin: "0 auto 40px",
              maxWidth: 560,
            }}
          >
            O método de <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>Cortes Virais e Automação</strong> para dominar o YouTube Shorts e TikTok sem aparecer.
          </motion.p>

          {/* VSL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{
              position: "relative",
              maxWidth: 720,
              margin: "0 auto 40px",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              border: "1px solid var(--border-default)",
              cursor: "pointer",
              aspectRatio: "16/9",
              background: "var(--bg-secondary)",
            }}
            className="group"
          >
            {/* Play overlay */}
            <div style={{
              position: "absolute", inset: 0, zIndex: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.35)",
              transition: "background 0.2s",
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "var(--accent-coral)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "var(--shadow-coral)",
                transition: "transform 0.2s",
              }}>
                <Play style={{ width: 28, height: 28, color: "#fff", fill: "#fff", marginLeft: 4 }} />
              </div>
            </div>

            <img
              src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200&auto=format&fit=crop"
              alt="ViralCuts Dashboard"
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.45 }}
            />

            <div style={{
              position: "absolute", bottom: 14, left: 14, right: 14, zIndex: 3,
              display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            }}>
              <div style={{
                background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
                padding: "5px 12px", borderRadius: "var(--radius-sm)",
                fontSize: "0.75rem", fontWeight: 500, color: "#fff",
                fontFamily: "var(--font-display)",
              }}>
                ▶ Assistir Aula Gratuita
              </div>
              <span className="vc-badge vc-badge-live">AO VIVO</span>
            </div>
          </motion.div>

          {/* CTA primário */}
          <motion.a
            href="#cta"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="vc-btn vc-btn-primary vc-btn-xl"
            style={{ textDecoration: "none", display: "inline-flex" }}
          >
            Quero acessar o método
            <ArrowRight size={18} />
          </motion.a>

          <p style={{ marginTop: 12, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            🔒 Acesso imediato · Garantia de 7 dias
          </p>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <section style={{
        borderTop: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "32px 24px",
        background: "var(--bg-secondary)",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24,
          textAlign: "center",
        }}>
          {[
            { value: "1.200+", label: "Alunos" },
            { value: "50M+", label: "Views Geradas" },
            { value: "350+", label: "Canais Monetizados" },
            { value: "R$2M+", label: "Faturamento" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                color: "var(--text-primary)", letterSpacing: "-0.04em",
                lineHeight: 1, marginBottom: 6,
              }}>{s.value}</div>
              <div style={{
                fontSize: "0.6875rem", color: "var(--text-muted)",
                textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600,
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problema / Solução ──────────────────────────────────── */}
      <section style={{ padding: "96px 24px" }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center",
        }}>
          <div>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", letterSpacing: "-0.035em",
              lineHeight: 1.15, margin: "0 0 16px", color: "var(--text-primary)",
            }}>
              Cansado da <span style={{ color: "var(--accent-coral)" }}>rota lenta?</span>
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: "0 0 24px" }}>
              A rota tradicional exige meses de roteiros caros, edição complexa e 4.000 horas de exibição. É exaustivo e demorado.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "4.000 horas de exibição necessárias",
                "Edição que leva horas por vídeo",
                "Roteiros complexos e caros",
                "Meses sem ver 1 centavo",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                    background: "var(--accent-coral-3)",
                    border: "1px solid rgba(232,65,42,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: "var(--accent-coral)",
                  }}>✕</div>
                  <span style={{ fontSize: "0.9375rem", color: "var(--text-secondary)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card de solução — visual do dashboard */}
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", inset: -1,
              background: "var(--accent-coral-3)",
              borderRadius: "var(--radius-xl)",
              filter: "blur(24px)",
              opacity: 0.6,
            }} />
            <div className="vc-card" style={{
              position: "relative", padding: "32px",
              borderColor: "rgba(232,65,42,0.2)",
            }}>
              {/* Traço coral no topo */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--accent-coral)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />

              <h3 style={{
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: "1.125rem", letterSpacing: "-0.02em",
                margin: "0 0 20px", color: "var(--text-primary)",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <Zap size={18} style={{ color: "var(--accent-amber)" }} />
                A Nova Era — Short-Form
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  "10 Milhões de Views em 90 dias",
                  "Cortes virais feitos em minutos",
                  "Sem aparecer, sem roteiros",
                  "Monetização acelerada",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle size={16} style={{ color: "var(--accent-teal)", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.9375rem", color: "var(--text-primary)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── O que o ViralCuts faz — features do produto ────────── */}
      <section style={{ padding: "80px 24px", background: "var(--bg-secondary)", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{
              fontFamily: "var(--font-display)", fontSize: "0.6875rem", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--accent-coral)", marginBottom: 12,
            }}>A plataforma</p>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", letterSpacing: "-0.035em",
              lineHeight: 1.1, margin: "0 0 14px", color: "var(--text-primary)",
            }}>
              Você foca nos cortes.<br />
              <span style={{ color: "var(--accent-coral)" }}>Nós cuidamos do resto.</span>
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              Upload, SEO, agendamento e distribuição multicanal em lote — tudo numa timeline.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              {
                icon: <Upload size={22} style={{ color: "var(--accent-coral)" }} />,
                accent: "coral",
                title: "Upload em lote",
                desc: "Arraste 10 vídeos de uma vez. O ViralCuts processa os metadados e gera títulos otimizados automaticamente.",
              },
              {
                icon: <Zap size={22} style={{ color: "var(--accent-amber)" }} />,
                accent: "amber",
                title: "IA nos metadados",
                desc: "Títulos, descrições e hashtags gerados por IA diretamente no modal de upload — sem copiar e colar.",
              },
              {
                icon: <Calendar size={22} style={{ color: "var(--accent-teal)" }} />,
                accent: "teal",
                title: "Agendamento inteligente",
                desc: "Calendário visual com heatmap de horários de pico. Arraste o vídeo pro slot certo e pronto.",
              },
              {
                icon: <BarChart2 size={22} style={{ color: "var(--accent-amber)" }} />,
                accent: "amber",
                title: "Analytics unificados",
                desc: "Views, inscritos e performance de Shorts de todas as plataformas em um único painel.",
              },
              {
                icon: <TrendingUp size={22} style={{ color: "var(--accent-teal)" }} />,
                accent: "teal",
                title: "Distribuição multicanal",
                desc: "Publique simultaneamente no YouTube Shorts, TikTok e Instagram Reels com um único upload.",
              },
              {
                icon: <Shield size={22} style={{ color: "var(--accent-coral)" }} />,
                accent: "coral",
                title: "Preview de plataforma",
                desc: "Veja como seu Short vai aparecer no YouTube, TikTok e Reels antes de publicar.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className={`vc-metric-card metric-${card.accent}`}
                style={{ padding: "24px" }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: "var(--radius-md)",
                  background: "var(--bg-elevated)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16,
                }}>
                  {card.icon}
                </div>
                <h3 style={{
                  fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1rem",
                  letterSpacing: "-0.02em", margin: "0 0 8px", color: "var(--text-primary)",
                }}>{card.title}</h3>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Método V.A.I. ───────────────────────────────────────── */}
      <section style={{ padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 56px" }}>
            <h2 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", letterSpacing: "-0.035em",
              lineHeight: 1.1, margin: "0 0 14px", color: "var(--text-primary)",
            }}>
              O Método{" "}
              <span style={{ color: "var(--accent-coral)" }}>V.A.I.</span>
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
              Viralize, Automatize, Incremente. Três pilares para construir um canal dark escalável.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              {
                num: "01", accent: "var(--accent-coral)",
                icon: <TrendingUp size={20} style={{ color: "var(--accent-coral)" }} />,
                title: "Viralize",
                desc: "Escolha nichos de consumo massivo (Pets, Hacks, Fails) com baixo custo e alto potencial de retenção.",
              },
              {
                num: "02", accent: "var(--accent-amber)",
                icon: <Zap size={20} style={{ color: "var(--accent-amber)" }} />,
                title: "Automatize",
                desc: "Use o ViralCuts para agendar uploads em lote, gerar metadados com IA e distribuir em múltiplas plataformas.",
              },
              {
                num: "03", accent: "var(--accent-teal)",
                icon: <Shield size={20} style={{ color: "var(--accent-teal)" }} />,
                title: "Incremente",
                desc: "Adicione valor único (edição, contexto) para evitar conteúdo repetitivo e garantir a monetização.",
              },
            ].map((card) => (
              <div key={card.num} className="vc-card" style={{ padding: "28px 28px 28px", position: "relative" }}>
                {/* Número grande decorativo */}
                <div style={{
                  fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "3.5rem",
                  color: "var(--border-subtle)", letterSpacing: "-0.06em", lineHeight: 1,
                  position: "absolute", top: 16, right: 20,
                  pointerEvents: "none", userSelect: "none",
                }}>{card.num}</div>

                <div style={{
                  width: 40, height: 40, borderRadius: "var(--radius-md)",
                  background: "var(--bg-elevated)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16,
                }}>
                  {card.icon}
                </div>
                <h3 style={{
                  fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.125rem",
                  letterSpacing: "-0.025em", margin: "0 0 10px", color: "var(--text-primary)",
                }}>{card.title}</h3>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ───────────────────────────────────────────── */}
      <section id="cta" style={{ padding: "96px 24px", position: "relative", overflow: "hidden" }}>
        {/* Glow */}
        <div style={{
          position: "absolute", bottom: -80, left: "50%", transform: "translateX(-50%)",
          width: 700, height: 400,
          background: "radial-gradient(ellipse, rgba(232,65,42,0.12) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "clamp(2rem, 4.5vw, 3rem)", letterSpacing: "-0.04em",
            lineHeight: 1.05, margin: "0 0 16px", color: "var(--text-primary)",
          }}>
            Pronto para escalar seu canal?
          </h2>
          <p style={{ fontSize: "1.0625rem", color: "var(--text-secondary)", margin: "0 0 40px", lineHeight: 1.7 }}>
            Receba o Plano de 30 Dias, Scripts de Automação e Templates de Edição. Tudo para começar hoje.
          </p>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <motion.a
              href="/register"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="vc-btn vc-btn-primary vc-btn-xl"
              style={{ textDecoration: "none", minWidth: 280, justifyContent: "center" }}
            >
              Começar agora
              <ArrowRight size={18} />
            </motion.a>
            <motion.a
              href="/login"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="vc-btn vc-btn-secondary"
              style={{ textDecoration: "none", minWidth: 280, justifyContent: "center" }}
            >
              Já sou aluno
            </motion.a>
          </div>

          <div style={{ marginTop: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
            {[
              { icon: <Shield size={14} />, text: "Pagamento Seguro" },
              { icon: <Star size={14} />, text: "4.9/5 Avaliação" },
            ].map((item) => (
              <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                {item.icon} {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid var(--border-subtle)",
        padding: "32px 24px",
        background: "var(--bg-secondary)",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", flexWrap: "wrap",
          justifyContent: "space-between", alignItems: "center", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="vc-logo-mark" style={{ width: 24, height: 24, fontSize: 10 }}>VC</div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-primary)", letterSpacing: "-0.025em" }}>
              ViralCuts
            </span>
          </div>

          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Termos", href: "/terms" },
              { label: "Privacidade", href: "/privacy" },
              { label: "Suporte", href: "mailto:suporte@viralcuts.app" },
            ].map((l) => (
              <a key={l.label} href={l.href} style={{ fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => e.target.style.color = "var(--text-primary)"}
                onMouseLeave={e => e.target.style.color = "var(--text-muted)"}
              >{l.label}</a>
            ))}
          </div>

          <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            © 2025 ViralCuts. Todos os direitos reservados.
          </span>
        </div>
      </footer>
    </div>
  );
}