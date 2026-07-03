import { useState, useEffect } from "react";
import { API_ENDPOINTS, API_URL } from '../config/api';
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Lock, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) setError("Token inválido. Solicite um novo reset de senha.");
    }, [token]);

    const handleSubmit = async () => {
        if (!newPassword || !confirmPassword) { setError("Preencha todos os campos"); return; }
        if (newPassword.length < 6) { setError("A senha deve ter pelo menos 6 caracteres"); return; }
        if (newPassword !== confirmPassword) { setError("As senhas não coincidem"); return; }
        setLoading(true); setError("");
        try {
            const response = await fetch(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
                method: "POST", headers: { "Content-Type": "application/json" },
                credentials: "include", body: JSON.stringify({ token, newPassword })
            });
            const data = await response.json();
            if (response.ok) { setSuccess(true); setTimeout(() => navigate("/login"), 2000); }
            else { setError(data.error || "Erro ao resetar senha"); }
        } catch (err) {
            console.error("Reset password error:", err);
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
                                <Lock size={24} style={{ color: "var(--teal)" }} />
                            </div>
                            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Senha Alterada!</h1>
                            <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6 }}>Sua senha foi alterada com sucesso. Redirecionando para o login...</p>
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
                <h2>Nova senha</h2>
                <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.6, marginBottom: 24 }}>
                    Escolha uma senha forte para proteger sua conta ViralCuts.
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
                    <p className="subtitle">Digite sua nova senha</p>
                    {error && (
                        <div className="vc-toast vc-toast-coral mb-6">
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="space-y-5">
                        <Input label="Nova Senha" type="password" icon={Lock} value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres" disabled={loading || !token} />
                        <Input label="Confirmar Senha" type="password" icon={Lock} value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="Repita a senha" disabled={loading || !token} />
                    </div>
                    <div className="flex flex-col gap-3 mt-8">
                        <Button className="w-full" onClick={handleSubmit} disabled={loading || !token} size="lg">
                            {loading ? "Resetando..." : "Resetar Senha"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
