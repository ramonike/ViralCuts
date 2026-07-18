import React, { useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import {
    Search, HelpCircle, MessageSquare, MessageCircle, PlayCircle,
    BookOpen, ChevronDown, ChevronUp, Send, CheckCircle
} from 'lucide-react';

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [openFaq, setOpenFaq] = useState(null);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const categories = [
        { icon: <BookOpen size={24} style={{ color: "var(--coral)" }} />, title: 'Como Começar', desc: 'Aprenda os primeiros passos no ViralCuts.' },
        { icon: <PlayCircle size={24} style={{ color: "var(--amber)" }} />, title: 'Cortes com IA', desc: 'Como nosso algoritmo extrai os melhores clipes.' },
        { icon: <CheckCircle size={24} style={{ color: "var(--teal)" }} />, title: 'Contas & Conexões', desc: 'Gerencie suas integrações de redes sociais.' }
    ];

    const faqs = [
        { q: 'Como a IA escolhe os melhores momentos para os cortes?', a: 'Nossa inteligência artificial analisa picos de áudio, mudanças de cena rápidas, tom de voz e palavras-chave de alto impacto na legenda para prever a taxa de retenção do clipe.' },
        { q: 'Quais redes sociais eu posso conectar?', a: 'Atualmente oferecemos suporte completo para canais do YouTube. Em receber, em breve lançaremos conexões diretas para TikTok, Instagram e Twitter.' },
        { q: 'Qual o tamanho máximo dos vídeos para upload?', a: 'Usuários do plano Free podem subir vídeos de até 500MB. Usuários Pro têm limite estendido de até 2GB por vídeo.' },
        { q: 'Como funciona o agendamento no calendário?', a: 'Basta arrastar seus cortes gerados para os horários disponíveis no calendário e habilitar a publicação automática. O ViralCuts cuidará do envio no horário exato.' }
    ];

    const filteredFaqs = faqs.filter(faq =>
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormSubmitted(true);
        setTimeout(() => {
            setFormSubmitted(false);
            setFormData({ name: '', email: '', message: '' });
        }, 3000);
    };

    return (
        <PageLayout title="Central de Ajuda" subtitle="Tire suas dúvidas sobre o ViralCuts e fale com nosso time.">
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius)", padding: 24 }}>
                    <div style={{ position: "relative", maxWidth: 560, margin: "0 auto" }}>
                        <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                        <input type="text" placeholder="Busque por dúvidas (ex: IA, limites, calendário)..."
                            style={{ background: "var(--bg-card2)", border: "1px solid var(--border-default)", borderRadius: 8, padding: "10px 14px", color: "var(--text-primary)", fontSize: 14, width: "100%", fontFamily: "var(--font)", paddingLeft: 40 }}
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                <div className="vc-help-categories-grid" style={{ gap: 16 }}>
                    {categories.map((cat, idx) => (
                        <div key={idx} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius)", padding: 24, cursor: "pointer", textAlign: "center" }}>
                            <div style={{ width: 48, height: 48, borderRadius: "var(--radius)", background: "var(--bg-card2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                                {cat.icon}
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{cat.title}</h3>
                            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>{cat.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="vc-help-content-grid" style={{ gap: 24 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Perguntas Frequentes</h2>
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div key={idx} style={{ borderBottom: "1px solid var(--border-default)" }}>
                                        <div onClick={() => setOpenFaq(isOpen ? null : idx)}
                                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", cursor: "pointer", fontWeight: 500, fontSize: 14 }}>
                                            <span style={{ fontSize: 14, fontWeight: 600 }}>{faq.q}</span>
                                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                        {isOpen && <div style={{ padding: "0 0 16px 0", fontSize: 14, color: "var(--text-secondary)", display: "block" }}>{faq.a}</div>}
                                    </div>
                                );
                            })
                        ) : (
                            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Nenhum resultado encontrado para a busca.</p>
                        )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius)", padding: 24 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <MessageSquare size={18} style={{ color: "var(--coral)" }} /> Enviar Mensagem
                            </h3>
                            {formSubmitted ? (
                                <div style={{ padding: 16, background: "var(--teal-3)", border: "1px solid rgba(0,201,167,0.2)", borderRadius: "var(--radius)", color: "var(--teal)", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                                    <CheckCircle size={16} /> Mensagem enviada com sucesso!
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    <div>
                                        <label className="vc-label">Nome</label>
                                        <input type="text" required
                                            style={{ background: "var(--bg-card2)", border: "1px solid var(--border-default)", borderRadius: 8, padding: "10px 14px", color: "var(--text-primary)", fontSize: 14, width: "100%", fontFamily: "var(--font)" }}
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="vc-label">E-mail</label>
                                        <input type="email" required
                                            style={{ background: "var(--bg-card2)", border: "1px solid var(--border-default)", borderRadius: 8, padding: "10px 14px", color: "var(--text-primary)", fontSize: 14, width: "100%", fontFamily: "var(--font)" }}
                                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="vc-label">Mensagem</label>
                                        <textarea rows="4" required
                                            style={{ background: "var(--bg-card2)", border: "1px solid var(--border-default)", borderRadius: 8, padding: "10px 14px", color: "var(--text-primary)", fontSize: 14, width: "100%", fontFamily: "var(--font)", resize: "vertical", minHeight: 80 }}
                                            value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} />
                                    </div>
                                    <button type="submit" className="vc-btn vc-btn-primary" style={{ justifyContent: "center", width: "100%" }}>
                                        <Send size={14} /> Enviar
                                    </button>
                                </form>
                            )}
                        </div>

                        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius)", padding: 24 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <MessageCircle size={18} style={{ color: "var(--amber)" }} /> Comunidades
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <a href="https://discord.gg" target="_blank" rel="noreferrer"
                                    className="vc-btn vc-btn-secondary" style={{ justifyContent: "flex-start", gap: 10 }}>
                                    <span style={{ fontSize: 16 }}>👾</span> Discord Oficial
                                </a>
                                <a href="https://wa.me" target="_blank" rel="noreferrer"
                                    className="vc-btn vc-btn-secondary" style={{ justifyContent: "flex-start", gap: 10 }}>
                                    <span style={{ fontSize: 16 }}>💬</span> Grupo do WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
