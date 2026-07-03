import { useState } from "react";
import { Moon, Sun, Monitor, Bell, Globe, Download, Shield, ChevronRight, Trash2, User, AlertCircle, Check, Share2 } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { PageLayout } from "../components/layout/PageLayout";
import { NotificationPreferences } from "../components/notifications/NotificationPreferences";
import PlatformConnections from "../components/settings/PlatformConnections";
import { API_URL } from "../config/api";

function Toast({ message }) {
    if (!message) return null;
    return (
        <div className={`vc-toast mb-6 ${message.type === "error" ? "vc-toast-coral" : "vc-toast-teal"}`}>
            {message.type === "error" ? <AlertCircle size={16} className="shrink-0" /> : <Check size={16} className="shrink-0" />}
            <span>{message.text}</span>
        </div>
    );
}

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();

    const [message, setMessage] = useState(null);
    const [language, setLanguage] = useState("pt-BR");
    const [timezone, setTimezone] = useState("America/Sao_Paulo");
    const [name, setName] = useState(user?.name || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [savingAccount, setSavingAccount] = useState(false);

    const showMsg = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 3500); };

    const handleSaveAccount = async () => {
        if (!name.trim()) return showMsg("error", "O nome não pode estar vazio.");
        setSavingAccount(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/update-profile`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                credentials: "include", body: JSON.stringify({ name: name.trim() }),
            });
            if (!res.ok) throw new Error();
            showMsg("success", "Perfil atualizado com sucesso!");
        } catch { showMsg("error", "Erro ao salvar. Tente novamente."); }
        finally { setSavingAccount(false); }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) return showMsg("error", "Preencha a senha atual e a nova senha.");
        if (newPassword.length < 8) return showMsg("error", "A nova senha precisa ter pelo menos 8 caracteres.");
        try {
            const res = await fetch(`${API_URL}/api/auth/change-password`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                credentials: "include", body: JSON.stringify({ currentPassword, newPassword }),
            });
            if (!res.ok) throw new Error();
            setCurrentPassword(""); setNewPassword("");
            showMsg("success", "Senha alterada com sucesso!");
        } catch { showMsg("error", "Senha atual incorreta ou erro ao alterar."); }
    };

    const handleExportData = () => showMsg("success", "Seus dados serão enviados por email em breve.");
    const handleDeleteAccount = () => {
        if (confirm("Tem certeza? Esta ação é irreversível e todos os seus dados serão removidos."))
            showMsg("error", "Entre em contato pelo suporte para excluir sua conta.");
    };

    const themeOptions = [
        { value: "light", icon: Sun, label: "Claro" },
        { value: "dark", icon: Moon, label: "Escuro" },
        { value: "system", icon: Monitor, label: "Sistema" },
    ];

    return (
        <PageLayout title="Configurações" subtitle="Gerencie sua conta e preferências do aplicativo.">
            <Toast message={message} />

            {/* Aparência */}
            <div className="card card-hover mb-4">
                <div className="flex items-center gap-3 mb-4">
                    <Sun size={18} style={{ color: "var(--amber)" }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>Aparência</h3>
                </div>
                <div className="theme-options">
                    {themeOptions.map(({ value, icon: Icon, label }) => (
                        <button key={value}
                            className={`theme-btn ${theme === value ? "active" : ""}`}
                            onClick={() => setTheme(value)}>
                            <Icon size={16} /> {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notificações */}
            <div className="card card-hover mb-4">
                <div className="flex items-center gap-3 mb-4">
                    <Bell size={18} style={{ color: "var(--blue)" }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>Notificações</h3>
                </div>
                <NotificationPreferences />
            </div>

            {/* Plataformas */}
            <div className="card card-hover mb-4">
                <div className="flex items-center gap-3 mb-4">
                    <Share2 size={18} style={{ color: "var(--teal)" }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>Plataformas</h3>
                </div>
                <PlatformConnections />
            </div>

            {/* Conta + Idioma/Região (2 colunas) */}
            <div className="grid-2 mb-4" style={{ gap: 24 }}>
                <div className="card card-hover">
                    <div className="flex items-center gap-3 mb-4">
                        <User size={18} style={{ color: "var(--coral)" }} />
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Conta</h3>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nome</label>
                        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="input" value={user?.email || ""} disabled style={{ opacity: 0.6 }} />
                    </div>
                    <button className="btn btn-primary btn-sm mb-4" onClick={handleSaveAccount}>
                        {savingAccount ? "Salvando..." : "Salvar nome"}
                    </button>
                    <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />
                    <div className="form-group">
                        <label className="form-label">Senha atual</label>
                        <input className="input" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Senha atual" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nova senha</label>
                        <input className="input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nova senha" />
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={handleChangePassword}>Alterar senha</button>
                </div>

                <div className="card card-hover">
                    <div className="flex items-center gap-3 mb-4">
                        <Globe size={18} style={{ color: "var(--amber)" }} />
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Idioma e Região</h3>
                    </div>
                    <div className="grid-2">
                        <div className="form-group">
                            <label className="form-label">Idioma</label>
                            <select className="input" value={language} onChange={e => setLanguage(e.target.value)}>
                                <option value="pt-BR">Português (BR)</option>
                                <option value="en-US">English (US)</option>
                                <option value="es">Español</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fuso horário</label>
                            <select className="input" value={timezone} onChange={e => setTimezone(e.target.value)}>
                                <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                                <option value="America/Manaus">Manaus (GMT-4)</option>
                                <option value="America/Belem">Belém (GMT-3)</option>
                                <option value="America/New_York">New York (GMT-5)</option>
                                <option value="Europe/London">London (GMT+0)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dados e Privacidade */}
            <div className="card card-hover mb-4">
                <div className="flex items-center gap-3 mb-4">
                    <Shield size={18} style={{ color: "var(--teal)" }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>Dados e Privacidade</h3>
                </div>
                <button className="platform-btn mb-2" onClick={handleExportData}>
                    <div className="left"><Download size={16} style={{ color: "var(--teal)" }} /> Exportar meus dados</div>
                    <ChevronRight size={14} style={{ color: "var(--text3)" }} />
                </button>
                <button className="platform-btn" style={{ borderColor: "rgba(232,65,42,.3)" }} onClick={handleDeleteAccount}>
                    <div className="left"><Trash2 size={16} style={{ color: "var(--coral)" }} /> Excluir conta</div>
                    <ChevronRight size={14} style={{ color: "var(--text3)" }} />
                </button>
            </div>

        </PageLayout>
    );
}
