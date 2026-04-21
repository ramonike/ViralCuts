/**
 * QuickActions Component
 * 
 * Displays 6 action buttons for common tasks with meaningful functionality.
 * Fixed order - buttons never reorder to prevent confusing card swapping.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */

import { useMemo, useCallback, useState, useRef } from 'react';
import { Card } from '../ui/card';
import WidgetWrapper from '../shared/WidgetWrapper';
import {
  Upload,
  Calendar,
  BarChart3,
  Sparkles,
  Bell,
  TrendingUp,
  Play,
  X,
  Clock,
  Target,
  Lightbulb,
  Zap,
  Video,
  Wand2 as Wand
} from 'lucide-react';

// Storage key for tracking usage statistics (for analytics only, not reordering)
const USAGE_STORAGE_KEY = 'quick-actions-usage';

/**
 * Notification sources for badge display
 */
const NOTIFICATION_SOURCES = {
  'upload-video': ['pending-uploads', 'draft-videos'],
  'schedule-content': ['upcoming-schedules', 'missed-schedules'],
  'check-analytics': ['performance-alerts', 'milestone-reached'],
  'optimize-channel': ['optimization-suggestions', 'seo-issues'],
  'ai-tools': ['new-features', 'ai-suggestions'],
  'notifications': ['unread-notifications'],
};

/**
 * Default actions with FIXED order - these NEVER reorder
 * Requirements: 5.3 - Include: Upload Video, Schedule Content, Check Analytics, Optimize Channel
 */
const DEFAULT_ACTIONS = [
  {
    id: 'upload-video',
    title: 'Enviar Vídeo',
    icon: 'upload',
    description: 'Envie um novo vídeo para seu canal',
    shortcut: 'Ctrl+U',
    category: 'creation',
  },
  {
    id: 'schedule-content',
    title: 'Agendar',
    icon: 'calendar',
    description: 'Agende conteúdo para o melhor horário',
    shortcut: 'Ctrl+S',
    category: 'management',
  },
  {
    id: 'check-analytics',
    title: 'Analytics',
    icon: 'bar-chart',
    description: 'Veja o desempenho do seu canal',
    shortcut: 'Ctrl+A',
    category: 'analysis',
  },
  {
    id: 'optimize-channel',
    title: 'Otimizar',
    icon: 'trending-up',
    description: 'Otimize seu canal para crescimento',
    shortcut: 'Ctrl+O',
    category: 'optimization',
  },
  {
    id: 'ai-tools',
    title: 'IA Tools',
    icon: 'sparkles',
    description: 'Acesse ferramentas de IA para conteúdo',
    category: 'creation',
  },
  {
    id: 'notifications',
    title: 'Alertas',
    icon: 'bell',
    description: 'Veja suas notificações',
    category: 'management',
  },
];

/**
 * Get icon component for action
 */
const getActionIcon = (iconName, size = 'w-5 h-5') => {
  const iconMap = {
    'upload': Upload,
    'calendar': Calendar,
    'bar-chart': BarChart3,
    'sparkles': Sparkles,
    'bell': Bell,
    'trending-up': TrendingUp,
    'play': Play,
    'clock': Clock,
    'target': Target,
    'lightbulb': Lightbulb,
    'zap': Zap,
    'video': Video,
    'wand': Wand,
  };

  const IconComponent = iconMap[iconName] || Sparkles;
  return <IconComponent className={size} />;
};

/**
 * Get category color for action button - Dark Theme / Glassmorphism
 */
const getCategoryColor = (category) => {
  const colorMap = {
    'creation': 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20 hover:border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_25px_rgba(59,130,246,0.25)]',
    'optimization': 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]',
    'analysis': 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/20 hover:border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]',
    'management': 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20 hover:border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]',
  };

  return colorMap[category] || 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border-slate-500/20 hover:border-slate-500/40 shadow-[0_0_15px_rgba(100,116,139,0.1)] hover:shadow-[0_0_25px_rgba(100,116,139,0.25)]';
};

