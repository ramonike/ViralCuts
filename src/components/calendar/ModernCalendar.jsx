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
    Upload,
    CheckCircle2,
    AlertCircle,
    Play
} from 'lucide-react';
import { Button } from '../ui/button';
import { useKeyboardNavigation, useAnnounce } from '../../hooks/useKeyboardNavigation';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function ModernCalendar({ 
    history = {}, 
    uploadQueue = [], 
    onScheduleVideo,
    onEditVideo,
    onDeleteVideo,
    onViewVideo 
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'
    
    const announce = useAnnounce();

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Navigation functions
    const navigatePrevious = () => {
        if (viewMode === 'month') {
            setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
            announce(`Navegando para ${MONTHS[currentMonth - 1 < 0 ? 11 : currentMonth - 1]}`);
        } else if (viewMode === 'week') {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() - 7);
            setCurrentDate(newDate);
        } else {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() - 1);
            setCurrentDate(newDate);
        }
    };

    const navigateNext = () => {
        if (viewMode === 'month') {
            setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
            announce(`Navegando para ${MONTHS[(currentMonth + 1) % 12]}`);
        } else if (viewMode === 'week') {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + 7);
            setCurrentDate(newDate);
        } else {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + 1);
            setCurrentDate(newDate);
        }
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today.toISOString().split('T')[0]);
        announce('Navegando para hoje');
    };

    // Get calendar data
    const calendarData = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const days = [];
        const current = new Date(startDate);
        
        for (let i = 0; i < 42; i++) {
            const dateStr = current.toISOString().split('T')[0];
            const dayData = history[dateStr] || {};
            const scheduledVideos = uploadQueue.filter(item => {
                const itemDate = new Date(item.scheduledAt || item.publishAt);
                return itemDate.toISOString().split('T')[0] === dateStr;
            });
            
            days.push({
                date: new Date(current),
                dateStr,
                isCurrentMonth: current.getMonth() === currentMonth,
                isToday: dateStr === new Date().toISOString().split('T')[0],
                isSelected: dateStr === selectedDate,
                postedVideos: dayData.completedItems?.filter(item => item.type === 'youtube_video') || [],
                scheduledVideos,
                hasActivity: (dayData.completedItems?.length || 0) + scheduledVideos.length > 0
            });
            
            current.setDate(current.getDate() + 1);
        }
        
        return days;
    }, [currentYear, currentMonth, selectedDate, history, uploadQueue]);

    const selectedDayData = calendarData.find(day => day.dateStr === selectedDate);

    const formatViews = (count) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count?.toString() || '0';
    };

    // Keyboard navigation for calendar grid
    const handleCalendarKeyDown = useCallback((event, dayIndex) => {
        const day = calendarData[dayIndex];
        if (!day) return;

        let newIndex = dayIndex;
        let handled = false;

        switch (event.key) {
            case 'ArrowRight':
                newIndex = dayIndex + 1;
                handled = true;
                break;
            case 'ArrowLeft':
                newIndex = dayIndex - 1;
                handled = true;
                break;
            case 'ArrowDown':
                newIndex = dayIndex + 7;
                handled = true;
                break;
            case 'ArrowUp':
                newIndex = dayIndex - 7;
                handled = true;
                break;
            case 'Home':
                newIndex = Math.floor(dayIndex / 7) * 7;
                handled = true;
                break;
            case 'End':
                newIndex = Math.floor(dayIndex / 7) * 7 + 6;
                handled = true;
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                setSelectedDate(day.dateStr);
                announce(`Selecionado ${day.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`);
                return;
            default:
                return;
        }

        if (handled) {
            event.preventDefault();
            if (newIndex >= 0 && newIndex < calendarData.length) {
                const buttons = event.currentTarget.parentElement.querySelectorAll('button[data-calendar-day]');
                if (buttons[newIndex]) {
                    buttons[newIndex].focus();
                }
            }
        }
    }, [calendarData, announce]);

    // Generate aria-label for day
    const getDayAriaLabel = (day) => {
        const dateLabel = day.date.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long',
            year: 'numeric'
        });
        
        const parts = [dateLabel];
        
        if (day.isToday) parts.push('hoje');
        if (day.postedVideos.length > 0) {
            parts.push(`${day.postedVideos.length} vídeo${day.postedVideos.length > 1 ? 's' : ''} publicado${day.postedVideos.length > 1 ? 's' : ''}`);
        }
        if (day.scheduledVideos.length > 0) {
            parts.push(`${day.scheduledVideos.length} vídeo${day.scheduledVideos.length > 1 ? 's' : ''} agendado${day.scheduledVideos.length > 1 ? 's' : ''}`);
        }
        
        return parts.join(', ');
    };

    return (
        <div 
            className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden shadow-xl"
            role="application"
            aria-label="Calendário de agendamentos"
        >
            {/* Compact Header */}
            <div className="bg-gradient-to-r from-blue-900/30 via-purple-900/20 to-blue-900/30 border-b border-slate-700/50 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center" aria-hidden="true">
                            <CalendarIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white" id="calendar-title">Calendário</h2>
                            <p className="text-xs text-slate-400">Agendamentos e histórico</p>
                        </div>
                    </div>
                    
                    <Button
                        onClick={goToToday}
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-xs px-2 py-1"
                        aria-label="Ir para hoje"
                    >
                        Hoje
                    </Button>
                </div>

                {/* Compact Navigation */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2" role="group" aria-label="Navegação do calendário">
                        <button
                            onClick={navigatePrevious}
                            className="p-1.5 rounded-md bg-slate-800/50 border border-slate-600/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                            aria-label={`Mês anterior, ${MONTHS[currentMonth - 1 < 0 ? 11 : currentMonth - 1]}`}
                        >
                            <ChevronLeft className="w-3 h-3" aria-hidden="true" />
                        </button>
                        
                        <h3 
                            className="text-sm font-bold text-white min-w-[140px] text-center"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {MONTHS[currentMonth]} {currentYear}
                        </h3>
                        
                        <button
                            onClick={navigateNext}
                            className="p-1.5 rounded-md bg-slate-800/50 border border-slate-600/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                            aria-label={`Próximo mês, ${MONTHS[(currentMonth + 1) % 12]}`}
                        >
                            <ChevronRight className="w-3 h-3" aria-hidden="true" />
                        </button>
                    </div>

                    {/* Compact Legend */}
                    <div className="flex items-center gap-2 text-[10px]" aria-hidden="true">
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                            <span className="text-slate-400">Publicado</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                            <span className="text-slate-400">Agendado</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4">
                {viewMode === 'month' && (
                    <div 
                        className="grid grid-cols-7 gap-1.5 max-w-sm mx-auto"
                        role="grid"
                        aria-labelledby="calendar-title"
                    >
                        {/* Weekday Headers */}
                        <div role="row" className="contents">
                            {WEEKDAYS.map((day, index) => (
                                <div 
                                    key={day} 
                                    className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider py-1.5"
                                    role="columnheader"
                                    aria-label={WEEKDAYS_FULL[index]}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>
                        
                        {/* Calendar Days */}
                        {calendarData.map((day, index) => (
                            <button
                                key={index}
                                data-calendar-day
                                onClick={() => {
                                    setSelectedDate(day.dateStr);
                                    announce(`Selecionado ${day.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`);
                                }}
                                onKeyDown={(e) => handleCalendarKeyDown(e, index)}
                                className={`
                                    relative w-10 h-10 rounded-md border transition-all duration-200 hover:scale-110 group text-xs font-medium
                                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900
                                    ${day.isCurrentMonth ? 'opacity-100' : 'opacity-40'}
                                    ${day.isToday 
                                        ? 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 border-purple-400 shadow-sm text-white' 
                                        : day.hasActivity
                                            ? 'bg-gradient-to-br from-green-500/15 to-blue-500/15 border-green-400/50 text-green-300'
                                            : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600 text-slate-300'
                                    }
                                    ${day.isSelected ? 'ring-1 ring-blue-400' : ''}
                                `}
                                role="gridcell"
                                aria-label={getDayAriaLabel(day)}
                                aria-selected={day.isSelected}
                                aria-current={day.isToday ? 'date' : undefined}
                                tabIndex={day.isSelected ? 0 : -1}
                            >
                                <span className="relative z-10" aria-hidden="true">
                                    {day.date.getDate()}
                                </span>
                                
                                {/* Activity Indicators */}
                                <div className="absolute bottom-1 left-1 right-1 flex flex-col gap-0.5" aria-hidden="true">
                                    {day.postedVideos.length > 0 && (
                                        <div className="w-full h-0.5 bg-green-400 rounded-full opacity-80"></div>
                                    )}
                                    {day.scheduledVideos.length > 0 && (
                                        <div className="w-full h-0.5 bg-blue-400 rounded-full opacity-80"></div>
                                    )}
                                </div>
                                
                                {/* Count Badge */}
                                {day.hasActivity && (
                                    <div 
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
                                        aria-hidden="true"
                                    >
                                        {day.postedVideos.length + day.scheduledVideos.length}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Day Details Panel */}
                {selectedDayData && (
                    <div className="mt-4 bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-lg border border-slate-600/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/50 p-3 border-b border-slate-600/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-white text-sm">
                                        {selectedDayData.date.toLocaleDateString('pt-BR', { 
                                            weekday: 'short', 
                                            day: 'numeric', 
                                            month: 'short' 
                                        })}
                                    </h4>
                                    <p className="text-xs text-slate-400">
                                        {selectedDayData.postedVideos.length + selectedDayData.scheduledVideos.length} vídeos
                                    </p>
                                </div>
                                
                                <Button
                                    onClick={() => onScheduleVideo?.(selectedDate)}
                                    size="sm"
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md text-xs px-2 py-1"
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Agendar
                                </Button>
                            </div>
                        </div>

                        <div className="p-3 max-h-48 overflow-y-auto custom-scrollbar">
                            {selectedDayData.scheduledVideos.length === 0 && selectedDayData.postedVideos.length === 0 ? (
                                <div className="text-center py-6">
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
                                        <CalendarIcon className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <p className="text-slate-400 text-sm">Nenhum conteúdo agendado para este dia</p>
                                    <p className="text-slate-500 text-xs mt-1">Use o botão "Agendar" acima para adicionar um vídeo</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Scheduled Videos */}
                                    {selectedDayData.scheduledVideos.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <Clock className="w-3 h-3 text-blue-400" />
                                                <h5 className="font-semibold text-blue-400 text-xs">
                                                    Agendados ({selectedDayData.scheduledVideos.length})
                                                </h5>
                                                <div className="flex-1 h-px bg-gradient-to-r from-blue-400/50 to-transparent"></div>
                                            </div>
                                            
                                            <div className="space-y-1.5">
                                                {selectedDayData.scheduledVideos.map((video, index) => (
                                                    <div key={video.id} className="group bg-slate-800/50 hover:bg-slate-700/50 rounded-md p-2 border border-slate-600/30 hover:border-blue-400/50 transition-all">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
                                                                <Upload className="w-3 h-3 text-blue-400" />
                                                            </div>
                                                            
                                                            <div className="flex-1 min-w-0">
                                                                <h6 className="font-medium text-white text-xs truncate" title={video.title}>
                                                                    {video.title}
                                                                </h6>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className="text-[10px] text-blue-400 font-medium">
                                                                        {new Date(video.scheduledAt || video.publishAt).toLocaleTimeString('pt-BR', { 
                                                                            hour: '2-digit', 
                                                                            minute: '2-digit' 
                                                                        })}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-500">•</span>
                                                                    <span className="text-[10px] text-slate-400">{video.platform}</span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => onEditVideo?.(video)}
                                                                    className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                                                                    title="Editar"
                                                                >
                                                                    <Edit3 className="w-2.5 h-2.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => onDeleteVideo?.(video.id)}
                                                                    className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                                                    title="Excluir"
                                                                >
                                                                    <Trash2 className="w-2.5 h-2.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Posted Videos */}
                                    {selectedDayData.postedVideos.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                                                <h5 className="font-semibold text-green-400 text-xs">
                                                    Publicados ({selectedDayData.postedVideos.length})
                                                </h5>
                                                <div className="flex-1 h-px bg-gradient-to-r from-green-400/50 to-transparent"></div>
                                            </div>
                                            
                                            <div className="space-y-1.5">
                                                {selectedDayData.postedVideos.map((video) => (
                                                    <div key={video.id} className="group bg-slate-800/50 hover:bg-slate-700/50 rounded-md p-2 border border-slate-600/30 hover:border-green-400/50 transition-all cursor-pointer">
                                                        <div className="flex items-center gap-2">
                                                            {video.thumbnail ? (
                                                                <img
                                                                    src={video.thumbnail}
                                                                    alt=""
                                                                    className="w-6 h-6 rounded object-cover flex-shrink-0"
                                                                />
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-400/30 flex items-center justify-center flex-shrink-0">
                                                                    <Video className="w-3 h-3 text-green-400" />
                                                                </div>
                                                            )}
                                                            
                                                            <div className="flex-1 min-w-0">
                                                                <h6 className="font-medium text-white text-xs truncate" title={video.title}>
                                                                    {video.title}
                                                                </h6>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    {video.viewCount !== undefined && (
                                                                        <>
                                                                            <div className="flex items-center gap-0.5">
                                                                                <Eye className="w-2.5 h-2.5 text-slate-500" />
                                                                                <span className="text-[10px] text-slate-400 font-medium">
                                                                                    {formatViews(video.viewCount)}
                                                                                </span>
                                                                            </div>
                                                                            <span className="text-[10px] text-slate-500">•</span>
                                                                        </>
                                                                    )}
                                                                    <span className="text-[10px] text-green-400">Publicado</span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => onViewVideo?.(video)}
                                                                    className="p-1 rounded text-slate-400 hover:text-green-400 hover:bg-green-400/10 transition-colors"
                                                                    title="Ver detalhes"
                                                                >
                                                                    <Play className="w-2.5 h-2.5" />
                                                                </button>
                                                                {video.url && (
                                                                    <a
                                                                        href={video.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                                                                        title="Abrir no YouTube"
                                                                    >
                                                                        <ExternalLink className="w-2.5 h-2.5" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}