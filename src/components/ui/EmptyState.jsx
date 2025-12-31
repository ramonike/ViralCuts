import { motion } from 'framer-motion';
import { 
    Inbox, 
    Video, 
    Calendar, 
    BarChart3, 
    CheckSquare,
    Upload,
    Search,
    Wifi
} from 'lucide-react';

const ICONS = {
    inbox: Inbox,
    video: Video,
    calendar: Calendar,
    analytics: BarChart3,
    checklist: CheckSquare,
    upload: Upload,
    search: Search,
    offline: Wifi
};

/**
 * Componente de estado vazio reutilizável
 */
export function EmptyState({
    icon = 'inbox',
    title,
    description,
    action,
    actionLabel,
    secondaryAction,
    secondaryActionLabel,
    size = 'default' // 'small' | 'default' | 'large'
}) {
    const Icon = typeof icon === 'string' ? ICONS[icon] : icon;
    
    const sizeClasses = {
        small: {
            container: 'py-6 px-4',
            icon: 'w-10 h-10',
            iconWrapper: 'w-16 h-16',
            title: 'text-sm',
            description: 'text-xs',
            button: 'text-xs px-3 py-1.5'
        },
        default: {
            container: 'py-12 px-6',
            icon: 'w-12 h-12',
            iconWrapper: 'w-20 h-20',
            title: 'text-base',
            description: 'text-sm',
            button: 'text-sm px-4 py-2'
        },
        large: {
            container: 'py-16 px-8',
            icon: 'w-16 h-16',
            iconWrapper: 'w-24 h-24',
            title: 'text-lg',
            description: 'text-base',
            button: 'text-base px-6 py-3'
        }
    };
    
    const classes = sizeClasses[size];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col items-center justify-center text-center ${classes.container}`}
        >
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className={`${classes.iconWrapper} rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-4`}
            >
                <Icon className={`${classes.icon} text-slate-500`} />
            </motion.div>
            
            {title && (
                <h3 className={`font-medium text-slate-300 mb-1 ${classes.title}`}>
                    {title}
                </h3>
            )}
            
            {description && (
                <p className={`text-slate-500 max-w-xs mb-4 ${classes.description}`}>
                    {description}
                </p>
            )}
            
            {(action || secondaryAction) && (
                <div className="flex gap-2">
                    {action && (
                        <button
                            onClick={action}
                            className={`font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors ${classes.button}`}
                        >
                            {actionLabel || 'Começar'}
                        </button>
                    )}
                    {secondaryAction && (
                        <button
                            onClick={secondaryAction}
                            className={`font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors ${classes.button}`}
                        >
                            {secondaryActionLabel || 'Saiba mais'}
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
}

/**
 * Empty states pré-configurados
 */
export function NoVideosEmpty({ onUpload }) {
    return (
        <EmptyState
            icon="video"
            title="Nenhum vídeo ainda"
            description="Comece enviando seu primeiro vídeo para a fila de uploads."
            action={onUpload}
            actionLabel="Adicionar vídeo"
        />
    );
}

export function NoUploadsEmpty({ onSchedule }) {
    return (
        <EmptyState
            icon="upload"
            title="Fila vazia"
            description="Adicione vídeos à fila para agendar uploads automáticos."
            action={onSchedule}
            actionLabel="Agendar upload"
        />
    );
}

export function NoResultsEmpty({ onClear }) {
    return (
        <EmptyState
            icon="search"
            title="Nenhum resultado"
            description="Tente ajustar os filtros ou termos de busca."
            action={onClear}
            actionLabel="Limpar filtros"
        />
    );
}

export function OfflineEmpty({ onRetry }) {
    return (
        <EmptyState
            icon="offline"
            title="Sem conexão"
            description="Verifique sua conexão com a internet e tente novamente."
            action={onRetry}
            actionLabel="Tentar novamente"
        />
    );
}

export function NoAnalyticsEmpty() {
    return (
        <EmptyState
            icon="analytics"
            title="Sem dados ainda"
            description="Os dados de analytics aparecerão aqui após seus primeiros uploads."
        />
    );
}
