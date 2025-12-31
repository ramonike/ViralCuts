import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, XCircle, Loader2, Pause, Play, X } from 'lucide-react';

/**
 * Format bytes to human readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format remaining time estimate
 * @param {number} bytesUploaded - Bytes uploaded so far
 * @param {number} totalBytes - Total bytes
 * @param {number} startTime - Upload start timestamp
 * @returns {string} Formatted time remaining
 */
function formatTimeRemaining(bytesUploaded, totalBytes, startTime) {
    if (!startTime || bytesUploaded === 0) return '';
    
    const elapsed = (Date.now() - startTime) / 1000; // seconds
    const bytesPerSecond = bytesUploaded / elapsed;
    const remainingBytes = totalBytes - bytesUploaded;
    const remainingSeconds = remainingBytes / bytesPerSecond;
    
    if (remainingSeconds < 60) {
        return `${Math.ceil(remainingSeconds)}s restantes`;
    } else if (remainingSeconds < 3600) {
        return `${Math.ceil(remainingSeconds / 60)}min restantes`;
    }
    return `${Math.ceil(remainingSeconds / 3600)}h restantes`;
}

/**
 * Componente de progresso de upload com feedback visual
 * Requirements: 2.2 - Mostrar progresso real do upload
 */
export function UploadProgress({ 
    progress = 0, 
    status = 'idle', // 'idle' | 'initiating' | 'uploading' | 'paused' | 'processing' | 'success' | 'error'
    fileName = '',
    errorMessage = '',
    bytesUploaded = 0,
    totalBytes = 0,
    startTime = null,
    onRetry,
    onCancel,
    onPause,
    onResume,
}) {
    const statusConfig = {
        idle: {
            color: 'bg-slate-500',
            icon: Upload,
            text: 'Aguardando...',
            iconColor: 'text-slate-400',
            detailText: null,
        },
        initiating: {
            color: 'bg-blue-500',
            icon: Loader2,
            text: 'Iniciando upload...',
            iconColor: 'text-blue-400',
            animate: true,
            detailText: 'Preparando sessão de upload',
        },
        uploading: {
            color: 'bg-blue-500',
            icon: Loader2,
            text: `Enviando... ${progress}%`,
            iconColor: 'text-blue-400',
            animate: true,
            detailText: totalBytes > 0 
                ? `${formatBytes(bytesUploaded)} de ${formatBytes(totalBytes)}`
                : null,
        },
        paused: {
            color: 'bg-yellow-500',
            icon: Pause,
            text: `Pausado - ${progress}%`,
            iconColor: 'text-yellow-400',
            detailText: totalBytes > 0 
                ? `${formatBytes(bytesUploaded)} de ${formatBytes(totalBytes)}`
                : 'Clique em retomar para continuar',
        },
        processing: {
            color: 'bg-purple-500',
            icon: Loader2,
            text: 'Processando no YouTube...',
            iconColor: 'text-purple-400',
            animate: true,
            detailText: 'O vídeo está sendo processado',
        },
        success: {
            color: 'bg-green-500',
            icon: CheckCircle,
            text: 'Concluído!',
            iconColor: 'text-green-400',
            detailText: 'Upload finalizado com sucesso',
        },
        error: {
            color: 'bg-red-500',
            icon: XCircle,
            text: 'Erro no upload',
            iconColor: 'text-red-400',
            detailText: errorMessage || 'Ocorreu um erro durante o upload',
        }
    };

    const config = statusConfig[status] || statusConfig.idle;
    const Icon = config.icon;
    const timeRemaining = status === 'uploading' 
        ? formatTimeRemaining(bytesUploaded, totalBytes, startTime) 
        : '';

    return (
        <div 
            className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Upload de ${fileName}: ${config.text}`}
        >
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}/20`}>
                    <Icon 
                        className={`w-5 h-5 ${config.iconColor} ${config.animate ? 'animate-spin' : ''}`}
                        aria-hidden="true"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate" title={fileName}>
                        {fileName || 'Arquivo'}
                    </p>
                    <p className={`text-xs ${config.iconColor}`}>
                        {config.text}
                    </p>
                </div>
                
                {/* Quick action buttons in header */}
                {status === 'uploading' && onPause && (
                    <button
                        onClick={onPause}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        aria-label="Pausar upload"
                        title="Pausar"
                    >
                        <Pause className="w-4 h-4" />
                    </button>
                )}
                {status === 'paused' && onResume && (
                    <button
                        onClick={onResume}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                        aria-label="Retomar upload"
                        title="Retomar"
                    >
                        <Play className="w-4 h-4" />
                    </button>
                )}
                {(status === 'uploading' || status === 'paused' || status === 'initiating') && onCancel && (
                    <button
                        onClick={onCancel}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        aria-label="Cancelar upload"
                        title="Cancelar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Barra de progresso */}
            <div 
                className="h-2 bg-slate-700/50 rounded-full overflow-hidden"
                role="presentation"
            >
                <motion.div
                    className={`h-full ${config.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${status === 'success' ? 100 : progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                />
            </div>

            {/* Detail text and time remaining */}
            {(config.detailText || timeRemaining) && (
                <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-slate-400">
                        {config.detailText}
                    </p>
                    {timeRemaining && (
                        <p className="text-xs text-slate-500">
                            {timeRemaining}
                        </p>
                    )}
                </div>
            )}

            {/* Ações */}
            <AnimatePresence>
                {status === 'error' && onRetry && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-2 mt-3"
                    >
                        <button
                            onClick={onRetry}
                            className="flex-1 py-2 px-3 text-xs font-medium text-white bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-colors"
                            aria-label="Tentar novamente"
                        >
                            Tentar novamente
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Lista de uploads em progresso
 */
export function UploadProgressList({ uploads = [] }) {
    if (uploads.length === 0) return null;

    return (
        <div 
            className="space-y-2"
            role="region"
            aria-label="Uploads em andamento"
            aria-live="polite"
        >
            <AnimatePresence mode="popLayout">
                {uploads.map((upload) => (
                    <motion.div
                        key={upload.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        layout
                    >
                        <UploadProgress
                            progress={upload.progress}
                            status={upload.status}
                            fileName={upload.fileName}
                            errorMessage={upload.error}
                            bytesUploaded={upload.bytesUploaded}
                            totalBytes={upload.totalBytes}
                            startTime={upload.startTime}
                            onRetry={upload.onRetry}
                            onCancel={upload.onCancel}
                            onPause={upload.onPause}
                            onResume={upload.onResume}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

/**
 * Compact upload progress indicator for use in headers/sidebars
 */
export function UploadProgressCompact({ 
    progress = 0, 
    status = 'idle',
    fileName = '',
    onCancel,
}) {
    const isActive = ['initiating', 'uploading', 'processing'].includes(status);
    const isPaused = status === 'paused';
    const isComplete = status === 'success';
    const isError = status === 'error';

    if (status === 'idle') return null;

    return (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
            {isActive && (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            )}
            {isPaused && (
                <Pause className="w-4 h-4 text-yellow-400" />
            )}
            {isComplete && (
                <CheckCircle className="w-4 h-4 text-green-400" />
            )}
            {isError && (
                <XCircle className="w-4 h-4 text-red-400" />
            )}
            
            <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{fileName}</p>
                <div className="w-full h-1 bg-slate-700 rounded-full mt-1">
                    <div 
                        className={`h-full rounded-full transition-all ${
                            isError ? 'bg-red-500' : 
                            isComplete ? 'bg-green-500' : 
                            isPaused ? 'bg-yellow-500' : 
                            'bg-blue-500'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
            
            <span className="text-xs text-slate-400 tabular-nums">
                {progress}%
            </span>
            
            {(isActive || isPaused) && onCancel && (
                <button
                    onClick={onCancel}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    aria-label="Cancelar"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}
