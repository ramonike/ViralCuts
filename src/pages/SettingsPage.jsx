import { useState } from "react";
import { Moon, Sun, Monitor, Bell, Globe, Download, Shield, ChevronRight, Trash2, User, Mail, Lock, Check, AlertCircle, Share2 } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { PageLayout } from "../components/layout/PageLayout";
import { NotificationPreferences } from "../components/notifications/NotificationPreferences";
import PlatformConnections from "../components/settings/PlatformConnections";
import { API_URL } from "../config/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Section({ icon, color, title, subtitle, children, isDark }) {
    return (
        <div className={`rounded-xl overflow-hidden ${isDark ? "glass-panel border border-surface-700/50" : "bg-white border border-gray-200 shadow-sm"}`}>
            <div className={`px-5 py-4 border-b flex items-center gap-3 ${isDark ? "border-surface-700/30" : "border-gray-200"}`}>
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{title}</h3>
                    <p className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>{subtitle}</p>
                </div>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function Toast({ message }) {
    if (!message) return null;
    const isError = message.type === "error";
    return (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2 ${isError ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"}`}>
            {isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
            {message.text}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const [message, setMessage] = useState(null);
    const [language, setLanguage] = useState("pt-BR");
    const [timezone, setTimezone] = useState("America/Sao_Paulo");

    // Conta
    const [name, setName] = useState(user?.name || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [savingAccount, setSavingAccount] = useState(false);

    const showMsg = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3500);
    };

    const handleSaveAccount = async () => {
        if (!name.trim()) return showMsg("error", "O nome não pode estar vazio.");
        setSavingAccount(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/update-profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name: name.trim() }),
            });
            if (!res.ok) throw new Error();
            showMsg("success", "Perfil atualizado com sucesso!");
        } catch {
            showMsg("error", "Erro ao salvar. Tente novamente.");
        } finally {
            setSavingAccount(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) return showMsg("error", "Preencha a senha atual e a nova senha.");
        if (newPassword.length < 8) return showMsg("error", "A nova senha precisa ter pelo menos 8 caracteres.");
        try {
            const res = await fetch(`${API_URL}/api/auth/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            if (!res.ok) throw new Error();
            setCurrentPassword(""); setNewPassword("");
            showMsg("success", "Senha alterada com sucesso!");
        } catch {
            showMsg("error", "Senha atual incorreta ou erro ao alterar.");
        }
    };

    const handleExportData = () => showMsg("success", "Seus dados serão enviados por email em breve.");

    const handleDeleteAccount = () => {
        if (confirm("Tem certeza? Esta ação é irreversível e todos os seus dados serão removidos.")) {
            showMsg("error", "Entre em contato pelo suporte para excluir sua conta.");
        }
    };

    const themeOptions = [
        { value: "light", icon: Sun, label: "Claro" },
        { value: "dark", icon: Moon, label: "Escuro" },
        { value: "system", icon: Monitor, label: "Sistema" },
    ];

    const inputCls = `w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${isDark ? "bg-surface-800 border-surface-700 text-white placeholder-slate-600" : "bg-white border-gray-200 text-gray-900"
        }`;

    const labelCls = `text-xs font-medium block mb-1.5 ${isDark ? "text-slate-400" : "text-gray-600"}`;

    return (
        <PageLayout title="Configurações" subtitle="Gerencie sua conta e preferências do aplicativo.">
            <Toast message={message} />

            <div className="space-y-6">

                {/* ── Aparência ── */}
                <Section icon={<Sun className="w-4 h-4 text-amber-400" />} color="bg-amber-500/10" title="Aparência" subtitle="Tema da interface" isDark={isDark}>
                    <div className="grid grid-cols-3 gap-3">
                        {themeOptions.map(({ value, icon: Icon, label }) => (
                            <button key={value} onClick={() => setTheme(value)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${theme === value
                                    ? "bg-primary/10 border-primary/30 text-primary"
                                    : isDark
                                        ? "bg-surface-800/50 border-surface-700/50 text-slate-400 hover:border-surface-600 hover:text-white"
                                        : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900"
                                }`}>
                                <Icon className="w-5 h-5" />
                                <span className="text-xs font-medium">{label}</span>
                            </button>
                        ))}
                    </div>
                </Section>

                {/* ── Notificações ── */}
                <Section icon={<Bell className="w-4 h-4 text-blue-400" />} color="bg-blue-500/10" title="Notificações" subtitle="Alertas de uploads, erros e atualizações" isDark={isDark}>
                    <NotificationPreferences />
                </Section>

                {/* ── Plataformas Conectadas ── */}
                <Section icon={<Share2 className="w-4 h-4 text-pink-400" />} color="bg-pink-500/10" title="Plataformas" subtitle="Conecte suas contas TikTok e YouTube" isDark={isDark}>
                    <PlatformConnections />
                </Section>

                {/* ── 2 colunas: Conta + Idioma ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Conta */}
                    <Section icon={<User className="w-4 h-4 text-purple-400" />} color="bg-purple-500/10" title="Conta" subtitle="Nome e senha" isDark={isDark}>
                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Nome de exibição</label>
                                <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Email</label>
                                <input value={user?.email || ""} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
                            </div>
                            <button onClick={handleSaveAccount} disabled={savingAccount} className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
                                {savingAccount ? "Salvando..." : "Salvar nome"}
                            </button>

                            <div className={`border-t pt-4 ${isDark ? "border-surface-700/30" : "border-gray-100"}`}>
                                <p className={`text-xs font-semibold mb-3 ${isDark ? "text-slate-400" : "text-gray-500"}`}>Alterar senha</p>
                                <div className="space-y-3">
                                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Senha atual" className={inputCls} />
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nova senha (mín. 8 caracteres)" className={inputCls} />
                                    <button onClick={handleChangePassword} className={`w-full py-2 rounded-lg border text-sm font-medium transition-colors ${isDark ? "border-surface-600 text-slate-300 hover:bg-surface-800" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
                                        Alterar senha
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Idioma e Região */}
                    <Section icon={<Globe className="w-4 h-4 text-purple-400" />} color="bg-purple-500/10" title="Idioma e Região" subtitle="Localização e fuso horário" isDark={isDark}>
                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Idioma</label>
                                <select value={language} onChange={e => setLanguage(e.target.value)} className={inputCls}>
                                    <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                                    <option value="en-US">🇺🇸 English (US)</option>
                                    <option value="es">🇪🇸 Español</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Fuso Horário</label>
                                <select value={timezone} onChange={e => setTimezone(e.target.value)} className={inputCls}>
                                    <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                                    <option value="America/Manaus">Manaus (GMT-4)</option>
                                    <option value="America/Belem">Belém (GMT-3)</option>
                                    <option value="America/New_York">New York (GMT-5)</option>
                                    <option value="Europe/London">London (GMT+0)</option>
                                </select>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* ── Dados e Privacidade ── */}
                <Section icon={<Shield className="w-4 h-4 text-green-400" />} color="bg-green-500/10" title="Dados e Privacidade" subtitle="Exportação e exclusão de conta" isDark={isDark}>
                    <div className="space-y-3">
                        <button onClick={handleExportData} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors group ${isDark ? "bg-surface-800/50 border-surface-700/30 hover:border-surface-600" : "bg-gray-50 border-gray-200 hover:border-gray-300"}`}>
                            <div className="flex items-center gap-3">
                                <Download className={`w-4 h-4 ${isDark ? "text-slate-400 group-hover:text-white" : "text-gray-500"} transition-colors`} />
                                <div className="text-left">
                                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Exportar meus dados</p>
                                    <p className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>Receba uma cópia por email</p>
                                </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 ${isDark ? "text-slate-500 group-hover:text-white" : "text-gray-400"} transition-colors`} />
                        </button>

                        <button onClick={handleDeleteAccount} className="w-full flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-colors group">
                            <div className="flex items-center gap-3">
                                <Trash2 className="w-4 h-4 text-red-400" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-red-400">Excluir conta</p>
                                    <p className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>Ação irreversível — todos os dados serão removidos</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-red-400/50 group-hover:text-red-400 transition-colors" />
                        </button>
                    </div>
                </Section>

            </div>
        </PageLayout>
    );
}
