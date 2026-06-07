import React, { useState } from 'react';
import { CheckCircle2, PlayCircle, Clock, Link2, Sparkles, Video, Calendar } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

export function BeginnerJourney({ userState, onNavigate }) {
  // Track completed steps via localStorage for persistence
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const stored = localStorage.getItem('viralcuts_journey_completed');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync auto-completion based on real user state
  React.useEffect(() => {
    if (!userState) return;
    
    const newCompleted = [...completedSteps];
    let changed = false;

    if (userState.hasConnectedChannel && !newCompleted.includes(1)) {
      newCompleted.push(1);
      changed = true;
    }
    // Step 2 is subjective (Ideation), step 3 is video creation
    if (userState.hasCreatedVideo && !newCompleted.includes(3)) {
      newCompleted.push(3);
      changed = true;
    }
    if (userState.hasScheduledContent && !newCompleted.includes(4)) {
      newCompleted.push(4);
      changed = true;
    }

    if (changed) {
      setCompletedSteps(newCompleted);
      localStorage.setItem('viralcuts_journey_completed', JSON.stringify(newCompleted));
    }
  }, [userState, completedSteps]);

  const markStepDone = (stepId) => {
    if (!completedSteps.includes(stepId)) {
      const updated = [...completedSteps, stepId];
      setCompletedSteps(updated);
      localStorage.setItem('viralcuts_journey_completed', JSON.stringify(updated));
    }
  };

  const getActiveStep = () => {
    for (let i = 1; i <= 4; i++) {
      if (!completedSteps.includes(i)) return i;
    }
    return 5; // All completed
  };

  const currentStep = getActiveStep();

  const steps = [
    {
      id: 1,
      title: 'Conectar Canais',
      description: 'Vincule seu YouTube ou TikTok para gerenciar publicações.',
      icon: Link2,
      actionText: 'Conectar Agora',
      actionId: 'connect-channels',
      color: 'blue'
    },
    {
      id: 2,
      title: 'Ideação',
      description: 'Use a IA para criar roteiros e títulos virais.',
      icon: Sparkles,
      actionText: 'Gerar Ideias',
      actionId: 'ai-tools',
      color: 'purple'
    },
    {
      id: 3,
      title: 'Criação',
      description: 'Edite e processe seus vídeos com nossa tecnologia.',
      icon: Video,
      actionText: 'Criar Vídeo',
      actionId: 'upload-video',
      color: 'pink'
    },
    {
      id: 4,
      title: 'Agendamento',
      description: 'Deixe o sistema publicar para você nos melhores horários.',
      icon: Calendar,
      actionText: 'Abrir Calendário',
      actionId: 'schedule-content',
      color: 'green'
    }
  ];

  if (currentStep === 5) {
    return (
      <Card className="p-8 bg-slate-900 border-slate-800 shadow-[0_0_50px_rgba(168,85,247,0.15)] overflow-hidden relative text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
        <div className="mx-auto w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Jornada Concluída!</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-6">Você completou todos os passos essenciais. Seu império de conteúdo já está rodando. Continue criando para ver o canal crescer!</p>
        <Button 
          className="bg-slate-800 hover:bg-slate-700 text-white"
          onClick={() => {
            // Optional: reset journey for testing
            setCompletedSteps([]);
            localStorage.setItem('viralcuts_journey_completed', JSON.stringify([]));
          }}
        >
          Reiniciar Tutorial
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative">
      {/* Background ambient glow effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
          Sua Jornada de Criação
        </h2>
        <p className="text-sm text-slate-400 mt-1">Siga o passo a passo para lançar seu império de conteúdo</p>
      </div>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-6 top-[3.5rem] bottom-[4rem] w-0.5 bg-slate-800/50 hidden sm:block z-0"></div>
        <div 
          className="absolute left-6 top-[3.5rem] w-0.5 bg-gradient-to-b from-purple-500 to-indigo-500 hidden sm:block z-0 transition-all duration-700 ease-in-out"
          style={{ height: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 sm:gap-6 relative z-10">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isPast = currentStep > step.id;
            const isFuture = currentStep < step.id;
            const Icon = step.icon;

            return (
              <div 
                key={step.id} 
                className={`relative flex items-start gap-4 p-4 rounded-xl transition-all duration-300
                  ${isActive ? 'bg-slate-800/80 border border-slate-700/50 shadow-lg scale-[1.02]' : 'bg-transparent border border-transparent'}
                  ${isFuture ? 'opacity-50' : 'opacity-100'}
                `}
              >
                {/* Visual Indicator */}
                <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300
                  ${isPast ? 'bg-green-500/20 text-green-500' : ''}
                  ${isActive ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : ''}
                  ${isFuture ? 'bg-slate-800 text-slate-500' : ''}
                `}>
                  {isPast ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className={`text-base font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    Passo {step.id}: {step.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1 mb-3">
                    {step.description}
                  </p>
                  
                  {/* Action Button for Active Step */}
                  <div className={`overflow-hidden transition-all duration-500 ${isActive ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                    <div className="flex gap-3">
                      <Button 
                        className="bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-transform hover:scale-105"
                        onClick={() => onNavigate(step.actionId)}
                      >
                        {step.actionText}
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        onClick={() => markStepDone(step.id)}
                      >
                        Marcar como Concluído
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
