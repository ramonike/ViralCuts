import { useState } from "react";
import { Moon, Sun, Monitor, Bell, Globe, Download, Shield, ChevronRight, Trash2, Link2, Zap } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { PageLayout } from "../components/layout/PageLayout";
import PlatformConnections from "../components/settings/PlatformConnections";
import { NotificationPreferences } from "../components/notifications/NotificationPreferences";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const [language, setLanguage] = useState("pt-BR");
    const [timezone, setTimezone] = useState("America/Sao_Paulo");
    const [n8nUrl, setN8nUrl] = useState(localStorage.getItem('n8n_url') || "");
    const [n8nApiKey, setN8nApiKey] = useState(localStorage.getItem('n8n_api_key') || "");
    const [message, setMessage] = useState(null);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleExportData = () => {
        showMessage("success", "Seus dados serão enviados por email em breve.");
    };

    const handleSaveN8n = () => {
        localStorage.setItem('n8n_url', n8nUrl);
        localStorage.setItem('n8n_api_key', n8nApiKey);
        showMessage("success", "Configurações do n8n salvas com sucesso!");
    };

    const handleDeleteAccount = () => {
        if (confirm("Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.")) {
            showMessage("error", "Funcionalidade em desenvolvimento.");
        }
    };

    const themeOptions = [
        { value: "light", icon: Sun, label: "Claro" },
        { value: "dark", icon: Moon, label: "Escuro" },
        { value: "system", icon: Monitor, label: "Sistema" },
    ];

    return (
        <PageLayout
            title="Ajustes"
            subtitle="Configure suas preferências do aplicativo."
        >
            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2 ${message.type === 'success'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Platform Connections Section */}
            <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? 'glass-panel border border-surface-700/50' : 'bg-white border border-gray-200 shadow-sm'}`}>
                <div className={`px-5 py-4 border-b flex items-center gap-3 ${isDark ? 'border-surface-700/30' : 'border-gray-200'}`}>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Link2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Conexões de Plataformas</h3>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Gerencie suas contas conectadas</p>
                    </div>
                </div>
                <div className="p-5">
                    <PlatformConnections />
                </div>
            </div>

            {/* n8n Integration Section */}
            <div className={`rounded-xl overflow-hidden mb-6 ${isDark ? 'glass-panel border border-surface-700/50' : 'bg-white border border-gray-200 shadow-sm'}`}>
                <div className={`px-5 py-4 border-b flex items-center gap-3 ${isDark ? 'border-surface-700/30' : 'border-gray-200'}`}>
                    <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Integração n8n</h3>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Conecte sua instância nativa do n8n para automações complexas</p>
                    </div>
                </div>
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>URL da Instância</label>
                            <input
                                type="text"
                                value={n8nUrl}
                                onChange={(e) => setN8nUrl(e.target.value)}
                                placeholder="https://seu-n8n.com"
                                className={`w-full px-4 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isDark ? 'bg-surface-800 border-surface-700 text-white placeholder-slate-600' : 'bg-white border-gray-200 text-gray-900'
                                    }`}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>API Key</label>
                            <input
                                type="password"
                                value={n8nApiKey}
                                onChange={(e) => setN8nApiKey(e.target.value)}
                                placeholder="n8n_api_..."
                                className={`w-full px-4 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isDark ? 'bg-surface-800 border-surface-700 text-white placeholder-slate-600' : 'bg-white border-gray-200 text-gray-900'
                                    }`}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveN8n}
                            className="px-6 py-2 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                        >
                            Salvar Configurações
                        </button>
                    </div>
                </div>
            </div>

            {/* Settings Grid - 2 columns on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Aparência */}
                <div className={`rounded-xl overflow-hidden ${isDark ? 'glass-panel border border-surface-700/50' : 'bg-white border border-gray-200 shadow-sm'}`}>
                    <div className={`px-5 py-4 border-b flex items-center gap-3 ${isDark ? 'border-surface-700/30' : 'border-gray-200'}`}>
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Sun className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Aparência</h3>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Personalize o visual</p>
                        </div>
                    </div>
                    <div className="p-5">
                        <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Tema da interface</p>
                        <div className="grid grid-cols-3 gap-2">
                            {themeOptions.map(({ value, icon: Icon, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setTheme(value)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${theme === value
                                            ? 'bg-primary/10 border-primary/30 text-primary'
                                            : isDark
                                                ? 'bg-surface-800/50 border-surface-700/50 text-slate-400 hover:border-surface-600 hover:text-white'
                                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-xs font-medium">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Notificações - Full width section */}
            </div>

            {/* Notification Preferences Section - Full width */}
            <div className={`mt-6 rounded-xl overflow-hidden ${isDark ? 'glass-panel border border-surface-700/50' : 'bg-white border border-gray-200 shadow-sm'}`}>
                <div className={`px-5 py-4 border-b flex items-center gap-3 ${isDark ? 'border-surface-700/30' : 'border-gray-200'}`}>
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Preferências de Notificações</h3>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Gerencie alertas in-app e push</p>
                    </div>
                </div>
                <div className="p-5">
                    <NotificationPreferences />
                </div>
            </div>

            {/* Settings Grid continued */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className={`rounded-xl overflow-hidden ${isDark ? 'glass-panel border border-surface-700/50' : 'bg-white border border-gray-200 shadow-sm'}`}>
                    <div className={`px-5 py-4 border-b flex items-center gap-3 ${isDark ? 'border-surface-700/30' : 'border-gray-200'}`}>
                        <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Globe className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Idioma e Região</h3>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Localização e fuso horário</p>
                        </div>
                    </div>
                    <div className="p-5 space-y-4">
                        <div>
                            <label className={`text-xs mb-2 block ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Idioma</label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all ${isDark
                                        ? 'bg-surface-800 border-surface-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                            >
                                <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                                <option value="en-US">🇺🇸 English (US)</option>
                                <option value="es">🇪🇸 Español</option>
                            </select>
                        </div>
                        <div>
                            <label className={`text-xs mb-2 block ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Fuso Horário</label>
                            <select
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all ${isDark
                                        ? 'bg-surface-800 border-surface-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                            >
                                <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                                <option value="America/New_York">New York (GMT-5)</option>
                                <option value="Europe/London">London (GMT+0)</option>
                                <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Dados e Privacidade */}
                <div className={`rounded-xl overflow-hidden ${isDark ? 'glass-panel border border-surface-700/50' : 'bg-white border border-gray-200 shadow-sm'}`}>
                    <div className={`px-5 py-4 border-b flex items-center gap-3 ${isDark ? 'border-surface-700/30' : 'border-gray-200'}`}>
                        <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dados e Privacidade</h3>
                            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Gerencie seus dados</p>
                        </div>
                    </div>
                    <div className="p-5 space-y-3">
                        <button
                            onClick={handleExportData}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors group ${isDark
                                    ? 'bg-surface-800/50 border-surface-700/30 hover:border-surface-600'
                                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Download className={`w-4 h-4 transition-colors ${isDark ? 'text-slate-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-900'}`} />
                                <div className="text-left">
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Exportar Dados</p>
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Baixe uma cópia dos seus dados</p>
                                </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-colors ${isDark ? 'text-slate-500 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-900'}`} />
                        </button>

                        <button
                            onClick={handleDeleteAccount}
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <Trash2 className="w-4 h-4 text-red-400" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-red-400">Excluir Conta</p>
                                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Remova permanentemente sua conta</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-red-400/50 group-hover:text-red-400 transition-colors" />
                        </button>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
