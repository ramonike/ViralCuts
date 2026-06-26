/**
 * ScheduleVideoModal v3 — Multi-plataforma, visual Buffer-inspired
 * - Avatares das contas conectadas como seletores (como o Buffer)
 * - Preview lateral por plataforma selecionada
 * - Upload múltiplo com cards expansíveis
 * - Um item na fila por plataforma selecionada
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    X, Upload, FileVideo, Trash2, AlertCircle, Globe, Lock,
    EyeOff, CheckCircle, Zap, Calendar, Plus, ChevronDown,
    ChevronUp, Loader2
} from 'lucide-react';
import { PlatformIcon, getPlatformLabel } from '../shared/PlatformIcon';
import { useDashboardState } from '../../hooks/useDashboardState';

// ─── Constantes ────────────────────────────────────────────────────────────────

const PRIVACY = [
    { value: 'public', label: 'Público' },
    { value: 'unlisted', label: 'Não listado' },
    { value: 'private', label: 'Privado' },
];

const TIMEZONES = [
    { value: 'America/Sao_Paulo', label: 'Brasília (BRT)' },
    { value: 'America/Manaus', label: 'Manaus (AMT)' },
    { value: 'America/Rio_Branco', label: 'Rio Branco (ACT)' },
    { value: 'America/New_York', label: 'Nova York (EST)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
    { value: 'Europe/London', label: 'Londres (GMT)' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localTZ() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONES.find(t => t.value === tz)?.value || 'America/Sao_Paulo';
}

function localDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function localTimeStr(d) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function todayStr() { return localDateStr(new Date()); }
function maxDateStr() { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return localDateStr(d); }

function isFuture(date, time) {
    if (!date || !time) return false;
    const [y, m, dd] = date.split('-').map(Number);
    const [h, mn] = time.split(':').map(Number);
    return new Date(y, m - 1, dd, h, mn) > new Date(Date.now() + 5 * 60 * 1000);
}

function makeItem(file, date, time) {
    const base = new Date(Date.now() + 10 * 60 * 1000);
    return {
        id: Math.random().toString(36).slice(2),
        file,
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        tags: '',
        privacyStatus: 'public',
        publishNow: false,
        scheduledDate: date || localDateStr(base),
        scheduledTime: time || localTimeStr(base),
        timezone: localTZ(),
        expanded: true,
        aiLoading: false,
        status: 'idle',
        errorMsg: '',
    };
}

function makeSchedule(count, baseDate, baseTime) {
    let base;
    if (baseDate && baseTime) {
        const [y, m, dd] = baseDate.split('-').map(Number);
        const [h, mn] = baseTime.split(':').map(Number);
        base = new Date(y, m - 1, dd, h, mn);
    } else {
        base = new Date(Date.now() + 10 * 60 * 1000);
    }
    return Array.from({ length: count }, (_, i) => {
        const dt = new Date(base.getTime() + i * 6 * 60 * 60 * 1000);
        return { date: localDateStr(dt), time: localTimeStr(dt) };
    });
}

// ─── AccountAvatar — avatar clicável estilo Buffer ───────────────────────────
function AccountAvatar({ account, selected, onClick }) {
    const [imgErr, setImgErr] = useState(false);
    const initials = (account.name || '?')[0].toUpperCase();
    const platformKey = (account.platform || 'youtube').toLowerCase();

    return (
        <button
            onClick={onClick}
            title={`${account.name} (${getPlatformLabel(platformKey)})`}
            style={{
                position: 'relative',
                width: 44, height: 44,
                borderRadius: '50%',
                border: `2px solid ${selected ? 'var(--accent-coral)' : 'var(--border-default)'}`,
                padding: 0, cursor: 'pointer',
                background: 'none',
                transition: 'border-color 0.15s, transform 0.15s',
                transform: selected ? 'scale(1.08)' : 'scale(1)',
                flexShrink: 0,
            }}
        >
            {/* Avatar ou iniciais */}
            {account.avatar && !imgErr ? (
                <img
                    src={account.avatar}
                    alt={account.name}
                    onError={() => setImgErr(true)}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
            ) : (
                <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: 'var(--accent-coral)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff',
                }}>
                    {initials}
                </div>
            )}

            {/* Badge da plataforma no canto inferior direito */}
            <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 18, height: 18, borderRadius: '50%',
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--bg-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <PlatformIcon platform={platformKey} size={13} />
            </div>

            {/* Check de seleção */}
            {selected && (
                <div style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'var(--accent-coral)',
                    border: '2px solid var(--bg-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <CheckCircle size={10} style={{ color: '#fff' }} />
                </div>
            )}
        </button>
    );
}

