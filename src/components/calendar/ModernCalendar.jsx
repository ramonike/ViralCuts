import React, { useState, useMemo, useCallback } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    Video,
    Eye,
    ExternalLink,
    Edit3,
    Trash2,
    CheckCircle2,
    Play
} from 'lucide-react';
import { Button } from '../ui/button';
import { useAnnounce } from '../../hooks/useKeyboardNavigation';
import { PlatformIcon } from '../shared/PlatformIcon';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// ── Helpers ───────────────────────────────────────────────────────────────────

const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
};

const formatViews = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count?.toString() || '0';
};

const getPlatform = (item) =>
    (item?.platform || item?.platforms?.[0] || 'youtube').toLowerCase();

// ── Platform Dots ─────────────────────────────────────────────────────────────

function DayDots({ postedVideos, scheduledVideos }) {
    const platforms = useMemo(() => {
        const map = {};
        postedVideos.forEach(v => {
            const p = getPlatform(v);
            if (!map[p]) map[p] = { platform: p, type: 'posted', count: 0 };
            map[p].count++;
        });
        scheduledVideos.forEach(v => {
            const p = getPlatform(v);
            if (!map[p]) map[p] = { platform: p, type: 'scheduled', count: 0 };
            map[p].count++;
        });
        return Object.values(map).slice(0, 3);
    }, [postedVideos, scheduledVideos]);

    const total = postedVideos.length + scheduledVideos.length;
    const shown = platforms.reduce((s, p) => s + p.count, 0);
    const hidden = total - shown;

    if (platforms.length === 0) return null;

    return (
        <div
            style={{
                position: 'absolute', top: -6, right: -6,
                display: 'flex', alignItems: 'center', gap: 1,
            }}
            aria-hidden="true"
        >
            {platforms.map((p, i) => (
                <div
                    key={i}
                    style={{
                        width: 16, height: 16, borderRadius: '50%',
                        background: p.type === 'posted'
                            ? 'var(--accent-teal, #14b8a6)'
                            : 'var(--accent-coral, #e8412a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        border: '1.5px solid rgba(0,0,0,0.3)',
                    }}
                >
                    <PlatformIcon platform={p.platform} size={9} />
                </div>
            ))}
            {hidden > 0 && (
                <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'var(--bg-elevated, #1e293b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 7, fontWeight: 700, color: 'var(--text-muted)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                }}>
                    +{hidden}
                </div>
            )}
        </div>
    );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const cfg = {
        published: { label: 'Publicado', color: 'var(--accent-teal)' },
        completed: { label: 'Publicado', color: 'var(--accent-teal)' },
        done: { label: 'Publicado', color: 'var(--accent-teal)' },
        success: { label: 'Publicado', color: 'var(--accent-teal)' },
        scheduled: { label: 'Agendado', color: 'var(--accent-coral)' },
        pending: { label: 'Pendente', color: 'var(--accent-amber)' },
        uploading: { label: 'Enviando', color: 'var(--accent-amber)' },
        processing: { label: 'Processando', color: 'var(--accent-amber)' },
        failed: { label: 'Falhou', color: '#ef4444' },
        error: { label: 'Erro', color: '#ef4444' },
    }[status] || { label: status || 'Pendente', color: 'var(--text-muted)' };

    return (
        <span style={{
            fontSize: '0.5625rem', fontWeight: 700, padding: '1px 5px',
            borderRadius: 4, letterSpacing: '0.02em',
            background: `${cfg.color}22`, color: cfg.color,
            border: `1px solid ${cfg.color}44`, whiteSpace: 'nowrap',
        }}>
            {cfg.label}
        </span>
    );
}

// ── Day video row ─────────────────────────────────────────────────────────────

