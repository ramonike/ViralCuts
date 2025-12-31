// Journey System Types
export interface UserJourneyState {
  currentStage: string;
  completedMilestones: string[];
  progressPercentage: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  onboardingCompleted: boolean;
  lastActiveDate: Date;
  isFirstLogin: boolean;
}

export interface JourneyStage {
  id: string;
  name: string;
  description: string;
  icon: string;
  milestones: Milestone[];
  estimatedTime: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  unlocked: boolean;
  order: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  actionUrl?: string;
  helpContent?: string;
  category: 'setup' | 'optimization' | 'creation' | 'publishing';
  points: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'setup' | 'creation' | 'optimization' | 'publishing' | 'engagement';
  points: number;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserStats {
  videosCreated: number;
  toolsUsed: string[];
  channelOptimizationScore: number;
  daysActive: number;
  totalPoints: number;
  achievements: Achievement[];
  currentStreak: number;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  completed: boolean;
  required: boolean;
  order: number;
}

export interface CreationFlowStep {
  id: string;
  name: string;
  description: string;
  icon: string;
  tools: string[];
  tips: string[];
  estimatedTime: number;
  completed: boolean;
}

// Context Types
export interface JourneyContextType {
  journeyState: UserJourneyState;
  stages: JourneyStage[];
  userStats: UserStats;
  updateProgress: (milestoneId: string) => void;
  completeStage: (stageId: string) => void;
  unlockAchievement: (achievementId: string) => void;
  setExperienceLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void;
  resetJourney: () => void;
}

// Default Data
export const DEFAULT_JOURNEY_STAGES: JourneyStage[] = [
  {
    id: 'setup',
    name: 'Configuração',
    description: 'Configure sua conta e conecte seu canal do YouTube',
    icon: '🚀',
    order: 1,
    estimatedTime: 15,
    difficulty: 'easy',
    unlocked: true,
    milestones: [
      {
        id: 'youtube-connection',
        title: 'Conectar YouTube',
        description: 'Conecte sua conta do YouTube para começar',
        completed: false,
        category: 'setup',
        points: 100,
        actionUrl: '/settings?tab=connections'
      },
      {
        id: 'channel-photo',
        title: 'Foto do Canal',
        description: 'Adicione uma foto profissional ao seu canal',
        completed: false,
        category: 'setup',
        points: 50
      },
      {
        id: 'channel-banner',
        title: 'Banner do Canal',
        description: 'Crie um banner atrativo para seu canal',
        completed: false,
        category: 'setup',
        points: 50
      },
      {
        id: 'channel-description',
        title: 'Descrição do Canal',
        description: 'Escreva uma descrição clara sobre seu conteúdo',
        completed: false,
        category: 'setup',
        points: 75
      }
    ]
  },
  {
    id: 'planning',
    name: 'Planejamento',
    description: 'Defina sua estratégia de conteúdo e nichos',
    icon: '📋',
    order: 2,
    estimatedTime: 30,
    difficulty: 'medium',
    unlocked: false,
    milestones: [
      {
        id: 'niche-selection',
        title: 'Escolher Nicho',
        description: 'Defina o nicho do seu canal',
        completed: false,
        category: 'creation',
        points: 100
      },
      {
        id: 'content-calendar',
        title: 'Calendário de Conteúdo',
        description: 'Planeje seus próximos vídeos',
        completed: false,
        category: 'creation',
        points: 150
      },
      {
        id: 'keyword-research',
        title: 'Pesquisa de Palavras-chave',
        description: 'Encontre palavras-chave para seus vídeos',
        completed: false,
        category: 'optimization',
        points: 125
      }
    ]
  },
  {
    id: 'creation',
    name: 'Criação',
    description: 'Use ferramentas IA para criar conteúdo viral',
    icon: '🎬',
    order: 3,
    estimatedTime: 45,
    difficulty: 'medium',
    unlocked: false,
    milestones: [
      {
        id: 'first-ai-tool',
        title: 'Primeira Ferramenta IA',
        description: 'Use uma ferramenta de IA para criar conteúdo',
        completed: false,
        category: 'creation',
        points: 200
      },
      {
        id: 'video-library-usage',
        title: 'Biblioteca de Vídeos',
        description: 'Explore bibliotecas de vídeo gratuitas',
        completed: false,
        category: 'creation',
        points: 100
      },
      {
        id: 'first-upload',
        title: 'Primeiro Upload',
        description: 'Faça upload do seu primeiro vídeo',
        completed: false,
        category: 'publishing',
        points: 300
      }
    ]
  },
  {
    id: 'optimization',
    name: 'Otimização',
    description: 'Otimize seus vídeos para máximo alcance',
    icon: '⚡',
    order: 4,
    estimatedTime: 20,
    difficulty: 'medium',
    unlocked: false,
    milestones: [
      {
        id: 'seo-optimization',
        title: 'Otimização SEO',
        description: 'Otimize títulos, descrições e tags',
        completed: false,
        category: 'optimization',
        points: 150
      },
      {
        id: 'thumbnail-creation',
        title: 'Criação de Thumbnail',
        description: 'Crie thumbnails atrativas',
        completed: false,
        category: 'optimization',
        points: 100
      },
      {
        id: 'analytics-setup',
        title: 'Configurar Analytics',
        description: 'Configure acompanhamento de métricas',
        completed: false,
        category: 'optimization',
        points: 125
      }
    ]
  },
  {
    id: 'publishing',
    name: 'Publicação',
    description: 'Publique e promova seu conteúdo',
    icon: '📤',
    order: 5,
    estimatedTime: 25,
    difficulty: 'easy',
    unlocked: false,
    milestones: [
      {
        id: 'scheduled-publishing',
        title: 'Publicação Agendada',
        description: 'Agende seus vídeos para horários otimizados',
        completed: false,
        category: 'publishing',
        points: 100
      },
      {
        id: 'social-promotion',
        title: 'Promoção Social',
        description: 'Promova seus vídeos nas redes sociais',
        completed: false,
        category: 'publishing',
        points: 150
      },
      {
        id: 'community-engagement',
        title: 'Engajamento',
        description: 'Responda comentários e interaja com a audiência',
        completed: false,
        category: 'engagement',
        points: 200
      }
    ]
  }
];

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-connection',
    title: 'Primeira Conexão',
    description: 'Conectou sua primeira conta do YouTube',
    icon: '🔗',
    category: 'setup',
    points: 100,
    rarity: 'common'
  },
  {
    id: 'channel-optimizer',
    title: 'Otimizador de Canal',
    description: 'Completou toda a otimização do canal',
    icon: '⭐',
    category: 'setup',
    points: 300,
    rarity: 'rare'
  },
  {
    id: 'ai-explorer',
    title: 'Explorador de IA',
    description: 'Usou todas as ferramentas de IA disponíveis',
    icon: '🤖',
    category: 'creation',
    points: 500,
    rarity: 'epic'
  },
  {
    id: 'viral-creator',
    title: 'Criador Viral',
    description: 'Criou seu primeiro vídeo viral',
    icon: '🚀',
    category: 'creation',
    points: 1000,
    rarity: 'legendary'
  },
  {
    id: 'consistent-creator',
    title: 'Criador Consistente',
    description: 'Publicou vídeos por 7 dias consecutivos',
    icon: '📅',
    category: 'publishing',
    points: 750,
    rarity: 'epic'
  }
];