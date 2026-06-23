/**
 * UpgradeModal — src/components/dashboard/UpgradeModal.jsx
 *
 * Aparece quando o usuário tenta adicionar um canal além do limite do plano.
 *
 * Uso:
 *   import { UpgradeModal } from '../components/dashboard/UpgradeModal';
 *
 *   const [showUpgrade, setShowUpgrade] = useState(false);
 *   ...
 *   <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} currentPlan={plan} />
 */

import React, { useState } from 'react';
import { X, Check, Zap, GitBranch, TrendingUp, Star } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';

const PLANS = [
    {
        name:         'starter',
        displayName:  'Starter',
        maxChannels:  3,
        monthly:      29,
        yearly:       290,
        highlight:    false,
        features:     ['3 canais YouTube', 'Upload em lote', 'Agendamento multicanal', 'IA para metadados'],
    },
    {
        name:         'pro',
        displayName:  'Pro',
        maxChannels:  5,
        monthly:      49,
        yearly:       490,
        highlight:    true,
        features:     ['5 canais YouTube', 'Tudo do Starter', 'Analytics avançados', 'Suporte prioritário'],
    },
    {
        name:         'agency',
        displayName:  'Agency',
        maxChannels:  10,
        monthly:      89,
        yearly:       890,
        highlight:    false,
        features:     ['10 canais YouTube', 'Tudo do Pro', 'Acesso para equipe', 'Relatórios personalizados'],
    },
];

export function UpgradeModal({ isOpen, onClose, currentPlan }) {
    const [billing,     setBilling]     = useState('monthly');
    const [loadingPlan, setLoadingPlan] = useState(null);
    const { openCheckout } = useSubscription();

    if (!isOpen) return null;

    const handleUpgrade = async (planName) => {
        setLoadingPlan(planName);
        try {
            await openCheckout(planName, billing);
        } catch (err) {
            alert('Erro ao abrir checkout: ' + err.message);
            setLoadingPlan(null);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            padding: 16,
        }}>
            <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-elevated)',
                width: '100%', maxWidth: 760,
                maxHeight: '90vh', overflowY: 'auto',
                position: 'relative',
            }}>
                {/* Traço coral */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent-coral)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }} />

                {/* Header */}
                <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-coral-3)', border: '1px solid rgba(232,65,42,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Zap size={18} style={{ color: 'var(--accent-coral)' }} />
                            </div>
                            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.375rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                                Fazer upgrade
                            </h2>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
                            Seu plano <strong style={{ color: 'var(--text-primary)' }}>{currentPlan?.displayName || 'Free'}</strong> permite {currentPlan?.maxChannels || 1} canal. Escolha um plano maior para adicionar mais canais.
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 6, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>
                        <X size={15} />
                    </button>
                </div>

                {/* Toggle mensal/anual */}
                <div style={{ padding: '20px 28px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 3, gap: 3 }}>
                        {['monthly', 'yearly'].map(cycle => (
                            <button key={cycle} onClick={() => setBilling(cycle)} style={{
                                padding: '6px 18px',
                                borderRadius: 'var(--radius-sm)',
                                background: billing === cycle ? 'var(--bg-elevated)' : 'transparent',
                                border: `1px solid ${billing === cycle ? 'var(--border-default)' : 'transparent'}`,
                                color: billing === cycle ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontFamily: 'var(--font-display)', fontWeight: 600,
                                fontSize: '0.875rem', letterSpacing: '-0.01em', cursor: 'pointer',
                            }}>
                                {cycle === 'monthly' ? 'Mensal' : 'Anual'}
                                {cycle === 'yearly' && (
                                    <span style={{ marginLeft: 6, fontSize: '0.6875rem', background: 'var(--accent-teal-3)', color: 'var(--accent-teal)', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                                        -17%
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards de planos */}
                <div style={{ padding: '0 28px 28px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    {PLANS.map(plan => {
                        const price    = billing === 'yearly' ? plan.yearly : plan.monthly * 12;
                        const monthly  = billing === 'yearly' ? (plan.yearly / 12).toFixed(0) : plan.monthly;
                        const isCurrent = currentPlan?.name === plan.name;
                        const isLoading = loadingPlan === plan.name;

                        return (
                            <div key={plan.name} style={{
                                border: `1px solid ${plan.highlight ? 'rgba(232,65,42,0.4)' : 'var(--border-subtle)'}`,
                                borderRadius: 'var(--radius-lg)',
                                background: plan.highlight ? 'var(--accent-coral-3)' : 'var(--bg-card)',
                                padding: '20px',
                                position: 'relative',
                                display: 'flex', flexDirection: 'column',
                            }}>
                                {/* Traço de cor no topo */}
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', background: plan.highlight ? 'var(--accent-coral)' : 'var(--border-default)' }} />

                                {plan.highlight && (
                                    <div style={{ position: 'absolute', top: 12, right: 12 }}>
                                        <span style={{ fontSize: '0.5625rem', fontWeight: 700, background: 'var(--accent-coral)', color: '#fff', padding: '2px 8px', borderRadius: 10, fontFamily: 'var(--font-display)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                            Mais popular
                                        </span>
                                    </div>
                                )}

                                <div style={{ marginBottom: 16 }}>
                                    <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.0625rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                                        {plan.displayName}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <GitBranch size={13} style={{ color: 'var(--accent-coral)' }} />
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>
                                            {plan.maxChannels} canais
                                        </span>
                                    </div>
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>R$</span>
                                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem', color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                                            {monthly}
                                        </span>
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>/mês</span>
                                    </div>
                                    {billing === 'yearly' && (
                                        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            R${price}/ano cobrado anualmente
                                        </p>
                                    )}
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                                    {plan.features.map(f => (
                                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--accent-teal-3)', border: '1px solid rgba(0,201,167,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Check size={10} style={{ color: 'var(--accent-teal)' }} />
                                            </div>
                                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{f}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => !isCurrent && handleUpgrade(plan.name)}
                                    disabled={isCurrent || isLoading}
                                    className={`vc-btn ${plan.highlight ? 'vc-btn-primary' : 'vc-btn-secondary'}`}
                                    style={{ justifyContent: 'center', opacity: isCurrent ? 0.5 : 1 }}
                                >
                                    {isCurrent    ? 'Plano atual'
                                    : isLoading   ? 'Redirecionando...'
                                    : `Assinar ${plan.displayName}`}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 28px 20px' }}>
                    Pagamento seguro via Stripe · Cancele quando quiser · Sem multas
                </p>
            </div>
        </div>
    );
}

export default UpgradeModal;
