import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    X, Upload, FileVideo, Trash2, AlertCircle, Globe, Lock,
    EyeOff, Sparkles, CheckCircle, Zap, Calendar, Plus,
    ChevronDown, ChevronUp, Loader2, Clock
} from 'lucide-react';

// ─── Constantes ───────────────────────────────────────────────────────────────

const PLATFORMS = [
    { id: 'youtube-shorts', name: 'YouTube Shorts', dot: 'youtube' },
    { id: 'tiktok', name: 'TikTok', dot: 'tiktok' },
    { id: 'instagram-reels', name: 'Instagram Reels', dot: 'instagram' },
];

const PRIVACY_OPTIONS = [
    { value: 'public', label: 'Público', icon: Globe, desc: 'Visível para todos' },
    { value: 'unlisted', label: 'Não listado', icon: EyeOff, desc: 'Apenas com link' },
    { value: 'private', label: 'Privado', icon: Lock, desc: 'Apenas você' },
];

const TIMEZONES = [
    { value: 'America/Sao_Paulo', label: 'Brasília (BRT)', offset: '-03:00' },
    { value: 'America/Manaus', label: 'Manaus (AMT)', offset: '-04:00' },
    { value: 'America/Rio_Branco', label: 'Rio Branco (ACT)', offset: '-05:00' },
    { value: 'America/New_York', label: 'Nova York (EST)', offset: '-05:00' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)', offset: '-08:00' },
    { value: 'Europe/London', label: 'Londres (GMT)', offset: '+00:00' },
    { value: 'Europe/Paris', label: 'Paris (CET)', offset: '+01:00' },
    { value: 'Asia/Tokyo', label: 'Tóquio (JST)', offset: '+09:00' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLocalTimezone() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONES.find(t => t.value === tz) ? tz : 'America/Sao_Paulo';
}

function isValidFuture(date, time) {
    if (!date || !time) return false;
    return new Date(`${date}T${time}:00`) > new Date(Date.now() + 5 * 60 * 1000);
}

function todayStr() { return localDateStr(new Date()); }
function maxDateStr() {
    const d = new Date(); d.setFullYear(d.getFullYear() + 1);
    return localDateStr(d);
}

// Dado um array de vídeos, gera horários espaçados de 30min a partir de agora
// Formata data como YYYY-MM-DD em horário LOCAL (evita virar UTC e mudar o dia)
function localDateStr(dt) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function localTimeStr(dt) {
    const h = String(dt.getHours()).padStart(2, '0');
    const min = String(dt.getMinutes()).padStart(2, '0');
    return `${h}:${min}`;
}

function suggestTimes(count, baseDate, baseTime) {
    const results = [];
    let dt = baseDate && baseTime
        ? new Date(`${baseDate}T${baseTime}:00`)
        : new Date(Date.now() + 10 * 60 * 1000);

    for (let i = 0; i < count; i++) {
        if (i > 0) dt = new Date(dt.getTime() + 30 * 60 * 1000);
        results.push({
            date: localDateStr(dt),   // local, não UTC
            time: localTimeStr(dt),
        });
    }
    return results;
}

function makeVideoItem(file) {
    return {
        id: crypto.randomUUID(),
        file,
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        tags: '',
        platform: 'youtube-shorts',
        privacyStatus: 'public',
        publishNow: false,
        scheduledDate: todayStr(),
        scheduledTime: '12:00',
        timezone: getLocalTimezone(),
        useNativeScheduling: true,
        // estados de UI
        expanded: true,
        aiLoading: false,
        status: 'idle', // idle | submitting | done | error
        error: null,
    };
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SectionLabel({ children }) {
    return <div className="vc-metric-label" style={{ marginBottom: 6 }}>{children}</div>;
}

function AIButton({ onClick, loading, disabled }) {
    return (
        <button type="button" onClick={onClick} disabled={disabled || loading} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px',
            background: loading ? 'var(--bg-elevated)' : 'var(--accent-coral-3)',
            border: '1px solid rgba(232,65,42,0.25)',
            borderRadius: 'var(--radius-sm)',
            color: loading ? 'var(--text-muted)' : 'var(--accent-coral-2)',
            fontSize: '0.625rem', fontWeight: 700,
            fontFamily: 'var(--font-display)', letterSpacing: '0.06em',
            textTransform: 'uppercase', cursor: disabled || loading ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.45 : 1, transition: 'all 0.15s',
        }}>
            {loading
                ? <><Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
                : <><Zap size={10} /> IA</>
            }
        </button>
    );
}

