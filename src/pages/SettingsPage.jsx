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
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 16 }}>
                <div className="flex items-center gap-3 mb-4">
                    <Sun size={18} style={{ color: "var(--accent-amber)" }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>Aparência</h3>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    {themeOptions.map(({ value, icon: Icon, label }) => (
                        <button key={value}
                            onClick={() => setTheme(value)}
                            style={{
                                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                                borderRadius: "var(--radius)", fontSize: 13, fontWeight: 500,
                                cursor: "pointer", transition: "all 0.15s",
                                border: theme === value ? "1px solid var(--accent-coral)" : "1px solid var(--border-default)",
                                background: theme === value ? "var(--accent-coral-3)" : "var(--bg-elevated)",
                                color: theme === value ? "var(--accent-coral-2)" : "var(--text-secondary)",
                            }}>
                            <Icon size={16} /> {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notificações */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 16 }}>
                <div className="flex items-center gap-3 mb-4">
                    <Bell size={18} style={{ color: "var(--accent-amber)" }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>Notificações</h3>
                </div>
                <NotificationPreferences />
            </div>

            {/* Plataformas */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 16 }}>
                <div className="flex items-center gap-3 mb-4">
                    <Share2 size={18} style={{ color: "var(--accent-teal)" }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>Plataformas</h3>
                </div>
                <PlatformConnections />
            </div>

            {/* Conta + Idioma/Região (2 colunas) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24, marginBottom: 24 }}>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: 24 }}>
                    <div className="flex items-center gap-3 mb-4">
                        <User size={18} style={{ color: "var(--accent-coral)" }} />
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Conta</h3>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Nome</label>
                        <input style={{ width: "100%", padding: "10px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius)", color: "var(--text-primary)", fontSize: 14, outline: "none" }} value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Email</label>
                        <input style={{ width: "100%", padding: "10px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius)", color: "var(--text-primary)", fontSize: 14, outline: "none", opacity: 0.6 }} value={user?.email || ""} disabled />
                    </div>
                    <button className="vc-btn vc-btn-primary btn-sm" onClick={handleSaveAccount} style={{ marginBottom: 16 }}>
                        {savingAccount ? "Salvando..." : "Salvar nome"}
                    </button>
                    <hr style={{ border: "none", borderTop: "1px solid var(--border-default)", margin: "16px 0" }} />
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Senha atual</label>
                        <input style={{ width: "100%", padding: "10px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius)", color: "var(--text-primary)", fontSize: 14, outline: "none" }} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Senha atual" />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Nova senha</label>
                        <input style={{ width: "100%", padding: "10px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius)", color: "var(--text-primary)", fontSize: 14, outline: "none" }} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nova senha" />
                    </div>
                    <button className="vc-btn vc-btn-secondary btn-sm" onClick={handleChangePassword}>Alterar senha</button>
                </div>

                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: 24 }}>
                    <div className="flex items-center gap-3 mb-4">
                        <Globe size={18} style={{ color: "var(--accent-amber)" }} />
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Idioma e Região</h3>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Idioma</label>
                            <select style={{ width: "100%", padding: "10px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius)", color: "var(--text-primary)", fontSize: 14, outline: "none" }} value={language} onChange={e => setLanguage(e.target.value)}>
                                <option value="pt-BR">Português (BR)</option>
                                <option value="en-US">English (US)</option>
                                <option value="es">Español</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>Fuso horário</label>
                            <select style={{ width: "100%", padding: "10px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "var(--radius)", color: "var(--text-primary)", fontSize: 14, outline: "none" }} value={timezone} onChange={e => setTimezone(e.target.value)}>
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
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 16 }}>
                <div className="flex items-center gap-3 mb-4">
                    <Shield size={18} style={{ color: "var(--accent-teal)" }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>Dados e Privacidade</h3>
                </div>
                <button style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 16px", borderRadius: "var(--radius)", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-primary)", cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--font-body)", marginBottom: 8 }} onClick={handleExportData}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Download size={16} style={{ color: "var(--accent-teal)" }} /> Exportar meus dados</div>
                    <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                </button>
                <button style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 16px", borderRadius: "var(--radius)", background: "var(--bg-elevated)", border: "1px solid rgba(232,65,42,.3)", color: "var(--text-primary)", cursor: "pointer", transition: "all 0.15s", fontFamily: "var(--font-body)" }} onClick={handleDeleteAccount}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Trash2 size={16} style={{ color: "var(--accent-coral)" }} /> Excluir conta</div>
                    <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                </button>
            </div>

        </PageLayout>
    );
}
