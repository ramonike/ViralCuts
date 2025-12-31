import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Loader2, ArrowLeft, Sun, Moon } from "lucide-react";

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

        if (!name || name.length < 2) {
            errors.name = "Nome deve ter pelo menos 2 caracteres";
        }

        if (!email) {
            errors.email = "Email é obrigatório";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Email inválido";
        }

        if (!password) {
            errors.password = "Senha é obrigatória";
        } else if (password.length < 8) {
            errors.password = "Senha deve ter pelo menos 8 caracteres";
        } else {
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumbers = /\d/.test(password);
            if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
                errors.password = "Use letras maiúsculas, minúsculas e números";
            }
        }

        if (!confirmPassword) {
            errors.confirmPassword = "Confirme sua senha";
        } else if (password !== confirmPassword) {
            errors.confirmPassword = "As senhas não coincidem";
        }

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

            if (result.success) {
                navigate("/dashboard", { replace: true });
            } else {
                let errorMessage = result.error;
                if (result.error?.includes("already exists") || result.error?.includes("already registered")) {
                    errorMessage = "Este email já está cadastrado";
                } else if (result.error?.includes("rate limit")) {
                    errorMessage = "Muitas tentativas. Aguarde alguns minutos.";
                }
                setError(errorMessage || "Erro ao criar conta");
            }
        } catch (err) {
            console.error("Register error:", err);
            setError("Erro ao conectar com o servidor");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleRegister(e);
        }
    };

    return (
        <div className={`min-h-screen flex ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
            {/* DEBUG: New RegisterPage v2 */}
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
                        Crie sua conta e comece a gerenciar seus vídeos de forma inteligente.
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
                        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Criar conta</h2>
                        <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Preencha os dados para começar</p>
                    </div>

                    {/* Mensagem de erro */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Nome */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                Nome
                            </label>
                            <div className="relative">
                                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setFieldErrors(prev => ({ ...prev, name: "" }));
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Seu nome"
                                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                        fieldErrors.name 
                                            ? "border-red-500 focus:ring-red-500/20" 
                                            : isDark 
                                                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                                    }`}
                                    disabled={isLoading}
                                    autoComplete="name"
                                />
                            </div>
                            {fieldErrors.name && (
                                <p className="mt-1.5 text-sm text-red-400">{fieldErrors.name}</p>
                            )}
                        </div>

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
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="mt-1.5 text-sm text-red-400">{fieldErrors.email}</p>
                            )}
                        </div>

                        {/* Senha */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                Senha
                            </label>
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
                                    placeholder="Mínimo 8 caracteres"
                                    className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                        fieldErrors.password 
                                            ? "border-red-500 focus:ring-red-500/20" 
                                            : isDark 
                                                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                                    }`}
                                    disabled={isLoading}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {fieldErrors.password ? (
                                <p className="mt-1.5 text-sm text-red-400">{fieldErrors.password}</p>
                            ) : (
                                <p className={`mt-1.5 text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                                    Use letras maiúsculas, minúsculas e números
                                </p>
                            )}
                        </div>

                        {/* Confirmar Senha */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                Confirmar Senha
                            </label>
                            <div className="relative">
                                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Repita a senha"
                                    className={`w-full pl-11 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                                        fieldErrors.confirmPassword 
                                            ? "border-red-500 focus:ring-red-500/20" 
                                            : isDark 
                                                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                                                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500/20 focus:border-blue-500"
                                    }`}
                                    disabled={isLoading}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {fieldErrors.confirmPassword && (
                                <p className="mt-1.5 text-sm text-red-400">{fieldErrors.confirmPassword}</p>
                            )}
                        </div>

                        {/* Botão de cadastro */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Criando conta...
                                </>
                            ) : (
                                "Cadastrar"
                            )}
                        </button>
                    </form>

                    {/* Link para login */}
                    <p className={`mt-8 text-center ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        Já tem uma conta?{" "}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
