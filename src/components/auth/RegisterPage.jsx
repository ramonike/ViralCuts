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
        <div className="auth-page">
            <button onClick={toggleTheme} style={{ position: "fixed", top: 16, right: 16, zIndex: 50, padding: 8, background: "var(--bg-card2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text2)", cursor: "pointer" }}>
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="auth-brand">
                <Link to="/" style={{ textDecoration: "none" }}>
                    <div className="logo">ViralCuts</div>
                </Link>
                <h2>Crie sua conta<br /><em>e comece agora</em></h2>
                <div className="features">
                    <div className="feature">Upload automático para múltiplas plataformas</div>
                    <div className="feature">Analytics detalhados do seu canal</div>
                    <div className="feature">Agendamento inteligente de publicações</div>
                </div>
                <div className="stats-bar">
                    <div className="stat-item"><div className="num">1.2K+</div><div className="desc">Criadores</div></div>
                    <div className="stat-item"><div className="num">50M+</div><div className="desc">Views geradas</div></div>
                    <div className="stat-item"><div className="num">350+</div><div className="desc">Canais</div></div>
                </div>
            </div>

            <div className="auth-form">
                <div className="form-wrap">
                    <Link to="/" className="lg:hidden" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text3)", textDecoration: "none", marginBottom: 32 }}>
                        <ArrowLeft size={14} /> Voltar
                    </Link>

                    <h1>Criar conta</h1>
                    <p className="subtitle">Preencha os dados para começar</p>

                    {error && (
                        <div className="vc-toast vc-toast-coral mb-6">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        <Input label="Nome" type="text" icon={User} value={name}
                            onChange={(e) => { setName(e.target.value); setFieldErrors(prev => ({ ...prev, name: "" })); }}
                            onKeyDown={handleKeyDown} placeholder="Seu nome" error={fieldErrors.name} disabled={isLoading} />
                        <Input label="Email" type="email" icon={Mail} value={email}
                            onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: "" })); }}
                            onKeyDown={handleKeyDown} placeholder="seu@email.com" error={fieldErrors.email} disabled={isLoading} />
                        <Input label="Senha" type={showPassword ? "text" : "password"} icon={Lock} value={password}
                            onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: "" })); }}
                            onKeyDown={handleKeyDown} placeholder="Mínimo 8 caracteres" error={fieldErrors.password} disabled={isLoading} />
                        <Input label="Confirmar Senha" type={showConfirmPassword ? "text" : "password"} icon={Lock} value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(prev => ({ ...prev, confirmPassword: "" })); }}
                            onKeyDown={handleKeyDown} placeholder="Repita a senha" error={fieldErrors.confirmPassword} disabled={isLoading} />
                        <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                            {isLoading ? "Criando conta..." : "Cadastrar"}
                        </Button>
                    </form>

                    <p style={{ marginTop: 32, textAlign: "center", fontSize: 14, color: "var(--text3)" }}>
                        Já tem uma conta?{" "}
                        <Link to="/login" style={{ color: "var(--coral-2)", fontWeight: 600, textDecoration: "none" }}>Entrar</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
