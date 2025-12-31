import { motion } from 'framer-motion';

/**
 * Componente base de Skeleton para loading states
 */
export function Skeleton({ className = '', animate = true }) {
    const baseClass = 'bg-slate-700/50 rounded';
    
    if (animate) {
        return (
            <motion.div
                className={`${baseClass} ${className}`}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
        );
    }
    
    return <div className={`${baseClass} animate-pulse ${className}`} />;
}

/**
 * Skeleton para cards de estatísticas
 */
export function StatCardSkeleton() {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
        </div>
    );
}

/**
 * Skeleton para itens de lista
 */
export function ListItemSkeleton({ hasAvatar = false }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
            {hasAvatar && <Skeleton className="w-10 h-10 rounded-full" />}
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    );
}

/**
 * Skeleton para vídeos/thumbnails
 */
export function VideoCardSkeleton() {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex gap-2 mt-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                </div>
            </div>
        </div>
    );
}

/**
 * Skeleton para checklist
 */
export function ChecklistSkeleton({ items = 4 }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="w-5 h-5 rounded" />
                    <Skeleton className="h-4 flex-1" />
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton para gráficos
 */
export function ChartSkeleton({ height = 200 }) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="flex items-end gap-2" style={{ height }}>
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton 
                        key={i} 
                        className="flex-1 rounded-t"
                        style={{ height: `${30 + Math.random() * 70}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Skeleton para calendário
 */
export function CalendarSkeleton() {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-32" />
                <div className="flex gap-2">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 rounded" />
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded" />
                ))}
            </div>
        </div>
    );
}

/**
 * Skeleton para perfil/canal
 */
export function ProfileSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-4 mt-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>
        </div>
    );
}
