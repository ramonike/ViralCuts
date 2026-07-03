import { useState, useEffect } from "react";
import { API_ENDPOINTS, API_URL } from '../config/api';
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
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
            <div className="vc-auth-shell">
                <div className="vc-auth-form">
                    <div className="vc-auth-form-inner">
                        <Card>
                            <CardHeader>
                                <CardTitle>Senha Alterada!</CardTitle>
                                <CardDescription>Sua senha foi alterada com sucesso</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Redirecionando para a página de login...
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="vc-auth-shell">
            <div className="vc-auth-brand">
                <Link to="/" className="vc-logo" style={{ padding: 0, border: 'none', marginBottom: 32 }}>
                    <div className="vc-logo-mark">V</div>
                    <span className="vc-logo-text">ViralCuts</span>
                </Link>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h1 className="text-display mb-4">Nova senha</h1>
                    <p className="text-lg text-[var(--text-secondary)]" style={{ lineHeight: 1.6 }}>
                        Escolha uma senha forte para proteger sua conta ViralCuts.
                    </p>
                </div>
            </div>
            <div className="vc-auth-form">
                <div className="vc-auth-form-inner">
                    <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8">
                        <ArrowLeft size={14} /> Voltar ao login
                    </Link>

                    <h2 className="text-heading mb-1">Resetar senha</h2>
                    <p className="text-sm text-[var(--text-secondary)] mb-8">Digite sua nova senha</p>

                    {error && (
                        <div className="vc-toast vc-toast-coral mb-6">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-5">
                        <Input
                            label="Nova Senha"
                            type="password"
                            icon={Lock}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            disabled={loading || !token}
                        />
                        <Input
                            label="Confirmar Senha"
                            type="password"
                            icon={Lock}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="Repita a senha"
                            disabled={loading || !token}
                        />
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