// ─── VideoCard ────────────────────────────────────────────────────────────────
function VideoCard({ item, onUpdate, onRemove }) {
    const [localAiLoad, setLocalAiLoad] = useState(false);
    const set = (field, val) => onUpdate(item.id, { [field]: val });
    const valid = item.publishNow || isFuture(item.scheduledDate, item.scheduledTime);

    const runAI = async () => {
        setLocalAiLoad(true);
        await new Promise(r => setTimeout(r, 900));
        const topic = item.title || item.file.name.replace(/\.[^/.]+$/, '');
        onUpdate(item.id, {
            description: `Descubra tudo sobre ${topic}! Conteúdo exclusivo e dicas incríveis. Curta e inscreva-se! 🔥`,
            tags: `${topic}, shorts, viral, dicas`,
        });
        setLocalAiLoad(false);
    };

    const accentBorder = item.status === 'done' ? 'rgba(0,201,167,0.3)'
        : item.status === 'error' ? 'rgba(232,65,42,0.3)'
            : item.status === 'submitting' ? 'rgba(240,165,0,0.3)'
                : 'var(--border-subtle)';

    return (
        <div style={{ border: `1px solid ${accentBorder}`, borderRadius: 'var(--radius-lg)', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
            {/* Header */}
            <div
                onClick={() => item.status === 'idle' && set('expanded', !item.expanded)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    cursor: item.status === 'idle' ? 'pointer' : 'default',
                    background: item.status === 'done' ? 'var(--accent-teal-3)' : item.status === 'error' ? 'var(--accent-coral-3)' : 'transparent'
                }}
            >
                <div style={{ width: 42, height: 24, borderRadius: 4, flexShrink: 0, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.status === 'submitting' && <Loader2 size={12} style={{ color: 'var(--accent-amber)', animation: 'spin 1s linear infinite' }} />}
                    {item.status === 'done' && <CheckCircle size={12} style={{ color: 'var(--accent-teal)' }} />}
                    {item.status === 'error' && <AlertCircle size={12} style={{ color: 'var(--accent-coral)' }} />}
                    {item.status === 'idle' && <FileVideo size={12} style={{ color: 'var(--text-muted)' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title || item.file.name}
                    </p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{(item.file.size / 1024 / 1024).toFixed(1)} MB</span>
                        {!item.publishNow && item.scheduledDate && (
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                · {new Date(...item.scheduledDate.split('-').map((v, i) => i === 1 ? Number(v) - 1 : Number(v)), ...item.scheduledTime.split(':').map(Number)).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        {item.publishNow && <span className="vc-badge vc-badge-amber" style={{ fontSize: '0.5rem' }}>Agora</span>}
                        {item.status === 'error' && <span style={{ fontSize: '0.6875rem', color: 'var(--accent-coral)' }}>{item.errorMsg}</span>}
                    </div>
                </div>
                {item.status === 'idle' && (
                    <button onClick={e => { e.stopPropagation(); onRemove(item.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                        <Trash2 size={13} />
                    </button>
                )}
                {item.status === 'idle' && (item.expanded ? <ChevronUp size={13} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />)}
            </div>

            {/* Corpo */}
            {item.expanded && item.status === 'idle' && (
                <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 0 4px' }} />

                    {/* Título + IA */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Título *</span>
                            <button onClick={runAI} disabled={localAiLoad} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', fontSize: '0.625rem', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase', background: 'var(--accent-coral-3)', border: '1px solid rgba(232,65,42,0.25)', color: 'var(--accent-coral-2)', borderRadius: 'var(--radius-sm)', cursor: localAiLoad ? 'not-allowed' : 'pointer', opacity: localAiLoad ? 0.5 : 1 }}>
                                {localAiLoad ? <><Loader2 size={9} style={{ animation: 'spin 1s linear infinite' }} />Gerando...</> : <><Zap size={9} />IA</>}
                            </button>
                        </div>
                        <input value={item.title} onChange={e => set('title', e.target.value)} placeholder="Título do vídeo" className="vc-input" style={{ fontSize: '0.875rem' }} />
                    </div>

                    <div>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 6 }}>Descrição</span>
                        <textarea value={item.description} onChange={e => set('description', e.target.value)} placeholder="Descrição..." rows={2} className="vc-input" style={{ resize: 'none', fontSize: '0.875rem', lineHeight: 1.5 }} />
                    </div>

                    <div>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 6 }}>Tags</span>
                        <input value={item.tags} onChange={e => set('tags', e.target.value)} placeholder="tag1, tag2, tag3" className="vc-input" style={{ fontSize: '0.875rem' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 6 }}>Privacidade</span>
                            <select value={item.privacyStatus} onChange={e => set('privacyStatus', e.target.value)} className="vc-input" style={{ fontSize: '0.8125rem', colorScheme: 'dark' }}>
                                {PRIVACY.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 6 }}>Quando</span>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                {[{ v: false, label: 'Agendar' }, { v: true, label: 'Agora' }].map(opt => (
                                    <button key={String(opt.v)} onClick={() => set('publishNow', opt.v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: item.publishNow === opt.v ? (opt.v ? 'var(--accent-amber-3)' : 'var(--accent-coral-3)') : 'var(--bg-elevated)', border: `1px solid ${item.publishNow === opt.v ? (opt.v ? 'rgba(240,165,0,0.25)' : 'rgba(232,65,42,0.25)') : 'var(--border-subtle)'}`, color: item.publishNow === opt.v ? (opt.v ? 'var(--accent-amber)' : 'var(--accent-coral-2)') : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
                                        {opt.v ? <Zap size={11} /> : <Calendar size={11} />}{opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {!item.publishNow && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 6 }}>Data</span>
                                <input type="date" value={item.scheduledDate} min={todayStr()} max={maxDateStr()} onChange={e => set('scheduledDate', e.target.value)} className="vc-input" style={{ fontSize: '0.875rem', colorScheme: 'dark' }} />
                            </div>
                            <div>
                                <span style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 6 }}>Horário</span>
                                <input type="time" value={item.scheduledTime} onChange={e => set('scheduledTime', e.target.value)} className="vc-input" style={{ fontSize: '0.875rem', colorScheme: 'dark' }} />
                            </div>
                        </div>
                    )}

                    {!item.publishNow && !valid && item.scheduledDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertCircle size={12} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>Horário deve ser pelo menos 5 minutos no futuro</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── DropZone ─────────────────────────────────────────────────────────────────
function DropZone({ onFiles, compact }) {
    const [drag, setDrag] = useState(false);
    const ref = useRef(null);
    const handle = files => {
        const videos = Array.from(files).filter(f => f.type.startsWith('video/'));
        if (videos.length) onFiles(videos);
    };
    return (
        <div onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onClick={() => ref.current?.click()} style={{ border: `2px dashed ${drag ? 'var(--accent-coral)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-lg)', padding: compact ? '12px 20px' : '36px 24px', textAlign: 'center', cursor: 'pointer', background: drag ? 'var(--accent-coral-3)' : 'var(--bg-tertiary)', transition: 'all 0.15s' }}>
            <input ref={ref} type="file" accept="video/*" multiple style={{ display: 'none' }} onChange={e => handle(e.target.files)} />
            {compact ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Plus size={15} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>Adicionar mais vídeos</span>
                </div>
            ) : (
                <>
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <Upload size={20} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Arraste vídeos ou clique para selecionar</p>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Múltiplos arquivos · MP4, MOV, AVI · máx 2GB</p>
                </>
            )}
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function ScheduleVideoModal({ isOpen, onClose, selectedDate, onSchedule, onAllDone }) {
    const { state } = useDashboardState();

    // Contas conectadas com token válido, agrupadas por plataforma
    const connectedAccounts = useMemo(() => {
        const accounts = state.auth?.connectedAccounts || [];
        const now = Date.now();
        return accounts
            .filter(a => a.expiresAt && a.expiresAt > now)
            .map(a => ({
                ...a,
                platform: (a.platform || 'youtube').toLowerCase(),
            }));
    }, [state.auth?.connectedAccounts]);

    const [items, setItems] = useState([]);
    const [selectedAccounts, setSelectedAccounts] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setItems([]);
            setGlobalError('');
            setSubmitting(false);
            // Auto-selecionar todas as contas conectadas
            const autoSelected = {};
            connectedAccounts.forEach(a => { autoSelected[a.id] = true; });
            setSelectedAccounts(autoSelected);
        }
    }, [isOpen]);

    const addFiles = useCallback((files) => {
        const videoFiles = Array.from(files).filter(f => f.type.startsWith('video/'));
        if (!videoFiles.length) return;
        setItems(prev => {
            const baseDate = selectedDate
                ? (typeof selectedDate === 'string' ? selectedDate : localDateStr(selectedDate))
                : null;
            const times = makeSchedule(prev.length + videoFiles.length, baseDate, null);
            const existing = prev.map((item, i) => ({ ...item, scheduledDate: times[i].date, scheduledTime: times[i].time }));
            const added = videoFiles.map((file, i) => makeItem(file, times[prev.length + i].date, times[prev.length + i].time));
            return [...existing, ...added];
        });
    }, [selectedDate]);

    const updateItem = useCallback((id, patch) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
    }, []);

    const removeItem = useCallback((id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    }, []);

    const toggleAccount = (accountId) => {
        setSelectedAccounts(prev => ({ ...prev, [accountId]: !prev[accountId] }));
    };

    const activeAccounts = connectedAccounts.filter(a => selectedAccounts[a.id]);

    const allValid = useMemo(() => {
        if (items.length === 0 || activeAccounts.length === 0) return false;
        return items.every(item => item.title && (item.publishNow || isFuture(item.scheduledDate, item.scheduledTime)));
    }, [items, activeAccounts]);

    if (!isOpen) return null;

    const doneCount = items.filter(i => i.status === 'done').length;
    const errorCount = items.filter(i => i.status === 'error').length;
    const allDone = items.length > 0 && doneCount === items.length;

    const handleSubmit = async () => {
        if (!allValid) {
            setGlobalError('Preencha título e horário válido em todos os vídeos');
            setItems(prev => prev.map(item => {
                const invalid = !item.title || (!item.publishNow && !isFuture(item.scheduledDate, item.scheduledTime));
                return invalid ? { ...item, expanded: true } : item;
            }));
            return;
        }
        setSubmitting(true);
        setGlobalError('');
        setItems(prev => prev.map(i => ({ ...i, status: 'submitting', expanded: false })));

        // Para cada vídeo × cada conta selecionada → um item na fila
        for (const item of items) {
            let itemError = '';
            for (const account of activeAccounts) {
                try {
                    const [y, m, dd] = item.scheduledDate.split('-').map(Number);
                    const [h, mn] = item.scheduledTime.split(':').map(Number);
                    const dt = item.publishNow ? new Date() : new Date(y, m - 1, dd, h, mn, 0);
                    await onSchedule({
                        title: item.title,
                        description: item.description,
                        platform: account.platform,
                        accountId: account.accountId || account.id,
                        scheduledAt: item.publishNow ? null : dt.toISOString(),
                        publishAt: dt.toISOString(),
                        privacyStatus: item.privacyStatus,
                        tags: item.tags.split(',').map(t => t.trim()).filter(Boolean),
                        file: item.file,
                        timezone: item.timezone,
                        publishNow: item.publishNow,
                        source: item.publishNow ? 'immediate' : 'scheduled',
                    });
                } catch (err) {
                    console.error(`[Modal] Failed for ${account.platform}:`, err);
                    itemError = err.message || `Erro ao agendar para ${account.platform}`;
                }
            }
            setItems(prev => prev.map(i =>
                i.id === item.id
                    ? { ...i, status: itemError ? 'error' : 'done', errorMsg: itemError }
                    : i
            ));
        }

        setSubmitting(false);
        setItems(prev => {
            if (prev.every(i => i.status === 'done' || i.status === 'error')) {
                if (prev.every(i => i.status === 'done')) {
                    setTimeout(() => (onAllDone ? onAllDone() : onClose()), 1400);
                }
            }
            return prev;
        });
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', padding: 16 }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-elevated)', width: '100%', maxWidth: 620, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent-coral)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: connectedAccounts.length > 0 ? 14 : 0 }}>
                        <div>
                            <h2 style={{ margin: '0 0 2px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.0625rem', letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
                                Agendar no Pipeline
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {items.length === 0 ? 'Selecione vídeos e contas de destino'
                                    : `${items.length} vídeo${items.length > 1 ? 's' : ''} · ${activeAccounts.length} conta${activeAccounts.length > 1 ? 's' : ''} selecionada${activeAccounts.length > 1 ? 's' : ''}`}
                            </p>
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 6, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                            <X size={15} />
                        </button>
                    </div>

                    {/* Seletor de contas — estilo Buffer */}
                    {connectedAccounts.length > 0 && (
                        <div>
                            <div style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, fontFamily: 'var(--font-body)' }}>
                                Publicar em
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                {connectedAccounts.map(account => (
                                    <AccountAvatar
                                        key={account.id}
                                        account={account}
                                        selected={!!selectedAccounts[account.id]}
                                        onClick={() => toggleAccount(account.id)}
                                    />
                                ))}
                                {connectedAccounts.length === 0 && (
                                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                        Nenhuma conta conectada — vá em Perfil para conectar.
                                    </p>
                                )}
                            </div>
                            {activeAccounts.length === 0 && connectedAccounts.length > 0 && (
                                <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: 'var(--accent-coral)' }}>
                                    Selecione ao menos uma conta
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Body */}
                <div style={{ overflowY: 'auto', flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {items.length === 0
                        ? <DropZone onFiles={addFiles} compact={false} />
                        : (
                            <>
                                {items.map(item => (
                                    <VideoCard key={item.id} item={item} onUpdate={updateItem} onRemove={removeItem} />
                                ))}
                                {!submitting && <DropZone onFiles={addFiles} compact={true} />}
                            </>
                        )
                    }

                    {allDone && (
                        <div style={{ padding: '14px 16px', background: 'var(--accent-teal-3)', border: '1px solid rgba(0,201,167,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <CheckCircle size={16} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.01em' }}>
                                {items.length} vídeo{items.length > 1 ? 's' : ''} agendado{items.length > 1 ? 's' : ''}!
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {globalError && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertCircle size={13} style={{ color: 'var(--accent-coral)', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.8125rem', color: 'var(--accent-coral)' }}>{globalError}</span>
                            </div>
                        )}
                        {submitting && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Loader2 size={13} style={{ color: 'var(--accent-amber)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Agendando...</span>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button onClick={onClose} className="vc-btn vc-btn-ghost vc-btn-sm">
                            {allDone ? 'Fechar' : 'Cancelar'}
                        </button>
                        {!allDone && items.length > 0 && (
                            <button onClick={handleSubmit} disabled={submitting || !allValid} className="vc-btn vc-btn-primary vc-btn-sm" style={{ opacity: !allValid || submitting ? 0.5 : 1 }}>
                                {submitting
                                    ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Agendando...</>
                                    : <><Calendar size={13} />
                                        {items.length > 1 || activeAccounts.length > 1
                                            ? `Agendar ${items.length * activeAccounts.length} publicações`
                                            : 'Agendar vídeo'
                                        }
                                    </>
                                }
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