/**
 * Get badge color based on count
 */
const getBadgeColor = (count) => {
  if (count <= 2) return 'bg-yellow-500';
  if (count <= 5) return 'bg-orange-500';
  return 'bg-red-500';
};


/**
 * Panel content for each action - meaningful functionality
 */
const PANEL_CONTENT = {
  'upload-video': {
    title: 'Enviar Novo Vídeo',
    sections: [
      {
        title: 'Início Rápido',
        items: [
          { icon: 'play', label: 'Selecionar arquivo de vídeo', action: 'select-file' },
          { icon: 'sparkles', label: 'Gerar título com IA', action: 'ai-title' },
          { icon: 'target', label: 'Otimizar para SEO', action: 'seo-optimize' },
        ]
      },
      {
        title: 'Dicas',
        tips: [
          'Vídeos entre 8-15 minutos têm melhor retenção',
          'Adicione legendas para aumentar alcance',
          'Use thumbnails personalizadas',
        ]
      }
    ]
  },
  'schedule-content': {
    title: 'Agendar Conteúdo',
    sections: [
      {
        title: 'Melhores Horários',
        items: [
          { icon: 'clock', label: 'Terça 18:00 - Alto engajamento', action: 'schedule-tue' },
          { icon: 'clock', label: 'Quinta 19:00 - Pico de views', action: 'schedule-thu' },
          { icon: 'clock', label: 'Sábado 14:00 - Fim de semana', action: 'schedule-sat' },
        ]
      },
      {
        title: 'Próximos Agendamentos',
        tips: [
          'Nenhum vídeo agendado para esta semana',
          'Recomendado: 2-3 vídeos por semana',
        ]
      }
    ]
  },
  'check-analytics': {
    title: 'Analytics do Canal',
    sections: [
      {
        title: 'Métricas Rápidas',
        items: [
          { icon: 'trending-up', label: 'Views esta semana: +12%', action: 'view-details' },
          { icon: 'target', label: 'Taxa de cliques: 4.2%', action: 'ctr-details' },
          { icon: 'clock', label: 'Tempo médio: 6:32', action: 'retention-details' },
        ]
      },
      {
        title: 'Insights',
        tips: [
          'Seu melhor vídeo teve 2.3k views',
          'Engajamento aumentou 8% este mês',
        ]
      }
    ]
  },
  'optimize-channel': {
    title: 'Otimizar Canal',
    sections: [
      {
        title: 'Ações Recomendadas',
        items: [
          { icon: 'lightbulb', label: 'Atualizar descrição do canal', action: 'update-desc' },
          { icon: 'target', label: 'Adicionar palavras-chave', action: 'add-keywords' },
          { icon: 'zap', label: 'Criar playlist temática', action: 'create-playlist' },
        ]
      },
      {
        title: 'Score de Otimização',
        tips: [
          'Seu canal está 72% otimizado',
          'Complete 3 ações para chegar a 85%',
        ]
      }
    ]
  },
  'ai-tools': {
    title: 'Ferramentas de IA',
    sections: [
      {
        title: 'Criar com IA',
        items: [
          { icon: 'video', label: 'Gerar vídeo por prompt', action: 'ai-video' },
          { icon: 'wand', label: 'Edição viral automática', action: 'ai-viral-edit' },
          { icon: 'zap', label: 'Transformar imagem em vídeo', action: 'ai-motion' },
        ]
      },
      {
        title: 'Tendências e APIs',
        tips: [
          'Use Replicate para geração via prompt',
          'Shotstack para edição programática',
          'Submagic para legendas dinâmicas',
        ]
      }
    ]
  },
  'notifications': {
    title: 'Central de Alertas',
    sections: [
      {
        title: 'Notificações Recentes',
        items: [
          { icon: 'trending-up', label: 'Vídeo atingiu 1k views!', action: 'view-video' },
          { icon: 'bell', label: 'Novo comentário para responder', action: 'view-comment' },
          { icon: 'zap', label: 'Dica: Melhor horário para postar', action: 'view-tip' },
        ]
      },
      {
        title: 'Resumo',
        tips: [
          '3 notificações não lidas',
          'Última atividade: há 2 horas',
        ]
      }
    ]
  },
};

