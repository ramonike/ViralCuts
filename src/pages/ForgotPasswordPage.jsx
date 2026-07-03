import { useState } from "react";
import { API_ENDPOINTS, API_URL } from '../config/api';
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
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
            <div className="vc-auth-shell">
                <div className="vc-auth-form">
                    <div className="vc-auth-form-inner">
                        <Card>
                            <CardHeader>
                                <CardTitle>Email Enviado!</CardTitle>
                                <CardDescription>Verifique sua caixa de entrada</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-[var(--text-secondary)] mb-4">
                                    Se o email <strong>{email}</strong> estiver cadastrado, você receberá instruções para resetar sua senha.
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Não recebeu o email? Verifique sua pasta de spam.
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Link to="/login" className="w-full">
                                    <Button className="w-full">Voltar para Login</Button>
                                </Link>
                            </CardFooter>
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
                    <h1 className="text-display mb-4">Esqueceu sua senha?</h1>
                    <p className="text-lg text-[var(--text-secondary)]" style={{ lineHeight: 1.6 }}>
                        Sem problemas. Digite seu email e enviaremos instruções para criar uma nova senha.
                    </p>
                </div>
            </div>
            <div className="vc-auth-form">
                <div className="vc-auth-form-inner">
                    <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8">
                        <ArrowLeft size={14} /> Voltar ao login
                    </Link>

                    <h2 className="text-heading mb-1">Resetar senha</h2>
                    <p className="text-sm text-[var(--text-secondary)] mb-8">Digite seu email para receber instruções</p>

                    {error && (
                        <div className="vc-toast vc-toast-coral mb-6">
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-5">
                        <Input
                            label="Email"
                            type="email"
                            icon={Mail}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="seu@email.com"
                            disabled={loading}
                        />
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
