import React, { useState, useRef, useMemo } from 'react';
import { 
    X, 
    Calendar, 
    Clock, 
    Upload, 
    Video, 
    Settings, 
    Eye,
    EyeOff,
    Globe,
    Lock,
    Sparkles,
    FileVideo,
    Trash2,
    AlertCircle,
    MapPin
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const PLATFORMS = [
    { id: 'youtube-shorts', name: 'YouTube Shorts', icon: '🎬', color: 'from-red-500 to-red-600' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'from-pink-500 to-purple-600' },
    { id: 'instagram-reels', name: 'Instagram Reels', icon: '📸', color: 'from-purple-500 to-pink-500' }
];

const PRIVACY_OPTIONS = [
    { value: 'public', label: 'Público', icon: Globe, description: 'Visível para todos' },
    { value: 'unlisted', label: 'Não listado', icon: EyeOff, description: 'Apenas com link' },
    { value: 'private', label: 'Privado', icon: Lock, description: 'Apenas você' }
];

// Common timezones for Brazil and international users
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

/**
 * Get the user's local timezone
 */
function getLocalTimezone() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const found = TIMEZONES.find(t => t.value === tz);
    return found ? tz : 'America/Sao_Paulo';
}

/**
 * Validate if a date/time is in the future
 */
function isValidFutureDateTime(date, time, timezone) {
    const dateTimeStr = `${date}T${time}:00`;
    const scheduledDate = new Date(dateTimeStr);
    const now = new Date();
    
    // Add 5 minutes buffer for processing
    const minTime = new Date(now.getTime() + 5 * 60 * 1000);
    
    return scheduledDate > minTime;
}

/**
 * Format date for display
 */
function formatScheduledDateTime(date, time, timezone) {
    const dateTimeStr = `${date}T${time}:00`;
    const scheduledDate = new Date(dateTimeStr);
    
    return scheduledDate.toLocaleString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone,
    });
}

