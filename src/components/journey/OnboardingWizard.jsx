import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Sparkles, Youtube, Settings, Rocket } from 'lucide-react';
import { Button } from '../ui/button';
import { useJourney } from '../../contexts/JourneyContext';

const ONBOARDING_STEPS = [
    {
        id: 'welcome',
        title: 'Bem-vindo ao ViralCuts!',
        description: 'Vamos configurar tudo para você começar a criar conteúdo viral',
        icon: Sparkles,
        component: 'WelcomeStep'
    },
    {
        id: 'youtube-connection',
        title: 'Conectar YouTube',
        description: 'Conecte sua conta do YouTube para começar',
        icon: Youtube,
        component: 'YouTubeConnectionStep'
    },
    {
        id: 'channel-setup',
        title: 'Configurar Canal',
        description: 'Otimize seu canal para máximo impacto',
        icon: Settings,
        component: 'ChannelSetupStep'
    },
    {
        id: 'completion',
        title: 'Tudo Pronto!',
        description: 'Você está pronto para criar conteúdo viral',
        icon: Rocket,
        component: 'CompletionStep'
    }
];

export function OnboardingWizard({ isOpen, onClose, onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([]);
    const { journeyState, updateProgress } = useJourney();

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCompletedSteps(prev => [...prev, currentStep]);
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        // Save progress and allow resumption later
        localStorage.setItem('viralcuts-onboarding-skipped', 'true');
        localStorage.setItem('viralcuts-onboarding-step', currentStep.toString());
        onClose();
    };

    const handleComplete = () => {
        updateProgress('onboarding-completed');
        onComplete();
        onClose();
    };

    const currentStepData = ONBOARDING_STEPS[currentStep];
    const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-white">Configuração Inicial</h2>
                        <button
                            onClick={handleSkip}
                            className="text-slate-400 hover:text-white transition-colors p-1"
                            title="Pular configuração"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Passo {currentStep + 1} de {ONBOARDING_STEPS.length}</span>
                            <span>{Math.round(progress)}% concluído</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                            <div 
                                className="bg-gradient-to-r from-primary to-primary-light h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Steps Indicator - COMPACTO */}
                    <div className="flex items-center justify-between mt-3">
                        {ONBOARDING_STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                    index < currentStep 
                                        ? 'bg-success text-white' 
                                        : index === currentStep 
                                            ? 'bg-primary text-white' 
                                            : 'bg-slate-700 text-slate-400'
                                }`}>
                                    {index < currentStep ? (
                                        <Check className="w-3 h-3" />
                                    ) : (
                                        <step.icon className="w-3 h-3" />
                                    )}
                                </div>
                                {index < ONBOARDING_STEPS.length - 1 && (
                                    <div className={`w-8 h-0.5 mx-1 ${
                                        index < currentStep ? 'bg-success' : 'bg-slate-700'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content - COM SCROLL */}
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <currentStepData.icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-base font-bold text-white mb-2">{currentStepData.title}</h3>
                        <p className="text-sm text-slate-400">{currentStepData.description}</p>
                    </div>

                    {/* Step Content - ALTURA FLEXÍVEL */}
                    <div className="flex items-center justify-center">
                        {currentStepData.component === 'WelcomeStep' && (
                            <WelcomeStep onNext={handleNext} />
                        )}
                        {currentStepData.component === 'YouTubeConnectionStep' && (
                            <YouTubeConnectionStep onNext={handleNext} />
                        )}
                        {currentStepData.component === 'ChannelSetupStep' && (
                            <ChannelSetupStep onNext={handleNext} />
                        )}
                        {currentStepData.component === 'CompletionStep' && (
                            <CompletionStep onComplete={handleComplete} />
                        )}
                    </div>
                </div>

                {/* Footer - SEMPRE VISÍVEL */}
                <div className="p-4 border-t border-slate-700 flex items-center justify-between flex-shrink-0">
                    <Button
                        variant="ghost"
                        onClick={handlePrevious}
                        disabled={currentStep === 0}
                        className="text-slate-400 hover:text-white"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Anterior
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            onClick={handleSkip}
                            className="text-slate-400 hover:text-white"
                        >
                            Pular por agora
                        </Button>
                        
                        {currentStep < ONBOARDING_STEPS.length - 1 ? (
                            <Button onClick={handleNext} className="bg-primary hover:bg-primary-dark">
                                Próximo
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button onClick={handleComplete} className="bg-success hover:bg-success-dark">
                                Finalizar
                                <Check className="w-4 h-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Step Components
function WelcomeStep({ onNext }) {
    return (
        <div className="text-center space-y-4">
            <div className="text-4xl mb-4">👋</div>
            <p className="text-slate-300 max-w-md mx-auto">
                Bem-vindo ao ViralCuts! Vamos configurar tudo para você começar a criar conteúdo viral de forma rápida e eficiente.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Youtube className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-xs text-slate-400">Conectar YouTube</p>
                </div>
                <div className="text-center">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Settings className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-xs text-slate-400">Otimizar Canal</p>
                </div>
                <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-xs text-slate-400">Criar Conteúdo</p>
                </div>
            </div>
        </div>
    );
}

function YouTubeConnectionStep({ onNext }) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const handleConnect = async () => {
        setIsConnecting(true);
        // Simulate connection process
        setTimeout(() => {
            setIsConnecting(false);
            setIsConnected(true);
        }, 2000);
    };

    return (
        <div className="text-center space-y-4">
            {!isConnected ? (
                <>
                    <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Youtube className="w-10 h-10 text-red-500" />
                    </div>
                    <p className="text-slate-300 max-w-md mx-auto mb-6">
                        Conecte sua conta do YouTube para começar a gerenciar seus vídeos e acessar analytics.
                    </p>
                    <Button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isConnecting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Conectando...
                            </>
                        ) : (
                            <>
                                <Youtube className="w-4 h-4 mr-2" />
                                Conectar YouTube
                            </>
                        )}
                    </Button>
                </>
            ) : (
                <>
                    <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <p className="text-green-400 font-semibold mb-2">✅ YouTube Conectado!</p>
                    <p className="text-slate-300 text-sm">
                        Sua conta foi conectada com sucesso. Agora você pode gerenciar seus vídeos diretamente pelo ViralCuts.
                    </p>
                    <Button onClick={onNext} className="bg-primary hover:bg-primary-dark mt-4">
                        Continuar
                    </Button>
                </>
            )}
        </div>
    );
}