/**
 * Action Panel Modal - Shows meaningful content for each action
 */
const ActionPanel = ({ action, onClose, onNavigate }) => {
  const content = PANEL_CONTENT[action.id] || { title: action.title, sections: [] };

  const handleItemClick = (item) => {
    console.log('Action:', item.action);
    if (onNavigate) {
      onNavigate(action.id, item.action);
    }
    onClose(); // Close panel after action
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 max-w-md w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 bg-slate-800/50 border-b border-slate-700`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-200">
              {getActionIcon(action.icon, 'w-6 h-6')}
              <h3 className="text-lg font-bold">{content.title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-slate-200"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {content.sections.map((section, idx) => (
            <div key={idx}>
              <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">{section.title}</h4>

              {section.items && (
                <div className="space-y-2">
                  {section.items.map((item, itemIdx) => (
                    <button
                      key={itemIdx}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/70 border border-slate-700/50 hover:border-slate-600 transition-all text-left"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="p-2 bg-slate-700/50 rounded-lg">
                        {getActionIcon(item.icon, 'w-4 h-4 text-slate-300')}
                      </div>
                      <span className="text-sm text-slate-200 font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {section.tips && (
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 space-y-1">
                  {section.tips.map((tip, tipIdx) => (
                    <p key={tipIdx} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="text-slate-500">•</span>
                      {tip}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/30">
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate(action.id, 'open-main');
              }
              onClose();
            }}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-all ${getCategoryColor(action.category)}`}
          >
            Ir para {action.title}
          </button>
        </div>
      </div>
    </div>
  );
};


/**
 * Single action button component
 */
const ActionButton = ({ action, onClick, showBadge = false, notificationCount = 0 }) => {
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(action);
    }
  }, [action, onClick]);

  const hasNotification = showBadge && notificationCount > 0;
  const badgeColor = getBadgeColor(notificationCount);

  return (
    <button
      onClick={handleClick}
      className={`
        group relative flex flex-col items-center justify-center p-6 rounded-2xl border backdrop-blur-md
        transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 min-w-[100px] gap-2
        ${getCategoryColor(action.category)}
        ${hasNotification ? 'ring-2 ring-offset-1 ring-red-500/50 ring-offset-slate-900' : ''}
      `}
      title={action.description}
      data-testid={`quick-action-${action.id}`}
      aria-label={`${action.title}${hasNotification ? `, ${notificationCount} itens precisam de atenção` : ''}`}
    >
      {/* Notification badge */}
      {hasNotification && (
        <span
          className={`absolute -top-1 -right-1 ${badgeColor} text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse`}
          data-testid={`notification-badge-${action.id}`}
          role="status"
          aria-label={`${notificationCount} notificações`}
        >
          {notificationCount > 9 ? '9+' : notificationCount}
        </span>
      )}

      <div className="mb-2">
        {getActionIcon(action.icon)}
      </div>

      <span className="text-sm font-medium text-center">
        {action.title}
      </span>

      {action.shortcut && (
        <span className="text-xs text-gray-400 mt-1">
          {action.shortcut}
        </span>
      )}
    </button>
  );
};

/**
 * Simple service for notification management (no reordering)
 */
class QuickActionsService {
  getNotificationCounts(externalCounts = {}, systemState = {}) {
    const counts = {};

    Object.entries(NOTIFICATION_SOURCES).forEach(([actionId, sources]) => {
      let totalCount = 0;

      sources.forEach(source => {
        if (externalCounts[source] !== undefined) {
          totalCount += externalCounts[source];
        } else if (systemState[source] !== undefined) {
          totalCount += systemState[source];
        }
      });

      if (externalCounts[actionId] !== undefined) {
        totalCount += externalCounts[actionId];
      }

      counts[actionId] = totalCount;
    });

    return counts;
  }

