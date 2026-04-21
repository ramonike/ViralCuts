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
    description: 'Deixe tudo pronto para o sistema postar por você.',
    icon: '🚀',
    order: 1,
    estimatedTime: 15,
    difficulty: 'easy',
    unlocked: true,
    milestones: [
      {
        id: 'youtube-connection',
        title: 'Como Conectar Contas Sociais',
        description: 'Passo 1: Clique no botão gigante abaixo para ir até as Configurações.\nPasso 2: Localize a aba lateral "Contas Conectadas/Integrações".\nPasso 3: Autorize sua conta Google/YouTube.\n\nIsso é OBRIGATÓRIO para que a postagem automática do ViralCuts funcione por você 24h por dia.',
        completed: false,
        category: 'setup',
        points: 100,
        actionUrl: '/dashboard/settings'
      },
      {
        id: 'channel-photo',
        title: 'Avatar e Banner do Canal',
        description: 'Passo 1: Utilize ferramentas modernas (como Canva ou Midjourney) para criar uma imagem de perfil atraente e capa.\nPasso 2: Volte nas Configurações do seu Painel e aplique os layouts atualizados.\n\nMostre credibilidade para seus inscritos desde o primeiro segundo.',
        completed: false,
        category: 'setup',
        points: 50,
        actionUrl: '/dashboard/settings'
      }
    ]
  },
  {
    id: 'planning',
    name: 'Tutorial: Planejamento',
    description: 'Aprenda a agendar publicações automaticamente.',
    icon: '📋',
    order: 2,
    estimatedTime: 15,
    difficulty: 'easy',
    unlocked: true,
    milestones: [
      {
        id: 'content-calendar',
        title: 'Como usar o Calendário',
        description: 'O Calendário é sua central de inteligência e distribuição de mídia:\n\n1. Acesse o botão abaixo para abrir a Grade Semanal.\n2. Visualize de cima todos os seus horários configurados como "Picos de Audiência".\n3. Basta arrastar seus vídeos finalizados para os espaços vazios e esquecer deles. O nosso sistema posta tudo sozinho no segundo exato.',
        completed: false,
        category: 'creation',
        points: 150,
        actionUrl: '/dashboard/calendar'
      },
      {
        id: 'scheduled-publishing',
        title: 'Como usar a Fila de Upload',
        description: 'Todo vídeo que você mandar vira um item na fila de espera.\n\n1. Use o botão para visitar seus Vídeos e acione "Novo Upload".\n2. Suba o arquivo do seu vídeo (formato Shorts/Reels é ideal).\n3. Escolha: Postar AGORA ou Jogar na Fila Inteligente.\n4. Se escolher a Fila Inteligente, ele ficará na área "Próximos" te aguardando!',
        completed: false,
        category: 'publishing',
        points: 100,
        actionUrl: '/dashboard/videos'
      }
    ]
  },
  {
    id: 'creation',
    name: 'Tutorial: Estúdio Criação IA',
    description: 'Use a automação para fatiar vídeos e gerar roteiros.',
    icon: '🎬',
    order: 3,
    estimatedTime: 30,
    difficulty: 'medium',
    unlocked: true,
    milestones: [
      {
        id: 'vizard-opus',
        title: 'Cortando com OpusClip e Vizard.ai',
        description: 'Transforme 1 entrevista longa em 30 Shorts prontos!\n\nPasso 1: Clique no botão da ferramenta para abrir a matriz de Inteligência Artificial.\nPasso 2: Role até os botões externos como OpusClip.\nPasso 3: Cole URLs diretas do YouTube e o robô cortará, escolherá os momentos de mais impacto e adicionará Legendas Estilo Hormozi por cima!',
        completed: false,
        category: 'creation',
        points: 200,
        actionUrl: '/dashboard/creation'
      },
      {
        id: 'first-ai-tool',
        title: 'Gerando Roteiros Mágicos',
        description: 'Teve um branco criativo?\n\nPasso 1: No Estúdio de IA, busque pelo gerador de Ideias.\nPasso 2: Digite simples "Dicas de musculação rápida".\nPasso 3: Deixe o algoritmo desenhar 4 blocos textuais testados em alta retenção, do "Gancho" inicial ao "CTA" final.',
        completed: false,
        category: 'creation',
        points: 100,
        actionUrl: '/dashboard/creation'
      }
    ]
  },
  {
    id: 'analytics',
    name: 'Tutorial: Otimização e Resultados',
    description: 'Aprenda a ler suas métricas para crescer.',
    icon: '⚡',
    order: 4,
    estimatedTime: 10,
    difficulty: 'easy',
    unlocked: true,
    milestones: [
      {
        id: 'analytics-setup',
        title: 'Lendo os Gráficos do Analytics',
        description: 'Saber o que dá certo é o que difere amadores de profissionais.\n\nPasso 1: Clique para abrir o Painel Completo de Data-Science do seu canal.\nPasso 2: Mire diretamente nos "Gráficos de Retenção".\nPasso 3: Se o gráfico despenca depois de 3 segundos, seu vídeo não teve um gancho forte.\nPasso 4: Utilize as conclusões e volte à aba de Criação com novas instruções para o algoritmo!',
        completed: false,
        category: 'optimization',
        points: 125,
        actionUrl: '/dashboard/analytics'
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