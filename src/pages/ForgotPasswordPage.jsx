import { useState } from "react";
import { API_ENDPOINTS, API_URL } from '../config/api';
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email) { setError("Por favor, insira seu email"); return; }
        setLoading(true); setError("");
        try {
            const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
                method: "POST", headers: { "Content-Type": "application/json" },
                credentials: "include", body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess(true);
                if (data.token) {
                    console.log("Reset token (DEV ONLY):", data.token);
                    console.log("Reset link:", `http://localhost:5173/reset-password?token=${data.token}`);
                }
            } else {
                setError(data.error || "Erro ao solicitar reset de senha");
            }
        } catch (err) {
            console.error("Forgot password error:", err);
            setError("Erro ao conectar com o servidor");
        } finally { setLoading(false); }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-form">
                    <div className="form-wrap">
                        <div className="card" style={{ textAlign: "center", padding: 40 }}>
                            <div style={{ width: 48, height: 48, borderRadius: "var(--radius)", background: "var(--teal-3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                                <Mail size={24} style={{ color: "var(--teal)" }} />
                            </div>
                            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Email Enviado!</h1>
                            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 16, lineHeight: 1.6 }}>
                                Se o email <strong>{email}</strong> estiver cadastrado, você receberá instruções para resetar sua senha.
                            </p>
                            <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 24 }}>Não recebeu o email? Verifique sua pasta de spam.</p>
                            <Link to="/login"><Button className="w-full">Voltar para Login</Button></Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-brand">
                <Link to="/" style={{ textDecoration: "none" }}>
                    <div className="logo">ViralCuts</div>
                </Link>
                <h2>Esqueceu<br />sua senha?</h2>
                <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6, marginBottom: 24 }}>
                    Sem problemas. Digite seu email e enviaremos instruções para criar uma nova senha.
                </p>
                <div className="features">
                    <div className="feature">Upload automático para múltiplas plataformas</div>
                    <div className="feature">Analytics detalhados do seu canal</div>
                </div>
            </div>
            <div className="auth-form">
                <div className="form-wrap">
                    <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text3)", textDecoration: "none", marginBottom: 32 }}>
                        <ArrowLeft size={14} /> Voltar ao login
                    </Link>
                    <h1>Resetar senha</h1>
                    <p className="subtitle">Digite seu email para receber instruções</p>
                    {error && (
                        <div className="vc-toast vc-toast-coral mb-6">
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="space-y-5">
                        <Input label="Email" type="email" icon={Mail} value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="seu@email.com" disabled={loading} />
                    </div>
                    <div className="flex flex-col gap-3 mt-8">
                        <Button className="w-full" onClick={handleSubmit} disabled={loading} size="lg">
                            {loading ? "Enviando..." : "Enviar Instruções"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