  getTotalNotifications(counts) {
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  }
}

/**
 * Main QuickActions component
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */
export const QuickActions = ({
  actions = [],
  userState = {},
  onActionClick,
  onActionUsed,
  onNavigate,
  showNotificationBadges = true,
  notificationCounts = {},
  systemState = {},
  className = '',
}) => {
  // State for the action panel modal
  const [activePanel, setActivePanel] = useState(null);

  // Track usage for analytics (not for reordering)
  const [usageCounts, setUsageCounts] = useState(() => {
    try {
      const stored = localStorage.getItem(USAGE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Service ref
  const serviceRef = useRef(new QuickActionsService());
  const service = serviceRef.current;

  // Merge notification counts
  const mergedNotificationCounts = useMemo(() => {
    return service.getNotificationCounts(notificationCounts, systemState);
  }, [service, notificationCounts, systemState]);

  // Get actions in FIXED order - merge custom actions but maintain order
  const displayActions = useMemo(() => {
    const merged = [...DEFAULT_ACTIONS];

    // Merge any custom action properties but keep the fixed order
    actions.forEach(customAction => {
      const existingIndex = merged.findIndex(a => a.id === customAction.id);
      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...customAction };
      }
    });

    // Always return exactly 6 actions in fixed order
    return merged.slice(0, 6);
  }, [actions]);

  // Handle action click - opens panel and tracks usage
  const handleActionClick = useCallback((action) => {
    // Track usage for analytics
    const now = new Date().toISOString();
    const newCounts = {
      ...usageCounts,
      [action.id]: (usageCounts[action.id] || 0) + 1,
      [`${action.id}_lastUsed`]: now,
    };
    setUsageCounts(newCounts);

    try {
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(newCounts));
    } catch {
      // Ignore storage errors
    }

    // Open the action panel
    setActivePanel(action);

    // Notify parent
    if (onActionUsed) {
      onActionUsed(action.id);
    }
    if (onActionClick) {
      onActionClick(action);
    }
  }, [usageCounts, onActionClick, onActionUsed]);

  // Close panel
  const handleClosePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  // Calculate total notifications
  const totalNotifications = useMemo(() => {
    return service.getTotalNotifications(mergedNotificationCounts);
  }, [service, mergedNotificationCounts]);

  return (
    <>
      <WidgetWrapper
        title="Ações Rápidas"
        icon={<Zap className="w-5 h-5" />}
        actions={
          totalNotifications > 0 && (
            <span
              className="text-sm text-slate-400"
              data-testid="attention-count"
            >
              {totalNotifications} {totalNotifications !== 1 ? 'itens precisam' : 'item precisa'} de atenção
            </span>
          )
        }
        className={className}
      >
        <div data-testid="quick-actions">
          {/* Action buttons grid - FIXED ORDER */}
          <div
            className="grid grid-cols-3 sm:grid-cols-6 gap-3"
            data-testid="quick-actions-grid"
          >
            {displayActions.map(action => (
              <ActionButton
                key={action.id}
                action={action}
                onClick={handleActionClick}
                showBadge={showNotificationBadges}
                notificationCount={mergedNotificationCounts[action.id] || 0}
              />
            ))}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="mt-4 text-xs text-slate-500 text-center">
            Use atalhos de teclado para acesso rápido
          </div>
        </div>
      </WidgetWrapper>

      {/* Action Panel Modal */}
      {activePanel && (
        <ActionPanel
          action={activePanel}
          onClose={handleClosePanel}
          onNavigate={onNavigate}
        />
      )}
    </>
  );
};

// Export for testing
export {
  QuickActionsService,
  DEFAULT_ACTIONS,
  NOTIFICATION_SOURCES,
  PANEL_CONTENT,
};

export default QuickActions;
