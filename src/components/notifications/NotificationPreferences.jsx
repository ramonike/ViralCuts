import { 
    Bell, 
    Upload, 
    Video, 
    Trophy, 
    Flame, 
    AlertTriangle,
    Smartphone,
    Monitor
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';

// Notification type configurations
const NOTIFICATION_TYPES = {
    upload_complete: {
        label: 'Upload concluído',
        description: 'Quando um upload termina com sucesso',
        icon: Upload,
        iconClass: 'text-green-400'
    },
    upload_error: {
        label: 'Erro no upload',
        description: 'Quando um upload falha',
        icon: Upload,
        iconClass: 'text-red-400',
        inAppOnly: true
    },
    video_published: {
        label: 'Vídeo publicado',
        description: 'Quando um vídeo agendado é publicado',
        icon: Video,
        iconClass: 'text-blue-400'
    },
    achievement_unlocked: {
        label: 'Conquista desbloqueada',
        description: 'Quando você desbloqueia uma nova conquista',
        icon: Trophy,
        iconClass: 'text-yellow-400'
    },
    streak_reminder: {
        label: 'Lembrete de streak',
        description: 'Lembrete para manter sua sequência de posts',
        icon: Flame,
        iconClass: 'text-orange-400'
    },
    quota_warning: {
        label: 'Aviso de quota',
        description: 'Quando a quota do YouTube está próxima do limite',
        icon: AlertTriangle,
        iconClass: 'text-amber-400',
        inAppOnly: true
    }
};

function ToggleSwitch({ enabled, onChange, disabled = false }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={disabled}
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                disabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer'
            } ${
                enabled ? 'bg-blue-500' : 'bg-slate-600'
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );
}

function NotificationTypeToggle({ 
    type, 
    config, 
    enabled, 
    onChange, 
    disabled = false 
}) {
    const Icon = config.icon;

    return (
        <div className={`flex items-center justify-between py-3 ${disabled ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-slate-800`}>
                    <Icon className={`w-4 h-4 ${config.iconClass}`} />
                </div>
                <div>
                    <p className="text-sm font-medium text-white">{config.label}</p>
                    <p className="text-xs text-slate-400">{config.description}</p>
                </div>
            </div>
            <ToggleSwitch 
                enabled={enabled} 
                onChange={onChange} 
                disabled={disabled}
            />
        </div>
    );
}

export function NotificationPreferences() {
    const { preferences, updatePreferences } = useNotification();

    const handleInAppToggle = (enabled) => {
        updatePreferences({
            inApp: { enabled }
        });
    };

    const handlePushToggle = (enabled) => {
        updatePreferences({
            push: { enabled }
        });
    };

    const handleInAppTypeToggle = (type, enabled) => {
        updatePreferences({
            inApp: {
                types: { [type]: enabled }
            }
        });
    };

    const handlePushTypeToggle = (type, enabled) => {
        updatePreferences({
            push: {
                types: { [type]: enabled }
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* In-App Notifications Section */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Monitor className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Notificações In-App</h3>
                                <p className="text-xs text-slate-400">Notificações dentro do aplicativo</p>
                            </div>
                        </div>
                        <ToggleSwitch 
                            enabled={preferences.inApp.enabled} 
                            onChange={handleInAppToggle}
                        />
                    </div>
                </div>

                <div className="px-4 divide-y divide-slate-700/50">
                    {Object.entries(NOTIFICATION_TYPES).map(([type, config]) => (
                        <NotificationTypeToggle
                            key={type}
                            type={type}
                            config={config}
                            enabled={preferences.inApp.types[type] ?? true}
                            onChange={(enabled) => handleInAppTypeToggle(type, enabled)}
                            disabled={!preferences.inApp.enabled}
                        />
                    ))}
                </div>
            </div>

            {/* Push Notifications Section */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <Smartphone className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Push Notifications</h3>
                                <p className="text-xs text-slate-400">Notificações mesmo quando não está no app</p>
                            </div>
                        </div>
                        <ToggleSwitch 
                            enabled={preferences.push.enabled} 
                            onChange={handlePushToggle}
                        />
                    </div>
                </div>

                <div className="px-4 divide-y divide-slate-700/50">
                    {Object.entries(NOTIFICATION_TYPES)
                        .filter(([_, config]) => !config.inAppOnly)
                        .map(([type, config]) => (
                            <NotificationTypeToggle
                                key={type}
                                type={type}
                                config={config}
                                enabled={preferences.push.types[type] ?? true}
                                onChange={(enabled) => handlePushTypeToggle(type, enabled)}
                                disabled={!preferences.push.enabled}
                            />
                        ))}
                </div>

                {/* Push permission notice */}
                {preferences.push.enabled && (
                    <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-700">
                        <p className="text-xs text-slate-400">
                            <Bell className="w-3 h-3 inline mr-1" />
                            Push notifications requerem permissão do navegador. 
                            Você será solicitado quando ativar esta opção.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default NotificationPreferences;
