/**
 * ProtectedRoute - Componente para proteger rotas que requerem autenticação
 * Redireciona para login se não autenticado
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

function LoadingScreen({ message = "Carregando..." }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    return (
        <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>{message}</p>
            </div>
        </div>
    );
}

export function ProtectedRoute({ children, redirectTo = '/login' }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // Mostrar loading enquanto verifica autenticação
    if (loading) {
        return <LoadingScreen message="Verificando autenticação..." />;
    }

    // Redirecionar para login se não autenticado
    if (!isAuthenticated) {
        // Salvar a URL atual para redirecionar após login
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    return children;
}

/**
 * PublicRoute - Redireciona usuários autenticados para o dashboard
 * Útil para páginas como login/register que não devem ser acessadas por usuários logados
 */
export function PublicRoute({ children, redirectTo = '/dashboard' }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // Não mostrar loading para rotas públicas - deixar o componente filho lidar com isso
    // Isso evita flash de loading durante o processo de login
    
    // Redirecionar para dashboard se já autenticado (e não está carregando)
    if (!loading && isAuthenticated) {
        // Verificar se há uma URL de retorno
        const from = location.state?.from?.pathname || redirectTo;
        return <Navigate to={from} replace />;
    }

    return children;
}

/**
 * AuthRedirect - Componente para a página inicial
 * Redireciona para dashboard se autenticado, senão mostra a landing page
 */
export function AuthRedirect({ children, authenticatedRedirect = '/dashboard' }) {
    const { isAuthenticated, loading } = useAuth();

    // Mostrar loading enquanto verifica autenticação
    if (loading) {
        return <LoadingScreen />;
    }

    // Redirecionar para dashboard se autenticado
    if (isAuthenticated) {
        return <Navigate to={authenticatedRedirect} replace />;
    }

    return children;
}

export default ProtectedRoute;
