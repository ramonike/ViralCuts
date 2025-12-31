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
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Redirecionar se já estiver autenticado
    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || "/dashboard";
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    // Mensagem de sucesso vinda do registro ou reset de senha
    const successMessage = location.state?.message;

    const validateForm = () => {
        const errors = {};
        
        if (!email) {
            errors.email = "Email é obrigatório";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Email inválido";
        }
        
        if (!password) {
            errors.password = "Senha é obrigatória";
        }
        
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
            console.log('[LoginPage] Calling signIn...');
            const result = await signIn(email, password);
            console.log('[LoginPage] signIn result:', result);

            if (result.success) {
                console.log('[LoginPage] Login successful, navigating to dashboard...');
                // Redirecionar para a página anterior ou dashboard
                const from = location.state?.from?.pathname || "/dashboard";
                
                // Usar window.location como fallback se navigate não funcionar
                try {
                    navigate(from, { replace: true });
                    // Se ainda estiver na mesma página após 100ms, forçar redirect
                    setTimeout(() => {
                        if (window.location.pathname === '/login') {
                            console.log('[LoginPage] Navigate failed, using window.location');
                            window.location.href = from;
                        }
                    }, 100);
                } catch (navError) {
                    console.error('[LoginPage] Navigate error:', navError);
                    window.location.href = from;
                }
            } else {
                // Traduzir mensagens de erro comuns
                let errorMessage = result.error;
                if (result.error?.includes("Invalid credentials") || result.error?.includes("invalid")) {
                    errorMessage = "Email ou senha incorretos";
                } else if (result.error?.includes("rate limit") || result.error?.includes("Too many")) {
                    errorMessage = "Muitas tentativas. Aguarde alguns minutos.";
                } else if (result.error?.includes("not found")) {
                    errorMessage = "Usuário não encontrado";
                }
                setError(errorMessage || "Erro ao fazer login");
                setLoading(false);
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Erro ao conectar com o servidor. Tente novamente.");
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleLogin(e);
        }
    };

    return (
        <div className={`min-h-screen flex ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className={`fixed top-4 right-4 z-50 p-2.5 rounded-lg border transition-all ${
                    isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-sm'
                }`}
                title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Lado esquerdo - Branding */}
            <div className={`hidden lg:flex lg:w-1/2 items-center justify-center p-12 ${isDark ? 'bg-slate-800' : 'bg-white border-r border-gray-200'}`}>
                <div className="max-w-md">
                    <Link to="/" className={`inline-flex items-center gap-2 mb-8 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                        <ArrowLeft className="w-4 h-4" />
                        Voltar ao início
                    </Link>
                    <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>ViralCuts</h1>
                    <p className={`text-lg mb-8 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        Gerencie seus vídeos, acompanhe métricas e cresça seu canal com inteligência.
                    </p>
                    <div className="space-y-4">
                        <div className={`flex items-center gap-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Upload automático para múltiplas plataformas</span>
                        </div>
                        <div className={`flex items-center gap-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Analytics detalhados do seu canal</span>
                        </div>
                        <div className={`flex items-center gap-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Agendamento inteligente de publicações</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lado direito - Formulário */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile: Link voltar */}
                    <Link to="/" className={`lg:hidden inline-flex items-center gap-2 mb-8 transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Link>

                    <div className="mb-8">
                        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Bem-vindo de volta</h2>
                        <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Entre na sua conta para continuar</p>
                    </div>

                    {/* Mensagem de sucesso */}
                    {successMessage && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-green-400 text-sm">{successMessage}</p>
                        </div>
                    )}

                    {/* Mensagem de erro */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                Email
                            </label>
                            <div className="relative">
                                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setFieldErrors(prev => ({ ...prev, email: "" }));
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="seu@email.com"
                                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                        fieldErrors.email 
                                            ? "border-red-500 focus:ring-red-500/20" 
                                            : isDark 
                                                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                                    }`}
                                    disabled={loading}
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="mt-1.5 text-sm text-red-400">{fieldErrors.email}</p>
                            )}
                        </div>

                        {/* Senha */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                    Senha
                                </label>
                                <Link 
                                    to="/forgot-password" 
                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Esqueceu a senha?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setFieldErrors(prev => ({ ...prev, password: "" }));
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="••••••••"
                                    className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                        fieldErrors.password 
                                            ? "border-red-500 focus:ring-red-500/20" 
                                            : isDark 
                                                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                                    }`}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="mt-1.5 text-sm text-red-400">{fieldErrors.password}</p>
                            )}
                        </div>

                        {/* Botão de login */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                "Entrar"
                            )}
                        </button>
                    </form>

                    {/* Link para cadastro */}
                    <p className={`mt-8 text-center ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        Não tem uma conta?{" "}
                        <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            Criar conta
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
