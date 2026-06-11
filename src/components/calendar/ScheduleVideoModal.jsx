import React, { useState, useRef, useMemo } from 'react';
import {
    X, Clock, Upload, Video, Settings, Eye, EyeOff,
    Globe, Lock, Sparkles, FileVideo, Trash2, AlertCircle,
    MapPin, Loader2, CheckCircle, Zap, Calendar
} from 'lucide-react';

// ─── Dados ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLocalTimezone() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONES.find(t => t.value === tz) ? tz : 'America/Sao_Paulo';
}

function isValidFuture(date, time) {
    const dt = new Date(`${date}T${time}:00`);
    return dt > new Date(Date.now() + 5 * 60 * 1000);
}

function formatDateTime(date, time, tz) {
    return new Date(`${date}T${time}:00`).toLocaleString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long',
        hour: '2-digit', minute: '2-digit', timeZone: tz,
    });
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SectionLabel({ children }) {
    return (
        <div className="vc-metric-label" style={{ marginBottom: 8 }}>{children}</div>
    );
}

function ModalInput({ value, onChange, placeholder, className = '', style = {} }) {
    return (
        <input
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`vc-input ${className}`}
            style={style}
        />
    );
}

// ─── AI Generate Button ───────────────────────────────────────────────────────

function AIGenerateButton({ onClick, loading, disabled }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px',
                background: loading ? 'var(--bg-elevated)' : 'var(--accent-coral-3)',
                border: '1px solid rgba(232,65,42,0.25)',
                borderRadius: 'var(--radius-sm)',
                color: loading ? 'var(--text-muted)' : 'var(--accent-coral-2)',
                fontSize: '0.6875rem', fontWeight: 600,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.04em', textTransform: 'uppercase',
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                opacity: disabled ? 0.45 : 1,
            }}
        >
            {loading
                ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
                : <><Zap size={11} /> Otimizar com IA</>
            }
        </button>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function ScheduleVideoModal({ isOpen, onClose, selectedDate, onSchedule }) {
    const emptyForm = {
        title: '', description: '', tags: '',
        platform: 'youtube-shorts', privacyStatus: 'public',
        scheduledDate: selectedDate || new Date().toISOString().split('T')[0],
        scheduledTime: '12:00', timezone: getLocalTimezone(),
        useNativeScheduling: true, file: null,
    };

    const [form, setForm] = useState(emptyForm);
    const [dragActive, setDragActive] = useState(false);
    const [validationErr, setValidErr] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    // Track which step is active for guided flow
    const [step, setStep] = useState(1); // 1=arquivo 2=metadados 3=agendamento
    const fileRef = useRef(null);

    const minDate = useMemo(() => new Date().toISOString().split('T')[0], []);
    const maxDate = useMemo(() => {
        const d = new Date(); d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().split('T')[0];
    }, []);

    React.useEffect(() => {
        if (selectedDate) setForm(p => ({ ...p, scheduledDate: selectedDate }));
    }, [selectedDate]);

    if (!isOpen) return null;

    const set = (field, value) => {
        setForm(p => ({ ...p, [field]: value }));
        setValidErr('');
    };

    const handleFile = (file) => {
        if (file?.type.startsWith('video/')) {
            setForm(p => ({ ...p, file, title: p.title || file.name.replace(/\.[^/.]+$/, '') }));
            setStep(2); // avança passo ao escolher arquivo
        }
    };

    // Simula chamada de IA — substituir pelo hook real quando disponível
    const handleAIGenerate = async () => {
        if (!form.title && !form.file) return;
        setAiLoading(true);
        await new Promise(r => setTimeout(r, 1200));
        const topic = form.title || form.file?.name?.replace(/\.[^/.]+$/, '') || 'vídeo';
        setForm(p => ({
            ...p,
            description: `Descubra tudo sobre ${topic}! Neste vídeo você vai aprender os principais pontos e dicas exclusivas. Não esqueça de curtir e se inscrever! 🔥`,
            tags: `${topic}, dicas, tutorial, viral, shorts`,
        }));
        setAiLoading(false);
    };

    const isScheduleValid = isValidFuture(form.scheduledDate, form.scheduledTime);

    const handleSubmit = () => {
        if (!form.title) { setValidErr('Título é obrigatório'); return; }
        if (!form.file && form.platform === 'youtube-shorts') { setValidErr('Selecione um arquivo de vídeo'); return; }
        if (!isScheduleValid) { setValidErr('O horário deve ser pelo menos 5 minutos no futuro'); return; }

        const dt = new Date(`${form.scheduledDate}T${form.scheduledTime}:00`);
        onSchedule({
            title: form.title, description: form.description,
            platform: form.platform, scheduledAt: dt.toISOString(),
            publishAt: form.useNativeScheduling ? dt.toISOString() : null,
            privacyStatus: form.privacyStatus,
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            file: form.file, timezone: form.timezone, source: 'scheduled',
        });
        setForm(emptyForm);
        setStep(1);
        setValidErr('');
        onClose();
    };

    // Steps config
    const STEPS = [
        { num: 1, label: 'Arquivo' },
        { num: 2, label: 'Metadados' },
        { num: 3, label: 'Agendamento' },
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            padding: 16,
            animation: 'vc-fade-in 0.2s ease',
        }}>
            <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-elevated)',
                width: '100%', maxWidth: 620,
                maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                animation: 'vc-scale-in 0.2s ease',
            }}>

                {/* ── Header ──────────────────────────────────────── */}
                <div style={{
                    padding: '18px 20px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    flexShrink: 0,
                    position: 'relative',
                }}>
                    {/* Traço coral no topo */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent-coral)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }} />

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                            <h2 style={{
                                margin: '0 0 2px',
                                fontFamily: 'var(--font-display)', fontWeight: 700,
                                fontSize: '1.125rem', letterSpacing: '-0.025em',
                                color: 'var(--text-primary)',
                            }}>Agendar no Pipeline</h2>
                            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                {formatDateTime(form.scheduledDate, form.scheduledTime, form.timezone)}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="vc-btn-icon vc-btn-ghost"
                            style={{ marginTop: -2 }}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Step indicator */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                        {STEPS.map((s) => (
                            <button
                                key={s.num}
                                onClick={() => s.num <= (form.file ? 3 : 1) && setStep(s.num)}
                                style={{
                                    flex: 1, padding: '6px 0', borderRadius: 'var(--radius-sm)',
                                    background: step === s.num ? 'var(--accent-coral-3)' : 'var(--bg-tertiary)',
                                    border: `1px solid ${step === s.num ? 'rgba(232,65,42,0.25)' : 'var(--border-subtle)'}`,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}
                            >
                                <div style={{
                                    fontSize: '0.6875rem', fontWeight: 600,
                                    fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                    color: step === s.num ? 'var(--accent-coral-2)' : 'var(--text-muted)',
                                }}>
                                    {s.num < step
                                        ? <><CheckCircle size={10} style={{ display: 'inline', marginRight: 4 }} />{s.label}</>
                                        : `${s.num}. ${s.label}`
                                    }
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Body ────────────────────────────────────────── */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '20px' }}>

                    {/* ─── Passo 1: Arquivo ─────────────────────── */}
                    {step === 1 && (
                        <div>
                            <SectionLabel>Arquivo de vídeo</SectionLabel>
                            <div
                                onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]); }}
                                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragLeave={() => setDragActive(false)}
                                onClick={() => fileRef.current?.click()}
                                style={{
                                    border: `2px dashed ${dragActive ? 'var(--accent-coral)' : form.file ? 'var(--accent-teal)' : 'var(--border-default)'}`,
                                    borderRadius: 'var(--radius-lg)',
                                    padding: 28, textAlign: 'center', cursor: 'pointer',
                                    background: dragActive ? 'var(--accent-coral-3)' : form.file ? 'var(--accent-teal-3)' : 'var(--bg-tertiary)',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }}
                                    onChange={(e) => handleFile(e.target.files[0])} />

                                {form.file ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: 'var(--radius-md)',
                                            background: 'var(--bg-elevated)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                            <FileVideo size={22} style={{ color: 'var(--accent-teal)' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: '0 0 3px', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                                                {form.file.name}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {(form.file.size / (1024 * 1024)).toFixed(1)} MB
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); set('file', null); setStep(1); }}
                                            className="vc-btn-icon vc-btn-ghost"
                                            style={{ color: 'var(--accent-coral)', flexShrink: 0 }}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{
                                            width: 52, height: 52, borderRadius: 'var(--radius-md)',
                                            background: 'var(--bg-elevated)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto 14px',
                                        }}>
                                            <Upload size={22} style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                        <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                            Arraste o vídeo ou clique para selecionar
                                        </p>
                                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                            MP4, MOV, AVI — máximo 2GB
                                        </p>
                                    </>
                                )}
                            </div>

                            {form.file && (
                                <button
                                    onClick={() => setStep(2)}
                                    className="vc-btn vc-btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}
                                >
                                    Continuar para metadados →
                                </button>
                            )}
                        </div>
                    )}

                    {/* ─── Passo 2: Metadados ───────────────────── */}
                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                            {/* Título com IA */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <SectionLabel>Título *</SectionLabel>
                                    <AIGenerateButton
                                        onClick={handleAIGenerate}
                                        loading={aiLoading}
                                        disabled={!form.file && !form.title}
                                    />
                                </div>
                                <ModalInput
                                    value={form.title}
                                    onChange={(e) => set('title', e.target.value)}
                                    placeholder="Ex: 5 Curiosidades Incríveis Sobre Gatos"
                                />
                            </div>

                            {/* Descrição */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <SectionLabel>Descrição</SectionLabel>
                                    {aiLoading && <span style={{ fontSize: '0.6875rem', color: 'var(--accent-coral-2)', fontFamily: 'var(--font-display)' }}>Gerando...</span>}
                                </div>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => set('description', e.target.value)}
                                    placeholder="Descrição do vídeo... (a IA pode gerar automaticamente)"
                                    rows={3}
                                    className="vc-input"
                                    style={{ resize: 'none', lineHeight: 1.6 }}
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <SectionLabel>Tags</SectionLabel>
                                <ModalInput
                                    value={form.tags}
                                    onChange={(e) => set('tags', e.target.value)}
                                    placeholder="gatos, curiosidades, animais (separadas por vírgula)"
                                />
                                {/* Preview das tags */}
                                {form.tags && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                        {form.tags.split(',').filter(t => t.trim()).map((tag, i) => (
                                            <span key={i} className="vc-badge vc-badge-muted" style={{ textTransform: 'none', letterSpacing: 0 }}>
                                                #{tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Plataformas */}
                            <div>
                                <SectionLabel>Plataforma</SectionLabel>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {PLATFORMS.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => set('platform', p.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                padding: '10px 14px',
                                                background: form.platform === p.id ? 'var(--accent-coral-3)' : 'var(--bg-tertiary)',
                                                border: `1px solid ${form.platform === p.id ? 'rgba(232,65,42,0.25)' : 'var(--border-subtle)'}`,
                                                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            <div className={`vc-platform-dot ${p.dot}`} style={{ width: 10, height: 10 }} />
                                            <span style={{
                                                fontFamily: 'var(--font-display)', fontWeight: 600,
                                                fontSize: '0.875rem', letterSpacing: '-0.01em',
                                                color: form.platform === p.id ? 'var(--accent-coral-2)' : 'var(--text-secondary)',
                                            }}>{p.name}</span>
                                            {form.platform === p.id && (
                                                <CheckCircle size={14} style={{ marginLeft: 'auto', color: 'var(--accent-coral-2)' }} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Privacidade — só YouTube */}
                            {form.platform === 'youtube-shorts' && (
                                <div>
                                    <SectionLabel>Privacidade</SectionLabel>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                                        {PRIVACY_OPTIONS.map(opt => {
                                            const Icon = opt.icon;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => set('privacyStatus', opt.value)}
                                                    style={{
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                                                        padding: '12px 8px',
                                                        background: form.privacyStatus === opt.value ? 'var(--accent-coral-3)' : 'var(--bg-tertiary)',
                                                        border: `1px solid ${form.privacyStatus === opt.value ? 'rgba(232,65,42,0.25)' : 'var(--border-subtle)'}`,
                                                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                    }}
                                                >
                                                    <Icon size={16} style={{ color: form.privacyStatus === opt.value ? 'var(--accent-coral-2)' : 'var(--text-muted)' }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: form.privacyStatus === opt.value ? 'var(--accent-coral-2)' : 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
                                                            {opt.label}
                                                        </div>
                                                        <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: 1 }}>
                                                            {opt.desc}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Agendamento nativo */}
                                    <label style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 12,
                                        marginTop: 12, padding: '12px 14px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={form.useNativeScheduling}
                                            onChange={(e) => set('useNativeScheduling', e.target.checked)}
                                            style={{ marginTop: 2, accentColor: 'var(--accent-coral)', flexShrink: 0 }}
                                        />
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                                <Sparkles size={13} style={{ color: 'var(--accent-coral-2)' }} />
                                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                                    Agendamento nativo do YouTube
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                                                {form.useNativeScheduling
                                                    ? 'Vídeo enviado agora e publicado automaticamente pelo YouTube no horário definido'
                                                    : 'Vídeo fica na fila e é enviado apenas no horário agendado (requer dashboard aberto)'
                                                }
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            <button
                                onClick={() => setStep(3)}
                                disabled={!form.title}
                                className="vc-btn vc-btn-primary"
                                style={{ width: '100%', justifyContent: 'center', opacity: !form.title ? 0.4 : 1 }}
                            >
                                Definir horário →
                            </button>
                        </div>
                    )}

                    {/* ─── Passo 3: Agendamento ─────────────────── */}
                    {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                {/* Data */}
                                <div>
                                    <SectionLabel>Data</SectionLabel>
                                    <input
                                        type="date"
                                        value={form.scheduledDate}
                                        min={minDate} max={maxDate}
                                        onChange={(e) => set('scheduledDate', e.target.value)}
                                        className="vc-input"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>

                                {/* Horário */}
                                <div>
                                    <SectionLabel>Horário</SectionLabel>
                                    <input
                                        type="time"
                                        value={form.scheduledTime}
                                        onChange={(e) => set('scheduledTime', e.target.value)}
                                        className="vc-input"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>

                            {/* Fuso */}
                            <div>
                                <SectionLabel>Fuso horário</SectionLabel>
                                <select
                                    value={form.timezone}
                                    onChange={(e) => set('timezone', e.target.value)}
                                    className="vc-input"
                                    style={{ colorScheme: 'dark' }}
                                >
                                    {TIMEZONES.map(tz => (
                                        <option key={tz.value} value={tz.value}>
                                            {tz.label} (UTC{tz.offset})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Validação */}
                            {!isScheduleValid && (
                                <div className="vc-toast vc-toast-amber" style={{ padding: '10px 14px' }}>
                                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                                    <p style={{ margin: 0, fontSize: '0.8125rem' }}>
                                        O horário deve ser pelo menos 5 minutos no futuro
                                    </p>
                                </div>
                            )}

                            {/* Resumo do agendamento */}
                            {isScheduleValid && (
                                <div style={{
                                    padding: '14px 16px',
                                    background: 'var(--accent-teal-3)',
                                    border: '1px solid rgba(0,201,167,0.2)',
                                    borderRadius: 'var(--radius-md)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <CheckCircle size={14} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--accent-teal)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                            Pronto para agendar
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{form.title}</strong>
                                        {' '}será publicado no{' '}
                                        {PLATFORMS.find(p => p.id === form.platform)?.name}
                                        {' '}em{' '}
                                        <strong style={{ color: 'var(--text-primary)' }}>
                                            {formatDateTime(form.scheduledDate, form.scheduledTime, form.timezone)}
                                        </strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer ──────────────────────────────────────── */}
                <div style={{
                    padding: '14px 20px',
                    borderTop: '1px solid var(--border-subtle)',
                    background: 'var(--bg-tertiary)',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                    {/* Erro de validação */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {validationErr ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertCircle size={14} style={{ color: 'var(--accent-coral)', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.8125rem', color: 'var(--accent-coral)' }}>{validationErr}</span>
                            </div>
                        ) : step === 3 && form.file ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-teal)', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {(form.file.size / (1024 * 1024)).toFixed(1)} MB · {PLATFORMS.find(p => p.id === form.platform)?.name}
                                </span>
                            </div>
                        ) : null}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        {step > 1 && (
                            <button onClick={() => setStep(s => s - 1)} className="vc-btn vc-btn-secondary vc-btn-sm">
                                ← Voltar
                            </button>
                        )}
                        <button onClick={onClose} className="vc-btn vc-btn-ghost vc-btn-sm">
                            Cancelar
                        </button>
                        {step === 3 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={!form.title || (!form.file && form.platform === 'youtube-shorts') || !isScheduleValid}
                                className="vc-btn vc-btn-primary vc-btn-sm"
                            >
                                <Calendar size={14} /> Agendar
                            </button>
                        ) : (
                            <button
                                onClick={() => setStep(s => Math.min(s + 1, 3))}
                                disabled={step === 1 && !form.file || step === 2 && !form.title}
                                className="vc-btn vc-btn-primary vc-btn-sm"
                            >
                                Próximo →
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScheduleVideoModal;
