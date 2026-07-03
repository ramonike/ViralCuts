import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS, API_URL } from '../config/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying');
    const [message, setMessage] = useState('');
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token de verificação não encontrado.');
            return;
        }

        fetch(`${API_ENDPOINTS.AUTH.VERIFY_EMAIL}?token=${token}`, {
            method: 'GET',
            credentials: 'include',
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setStatus('success');
                    setMessage('Email verificado com sucesso!');
                    setTimeout(() => navigate('/login'), 3000);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Falha na verificação do email.');
                }
            })
            .catch((err) => {
                setStatus('error');
                setMessage('Erro ao verificar email. Tente novamente.');
                console.error(err);
            });
    }, [token, navigate]);

    return (
        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-default)",
                padding: "24px"
            }}
        >
            <div
                className="vc-card"
                style={{
                    width: "100%",
                    maxWidth: "440px",
                    padding: "32px"
                }}
            >
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                    <h1
                        style={{
                            margin: "0 0 4px",
                            fontSize: "1.625rem",
                            fontWeight: 700,
                            letterSpacing: "-.03em",
                            color: "var(--text-primary)"
                        }}
                    >
                        Verificação de Email
                    </h1>
                </div>

                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                    {status === 'verifying' && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "1rem"
                            }}
                        >
                            <div
                                style={{
                                    width: "50px",
                                    height: "50px",
                                    border: "4px solid var(--border-default)",
                                    borderTopColor: "var(--accent-amber)",
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite"
                                }}
                            ></div>
                            <p style={{ margin: 0, color: "var(--text-primary)" }}>
                                Verificando seu email...
                            </p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "1rem"
                            }}
                        >
                            <div
                                style={{
                                    width: "80px",
                                    height: "80px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "3rem",
                                    fontWeight: "bold",
                                    color: "white",
                                    background: "linear-gradient(135deg, var(--accent-coral), var(--accent-amber))"
                                }}
                            >
                                ✓
                            </div>
                            <h2 style={{ margin: 0, color: "var(--text-primary)" }}>
                                Email Verificado!
                            </h2>
                            <p style={{ margin: 0, color: "var(--text-primary)" }}>{message}</p>
                            <p
                                style={{
                                    margin: "0.5rem 0 0",
                                    color: "var(--text-muted)",
                                    fontSize: "0.9rem"
                                }}
                            >
                                Redirecionando para o login...
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "1rem"
                            }}
                        >
                            <div
                                style={{
                                    width: "80px",
                                    height: "80px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "3rem",
                                    fontWeight: "bold",
                                    color: "white",
                                    background: "linear-gradient(135deg, var(--accent-amber), var(--accent-coral))"
                                }}
                            >
                                ✕
                            </div>
                            <h2 style={{ margin: 0, color: "var(--text-primary)" }}>
                                Erro na Verificação
                            </h2>
                            <p style={{ margin: 0, color: "var(--text-primary)" }}>{message}</p>
                            <button
                                onClick={() => navigate('/login')}
                                className="vc-btn vc-btn-primary"
                                style={{ marginTop: "1rem" }}
                            >
                                Voltar para o Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
