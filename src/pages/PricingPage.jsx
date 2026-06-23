/**
 * PricingPage — src/pages/PricingPage.jsx
 * Rota: /pricing (pública, acessível sem login)
 *
 * Registrar em App.jsx:
 *   import PricingPage from './pages/PricingPage';
 *   <Route path="/pricing" element={<PricingPage />} />
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, GitBranch, ArrowRight, X } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

const PLANS = [
    {
        name:        'free',
        displayName: 'Free',
        maxChannels: 1,
        monthly:     0,
        yearly:      0,
        highlight:   false,
        features:    [
            '1 canal YouTube',
            'Upload em lote',
            'Agendamento multicanal',
            'IA para metadados',
        ],
        missing: ['Analytics avançados', 'Suporte prioritário'],
    },
    {
        name:        'starter',
        displayName: 'Starter',
        maxChannels: 3,
        monthly:     29,
        yearly:      290,
        highlight:   false,
        features:    [
            '3 canais YouTube',
            'Upload em lote',
            'Agendamento multicanal',
            'IA para metadados',
        ],
        missing: ['Analytics avançados', 'Suporte prioritário'],
    },
    {
        name:        'pro',
        displayName: 'Pro',
        maxChannels: 5,
        monthly:     49,
        yearly:      490,
        highlight:   true,
        features:    [
            '5 canais YouTube',
            'Upload em lote',
            'Agendamento multicanal',
            'IA para metadados',
            'Analytics avançados',
            'Suporte prioritário',
        ],
        missing: [],
    },
    {
        name:        'agency',
        displayName: 'Agency',
        maxChannels: 10,
        monthly:     89,
        yearly:      890,
        highlight:   false,
        features:    [
            '10 canais YouTube',
            'Upload em lote',
            'Agendamento multicanal',
            'IA para metadados',
            'Analytics avançados',
            'Suporte prioritário',
            'Acesso para equipe',
            'Relatórios personalizados',
        ],
        missing: [],
    },
];

export default function PricingPage() {
    const [billing,     setBilling]     = useState('monthly');
    const [loadingPlan, setLoadingPlan] = useState(null);
    const navigate = useNavigate();
    const { plan: currentPlan, openCheckout } = useSubscription();

    const handleSelect = async (planName) => {
        if (planName === 'free') { navigate('/register'); return; }
        setLoadingPlan(planName);
        try {
            await openCheckout(planName, billing);
        } catch {
            alert('Erro ao iniciar checkout. Tente novamente.');
            setLoadingPlan(null);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', fontFamily: 'var(--font-body)' }}>

            {/* Nav mínima */}
            <nav style={{
                height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 32px', borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <div className="vc-logo-mark">VC</div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                        ViralCuts
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => navigate('/login')} className="vc-btn vc-btn-secondary vc-btn-sm">
                        Entrar
                    </button>
                    <button onClick={() => navigate('/register')} className="vc-btn vc-btn-primary vc-btn-sm">
                        Começar grátis
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <div style={{ textAlign: 'center', padding: '72px 24px 48px' }}>
                <span className="vc-badge vc-badge-coral" style={{ marginBottom: 16, display: 'inline-flex' }}>
                    Planos e preços
                </span>
                <h1 style={{
                    margin: '0 0 16px', fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: 'clamp(2rem, 5vw, 3.25rem)', letterSpacing: '-0.04em',
                    color: 'var(--text-primary)', lineHeight: 1.05,
                }}>
                    Canais como unidade.<br />
                    <span style={{ color: 'var(--accent-coral)' }}>Escale no seu ritmo.</span>
                </h1>
                <p style={{ margin: '0 auto 36px', maxWidth: 520, fontSize: '1.0625rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    Comece grátis com 1 canal. Quando crescer, adicione mais canais sem mudar de plataforma.
                </p>

                {/* Toggle mensal/anual */}
                <div style={{ display: 'inline-flex', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 3, gap: 3 }}>
                    {['monthly', 'yearly'].map(cycle => (
                        <button key={cycle} onClick={() => setBilling(cycle)} style={{
                            padding: '7px 22px', borderRadius: 'var(--radius-sm)',
                            background: billing === cycle ? 'var(--bg-elevated)' : 'transparent',
                            border: `1px solid ${billing === cycle ? 'var(--border-default)' : 'transparent'}`,
                            color: billing === cycle ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontFamily: 'var(--font-display)', fontWeight: 600,
                            fontSize: '0.9375rem', letterSpacing: '-0.01em', cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}>
                            {cycle === 'monthly' ? 'Mensal' : 'Anual'}
                            {cycle === 'yearly' && (
                                <span style={{ marginLeft: 8, fontSize: '0.6875rem', background: 'var(--accent-teal-3)', color: 'var(--accent-teal)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                                    -17%
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards */}
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 96px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                {PLANS.map(plan => {
                    const monthly  = billing === 'yearly' ? Math.round(plan.yearly / 12) : plan.monthly;
                    const isCurrent = currentPlan?.name === plan.name;
                    const isLoading = loadingPlan === plan.name;

                    return (
                        <div key={plan.name} style={{
                            border: `1px solid ${plan.highlight ? 'rgba(232,65,42,0.4)' : 'var(--border-subtle)'}`,
                            borderRadius: 'var(--radius-xl)',
                            background: plan.highlight ? 'var(--accent-coral-3)' : 'var(--bg-card)',
                            padding: '28px 24px',
                            position: 'relative',
                            display: 'flex', flexDirection: 'column',
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', background: plan.highlight ? 'var(--accent-coral)' : 'var(--border-subtle)' }} />

                            {plan.highlight && (
                                <span style={{ position: 'absolute', top: 14, right: 14, fontSize: '0.5625rem', fontWeight: 700, background: 'var(--accent-coral)', color: '#fff', padding: '2px 8px', borderRadius: 10, fontFamily: 'var(--font-display)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    Popular
                                </span>
                            )}

                            {/* Nome e canais */}
                            <div style={{ marginBottom: 20 }}>
                                <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
                                    {plan.displayName}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <GitBranch size={13} style={{ color: 'var(--accent-coral)' }} />
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                        {plan.maxChannels} canal{plan.maxChannels > 1 ? 'is' : ''}
                                    </span>
                                </div>
                            </div>

                            {/* Preço */}
                            <div style={{ marginBottom: 24 }}>
                                {plan.monthly === 0 ? (
                                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem', color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                                        Grátis
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>R$</span>
                                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2.25rem', color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                                                {monthly}
                                            </span>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>/mês</span>
                                        </div>
                                        {billing === 'yearly' && (
                                            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                R${plan.yearly} cobrado anualmente
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Features */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                                {plan.features.map(f => (
                                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--accent-teal-3)', border: '1px solid rgba(0,201,167,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Check size={10} style={{ color: 'var(--accent-teal)' }} />
                                        </div>
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{f}</span>
                                    </div>
                                ))}
                                {plan.missing.map(f => (
                                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.4 }}>
                                        <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <X size={10} style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{f}</span>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <button
                                onClick={() => !isCurrent && handleSelect(plan.name)}
                                disabled={isCurrent || isLoading}
                                className={`vc-btn ${plan.highlight ? 'vc-btn-primary' : 'vc-btn-secondary'}`}
                                style={{ justifyContent: 'center', opacity: isCurrent ? 0.5 : 1 }}
                            >
                                {isCurrent    ? 'Plano atual'
                                : isLoading   ? 'Redirecionando...'
                                : plan.monthly === 0 ? <><ArrowRight size={14} /> Começar grátis</>
                                : <><Zap size={14} /> Assinar {plan.displayName}</>}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* FAQ mínimo */}
            <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px 96px' }}>
                <h2 style={{ margin: '0 0 32px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.03em', color: 'var(--text-primary)', textAlign: 'center' }}>
                    Dúvidas frequentes
                </h2>
                {[
                    { q: 'Posso cancelar quando quiser?', a: 'Sim. Cancele a qualquer momento pelo painel de assinatura. Você continua com acesso até o fim do período pago.' },
                    { q: 'O que acontece se eu ultrapassar o limite de canais?', a: 'Você não consegue adicionar o canal — aparece uma tela de upgrade antes de iniciar a conexão.' },
                    { q: 'Tem período de teste?', a: 'O plano Free é gratuito para sempre com 1 canal. Você pode testar todas as funcionalidades antes de assinar.' },
                    { q: 'Quais formas de pagamento aceitam?', a: 'Cartão de crédito/débito nacional e internacional via Stripe. PIX em breve.' },
                ].map(({ q, a }) => (
                    <div key={q} style={{ padding: '20px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                        <p style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{q}</p>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{a}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
