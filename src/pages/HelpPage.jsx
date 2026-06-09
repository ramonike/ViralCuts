import React, { useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { 
    Search, HelpCircle, MessageSquare, MessageCircle, PlayCircle, 
    BookOpen, ChevronDown, ChevronUp, Send, CheckCircle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function HelpPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const [searchQuery, setSearchQuery] = useState('');
    const [openFaq, setOpenFaq] = useState(null);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const categories = [
        { icon: <BookOpen className="w-6 h-6 text-[#e8412a]" />, title: 'Como Começar', desc: 'Aprenda os primeiros passos no ViralCuts.' },
        { icon: <PlayCircle className="w-6 h-6 text-[#f0a500]" />, title: 'Cortes com IA', desc: 'Como nosso algoritmo extrai os melhores clipes.' },
        { icon: <CheckCircle className="w-6 h-6 text-[#00c9a7]" />, title: 'Contas & Conexões', desc: 'Gerencie suas integrações de redes sociais.' }
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
            <div className="space-y-8">
                {/* Busca */}
                <div className="vc-card p-6">
                    <div className="relative max-w-xl mx-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Busque por dúvidas (ex: IA, limites, calendário)..."
                            className="vc-input pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categorias Rápidas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="vc-card p-5 hover:border-[#e8412a]/30 transition-all cursor-pointer">
                            <div className="w-12 h-12 rounded-lg bg-slate-800/50 flex items-center justify-center mb-4">
                                {cat.icon}
                            </div>
                            <h3 className="font-display font-semibold text-base mb-1">{cat.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">{cat.desc}</p>
                        </div>
                    ))}
                </div>

                {/* FAQs & Formulário */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lista de FAQs - 2 colunas */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="font-display text-xl font-bold mb-4">Perguntas Frequentes</h2>
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <div key={idx} className="vc-card overflow-hidden">
                                        <button 
                                            onClick={() => setOpenFaq(isOpen ? null : idx)}
                                            className="w-full flex items-center justify-between p-4 text-left font-semibold hover:bg-slate-800/20"
                                        >
                                            <span className="text-sm">{faq.q}</span>
                                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                        {isOpen && (
                                            <div className="px-4 pb-4 pt-1 text-sm text-slate-400 border-t border-slate-800/30">
                                                {faq.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-slate-500">Nenhum resultado encontrado para a busca.</p>
                        )}
                    </div>

                    {/* Formulário de Suporte */}
                    <div className="space-y-6">
                        <div className="vc-card p-5">
                            <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-[#e8412a]" /> Enviar Mensagem
                            </h3>
                            {formSubmitted ? (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Mensagem enviada com sucesso!
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="vc-label">Nome</label>
                                        <input 
                                            type="text" 
                                            required 
                                            className="vc-input" 
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="vc-label">E-mail</label>
                                        <input 
                                            type="email" 
                                            required 
                                            className="vc-input" 
                                            value={formData.email}
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="vc-label">Mensagem</label>
                                        <textarea 
                                            rows="4" 
                                            required 
                                            className="vc-input resize-none"
                                            value={formData.message}
                                            onChange={e => setFormData({...formData, message: e.target.value})}
                                        />
                                    </div>
                                    <button type="submit" className="vc-btn vc-btn-primary w-full justify-center">
                                        <Send className="w-4 h-4" /> Enviar
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Comunidade */}
                        <div className="vc-card p-5">
                            <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-[#f0a500]" /> Comunidades
                            </h3>
                            <div className="space-y-3">
                                <a href="https://discord.gg" target="_blank" rel="noreferrer" className="vc-btn vc-btn-secondary w-full justify-start gap-3">
                                    <span>👾 Discord Oficial</span>
                                </a>
                                <a href="https://wa.me" target="_blank" rel="noreferrer" className="vc-btn vc-btn-secondary w-full justify-start gap-3">
                                    <span>💬 Grupo do WhatsApp</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
