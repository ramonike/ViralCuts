/**
 * ChannelSwitcher — componente reutilizável
 * Usado na aba Canal (VideosPage) e no Pipeline (CalendarPage)
 * Recebe connectedAccounts, activeAccountId e onSwitch via props
 *
 * Modos:
 *   mode="bar"     → tira fina horizontalmente (ideal para topo de página)
 *   mode="compact" → dropdown/popover compacto (ideal para topbar do Pipeline)
 */
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckCircle, Youtube, Plus, RefreshCw, AlertCircle } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatNum = (n) => {
    if (!n) return '—';
    const v = parseInt(n);
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000)     return (v / 1_000).toFixed(1) + 'K';
    return v.toLocaleString('pt-BR');
};

function ChannelAvatar({ account, size = 32 }) {
    const [imgError, setImgError] = useState(false);
    const avatar = account?.stats?.thumbnails?.default?.url || account?.avatar;

    if (avatar && !imgError) {
        return (
            <img
                src={avatar}
                alt={account.name}
                onError={() => setImgError(true)}
                style={{
                    width: size, height: size,
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'cover', flexShrink: 0,
                }}
            />
        );
    }

    const initials = (account?.name || 'C')
        .trim().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div style={{
            width: size, height: size,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-coral)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: size * 0.38, color: '#fff', flexShrink: 0,
        }}>
            {initials}
        </div>
    );
}

// ─── Bar mode — linha horizontal com abas por canal ──────────────────────────
function BarMode({ accounts, activeId, onSwitch, onAddChannel }) {
    if (!accounts?.length) return null;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 0', marginBottom: 16,
            borderBottom: '1px solid var(--border-subtle)',
            overflowX: 'auto',
        }}>
            <span className="vc-metric-label" style={{ marginBottom: 0, flexShrink: 0 }}>
                Canal ativo:
            </span>

            <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                {accounts.map(acc => {
                    const active = acc.id === activeId;
                    const expired = acc.expiresAt && new Date(acc.expiresAt).getTime() < Date.now();
                    const subs = acc.stats?.statistics?.subscriberCount;

                    return (
                        <button
                            key={acc.id}
                            onClick={() => !expired && onSwitch(acc.id)}
                            disabled={expired}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 9,
                                padding: '7px 12px',
                                borderRadius: 'var(--radius-md)',
                                background: active ? 'var(--accent-coral-3)' : 'var(--bg-tertiary)',
                                border: `1px solid ${active ? 'rgba(232,65,42,0.25)' : 'var(--border-subtle)'}`,
                                cursor: expired ? 'not-allowed' : 'pointer',
                                opacity: expired ? 0.5 : 1,
                                transition: 'all 0.15s',
                                flexShrink: 0,
                                textAlign: 'left',
                            }}
                        >
                            <ChannelAvatar account={acc} size={26} />
                            <div>
                                <div style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 600,
                                    fontSize: '0.8125rem', letterSpacing: '-0.01em',
                                    color: active ? 'var(--accent-coral-2)' : 'var(--text-primary)',
                                    maxWidth: 140,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {acc.name || 'Canal'}
                                </div>
                                {subs && (
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                        {formatNum(subs)} inscritos
                                    </div>
                                )}
                            </div>
                            {active && <CheckCircle size={13} style={{ color: 'var(--accent-coral)', flexShrink: 0, marginLeft: 2 }} />}
                            {expired && <AlertCircle size={13} style={{ color: 'var(--accent-coral)', flexShrink: 0 }} />}
                        </button>
                    );
                })}
            </div>

            {/* Adicionar canal */}
            {onAddChannel && (
                <button
                    onClick={onAddChannel}
                    className="vc-btn vc-btn-ghost vc-btn-sm"
                    style={{ flexShrink: 0 }}
                >
                    <Plus size={13} /> Adicionar
                </button>
            )}
        </div>
    );
}