export function ScheduleVideoModal({ isOpen, onClose, selectedDate, onSchedule }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        platform: 'youtube-shorts',
        privacyStatus: 'public',
        scheduledDate: selectedDate || new Date().toISOString().split('T')[0],
        scheduledTime: '12:00',
        timezone: getLocalTimezone(),
        useNativeScheduling: true,
        tags: '',
        file: null
    });
    
    const [dragActive, setDragActive] = useState(false);
    const [validationError, setValidationError] = useState(null);
    const fileInputRef = useRef(null);

    // Update scheduled date when selectedDate prop changes
    React.useEffect(() => {
        if (selectedDate) {
            setFormData(prev => ({ ...prev, scheduledDate: selectedDate }));
        }
    }, [selectedDate]);

    // Validate scheduled time whenever date/time changes
    const isScheduleValid = useMemo(() => {
        return isValidFutureDateTime(
            formData.scheduledDate, 
            formData.scheduledTime, 
            formData.timezone
        );
    }, [formData.scheduledDate, formData.scheduledTime, formData.timezone]);

    // Get minimum date (today)
    const minDate = useMemo(() => {
        return new Date().toISOString().split('T')[0];
    }, []);

    // Get maximum date (1 year from now - YouTube limit)
    const maxDate = useMemo(() => {
        const max = new Date();
        max.setFullYear(max.getFullYear() + 1);
        return max.toISOString().split('T')[0];
    }, []);

    if (!isOpen) return null;

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setValidationError(null);
    };

    const handleFileSelect = (file) => {
        if (file && file.type.startsWith('video/')) {
            setFormData(prev => ({
                ...prev,
                file,
                title: prev.title || file.name.replace(/\.[^/.]+$/, '')
            }));
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragActive(false);
    };

    const handleSubmit = () => {
        if (!formData.title || (!formData.file && formData.platform === 'youtube-shorts')) {
            setValidationError('Preencha todos os campos obrigatórios');
            return;
        }

        if (!isScheduleValid) {
            setValidationError('O horário agendado deve ser no futuro (mínimo 5 minutos)');
            return;
        }

        // Create scheduled date/time in the selected timezone
        const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00`);
        
        onSchedule({
            title: formData.title,
            description: formData.description,
            platform: formData.platform,
            scheduledAt: scheduledDateTime.toISOString(),
            publishAt: formData.useNativeScheduling ? scheduledDateTime.toISOString() : null,
            privacyStatus: formData.privacyStatus,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            file: formData.file,
            timezone: formData.timezone,
            source: 'scheduled'
        });

        // Reset form
        setFormData({
            title: '',
            description: '',
            platform: 'youtube-shorts',
            privacyStatus: 'public',
            scheduledDate: new Date().toISOString().split('T')[0],
            scheduledTime: '12:00',
            timezone: getLocalTimezone(),
            useNativeScheduling: true,
            tags: '',
            file: null
        });
        setValidationError(null);
        
        onClose();
    };

    const selectedPlatform = PLATFORMS.find(p => p.id === formData.platform);
    const selectedPrivacy = PRIVACY_OPTIONS.find(p => p.value === formData.privacyStatus);
    const selectedTimezone = TIMEZONES.find(t => t.value === formData.timezone);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-600/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300 m-4">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900/30 via-purple-900/20 to-blue-900/30 border-b border-slate-600/50 p-6 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Agendar Vídeo</h2>
                                <p className="text-sm text-slate-400">
                                    {formatScheduledDateTime(formData.scheduledDate, formData.scheduledTime, formData.timezone)}
                                </p>
                            </div>
                        </div>
                        
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1" style={{ maxHeight: 'calc(85vh - 200px)' }}>
                    <div className="space-y-6">
                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-3">
                                <Video className="w-4 h-4 inline mr-2" />
                                Arquivo de Vídeo
                            </label>
                            
                            <div
                                className={`
                                    relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer
                                    ${dragActive 
                                        ? 'border-blue-400 bg-blue-500/10' 
                                        : formData.file 
                                            ? 'border-green-400 bg-green-500/10'
                                            : 'border-slate-600 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
                                    }
                                `}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                />
                                
                                {formData.file ? (
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-400/30 flex items-center justify-center">
                                            <FileVideo className="w-6 h-6 text-green-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate">{formData.file.name}</p>
                                            <p className="text-sm text-slate-400">
                                                {(formData.file.size / (1024 * 1024)).toFixed(1)} MB
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFormData(prev => ({ ...prev, file: null }));
                                            }}
                                            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <Upload className="w-8 h-8 mx-auto mb-3 text-slate-500" />
                                        <p className="text-white font-medium mb-1">
                                            Arraste um vídeo ou clique para selecionar
                                        </p>
                                        <p className="text-sm text-slate-400">
                                            Suporta MP4, MOV, AVI e outros formatos
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Title and Description */}
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Título do Vídeo *
                                </label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    placeholder="Ex: 5 Curiosidades Incríveis Sobre Gatos"
                                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Descrição (Opcional)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Adicione uma descrição para o seu vídeo..."
                                    rows={3}
                                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            </div>
                        </div>

                        {/* Platform and Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-white mb-2">
                                    Plataforma
                                </label>
                                <div className="space-y-2">
                                    {PLATFORMS.map(platform => (
                                        <button
                                            key={platform.id}
                                            onClick={() => handleInputChange('platform', platform.id)}
                                            className={`
                                                w-full flex items-center gap-3 p-3 rounded-lg border transition-all
                                                ${formData.platform === platform.id
                                                    ? 'border-blue-400 bg-blue-500/10 text-white'
                                                    : 'border-slate-600 bg-slate-800/30 text-slate-400 hover:border-slate-500 hover:text-white'
                                                }
                                            `}
                                        >
                                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-sm`}>
                                                {platform.icon}
                                            </div>
                                            <span className="font-medium">{platform.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Date Picker */}
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Data
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.scheduledDate}
                                        min={minDate}
                                        max={maxDate}
                                        onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                    />
                                </div>

                                {/* Time Picker */}
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        <Clock className="w-4 h-4 inline mr-1" />
                                        Horário
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.scheduledTime}
                                        onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                    />
                                </div>

                                {/* Timezone Selector */}
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-2">
                                        <MapPin className="w-4 h-4 inline mr-1" />
                                        Fuso Horário
                                    </label>
                                    <select
                                        value={formData.timezone}
                                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                    >
                                        {TIMEZONES.map(tz => (
                                            <option key={tz.value} value={tz.value}>
                                                {tz.label} (UTC{tz.offset})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Validation Warning */}
                                {!isScheduleValid && (
                                    <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                        <span className="text-xs text-yellow-400">
                                            O horário deve ser pelo menos 5 minutos no futuro
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Privacy Settings */}
                        {formData.platform === 'youtube-shorts' && (
                            <div>
                                <label className="block text-sm font-semibold text-white mb-3">
                                    <Settings className="w-4 h-4 inline mr-2" />
                                    Configurações de Privacidade
                                </label>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                    {PRIVACY_OPTIONS.map(option => {
                                        const Icon = option.icon;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => handleInputChange('privacyStatus', option.value)}
                                                className={`
                                                    flex flex-col items-center gap-2 p-3 rounded-lg border transition-all
                                                    ${formData.privacyStatus === option.value
                                                        ? 'border-blue-400 bg-blue-500/10 text-white'
                                                        : 'border-slate-600 bg-slate-800/30 text-slate-400 hover:border-slate-500 hover:text-white'
                                                    }
                                                `}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <div className="text-center">
                                                    <div className="font-medium text-sm">{option.label}</div>
                                                    <div className="text-xs opacity-75">{option.description}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Native Scheduling Option */}
                                <div className="bg-slate-800/30 border border-slate-600/50 rounded-lg p-4">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.useNativeScheduling}
                                            onChange={(e) => handleInputChange('useNativeScheduling', e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Sparkles className="w-4 h-4 text-blue-400" />
                                                <span className="font-medium text-white">Usar agendamento nativo do YouTube</span>
                                            </div>
                                            <p className="text-sm text-slate-400">
                                                {formData.useNativeScheduling
                                                    ? '✅ Vídeo será enviado agora e publicado automaticamente pelo YouTube no horário agendado'
                                                    : '⚠️ Vídeo ficará na fila e será enviado apenas no horário agendado (requer dashboard aberto)'
                                                }
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-semibold text-white mb-2">
                                Tags (Opcional)
                            </label>
                            <Input
                                value={formData.tags}
                                onChange={(e) => handleInputChange('tags', e.target.value)}
                                placeholder="gatos, curiosidades, animais (separadas por vírgula)"
                                className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-600/50 p-4 bg-slate-800/30 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">
                            {validationError ? (
                                <span className="flex items-center gap-2 text-red-400">
                                    <AlertCircle className="w-4 h-4" />
                                    {validationError}
                                </span>
                            ) : formData.file ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                    Arquivo selecionado
                                </span>
                            ) : null}
                        </div>
                        
                        <div className="flex gap-3">
                            <Button
                                onClick={onClose}
                                variant="outline"
                                className="border-slate-600 text-slate-400 hover:text-white hover:border-slate-500"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!formData.title || (!formData.file && formData.platform === 'youtube-shorts') || !isScheduleValid}
                                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                Agendar Vídeo
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}