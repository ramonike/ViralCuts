import { motion } from 'framer-motion';
import { Inbox, Video, Calendar, BarChart3, CheckSquare, Upload, Search, Wifi } from 'lucide-react';

const ICONS = {
  inbox: Inbox, video: Video, calendar: Calendar,
  analytics: BarChart3, checklist: CheckSquare, upload: Upload,
  search: Search, offline: Wifi,
};

export function EmptyState({
  icon = 'inbox', title, description, action, actionLabel,
  secondaryAction, secondaryActionLabel, size = 'default'
}) {
  const Icon = typeof icon === 'string' ? ICONS[icon] : icon;
  const s = {
    small: { container: 'py-6 px-4', icon: 'w-10 h-10', wrapper: 'w-16 h-16', title: 'text-sm', desc: 'text-xs', btn: 'text-xs px-3 py-1.5' },
    default: { container: 'py-12 px-6', icon: 'w-12 h-12', wrapper: 'w-20 h-20', title: 'text-base', desc: 'text-sm', btn: 'text-sm px-4 py-2' },
    large: { container: 'py-16 px-8', icon: 'w-16 h-16', wrapper: 'w-24 h-24', title: 'text-lg', desc: 'text-base', btn: 'text-base px-6 py-3' },
  };
  const c = s[size];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col items-center justify-center text-center ${c.container}`}>
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }}
        className={`${c.wrapper} rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center mb-4`}>
        <Icon className={`${c.icon} text-[var(--text-muted)]`} />
      </motion.div>
      {title && <h3 className={`font-medium text-[var(--text-secondary)] mb-1 ${c.title}`}>{title}</h3>}
      {description && <p className={`text-[var(--text-muted)] max-w-xs mb-4 ${c.desc}`}>{description}</p>}
      {(action || secondaryAction) && (
        <div className="flex gap-2">
          {action && (
            <button onClick={action} className={`font-medium text-white bg-[var(--accent-coral)] hover:bg-[var(--accent-coral-2)] rounded-[var(--radius-md)] transition-colors ${c.btn}`}>
              {actionLabel || 'Começar'}
            </button>
          )}
          {secondaryAction && (
            <button onClick={secondaryAction} className={`font-medium text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-card-hover)] rounded-[var(--radius-md)] transition-colors ${c.btn}`}>
              {secondaryActionLabel || 'Saiba mais'}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function NoVideosEmpty({ onUpload }) {
  return <EmptyState icon="video" title="Nenhum vídeo ainda" description="Comece enviando seu primeiro vídeo para a fila de uploads." action={onUpload} actionLabel="Adicionar vídeo" />;
}
export function NoUploadsEmpty({ onSchedule }) {
  return <EmptyState icon="upload" title="Fila vazia" description="Adicione vídeos à fila para agendar uploads automáticos." action={onSchedule} actionLabel="Agendar upload" />;
}
export function NoResultsEmpty({ onClear }) {
  return <EmptyState icon="search" title="Nenhum resultado" description="Tente ajustar os filtros ou termos de busca." action={onClear} actionLabel="Limpar filtros" />;
}
export function OfflineEmpty({ onRetry }) {
  return <EmptyState icon="offline" title="Sem conexão" description="Verifique sua conexão com a internet e tente novamente." action={onRetry} actionLabel="Tentar novamente" />;
}
export function NoAnalyticsEmpty() {
  return <EmptyState icon="analytics" title="Sem dados ainda" description="Os dados de analytics aparecerão aqui após seus primeiros uploads." />;
}