// ─── Card de um vídeo ─────────────────────────────────────────────────────────

function VideoCard({ item, index, total, onUpdate, onRemove }) {
    const set = (field, value) => onUpdate(item.id, field, value);

    const statusColors = {
        idle: null,
        submitting: 'var(--accent-amber)',
        done: 'var(--accent-teal)',
        error: 'var(--accent-coral)',
    };

    const borderColor = statusColors[item.status]
        ? `1px solid ${statusColors[item.status]}33`
        : '1px solid var(--border-default)';

    const isScheduleValid = item.publishNow || isValidFuture(item.scheduledDate, item.scheduledTime);

    return (
        <div style={{
            border: borderColor,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-tertiary)',
            overflow: 'hidden',
            transition: 'border-color 0.2s',
        }}>
            {/* Card header — sempre visível */}
            <div
                onClick={() => set('expanded', !item.expanded)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', cursor: 'pointer',
                    background: item.status === 'done' ? 'var(--accent-teal-3)'
                        : item.status === 'error' ? 'var(--accent-coral-3)'
                            : 'transparent',
                }}
            >
                {/* Thumb */}
                <div style={{
                    width: 44, height: 25, borderRadius: 4, flexShrink: 0,
                    background: 'var(--bg-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {item.status === 'submitting'
                        ? <Loader2 size={13} style={{ color: 'var(--accent-amber)', animation: 'spin 1s linear infinite' }} />
                        : item.status === 'done'
                            ? <CheckCircle size={13} style={{ color: 'var(--accent-teal)' }} />
                            : item.status === 'error'
                                ? <AlertCircle size={13} style={{ color: 'var(--accent-coral)' }} />
                                : <FileVideo size={13} style={{ color: 'var(--text-muted)' }} />
                    }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                        margin: 0, fontSize: '0.8125rem', fontWeight: 600,
                        fontFamily: 'var(--font-display)', letterSpacing: '-0.01em',
                        color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {item.title || item.file.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                        {!item.publishNow && item.scheduledDate && (
                            <>
                                <span style={{ color: 'var(--border-default)' }}>·</span>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                    {new Date(`${item.scheduledDate}T${item.scheduledTime}:00`).toLocaleString('pt-BR', {
                                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                                    })}
                                </span>
                            </>
                        )}
                        {item.publishNow && (
                            <span className="vc-badge vc-badge-amber" style={{ fontSize: '0.5rem' }}>Agora</span>
                        )}
                        {item.status === 'error' && item.error && (
                            <span style={{ fontSize: '0.6875rem', color: 'var(--accent-coral)' }}>{item.error}</span>
                        )}
                    </div>
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {item.status === 'idle' && (
                        <button
                            onClick={e => { e.stopPropagation(); onRemove(item.id); }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, borderRadius: 4 }}
                        >
                            <Trash2 size={13} />
                        </button>
                    )}
                    {item.status === 'idle' && (
                        item.expanded
                            ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
                            : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                    )}
                </div>
            </div>

            {/* Corpo expansível — só para itens em idle */}
            {item.expanded && item.status === 'idle' && (
                <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 2 }} />

                    {/* Título */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <SectionLabel>Título *</SectionLabel>
                            <AIButton
                                onClick={async () => {
                                    set('aiLoading', true);
                                    await new Promise(r => setTimeout(r, 1000));
                                    const topic = item.title || item.file.name.replace(/\.[^/.]+$/, '');
                                    set('description', `Descubra tudo sobre ${topic}! Dicas exclusivas e conteúdo incrível. Curta e inscreva-se! 🔥`);
                                    set('tags', `${topic}, dicas, viral, shorts`);
                                    set('aiLoading', false);
                                }}
                                loading={item.aiLoading}
                                disabled={false}
                            />
                        </div>
                        <input
                            value={item.title}
                            onChange={e => set('title', e.target.value)}
                            placeholder="Título do vídeo"
                            className="vc-input"
                            style={{ fontSize: '0.875rem' }}
                        />
                    </div>

                    {/* Descrição */}
                    <div>
                        <SectionLabel>Descrição</SectionLabel>
                        <textarea
                            value={item.description}
                            onChange={e => set('description', e.target.value)}
                            placeholder="Descrição..."
                            rows={2}
                            className="vc-input"
                            style={{ resize: 'none', fontSize: '0.875rem', lineHeight: 1.5 }}
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <SectionLabel>Tags</SectionLabel>
                        <input
                            value={item.tags}
                            onChange={e => set('tags', e.target.value)}
                            placeholder="tag1, tag2, tag3"
                            className="vc-input"
                            style={{ fontSize: '0.875rem' }}
                        />
                    </div>

                    {/* Plataforma + Privacidade — linha */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                            <SectionLabel>Plataforma</SectionLabel>
                            <select
                                value={item.platform}
                                onChange={e => set('platform', e.target.value)}
                                className="vc-input"
                                style={{ fontSize: '0.8125rem', colorScheme: 'dark' }}
                            >
                                {PLATFORMS.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <SectionLabel>Privacidade</SectionLabel>
                            <select
                                value={item.privacyStatus}
                                onChange={e => set('privacyStatus', e.target.value)}
                                className="vc-input"
                                style={{ fontSize: '0.8125rem', colorScheme: 'dark' }}
                            >
                                {PRIVACY_OPTIONS.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Publicar agora vs Agendar */}
                    <div>
                        <SectionLabel>Quando publicar</SectionLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {[
                                { key: false, icon: <Calendar size={14} />, label: 'Agendar', color: 'coral' },
                                { key: true, icon: <Zap size={14} />, label: 'Agora', color: 'amber' },
                            ].map(opt => (
                                <button
                                    key={String(opt.key)}
                                    onClick={() => set('publishNow', opt.key)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        padding: '7px',
                                        borderRadius: 'var(--radius-md)',
                                        background: item.publishNow === opt.key
                                            ? opt.color === 'coral' ? 'var(--accent-coral-3)' : 'var(--accent-amber-3)'
                                            : 'var(--bg-elevated)',
                                        border: `1px solid ${item.publishNow === opt.key
                                            ? opt.color === 'coral' ? 'rgba(232,65,42,0.25)' : 'rgba(240,165,0,0.25)'
                                            : 'var(--border-subtle)'}`,
                                        cursor: 'pointer', transition: 'all 0.15s',
                                        color: item.publishNow === opt.key
                                            ? opt.color === 'coral' ? 'var(--accent-coral-2)' : 'var(--accent-amber)'
                                            : 'var(--text-muted)',
                                        fontSize: '0.8125rem', fontWeight: 600,
                                        fontFamily: 'var(--font-display)', letterSpacing: '-0.01em',
                                    }}
                                >
                                    {opt.icon} {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Data/hora — só se agendar */}
                    {!item.publishNow && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <SectionLabel>Data</SectionLabel>
                                <input
                                    type="date"
                                    value={item.scheduledDate}
                                    min={todayStr()} max={maxDateStr()}
                                    onChange={e => set('scheduledDate', e.target.value)}
                                    className="vc-input"
                                    style={{ fontSize: '0.875rem', colorScheme: 'dark' }}
                                />
                            </div>
                            <div>
                                <SectionLabel>Horário</SectionLabel>
                                <input
                                    type="time"
                                    value={item.scheduledTime}
                                    onChange={e => set('scheduledTime', e.target.value)}
                                    className="vc-input"
                                    style={{ fontSize: '0.875rem', colorScheme: 'dark' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Aviso horário inválido */}
                    {!item.publishNow && !isScheduleValid && item.scheduledDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertCircle size={12} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
                                Horário deve ser pelo menos 5 minutos no futuro
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Zona de drop ─────────────────────────────────────────────────────────────

function DropZone({ onFiles }) {
    const [drag, setDrag] = useState(false);
    const ref = useRef(null);

    const handleFiles = (files) => {
        const videos = Array.from(files).filter(f => f.type.startsWith('video/'));
        if (videos.length) onFiles(videos);
    };

    return (
        <div
            onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onClick={() => ref.current?.click()}
            style={{
                border: `2px dashed ${drag ? 'var(--accent-coral)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: drag ? 'var(--accent-coral-3)' : 'var(--bg-tertiary)',
                transition: 'all 0.15s',
            }}
        >
            <input ref={ref} type="file" accept="video/*" multiple style={{ display: 'none' }}
                onChange={e => handleFiles(e.target.files)} />
            <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: 'var(--bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px',
            }}>
                <Plus size={20} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Adicionar mais vídeos
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Arraste ou clique · MP4, MOV, AVI
            </p>
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function ScheduleVideoModal({ isOpen, onClose, selectedDate, onSchedule }) {
    const [items, setItems] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const fileRef = useRef(null);

    // Reset ao abrir
    React.useEffect(() => {
        if (isOpen) {
            setItems([]);
            setGlobalError('');
            setSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // ── Adicionar arquivos ──────────────────────────────────────────────────
    const addFiles = useCallback((files) => {
        const newItems = Array.from(files)
            .filter(f => f.type.startsWith('video/'))
            .map(f => {
                const item = makeVideoItem(f);
                return item;
            });

        setItems(prev => {
            const all = [...prev, ...newItems];
            // Sugerir horários espaçados de 30min para os novos itens
            const baseItem = all.find(i => i.scheduledDate && i.scheduledTime);
            const times = suggestTimes(
                all.length,
                selectedDate
                    ? (typeof selectedDate === 'string' ? selectedDate : selectedDate.toISOString().split('T')[0])
                    : baseItem?.scheduledDate,
                baseItem?.scheduledTime,
            );
            return all.map((item, idx) => ({
                ...item,
                scheduledDate: times[idx]?.date || item.scheduledDate,
                scheduledTime: times[idx]?.time || item.scheduledTime,
                expanded: idx === all.length - newItems.length, // expande apenas o primeiro novo
            }));
        });
    }, [selectedDate]);

    // ── Atualizar campo de um item ──────────────────────────────────────────
    const updateItem = useCallback((id, field, value) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    }, []);

    // ── Remover item ────────────────────────────────────────────────────────
    const removeItem = useCallback((id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    }, []);

    // ── Validação geral ─────────────────────────────────────────────────────
    const allValid = useMemo(() => {
        if (items.length === 0) return false;
        return items.every(item => {
            if (!item.title) return false;
            if (item.publishNow) return true;
            return isValidFuture(item.scheduledDate, item.scheduledTime);
        });
    }, [items]);

    const invalidItems = useMemo(() =>
        items.filter(item => !item.title || (!item.publishNow && !isValidFuture(item.scheduledDate, item.scheduledTime)))
        , [items]);

    // ── Submit — envia todos em paralelo ────────────────────────────────────
    const handleSubmitAll = async () => {
        if (!allValid) {
            setGlobalError(`${invalidItems.length} vídeo(s) com dados incompletos ou horário inválido`);
            // Expande os inválidos para o usuário ver
            setItems(prev => prev.map(item => {
                const invalid = !item.title || (!item.publishNow && !isValidFuture(item.scheduledDate, item.scheduledTime));
                return invalid ? { ...item, expanded: true } : item;
            }));
            return;
        }

        setSubmitting(true);
        setGlobalError('');

        // Marca todos como "submitting"
        setItems(prev => prev.map(i => ({ ...i, status: 'submitting', expanded: false })));

        // Envia em paralelo
        await Promise.all(
            items.map(async (item) => {
                try {
                    // Constrói datetime em horário LOCAL explicitamente (evita ambiguidade UTC)
                    const [yr, mo, dy] = item.scheduledDate.split('-').map(Number);
                    const [hr, mn] = item.scheduledTime.split(':').map(Number);
                    const dt = item.publishNow ? new Date() : new Date(yr, mo - 1, dy, hr, mn, 0);
                    await onSchedule({
                        title: item.title,
                        description: item.description,
                        platform: item.platform,
                        scheduledAt: item.publishNow ? null : dt.toISOString(),
                        publishAt: item.publishNow ? null : (item.useNativeScheduling ? dt.toISOString() : null),
                        privacyStatus: item.privacyStatus,
                        tags: item.tags.split(',').map(t => t.trim()).filter(Boolean),
                        file: item.file,
                        timezone: item.timezone,
                        source: item.publishNow ? 'immediate' : 'scheduled',
                        publishNow: item.publishNow,
                    });
                    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'done' } : i));
                } catch (err) {
                    setItems(prev => prev.map(i => i.id === item.id
                        ? { ...i, status: 'error', error: err?.message || 'Erro ao agendar', expanded: true }
                        : i
                    ));
                }
            })
        );

        setSubmitting(false);

        // Se todos foram com sucesso, fecha após 1.5s
        setItems(prev => {
            const allDone = prev.every(i => i.status === 'done');
            if (allDone) {
                setTimeout(() => onClose(), 1500);
            }
            return prev;
        });
    };

    const doneCount = items.filter(i => i.status === 'done').length;
    const errorCount = items.filter(i => i.status === 'error').length;
    const allDone = items.length > 0 && doneCount === items.length;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            padding: 16, animation: 'vc-fade-in 0.2s ease',
        }}>
            <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-elevated)',
                width: '100%', maxWidth: 640,
                maxHeight: '92vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                animation: 'vc-scale-in 0.2s ease',
            }}>

                {/* Header */}
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
                    flexShrink: 0, position: 'relative',
                }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent-coral)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h2 style={{ margin: '0 0 2px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.0625rem', letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>
                                Agendar no Pipeline
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {items.length === 0
                                    ? 'Selecione um ou mais vídeos'
                                    : `${items.length} vídeo${items.length > 1 ? 's' : ''} · ${doneCount} agendado${doneCount !== 1 ? 's' : ''}`
                                }
                            </p>
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: 6, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '16px' }}>

                    {/* Drop zone inicial — quando não há vídeos */}
                    {items.length === 0 && (
                        <div
                            onDrop={e => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); }}
                            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={() => setDragActive(false)}
                            onClick={() => fileRef.current?.click()}
                            style={{
                                border: `2px dashed ${dragActive ? 'var(--accent-coral)' : 'var(--border-default)'}`,
                                borderRadius: 'var(--radius-lg)',
                                padding: '40px 24px', textAlign: 'center',
                                cursor: 'pointer',
                                background: dragActive ? 'var(--accent-coral-3)' : 'var(--bg-tertiary)',
                                transition: 'all 0.15s',
                            }}
                        >
                            <input ref={fileRef} type="file" accept="video/*" multiple style={{ display: 'none' }}
                                onChange={e => addFiles(e.target.files)} />
                            <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                <Upload size={22} style={{ color: 'var(--text-muted)' }} />
                            </div>
                            <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                Arraste os vídeos ou clique para selecionar
                            </p>
                            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                Selecione múltiplos arquivos de uma vez · MP4, MOV, AVI · máx 2GB cada
                            </p>
                        </div>
                    )}

                    {/* Lista de vídeos */}
                    {items.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {items.map((item, idx) => (
                                <VideoCard
                                    key={item.id}
                                    item={item}
                                    index={idx}
                                    total={items.length}
                                    onUpdate={updateItem}
                                    onRemove={removeItem}
                                />
                            ))}

                            {/* Adicionar mais vídeos — só quando não está enviando */}
                            {!submitting && (
                                <DropZone onFiles={addFiles} />
                            )}
                        </div>
                    )}

                    {/* Estado de sucesso total */}
                    {allDone && (
                        <div style={{
                            marginTop: 12, padding: '14px 16px',
                            background: 'var(--accent-teal-3)',
                            border: '1px solid rgba(0,201,167,0.2)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <CheckCircle size={16} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.01em' }}>
                                {items.length} vídeo{items.length > 1 ? 's' : ''} agendado{items.length > 1 ? 's' : ''} com sucesso!
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border-subtle)',
                    background: 'var(--bg-tertiary)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                    {/* Erro global */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {globalError && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertCircle size={13} style={{ color: 'var(--accent-coral)', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.8125rem', color: 'var(--accent-coral)' }}>{globalError}</span>
                            </div>
                        )}
                        {submitting && !allDone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Loader2 size={13} style={{ color: 'var(--accent-amber)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                    Enviando {doneCount + errorCount}/{items.length}...
                                </span>
                            </div>
                        )}
                        {errorCount > 0 && !submitting && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertCircle size={13} style={{ color: 'var(--accent-coral)', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.8125rem', color: 'var(--accent-coral)' }}>
                                    {errorCount} erro{errorCount > 1 ? 's' : ''} · verifique os itens acima
                                </span>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button onClick={onClose} className="vc-btn vc-btn-ghost vc-btn-sm">
                            {allDone ? 'Fechar' : 'Cancelar'}
                        </button>

                        {!allDone && items.length > 0 && (
                            <button
                                onClick={handleSubmitAll}
                                disabled={submitting || !allValid}
                                className="vc-btn vc-btn-primary vc-btn-sm"
                                style={{ opacity: (!allValid || submitting) ? 0.5 : 1 }}
                            >
                                {submitting ? (
                                    <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Agendando...</>
                                ) : (
                                    <><Calendar size={13} /> Agendar {items.length > 1 ? `${items.length} vídeos` : 'vídeo'}</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScheduleVideoModal;
