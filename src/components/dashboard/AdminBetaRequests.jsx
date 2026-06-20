/**
 * AdminBetaRequests — src/components/dashboard/AdminBetaRequests.jsx
 *
 * Aba de pedidos beta para incluir na AdminPage.
 *
 * Uso na AdminPage:
 *   import { AdminBetaRequests } from '../components/dashboard/AdminBetaRequests';
 *
 *   // Adicionar tab no header:
 *   const [tab, setTab] = useState('users'); // 'users' | 'beta'
 *
 *   // No render, abaixo do header:
 *   {tab === 'beta' && <AdminBetaRequests />}
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, XCircle, RefreshCw, Mail, Youtube, Copy, Check } from 'lucide-react';
import { API_URL } from '../../config/api';

async function fetchRequests(status = 'pending') {
    const res = await fetch(`${API_URL}/api/beta/requests?status=${status}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Falha ao buscar pedidos');
    return res.json();
}

async function updateRequest(id, status, note = '') {
    const res = await fetch(`${API_URL}/api/beta/requests/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
    });
    if (!res.ok) throw new Error('Falha ao atualizar pedido');
    return res.json();
}

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--text-muted)', borderRadius: 4 }}
            title="Copiar"
        >
            {copied ? <Check size={12} style={{ color: 'var(--accent-teal)' }} /> : <Copy size={12} />}
        </button>
    );
}

export function AdminBetaRequests() {
    const [requests,   setRequests]   = useState([]);
    const [filter,     setFilter]     = useState('pending');
    const [loading,    setLoading]    = useState(true);
    const [actionNote, setActionNote] = useState('');
    const [acting,     setActing]     = useState(null); // id do pedido em ação

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchRequests(filter);
            setRequests(data.requests || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { load(); }, [load]);

    const handleAction = async (id, status) => {
        setActing(id);
        try {
            await updateRequest(id, status, actionNote);
            await load();
            setActionNote('');
        } catch (err) {
            alert('Erro ao atualizar: ' + err.message);
        } finally {
            setActing(null);
        }
    };

    const statusMap = {
        pending:  { badge: 'vc-badge-amber', label: 'Pendente', icon: <Clock size={10} /> },
        approved: { badge: 'vc-badge-teal',  label: 'Aprovado', icon: <CheckCircle size={10} /> },
        rejected: { badge: 'vc-badge-coral', label: 'Rejeitado', icon: <XCircle size={10} /> },
    };

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div className="vc-card" style={{ padding: '16px 20px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent-amber)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h2 style={{ margin: '0 0 2px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
                            Pedidos de Acesso Beta
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            Gmails para adicionar no Google Console OAuth → Test Users
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {/* Filtro */}
                        {['pending', 'approved', 'rejected', 'all'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={`vc-btn vc-btn-sm ${filter === s ? 'vc-btn-primary' : 'vc-btn-secondary'}`}
                            >
                                {s === 'pending' ? `Pendentes${pendingCount ? ` (${pendingCount})` : ''}` : s === 'approved' ? 'Aprovados' : s === 'rejected' ? 'Rejeitados' : 'Todos'}
                            </button>
                        ))}
                        <button onClick={load} className="vc-btn vc-btn-secondary vc-btn-sm">
                            <RefreshCw size={13} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Instruções para o admin */}
            {filter === 'pending' && requests.length > 0 && (
                <div className="vc-toast vc-toast-amber">
                    <Clock size={15} style={{ flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.6 }}>
                        Para aprovar: copie o Gmail → acesse{' '}
                        <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener" style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                            Google Console → OAuth consent screen → Test users
                        </a>
                        {' '}→ adicione o email → clique "Aprovar" aqui.
                    </p>
                </div>
            )}

            {/* Lista */}
            {loading ? (
                <div className="vc-card" style={{ padding: '48px', textAlign: 'center' }}>
                    <RefreshCw size={20} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
                </div>
            ) : requests.length === 0 ? (
                <div className="vc-card" style={{ padding: '48px', textAlign: 'center' }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Nenhum pedido {filter !== 'all' ? filter === 'pending' ? 'pendente' : filter === 'approved' ? 'aprovado' : 'rejeitado' : ''} encontrado
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {requests.map(req => {
                        const s = statusMap[req.status] || statusMap.pending;
                        const isActing = acting === req.id;
                        return (
                            <div key={req.id} className="vc-card" style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {/* Usuário */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <div className="vc-avatar" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>
                                                {(req.user?.name || '?')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                                    {req.user?.name || 'Usuário'}
                                                </span>
                                                <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {req.user?.email}
                                                </span>
                                            </div>
                                            <span className={`vc-badge ${s.badge}`} style={{ marginLeft: 4 }}>
                                                {s.icon} {s.label}
                                            </span>
                                        </div>

                                        {/* Gmail do canal */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: req.channelName ? 4 : 0 }}>
                                            <Mail size={13} style={{ color: 'var(--accent-coral)', flexShrink: 0 }} />
                                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                                {req.gmail}
                                            </span>
                                            <CopyButton text={req.gmail} />
                                        </div>

                                        {req.channelName && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Youtube size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{req.channelName}</span>
                                            </div>
                                        )}

                                        <div style={{ marginTop: 6, fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                            Solicitado em {new Date(req.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </div>

                                        {req.note && (
                                            <div style={{ marginTop: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                Nota: {req.note}
                                            </div>
                                        )}
                                    </div>

                                    {/* Ações */}
                                    {req.status !== 'approved' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                                            <input
                                                placeholder="Nota (opcional)"
                                                value={acting === req.id ? actionNote : ''}
                                                onChange={e => setActionNote(e.target.value)}
                                                className="vc-input"
                                                style={{ fontSize: '0.75rem', padding: '5px 10px', width: 160 }}
                                                onFocus={() => setActing(req.id)}
                                            />
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    onClick={() => handleAction(req.id, 'approved')}
                                                    disabled={isActing}
                                                    className="vc-btn vc-btn-sm"
                                                    style={{ flex: 1, justifyContent: 'center', background: 'var(--accent-teal-3)', border: '1px solid rgba(0,201,167,0.25)', color: 'var(--accent-teal)' }}
                                                >
                                                    <CheckCircle size={13} /> Aprovar
                                                </button>
                                                {req.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleAction(req.id, 'rejected')}
                                                        disabled={isActing}
                                                        className="vc-btn vc-btn-ghost vc-btn-sm"
                                                        style={{ color: 'var(--accent-coral)' }}
                                                    >
                                                        <XCircle size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default AdminBetaRequests;
