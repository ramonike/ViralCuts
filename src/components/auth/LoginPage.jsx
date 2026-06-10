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
        <div data-theme={isDark ? "dark" : "light"} style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex" }}>

            {/* Theme toggle */}
            <button
                onClick={toggleTheme}
                style={{
                    position: "fixed", top: 16, right: 16, zIndex: 50,
                    padding: "8px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                }}
            >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* ── Brand panel (desktop only) ──────────────────────── */}
            <div style={{
                width: "44%",
                background: "var(--bg-secondary)",
                borderRight: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                padding: "48px",
                position: "relative",
                overflow: "hidden",
            }}
                className="hidden lg:flex"
            >
                {/* Grid decorativo — frame rate vibes */}
                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                    pointerEvents: "none",
                }} />
                {/* Glow coral */}
                <div style={{
                    position: "absolute", bottom: -100, right: -100,
                    width: 400, height: 400,
                    background: "radial-gradient(circle, rgba(232,65,42,0.12) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                {/* Conteúdo */}
                <div style={{ position: "relative", zIndex: 1 }}>
                    <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 48 }}>
                        <div className="vc-logo-mark">VC</div>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
                            ViralCuts
                        </span>
                    </Link>

                    <h2 style={{
                        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "2.25rem",
                        color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1.05,
                        margin: "0 0 16px",
                    }}>
                        Distribua mais.<br />
                        <span style={{ color: "var(--accent-coral)" }}>Edite menos.</span>
                    </h2>
                    <p style={{ margin: "0 0 40px", fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        O hub de automação e distribuição multicanais para criadores de Shorts.
                    </p>

                    {/* Features list */}
                    {[
                        "Upload automático em lote para YouTube, TikTok e Reels",
                        "Títulos e descrições otimizados por IA com 1 clique",
                        "Timeline visual com horários de pico do seu canal",
                    ].map((feat, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
                            <div style={{
                                width: 18, height: 18, borderRadius: 3, flexShrink: 0, marginTop: 1,
                                background: "var(--accent-coral-3)",
                                border: "1px solid rgba(232,65,42,0.25)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <div style={{ width: 4, height: 4, borderRadius: 1, background: "var(--accent-coral)" }} />
                            </div>
                            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{feat}</span>
                        </div>
                    ))}
                </div>

                {/* Stat strip na base */}
                <div style={{ position: "relative", zIndex: 1, marginTop: "auto", display: "flex", gap: 32 }}>
                    {[["1.2K+", "Criadores"], ["50M+", "Views geradas"], ["350+", "Canais"]].map(([v, l]) => (
                        <div key={l}>
                            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.375rem", color: "var(--text-primary)", letterSpacing: "-0.04em" }}>{v}</div>
                            <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{l}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Form panel ─────────────────────────────────────── */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 32px" }}>
                <div style={{ width: "100%", maxWidth: 380 }}>

                    {/* Mobile back */}
                    <Link to="/" style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        fontSize: "0.8125rem", color: "var(--text-muted)",
                        textDecoration: "none", marginBottom: 32,
                        fontFamily: "var(--font-body)",
                    }} className="lg:hidden">
                        <ArrowLeft size={14} /> Voltar
                    </Link>

                    {/* Heading */}
                    <div style={{ marginBottom: 32 }}>
                        <h1 style={{
                            margin: "0 0 6px", fontFamily: "var(--font-display)", fontWeight: 700,
                            fontSize: "1.625rem", color: "var(--text-primary)", letterSpacing: "-0.03em",
                        }}>
                            Bem-vindo de volta
                        </h1>
                        <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--text-muted)" }}>
                            Entre na sua conta para continuar
                        </p>
                    </div>

                    {/* Success */}
                    {successMessage && (
                        <div className="vc-toast vc-toast-teal" style={{ marginBottom: 20 }}>
                            <p style={{ margin: 0, fontSize: "0.875rem" }}>{successMessage}</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="vc-toast vc-toast-coral" style={{ marginBottom: 20 }}>
                            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                            <p style={{ margin: 0, fontSize: "0.875rem" }}>{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Email */}
                        <div>
                            <label className="vc-label">Email</label>
                            <div className="vc-input-wrap">
                                <Mail size={16} className="vc-input-icon-left" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: "" })); }}
                                    onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                                    placeholder="seu@email.com"
                                    className={`vc-input has-icon-left${fieldErrors.email ? " error" : ""}`}
                                />
                            </div>
                            {fieldErrors.email && (
                                <p style={{ margin: "5px 0 0", fontSize: "0.75rem", color: "var(--accent-coral)" }}>{fieldErrors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <label className="vc-label" style={{ marginBottom: 0 }}>Senha</label>
                                <Link to="/forgot-password" style={{ fontSize: "0.75rem", color: "var(--accent-coral-2)", textDecoration: "none", fontWeight: 500 }}>
                                    Esqueceu?
                                </Link>
                            </div>
                            <div className="vc-input-wrap">
                                <Lock size={16} className="vc-input-icon-left" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: "" })); }}
                                    onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                                    placeholder="••••••••"
                                    className={`vc-input has-icon-left${fieldErrors.password ? " error" : ""}`}
                                    style={{ paddingRight: 40 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                                        background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0,
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p style={{ margin: "5px 0 0", fontSize: "0.75rem", color: "var(--accent-coral)" }}>{fieldErrors.password}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="vc-btn vc-btn-primary"
                            style={{ justifyContent: "center", marginTop: 4 }}
                        >
                            {loading ? (
                                <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Entrando...</>
                            ) : (
                                "Entrar"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="vc-divider" style={{ margin: "24px 0" }}>ou</div>

                    {/* Register */}
                    <p style={{ margin: 0, textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                        Não tem conta?{" "}
                        <Link to="/register" style={{ color: "var(--accent-coral-2)", fontWeight: 600, textDecoration: "none" }}>
                            Criar conta grátis
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
