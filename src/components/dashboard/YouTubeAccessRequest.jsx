/**
 * YouTubeAccessRequest — v2
 * Corrigido: quando status = 'approved', renderiza o GoogleAuthButton real
 * em vez de um botão customizado que não dispara o OAuth do Google.
 */

import React, { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle, XCircle, Youtube, Send, AlertCircle } from 'lucide-react';
import { GoogleAuthButton } from './GoogleAuthButton';
import { API_URL } from '../../config/api';

// ─── API ──────────────────────────────────────────────────────────────────────
async function fetchBetaStatus() {
    const res = await fetch(`${API_URL}/api/beta/status`, { credentials: 'include' });
    if (!res.ok) throw new Error('Falha ao consultar status');
    return res.json();
}

async function submitBetaRequest(gmail, channelName) {
    const res = await fetch(`${API_URL}/api/beta/request`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmail, channelName }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao enviar solicitação');
    }
    return res.json();
}

// ─── Estado: Pendente ─────────────────────────────────────────────────────────
function PendingState({ gmail, onEdit }) {
    return (
        <div style={{
            padding: '20px 24px', borderRadius: 'var(--radius-lg)',
            background: 'var(--accent-amber-3)',
            border: '1px solid rgba(240,165,0,0.25)',
        }}>
            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0,
                    background: 'rgba(240,165,0,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Clock size={18} style={{ color: 'var(--accent-amber)' }} />
                </div>
                <div>
                    <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        Aguardando aprovação
                    </p>
                    <p style={{ margin: '0 0 10px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Recebemos o pedido para <strong style={{ color: 'var(--text-primary)' }}>{gmail}</strong>.
                        Você será aprovado em até 24h e poderá conectar o YouTube normalmente.
                    </p>
                    <button onClick={onEdit} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                        Email errado? Corrigir →
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Estado: Aprovado — usa GoogleAuthButton real ─────────────────────────────
function ApprovedState({ onLoginSuccess, onLoginError }) {
    return (
        <div style={{
            padding: '20px 24px', borderRadius: 'var(--radius-lg)',
            background: 'var(--accent-teal-3)',
            border: '1px solid rgba(0,201,167,0.25)',
        }}>
            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0,
                    background: 'rgba(0,201,167,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <CheckCircle size={18} style={{ color: 'var(--accent-teal)' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        Acesso aprovado! 🎉
                    </p>
                    <p style={{ margin: '0 0 14px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Seu email foi adicionado ao programa beta. Agora você pode conectar o YouTube.
                    </p>
                    {/* GoogleAuthButton REAL — dispara o OAuth do Google */}
                    <GoogleAuthButton
                        onLoginSuccess={onLoginSuccess}
                        onLoginError={onLoginError}
                        text="Conectar YouTube"
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Estado: Rejeitado ────────────────────────────────────────────────────────
function RejectedState({ note, onEdit }) {
    return (
        <div style={{
            padding: '20px 24px', borderRadius: 'var(--radius-lg)',
            background: 'var(--accent-coral-3)',
            border: '1px solid rgba(232,65,42,0.25)',
        }}>
            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0,
                    background: 'rgba(232,65,42,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <XCircle size={18} style={{ color: 'var(--accent-coral)' }} />
                </div>
                <div>
                    <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        Solicitação não aprovada
                    </p>
                    {note && <p style={{ margin: '0 0 10px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{note}</p>}
                    <button onClick={onEdit} className="vc-btn vc-btn-secondary vc-btn-sm">
                        Tentar com outro email
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Formulário de solicitação ────────────────────────────────────────────────
function RequestForm({ onSubmitted }) {
    const [gmail, setGmail] = useState('');
    const [channelName, setChannelName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!gmail || !gmail.includes('@')) { setError('Digite um email válido'); return; }
        setLoading(true);
        setError('');
        try {
            await submitBetaRequest(gmail.trim(), channelName.trim());
            onSubmitted();
        } catch (err) {
            setError(err.message || 'Erro ao enviar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '22px 24px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent-coral)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-coral-3)', border: '1px solid rgba(232,65,42,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Youtube size={18} style={{ color: 'var(--accent-coral)' }} />
                </div>
                <div>
                    <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        Solicitar acesso ao YouTube
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fase beta — vagas limitadas</p>
                </div>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                O ViralCuts está em fase de testes. Informe o <strong style={{ color: 'var(--text-primary)' }}>Gmail associado ao seu canal YouTube</strong> — adicionaremos você ao programa beta em até 24h.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                    <label className="vc-label">Gmail do canal *</label>
                    <div className="vc-input-wrap">
                        <Mail size={14} className="vc-input-icon-left" />
                        <input
                            type="email"
                            value={gmail}
                            onChange={e => { setGmail(e.target.value); setError(''); }}
                            placeholder="seuemail@gmail.com"
                            className="vc-input has-icon-left"
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        />
                    </div>
                </div>

                <div>
                    <label className="vc-label">
                        Nome do canal{' '}
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
                    </label>
                    <input
                        type="text"
                        value={channelName}
                        onChange={e => setChannelName(e.target.value)}
                        placeholder="Ex: CiênciaPraBurro"
                        className="vc-input"
                    />
                </div>

                {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertCircle size={13} style={{ color: 'var(--accent-coral)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8125rem', color: 'var(--accent-coral)' }}>{error}</span>
                    </div>
                )}

                <button onClick={handleSubmit} disabled={loading} className="vc-btn vc-btn-primary" style={{ justifyContent: 'center' }}>
                    {loading ? 'Enviando...' : <><Send size={14} /> Solicitar acesso</>}
                </button>
            </div>

            <p style={{ margin: '14px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                Usado apenas para liberar acesso ao OAuth do YouTube. Não compartilhamos seus dados.
            </p>
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function YouTubeAccessRequest({ onLoginSuccess, onLoginError }) {
    const [status, setStatus] = useState(null);
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [forceForm, setForceForm] = useState(false);

    const loadStatus = async () => {
        setLoading(true);
        try {
            const data = await fetchBetaStatus();
            setRequest(data.request);
            setStatus(data.request?.status || null);
        } catch {
            setStatus(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadStatus(); }, []);

    if (loading) return (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Verificando status...
        </div>
    );

    // Aprovado → GoogleAuthButton real para fazer OAuth
    if (status === 'approved' && !forceForm) {
        return <ApprovedState onLoginSuccess={onLoginSuccess} onLoginError={onLoginError} />;
    }

    // Pendente → aguardando
    if (status === 'pending' && !forceForm) {
        return <PendingState gmail={request?.gmail} onEdit={() => setForceForm(true)} />;
    }

    // Rejeitado → opção de tentar outro email
    if (status === 'rejected' && !forceForm) {
        return <RejectedState note={request?.note} onEdit={() => setForceForm(true)} />;
    }

    // Sem pedido (ou forçando form)
    return <RequestForm onSubmitted={() => { setForceForm(false); loadStatus(); }} />;
}

export default YouTubeAccessRequest;
