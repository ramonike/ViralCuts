import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
          Política de Privacidade
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: 40 }}>
          Última atualização: 25 de Junho de 2026
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, lineHeight: 1.7, fontSize: "0.9375rem", color: "var(--text-secondary)" }}>
          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>1. Informações que Coletamos</h2>
            <p>Coletamos as seguintes informações quando você usa o ViralCuts:</p>
            <ul style={{ paddingLeft: 24, marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <li>Informações da conta: nome, e-mail e foto de perfil</li>
              <li>Dados de autenticação de plataformas terceiras (TikTok, YouTube, Instagram) através de OAuth</li>
              <li>Conteúdo de vídeo que você publica através da plataforma</li>
              <li>Dados de uso e métricas de desempenho dos seus conteúdos</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>2. Como Usamos suas Informações</h2>
            <p>Utilizamos suas informações para:</p>
            <ul style={{ paddingLeft: 24, marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <li>Operar, manter e melhorar a plataforma</li>
              <li>Publicar conteúdo nas plataformas que você autorizar</li>
              <li>Fornecer análises e métricas sobre seu conteúdo</li>
              <li>Enviar comunicações relacionadas ao serviço</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>3. Compartilhamento de Dados</h2>
            <p>Não vendemos seus dados pessoais. Compartilhamos informações apenas com:</p>
            <ul style={{ paddingLeft: 24, marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <li>Plataformas que você autorizar (TikTok, YouTube, Instagram) para publicação de conteúdo</li>
              <li>Provedores de infraestrutura (hospedagem, banco de dados)</li>
              <li>Quando exigido por lei ou ordem judicial</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>4. Segurança dos Dados</h2>
            <p>Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados, incluindo criptografia em trânsito e em repouso, controles de acesso rigorosos e auditoria regular de segurança.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>5. Seus Direitos</h2>
            <p>Você tem direito a acessar, corrigir, excluir seus dados pessoais e revogar a autorização de acesso às plataformas conectadas a qualquer momento através das configurações da sua conta.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>6. Retenção de Dados</h2>
            <p>Mantemos seus dados enquanto sua conta estiver ativa. Após o encerramento da conta, os dados são excluídos em até 90 dias, exceto quando exigido por lei.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>7. Cookies</h2>
            <p>Utilizamos cookies essenciais para o funcionamento da plataforma. Cookies de terceiros podem ser utilizados para análises de uso, mas nenhum dado é compartilhado com anunciantes.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: 12 }}>8. Contato</h2>
            <p>Para questões sobre esta Política de Privacidade, entre em contato: suporte@viralcuts.app</p>
          </section>
        </div>
      </div>
    </div>
  );
}
