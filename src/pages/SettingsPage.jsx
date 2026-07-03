import { useState } from "react";
import { Moon, Sun, Monitor, Bell, Globe, Download, Shield, ChevronRight, Trash2, User, Mail, Lock, Check, AlertCircle, Share2 } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { PageLayout } from "../components/layout/PageLayout";
import { NotificationPreferences } from "../components/notifications/NotificationPreferences";
import PlatformConnections from "../components/settings/PlatformConnections";
import { API_URL } from "../config/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";

function Section({ icon, color, title, subtitle, children }) {
    return (
        <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>{icon}</div>
                <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
                </div>
            </div>
            <div className="p-5">{children}</div>
        </Card>
    );
}

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

    const activeThemeBtn = (val) =>
        theme === val
            ? "bg-[var(--accent-coral-3)] border-[rgba(232,65,42,0.3)] text-[var(--accent-coral-2)]"
            : "bg-[var(--bg-tertiary)] border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]";

    return (
        <PageLayout title="Configurações" subtitle="Gerencie sua conta e preferências do aplicativo.">
            <Toast message={message} />

            <div className="space-y-6">

                <Section icon={<Sun className="w-4 h-4 text-[var(--accent-amber)]" />} color="bg-[var(--accent-amber-3)]" title="Aparência" subtitle="Tema da interface">
                    <div className="grid grid-cols-3 gap-3">
                        {themeOptions.map(({ value, icon: Icon, label }) => (
                            <button key={value} onClick={() => setTheme(value)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${activeThemeBtn(value)}`}>
                                <Icon className="w-5 h-5" />
                                <span className="text-xs font-medium">{label}</span>
                            </button>
                        ))}
                    </div>
                </Section>

                <Section icon={<Bell className="w-4 h-4 text-[var(--accent-coral-2)]" />} color="bg-[var(--accent-coral-3)]" title="Notificações" subtitle="Alertas de uploads, erros e atualizações">
                    <NotificationPreferences />
                </Section>

                <Section icon={<Share2 className="w-4 h-4 text-[var(--accent-teal)]" />} color="bg-[var(--accent-teal-3)]" title="Plataformas" subtitle="Conecte suas contas TikTok e YouTube">
                    <PlatformConnections />
                </Section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Section icon={<User className="w-4 h-4 text-[var(--accent-coral-2)]" />} color="bg-[var(--accent-coral-3)]" title="Conta" subtitle="Nome e senha">
                        <div className="space-y-4">
                            <Input label="Nome de exibição" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
                            <Input label="Email" value={user?.email || ""} disabled className="opacity-50 cursor-not-allowed" />
                            <Button className="w-full" onClick={handleSaveAccount} loading={savingAccount}>
                                {savingAccount ? "Salvando..." : "Salvar nome"}
                            </Button>

                            <div className="border-t border-[var(--border-subtle)] pt-4">
                                <p className="text-xs font-semibold text-[var(--text-muted)] mb-3">Alterar senha</p>
                                <div className="space-y-3">
                                    <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Senha atual" />
                                    <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nova senha (mín. 8 caracteres)" />
                                    <Button variant="secondary" className="w-full" onClick={handleChangePassword}>
                                        Alterar senha
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section icon={<Globe className="w-4 h-4 text-[var(--accent-amber)]" />} color="bg-[var(--accent-amber-3)]" title="Idioma e Região" subtitle="Localização e fuso horário">
                        <div className="space-y-4">
                            <Select label="Idioma" value={language} onChange={e => setLanguage(e.target.value)}>
                                <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                                <option value="en-US">🇺🇸 English (US)</option>
                                <option value="es">🇪🇸 Español</option>
                            </Select>
                            <Select label="Fuso Horário" value={timezone} onChange={e => setTimezone(e.target.value)}>
                                <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                                <option value="America/Manaus">Manaus (GMT-4)</option>
                                <option value="America/Belem">Belém (GMT-3)</option>
                                <option value="America/New_York">New York (GMT-5)</option>
                                <option value="Europe/London">London (GMT+0)</option>
                            </Select>
                        </div>
                    </Section>
                </div>

                <Section icon={<Shield className="w-4 h-4 text-[var(--accent-teal)]" />} color="bg-[var(--accent-teal-3)]" title="Dados e Privacidade" subtitle="Exportação e exclusão de conta">
                    <div className="space-y-3">
                        <button onClick={handleExportData}
                            className="w-full flex items-center justify-between p-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] transition-all group">
                            <div className="flex items-center gap-3">
                                <Download className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-[var(--text-primary)]">Exportar meus dados</p>
                                    <p className="text-xs text-[var(--text-muted)]">Receba uma cópia por email</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
                        </button>

                        <button onClick={handleDeleteAccount}
                            className="w-full flex items-center justify-between p-3 rounded-lg border border-[rgba(232,65,42,0.15)] bg-[var(--accent-coral-3)] hover:border-[rgba(232,65,42,0.35)] transition-all group">
                            <div className="flex items-center gap-3">
                                <Trash2 className="w-4 h-4 text-[var(--accent-coral-2)]" />
                                <div className="text-left">
                                    <p className="text-sm font-medium text-[var(--accent-coral-2)]">Excluir conta</p>
                                    <p className="text-xs text-[var(--text-muted)]">Ação irreversível — todos os dados serão removidos</p>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[var(--accent-coral)] opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>
                </Section>

            </div>
        </PageLayout>
    );
}
