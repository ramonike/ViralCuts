import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, ArrowLeft, Sun, Moon } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || "/dashboard";
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    const successMessage = location.state?.message;

    const validateForm = () => {
        const errors = {};
        if (!email) errors.email = "Email é obrigatório";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email inválido";
        if (!password) errors.password = "Senha é obrigatória";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleLogin = async (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        setError("");
        if (!validateForm()) return;
        setLoading(true);
        try {
            const result = await signIn(email, password);
            if (result.success) {
                const from = location.state?.from?.pathname || "/dashboard";
                navigate(from, { replace: true });
                setTimeout(() => {
                    if (window.location.pathname === "/login") window.location.href = from;
                }, 100);
            } else {
                let msg = result.error;
                if (msg?.includes("Invalid credentials") || msg?.includes("invalid")) msg = "Email ou senha incorretos";
                else if (msg?.includes("rate limit") || msg?.includes("Too many")) msg = "Muitas tentativas. Aguarde alguns minutos.";
                else if (msg?.includes("not found")) msg = "Usuário não encontrado";
                setError(msg || "Erro ao fazer login");
                setLoading(false);
            }
        } catch (err) {
            setError("Erro ao conectar com o servidor. Tente novamente.");
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <button onClick={toggleTheme} style={{ position: "fixed", top: 16, right: 16, zIndex: 50, padding: 8, background: "var(--bg-card2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text2)", cursor: "pointer" }}>
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="auth-brand">
                <Link to="/" style={{ textDecoration: "none" }}>
                    <div className="logo">ViralCuts</div>
                </Link>
                <h2>Distribua mais.<br /><em>Edite menos.</em></h2>
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

                    <h1>Bem-vindo de volta</h1>
                    <p className="subtitle">Entre na sua conta para continuar</p>

                    {successMessage && (
                        <div className="vc-toast vc-toast-teal" style={{ marginBottom: 20 }}>
                            <p style={{ margin: 0, fontSize: 14 }}>{successMessage}</p>
                        </div>
                    )}

                    {error && (
                        <div className="vc-toast vc-toast-coral" style={{ marginBottom: 20 }}>
                            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                            <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                            <label className="vc-label">Email</label>
                            <div className="vc-input-wrap">
                                <Mail size={16} className="vc-input-icon-left" />
                                <input type="email" value={email}
                                    onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: "" })); }}
                                    onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                                    placeholder="seu@email.com"
                                    className={"vc-input has-icon-left" + (fieldErrors.email ? " error" : "")} />
                            </div>
                            {fieldErrors.email && <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--coral-2)" }}>{fieldErrors.email}</p>}
                        </div>

                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <label className="vc-label" style={{ marginBottom: 0 }}>Senha</label>
                                <Link to="/forgot-password" style={{ fontSize: 12, color: "var(--coral-2)", textDecoration: "none", fontWeight: 500 }}>
                                    Esqueceu?
                                </Link>
                            </div>
                            <div className="vc-input-wrap">
                                <Lock size={16} className="vc-input-icon-left" />
                                <input type={showPassword ? "text" : "password"} value={password}
                                    onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: "" })); }}
                                    onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                                    placeholder="••••••••"
                                    className={"vc-input has-icon-left" + (fieldErrors.password ? " error" : "")}
                                    style={{ paddingRight: 40 }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text3)", cursor: "pointer", padding: 0 }}>
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {fieldErrors.password && <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--coral-2)" }}>{fieldErrors.password}</p>}
                        </div>

                        <button type="submit" disabled={loading} className="vc-btn vc-btn-primary" style={{ justifyContent: "center", marginTop: 4 }}>
                            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Entrando...</> : "Entrar"}
                        </button>
                    </form>

                    <div className="vc-divider" style={{ margin: "24px 0" }}>ou</div>

                    <p style={{ margin: 0, textAlign: "center", fontSize: 14, color: "var(--text3)" }}>
                        Não tem conta?{" "}
                        <Link to="/register" style={{ color: "var(--coral-2)", fontWeight: 600, textDecoration: "none" }}>
                            Criar conta grátis
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