function ChannelSetupStep({ onNext }) {
    const [setupItems, setSetupItems] = useState([
        { id: 'photo', name: 'Foto do Canal', completed: false },
        { id: 'banner', name: 'Banner do Canal', completed: false },
        { id: 'description', name: 'Descrição', completed: false }
    ]);

    const handleItemToggle = (itemId) => {
        setSetupItems(prev => prev.map(item => 
            item.id === itemId ? { ...item, completed: !item.completed } : item
        ));
    };

    const completedCount = setupItems.filter(item => item.completed).length;
    const allCompleted = completedCount === setupItems.length;

    return (
        <div className="space-y-4 w-full max-w-md mx-auto">
            <p className="text-slate-300 text-center mb-6">
                Vamos otimizar seu canal para atrair mais visualizações:
            </p>
            
            <div className="space-y-3">
                {setupItems.map(item => (
                    <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            item.completed 
                                ? 'bg-green-500/10 border-green-500/30' 
                                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        }`}
                        onClick={() => handleItemToggle(item.id)}
                    >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            item.completed 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-slate-500'
                        }`}>
                            {item.completed && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`flex-1 ${
                            item.completed ? 'text-green-400' : 'text-slate-300'
                        }`}>
                            {item.name}
                        </span>
                    </div>
                ))}
            </div>

            <div className="text-center mt-6">
                <p className="text-xs text-slate-400 mb-4">
                    {completedCount} de {setupItems.length} itens concluídos
                </p>
                <Button
                    onClick={onNext}
                    disabled={!allCompleted}
                    className={allCompleted ? 'bg-primary hover:bg-primary-dark' : 'bg-slate-700 cursor-not-allowed'}
                >
                    {allCompleted ? 'Continuar' : 'Complete todos os itens'}
                </Button>
            </div>
        </div>
    );
}

function CompletionStep({ onComplete }) {
    return (
        <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">Parabéns!</h3>
            <p className="text-slate-300 max-w-md mx-auto mb-6">
                Sua configuração está completa! Agora você está pronto para criar conteúdo viral com as melhores ferramentas.
            </p>
            
            <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-300">
                    🚀 <strong>Próximos passos:</strong> Explore a Central de Criação e comece a usar as ferramentas de IA para criar seus primeiros vídeos virais!
                </p>
            </div>

            <Button onClick={onComplete} className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary-dark hover:to-purple-600">
                <Rocket className="w-4 h-4 mr-2" />
                Começar a Criar!
            </Button>
        </div>
    );
}