function DayVideoRow({ video, type, onEdit, onDelete, onView }) {
    const platform = getPlatform(video);
    const time = video.scheduledAt || video.publishAt || video.publishedAt;

    return (
        <div
            style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 6,
                transition: 'border-color 0.15s, background 0.15s',
                cursor: 'default',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            }}
        >
            <div style={{
                width: 48, height: 27, borderRadius: 4, flexShrink: 0,
                background: 'var(--bg-elevated)', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {video.thumbnail
                    ? <img src={video.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Video size={12} style={{ color: 'var(--text-muted)' }} />
                }
            </div>

            <div style={{ flexShrink: 0 }}>
                <PlatformIcon platform={platform} size={14} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: 0, fontSize: '0.8rem', fontWeight: 600,
                    fontFamily: 'var(--font-display)', color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    letterSpacing: '-0.01em',
                }}>
                    {video.title || 'Sem título'}
                </p>
                {time && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {new Date(time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>

            <StatusBadge status={video.status || (type === 'posted' ? 'published' : 'scheduled')} />

            <div style={{
                display: 'flex', alignItems: 'center', gap: 2,
                opacity: 0, transition: 'opacity 0.15s',
            }}
                onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = 0; }}
            >
                {type === 'posted' && onView && (
                    <button onClick={() => onView(video)} title="Ver"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: 'var(--text-muted)', display: 'flex' }}>
                        <Play size={11} />
                    </button>
                )}
                {type === 'scheduled' && onEdit && (
                    <button onClick={() => onEdit(video)} title="Editar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: 'var(--text-muted)', display: 'flex' }}>
                        <Edit3 size={11} />
                    </button>
                )}
                {onDelete && (
                    <button onClick={() => onDelete(video.id)} title="Excluir"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: 'var(--text-muted)', display: 'flex' }}>
                        <Trash2 size={11} />
                    </button>
                )}
                {video.url && (
                    <a href={video.url} target="_blank" rel="noopener noreferrer" title="Abrir"
                        style={{ padding: 3, color: 'var(--text-muted)', display: 'flex' }}>
                        <ExternalLink size={11} />
                    </a>
                )}
            </div>
        </div>
    );
}

// ── Filter chips ──────────────────────────────────────────────────────────────

