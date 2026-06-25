import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      fontFamily: "var(--font-body)",
      color: "var(--text-primary)",
    }}>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(12,12,14,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-subtle)",
        height: 56,
        display: "flex", alignItems: "center",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="vc-logo-mark">VC</div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
              ViralCuts
            </span>
          </div>
          <button onClick={() => navigate("/")} className="vc-btn vc-btn-ghost vc-btn-sm">
            <ArrowLeft size={16} />
            Voltar
          </button>
        </div>
      </nav>

      <div style={{ paddingTop: 80, paddingBottom: 60, maxWidth: 800, margin: "0 auto", padding: "100px 24px 60px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2rem", marginBottom: 8 }}>
          Termos de Serviço
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: 40 }}>
          Última atualização: 25 de Junho de 2026
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, lineHeight: 1.7, fontSize: "0.9375rem", color: "var(--text-secondary)" }}>
          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>1. Aceitação dos Termos</h2>
            <p>Ao acessar ou usar o ViralCuts ("Plataforma"), você concorda em cumprir e ficar vinculado a estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não poderá usar nossos serviços.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>2. Descrição do Serviço</h2>
            <p>O ViralCuts é uma plataforma de gerenciamento de conteúdo para criadores digitais que permite agendamento, publicação e análise de vídeos em múltiplas plataformas sociais, incluindo TikTok, YouTube e Instagram.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>3. Contas de Usuário</h2>
            <p>Você é responsável por manter a confidencialidade de suas credenciais de login e por todas as atividades ocorridas em sua conta. Você deve nos notificar imediatamente sobre qualquer uso não autorizado.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>4. Uso Aceitável</h2>
            <p>Você concorda em usar a Plataforma apenas para fins legais e de acordo com estes Termos. Você não deve usar a Plataforma para publicar conteúdo que viole direitos autorais, marcas registradas ou outros direitos de propriedade intelectual.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>5. Propriedade Intelectual</h2>
            <p>O conteúdo que você publica através da Plataforma permanece seu. Você concede ao ViralCuts uma licença limitada para processar e distribuir seu conteúdo nas plataformas que você selecionar.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>6. Limitação de Responsabilidade</h2>
            <p>O ViralCuts não se responsabiliza por quaisquer danos diretos, indiretos, incidentais ou consequenciais resultantes do uso ou da incapacidade de usar nossos serviços.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>7. Alterações nos Termos</h2>
            <p>Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações significativas serão notificadas aos usuários através da Plataforma ou por e-mail.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>8. Contato</h2>
            <p>Para questões relacionadas a estes Termos, entre em contato através do nosso suporte na plataforma ou pelo e-mail suporte@viralcuts.app.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
