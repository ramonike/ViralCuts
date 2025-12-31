import { useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';

/**
 * Mensagens de erro amigáveis para códigos comuns
 */
const ERROR_MESSAGES = {
    // Network errors
    'NETWORK_ERROR': 'Erro de conexão. Verifique sua internet.',
    'TIMEOUT': 'A requisição demorou muito. Tente novamente.',
    
    // Auth errors
    'UNAUTHORIZED': 'Sessão expirada. Faça login novamente.',
    'FORBIDDEN': 'Você não tem permissão para esta ação.',
    
    // YouTube API errors
    'quotaExceeded': 'Cota da API do YouTube excedida. Tente novamente amanhã.',
    'YOUTUBE_AUTH_EXPIRED': 'Token do YouTube expirado. Reconecte sua conta.',
    
    // Upload errors
    'UPLOAD_FAILED': 'Falha no upload. Tente novamente.',
    'FILE_TOO_LARGE': 'Arquivo muito grande. Máximo permitido: 256MB.',
    'INVALID_FORMAT': 'Formato de arquivo não suportado.',
    
    // Generic
    'UNKNOWN': 'Ocorreu um erro inesperado. Tente novamente.'
};

/**
 * Extrai código de erro de diferentes formatos de erro
 */
function extractErrorCode(error) {
    if (typeof error === 'string') {
        // Verifica se a string contém algum código conhecido
        for (const code of Object.keys(ERROR_MESSAGES)) {
            if (error.toLowerCase().includes(code.toLowerCase())) {
                return code;
            }
        }
        return null;
    }
    
    if (error?.code) return error.code;
    if (error?.response?.data?.code) return error.response.data.code;
    if (error?.message) {
        for (const code of Object.keys(ERROR_MESSAGES)) {
            if (error.message.toLowerCase().includes(code.toLowerCase())) {
                return code;
            }
        }
    }
    
    return null;
}

/**
 * Hook para tratamento centralizado de erros
 */
export function useErrorHandler() {
    const notification = useNotification();

    /**
     * Trata um erro e exibe notificação apropriada
     * @param {Error|string} error - O erro a ser tratado
     * @param {Object} options - Opções adicionais
     * @param {string} options.fallbackMessage - Mensagem padrão se não encontrar tradução
     * @param {string} options.context - Contexto do erro (ex: "upload", "auth")
     * @param {boolean} options.silent - Se true, não exibe notificação
     * @param {Function} options.onRetry - Callback para ação de retry
     */
    const handleError = useCallback((error, options = {}) => {
        const { 
            fallbackMessage = 'Ocorreu um erro. Tente novamente.',
            context = '',
            silent = false,
            onRetry = null
        } = options;

        // Log para debugging
        console.error(`[ErrorHandler${context ? ` - ${context}` : ''}]`, error);

        if (silent) return;

        // Extrai código e mensagem
        const errorCode = extractErrorCode(error);
        const message = errorCode 
            ? ERROR_MESSAGES[errorCode] 
            : (error?.message || fallbackMessage);

        // Determina o título baseado no contexto
        let title = 'Erro';
        if (context) {
            const contextTitles = {
                'upload': 'Erro no Upload',
                'auth': 'Erro de Autenticação',
                'youtube': 'Erro do YouTube',
                'network': 'Erro de Conexão',
                'settings': 'Erro nas Configurações'
            };
            title = contextTitles[context] || `Erro - ${context}`;
        }

        // Exibe notificação
        notification.error(message, {
            title,
            duration: 8000,
            action: onRetry ? {
                label: 'Tentar novamente',
                onClick: onRetry
            } : null
        });

        return { errorCode, message };
    }, [notification]);

    /**
     * Wrapper para funções async com tratamento de erro automático
     */
    const withErrorHandling = useCallback((asyncFn, options = {}) => {
        return async (...args) => {
            try {
                return await asyncFn(...args);
            } catch (error) {
                handleError(error, options);
                throw error; // Re-throw para permitir tratamento adicional
            }
        };
    }, [handleError]);

    /**
     * Trata erros específicos do YouTube
     */
    const handleYouTubeError = useCallback((error) => {
        const message = error?.message || '';
        
        if (message.includes('quota')) {
            notification.warning(ERROR_MESSAGES.quotaExceeded, {
                title: 'Limite de API',
                duration: 10000
            });
            return 'quota';
        }
        
        if (message.includes('auth') || message.includes('token')) {
            notification.error(ERROR_MESSAGES.YOUTUBE_AUTH_EXPIRED, {
                title: 'Autenticação',
                action: {
                    label: 'Reconectar',
                    onClick: () => window.location.href = '/dashboard/settings'
                }
            });
            return 'auth';
        }
        
        handleError(error, { context: 'youtube' });
        return 'unknown';
    }, [notification, handleError]);

    /**
     * Trata erros de upload
     */
    const handleUploadError = useCallback((error, onRetry = null) => {
        handleError(error, { 
            context: 'upload',
            onRetry
        });
    }, [handleError]);

    return {
        handleError,
        withErrorHandling,
        handleYouTubeError,
        handleUploadError
    };
}