function ChannelFilterBar({ channels, activeFilter, onFilterChange, totalVideos }) {
    if (channels.length <= 1) return null;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            flexWrap: 'wrap', marginBottom: 12,
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
        }}>
            <button
                onClick={() => onFilterChange('all')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 20,
                    background: activeFilter === 'all' ? 'var(--accent-coral)' : 'var(--bg-elevated)',
                    border: `1px solid ${activeFilter === 'all' ? 'var(--accent-coral)' : 'var(--border-subtle)'}`,
                    color: activeFilter === 'all' ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.75rem', fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    letterSpacing: '-0.01em',
                }}
            >
                Todos
                <span style={{
                    fontSize: '0.625rem', fontWeight: 700,
                    background: activeFilter === 'all' ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                    padding: '1px 5px', borderRadius: 10,
                    color: activeFilter === 'all' ? '#fff' : 'var(--text-muted)',
                }}>
                    {channels.length}
                </span>
            </button>

            {channels.map(ch => {
                const isActive = activeFilter === ch.id;
                return (
                    <button
                        key={ch.id}
                        onClick={() => onFilterChange(isActive ? 'all' : ch.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px', borderRadius: 20,
                            background: isActive ? 'var(--bg-elevated)' : 'var(--bg-tertiary)',
                            border: `1px solid ${isActive ? 'var(--accent-coral)' : 'var(--border-subtle)'}`,
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontSize: '0.75rem', fontWeight: 600,
                            fontFamily: 'var(--font-display)',
                            cursor: 'pointer', transition: 'all 0.15s',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {ch.avatar ? (
                            <img src={ch.avatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{
                                width: 18, height: 18, borderRadius: '50%',
                                background: 'var(--accent-coral-3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.5625rem', fontWeight: 700, color: 'var(--accent-coral)',
                            }}>
                                {(ch.name || '?')[0].toUpperCase()}
                            </div>
                        )}
                        <span style={{
                            maxWidth: 90, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {ch.name}
                        </span>
                        <PlatformIcon platform={ch.platform || 'youtube'} size={11} />
                    </button>
                );
            })}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ModernCalendar({
    history = {},
    uploadQueue = [],
    onScheduleVideo,
    onEditVideo,
    onDeleteVideo,
    onViewVideo,
    // novas props
    channelFilter = [],
    activeFilter = 'all',
    onFilterChange,
    loading = false,
}) {
    const [currentDate, setCurrentDate] = useState(new Date(new Date().toLocaleDateString('en-CA')));
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));

    const announce = useAnnounce();

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const navigatePrevious = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const navigateNext = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const goToToday = () => {
        const today = new Date(new Date().toLocaleDateString('en-CA'));
        setCurrentDate(today);
        setSelectedDate(toLocalDateStr(today));
    };

    const calendarData = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days = [];
        const current = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            const dateStr = toLocalDateStr(current);
            const dayData = history[dateStr] || {};

            const postedVideos = (dayData.completedItems || [])
                .filter(item => item.type === 'youtube_video' || item.type === undefined || item.publishedAt)
                .map(item => ({ ...item, platform: item.platform || 'youtube' }));

            const scheduledVideos = uploadQueue.filter(item => {
                const raw = item.scheduledAt || item.publishAt;
                if (!raw) return false;
                return toLocalDateStr(new Date(raw)) === dateStr;
            });

            days.push({
                date: new Date(current),
                dateStr,
                isCurrentMonth: current.getMonth() === currentMonth,
                isToday: dateStr === toLocalDateStr(new Date()),
                isSelected: dateStr === selectedDate,
                postedVideos,
                scheduledVideos,
                hasActivity: postedVideos.length + scheduledVideos.length > 0,
            });

            current.setDate(current.getDate() + 1);
        }

        return days;
    }, [currentYear, currentMonth, selectedDate, history, uploadQueue]);

    const selectedDayData = calendarData.find(day => day.dateStr === selectedDate);

    const handleCalendarKeyDown = useCallback((event, dayIndex) => {
        const day = calendarData[dayIndex];
        if (!day) return;
        let newIndex = dayIndex;
        let handled = false;
        switch (event.key) {
            case 'ArrowRight': newIndex = dayIndex + 1; handled = true; break;
            case 'ArrowLeft': newIndex = dayIndex - 1; handled = true; break;
            case 'ArrowDown': newIndex = dayIndex + 7; handled = true; break;
            case 'ArrowUp': newIndex = dayIndex - 7; handled = true; break;
            case 'Enter': case ' ':
                event.preventDefault();
                setSelectedDate(day.dateStr);
                return;
            default: return;
        }
        if (handled) {
            event.preventDefault();
            if (newIndex >= 0 && newIndex < calendarData.length) {
                const buttons = event.currentTarget.parentElement.querySelectorAll('button[data-calendar-day]');
                if (buttons[newIndex]) buttons[newIndex].focus();
            }
        }
    }, [calendarData]);

    return (
        <div
            style={{
                background: 'linear-gradient(135deg, rgba(15,20,35,0.98), rgba(20,25,40,0.98))',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
            }}
            role="application"
            aria-label="Calendário de agendamentos"
        >
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(30,40,70,0.6), rgba(40,30,70,0.4))',
                borderBottom: '1px solid var(--border-subtle)',
                padding: '16px 20px 12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <CalendarIcon size={15} color="#fff" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                                Calendário
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                Agendamentos e histórico
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={goToToday}
                        size="sm"
                        variant="outline"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                        Hoje
                    </Button>
                </div>

                {/* Channel filter inline */}
                <ChannelFilterBar
                    channels={channelFilter}
                    activeFilter={activeFilter}
                    onFilterChange={onFilterChange}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={navigatePrevious} style={{
                            padding: 6, borderRadius: 6, border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                            cursor: 'pointer', display: 'flex',
                        }}>
                            <ChevronLeft size={13} />
                        </button>
                        <h3 style={{
                            margin: 0, fontSize: '0.875rem', fontWeight: 700,
                            color: 'var(--text-primary)', fontFamily: 'var(--font-display)',
                            minWidth: 130, textAlign: 'center', letterSpacing: '-0.02em',
                        }} aria-live="polite">
                            {MONTHS[currentMonth]} {currentYear}
                        </h3>
                        <button onClick={navigateNext} style={{
                            padding: 6, borderRadius: 6, border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                            cursor: 'pointer', display: 'flex',
                        }}>
                            <ChevronRight size={13} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.6875rem', color: 'var(--text-muted)' }} aria-hidden="true">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-teal)' }} />
                            Publicado
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-coral)' }} />
                            Agendado
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ padding: '16px 20px 20px' }}>
                {/* Grid de dias */}
                <div
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, maxWidth: 360, margin: '0 auto' }}
                    role="grid"
                    aria-labelledby="calendar-title"
                >
                    {WEEKDAYS.map((day, index) => (
                        <div key={day}
                            style={{ textAlign: 'center', fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', paddingBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                            role="columnheader"
                            aria-label={WEEKDAYS_FULL[index]}
                        >
                            {day}
                        </div>
                    ))}

                    {calendarData.map((day, index) => (
                        <button
                            key={index}
                            data-calendar-day
                            onClick={() => {
                                setSelectedDate(day.dateStr);
                                announce(`Selecionado ${day.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`);
                            }}
                            onKeyDown={(e) => handleCalendarKeyDown(e, index)}
                            style={{
                                position: 'relative',
                                width: 44, height: 44,
                                borderRadius: 8,
                                border: day.isSelected
                                    ? '1.5px solid var(--accent-coral)'
                                    : day.isToday
                                        ? '1.5px solid rgba(139,92,246,0.6)'
                                        : '1px solid var(--border-subtle)',
                                background: day.isToday
                                    ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))'
                                    : day.hasActivity
                                        ? 'rgba(20,184,166,0.08)'
                                        : 'var(--bg-tertiary)',
                                opacity: day.isCurrentMonth ? 1 : 0.35,
                                color: day.isToday ? 'var(--text-primary)' : day.hasActivity ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontSize: '0.8125rem', fontWeight: day.isToday || day.isSelected ? 700 : 500,
                                fontFamily: 'var(--font-display)',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                outline: 'none',
                            }}
                            role="gridcell"
                            aria-selected={day.isSelected}
                            aria-current={day.isToday ? 'date' : undefined}
                            tabIndex={day.isSelected ? 0 : -1}
                        >
                            {day.date.getDate()}

                            {day.hasActivity && (
                                <DayDots
                                    postedVideos={day.postedVideos}
                                    scheduledVideos={day.scheduledVideos}
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Day Panel */}
                {selectedDayData && (
                    <div style={{
                        marginTop: 16,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 10,
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border-subtle)',
                            background: 'rgba(255,255,255,0.02)',
                        }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                                    {selectedDayData.date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '')}
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                    {selectedDayData.postedVideos.length + selectedDayData.scheduledVideos.length} vídeos
                                </p>
                            </div>
                            <Button
                                onClick={() => onScheduleVideo?.(selectedDate)}
                                size="sm"
                                style={{ background: 'var(--accent-coral)', color: '#fff', border: 'none', fontSize: '0.75rem', padding: '6px 12px' }}
                            >
                                <Plus size={13} style={{ marginRight: 4 }} />
                                Agendar
                            </Button>
                        </div>

                        <div style={{ padding: '12px 16px', maxHeight: 280, overflowY: 'auto' }}>
                            {selectedDayData.scheduledVideos.length === 0 && selectedDayData.postedVideos.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                    <div style={{ width: 40, height: 40, margin: '0 auto 10px', borderRadius: 10, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CalendarIcon size={18} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <p style={{ margin: '0 0 4px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        Nenhum conteúdo para este dia
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Use o botão Agendar para adicionar
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {selectedDayData.scheduledVideos.length > 0 && (
                                        <div style={{ marginBottom: selectedDayData.postedVideos.length > 0 ? 14 : 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                                <Clock size={12} style={{ color: 'var(--accent-coral)' }} />
                                                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-coral)', fontFamily: 'var(--font-display)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                                                    Agendados ({selectedDayData.scheduledVideos.length})
                                                </span>
                                                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, var(--accent-coral-3), transparent)' }} />
                                            </div>
                                            {selectedDayData.scheduledVideos.map(video => (
                                                <DayVideoRow key={video.id} video={video} type="scheduled"
                                                    onEdit={onEditVideo} onDelete={onDeleteVideo} />
                                            ))}
                                        </div>
                                    )}

                                    {selectedDayData.postedVideos.length > 0 && (
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                                <CheckCircle2 size={12} style={{ color: 'var(--accent-teal)' }} />
                                                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-teal)', fontFamily: 'var(--font-display)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                                                    Publicados ({selectedDayData.postedVideos.length})
                                                </span>
                                                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(20,184,166,0.3), transparent)' }} />
                                            </div>
                                            {selectedDayData.postedVideos.map(video => (
                                                <DayVideoRow key={video.id} video={video} type="posted"
                                                    onEdit={onEditVideo} onDelete={onDeleteVideo} onView={onViewVideo} />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