// ─── Compact mode — dropdown para topbar do Pipeline ─────────────────────────
function CompactMode({ accounts, activeId, onSwitch, onAddChannel }) {
    const [open, setOpen] = useState(false);
    const ref             = useRef(null);

    const active = accounts?.find(a => a.id === activeId) || accounts?.[0];

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!accounts?.length) return null;

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px',
                    background: open ? 'var(--bg-elevated)' : 'var(--bg-tertiary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', transition: 'all 0.15s',
                }}
            >
                <ChannelAvatar account={active} size={22} />
                <span style={{
                    fontFamily: 'var(--font-display)', fontWeight: 600,
                    fontSize: '0.8125rem', letterSpacing: '-0.01em',
                    color: 'var(--text-primary)',
                    maxWidth: 120,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {active?.name || 'Selecionar canal'}
                </span>
                <ChevronDown
                    size={13}
                    style={{
                        color: 'var(--text-muted)', flexShrink: 0,
                        transform: open ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.15s',
                    }}
                />
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                    zIndex: 50, minWidth: 220,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-elevated)',
                    padding: '6px',
                    animation: 'vc-scale-in 0.15s ease',
                }}>
                    <div className="vc-metric-label" style={{ padding: '4px 8px 8px', marginBottom: 0 }}>
                        Canais conectados
                    </div>

                    {accounts.map(acc => {
                        const isActive  = acc.id === activeId;
                        const expired   = acc.expiresAt && new Date(acc.expiresAt).getTime() < Date.now();
                        const subs      = acc.stats?.statistics?.subscriberCount;

                        return (
                            <button
                                key={acc.id}
                                onClick={() => { if (!expired) { onSwitch(acc.id); setOpen(false); } }}
                                disabled={expired}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    width: '100%', padding: '8px 10px',
                                    borderRadius: 'var(--radius-md)',
                                    background: isActive ? 'var(--accent-coral-3)' : 'transparent',
                                    border: '1px solid transparent',
                                    cursor: expired ? 'not-allowed' : 'pointer',
                                    opacity: expired ? 0.5 : 1,
                                    transition: 'all 0.12s',
                                    textAlign: 'left',
                                }}
                                onMouseEnter={e => { if (!isActive && !expired) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                            >
                                <ChannelAvatar account={acc} size={28} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontFamily: 'var(--font-display)', fontWeight: 600,
                                        fontSize: '0.875rem', letterSpacing: '-0.01em',
                                        color: isActive ? 'var(--accent-coral-2)' : 'var(--text-primary)',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {acc.name || 'Canal'}
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 1 }}>
                                        {expired
                                            ? '⚠ Token expirado — reconecte'
                                            : subs ? `${formatNum(subs)} inscritos` : 'Canal conectado'
                                        }
                                    </div>
                                </div>
                                {isActive && <CheckCircle size={14} style={{ color: 'var(--accent-coral)', flexShrink: 0 }} />}
                            </button>
                        );
                    })}

                    {/* Adicionar canal */}
                    {onAddChannel && (
                        <>
                            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 0' }} />
                            <button
                                onClick={() => { onAddChannel(); setOpen(false); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    width: '100%', padding: '8px 10px',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'transparent', border: '1px solid transparent',
                                    cursor: 'pointer', transition: 'background 0.12s',
                                    textAlign: 'left',
                                    color: 'var(--text-secondary)',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{
                                    width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                                    background: 'var(--bg-card)',
                                    border: '1px dashed var(--border-default)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <Plus size={13} style={{ color: 'var(--text-muted)' }} />
                                </div>
                                <span style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 500,
                                    fontSize: '0.875rem', color: 'var(--text-secondary)',
                                }}>
                                    Adicionar canal
                                </span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function ChannelSwitcher({ mode = 'bar', accounts = [], activeId, onSwitch, onAddChannel }) {
    if (!accounts?.length) return null;

    if (mode === 'compact') {
        return (
            <CompactMode
                accounts={accounts}
                activeId={activeId}
                onSwitch={onSwitch}
                onAddChannel={onAddChannel}
            />
        );
    }

    return (
        <BarMode
            accounts={accounts}
            activeId={activeId}
            onSwitch={onSwitch}
            onAddChannel={onAddChannel}
        />
    );
}

export default ChannelSwitcher;
