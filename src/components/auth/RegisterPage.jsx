import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Loader2, ArrowLeft, Sun, Moon } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const validateForm = () => {
        const errors = {};
        if (!name || name.length < 2) errors.name = "Nome deve ter pelo menos 2 caracteres";
        if (!email) errors.email = "Email é obrigatório";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email inválido";
        if (!password) errors.password = "Senha é obrigatória";
        else if (password.length < 8) errors.password = "Senha deve ter pelo menos 8 caracteres";
        else { const hasUpper = /[A-Z]/.test(password); const hasLower = /[a-z]/.test(password); const hasNum = /\d/.test(password); if (!hasUpper || !hasLower || !hasNum) errors.password = "Use maiúsculas, minúsculas e números"; }
        if (!confirmPassword) errors.confirmPassword = "Confirme sua senha";
        else if (password !== confirmPassword) errors.confirmPassword = "As senhas não coincidem";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleRegister = async (e) => {
        e?.preventDefault();
        setError("");
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            const result = await signUp(email, password, name);
            if (result.success) navigate("/dashboard", { replace: true });
            else {
                let msg = result.error;
                if (result.error?.includes("already exists") || result.error?.includes("already registered")) msg = "Este email já está cadastrado";
                else if (result.error?.includes("rate limit")) msg = "Muitas tentativas. Aguarde alguns minutos.";
                setError(msg || "Erro ao criar conta");
            }
        } catch (err) { console.error("Register error:", err); setError("Erro ao conectar com o servidor"); }
        finally { setIsLoading(false); }
    };

    const handleKeyDown = (e) => { if (e.key === "Enter") handleRegister(e); };

    return (
        <div className="vc-auth-shell">
            <button onClick={toggleTheme}
                className="fixed top-4 right-4 z-50 p-2.5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="vc-auth-brand">
                <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8">
                    <ArrowLeft size={14} /> Voltar ao início
                </Link>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div className="vc-logo-mark mb-6" style={{ width: 48, height: 48, fontSize: 20 }}>V</div>
                    <h1 className="text-display mb-4">Criar conta</h1>
                    <p className="text-lg text-[var(--text-secondary)] mb-8" style={{ lineHeight: 1.6 }}>
                        Crie sua conta e comece a gerenciar seus vídeos de forma inteligente.
                    </p>
                    <div className="space-y-4">
                        {["Upload automático para múltiplas plataformas", "Analytics detalhados do seu canal", "Agendamento inteligente de publicações"].map((text, i) => (
                            <div key={i} className="flex items-center gap-3 text-[var(--text-secondary)]">
                                <div className="w-2 h-2 rounded-full bg-[var(--accent-coral)]" />
                                <span>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="vc-auth-form">
                <div className="vc-auth-form-inner">
                    <Link to="/" className="lg:hidden inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8">
                        <ArrowLeft size={14} /> Voltar
                    </Link>

                    <h2 className="text-heading mb-1">Cadastro</h2>
                    <p className="text-sm text-[var(--text-secondary)] mb-8">Preencha os dados para começar</p>

                    {error && (
                        <div className="vc-toast vc-toast-coral mb-6">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        <Input
                            label="Nome"
                            type="text"
                            icon={User}
                            value={name}
                            onChange={(e) => { setName(e.target.value); setFieldErrors(prev => ({ ...prev, name: "" })); }}
                            onKeyDown={handleKeyDown}
                            placeholder="Seu nome"
                            error={fieldErrors.name}
                            disabled={isLoading}
                        />

                        <Input
                            label="Email"
                            type="email"
                            icon={Mail}
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: "" })); }}
                            onKeyDown={handleKeyDown}
                            placeholder="seu@email.com"
                            error={fieldErrors.email}
                            disabled={isLoading}
                        />

                        <Input
                            label="Senha"
                            type={showPassword ? "text" : "password"}
                            icon={Lock}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: "" })); }}
                            onKeyDown={handleKeyDown}
                            placeholder="Mínimo 8 caracteres"
                            error={fieldErrors.password}
                            disabled={isLoading}
                        />

                        <Input
                            label="Confirmar Senha"
                            type={showConfirmPassword ? "text" : "password"}
                            icon={Lock}
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(prev => ({ ...prev, confirmPassword: "" })); }}
                            onKeyDown={handleKeyDown}
                            placeholder="Repita a senha"
                            error={fieldErrors.confirmPassword}
                            disabled={isLoading}
                        />

                        <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                            {isLoading ? "Criando conta..." : "Cadastrar"}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
                        Já tem uma conta?{" "}
                        <Link to="/login" className="text-[var(--accent-coral-2)] hover:underline font-medium">Entrar</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
