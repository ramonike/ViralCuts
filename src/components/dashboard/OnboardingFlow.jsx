import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

const ONBOARDING_STEPS = [
    {
        id: 'welcome',
        title: 'Bem-vindo ao ViralCuts v2.0! 🎉',
        description: 'Seu novo centro de comando para criação de conteúdo',
        image: '🚀',
    },
    {
        id: 'workspaces',
        title: 'Multi-Workspace',
        description: 'Gerencie múltiplos canais em um só lugar. Troque entre workspaces facilmente.',
        image: '📺',
        highlight: 'workspace-switcher',
    },
    {
        id: 'widgets',
        title: 'Widgets Customizáveis',
        description: 'Personalize seu dashboard! Adicione, remova e reorganize widgets como quiser.',
        image: '🎨',
        highlight: 'widgets-button',
    },
    {
        id: 'command',
        title: 'Command Palette',
        description: 'Pressione Cmd/Ctrl + K para acessar qualquer função rapidamente.',
        image: '⚡',
        shortcut: 'Cmd + K',
    },
    {
        id: 'premium',
        title: 'Features Premium',
        description: 'Desbloqueie AI Copilot, Revenue Tracker e Analytics Avançados.',
        image: '💎',
    },
];

export const OnboardingFlow = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has seen onboarding
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboardingV2');
        if (!hasSeenOnboarding) {
            setIsVisible(true);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        localStorage.setItem('hasSeenOnboardingV2', 'true');
        setIsVisible(false);
        if (onComplete) onComplete();
    };

    if (!isVisible) return null;

    const step = ONBOARDING_STEPS[currentStep];
    const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                {/* Spotlight effect */}
                {step.highlight && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), transparent 150px, rgba(0,0,0,0.8) 300px)',
                        }}
                    />
                )}

                {/* Onboarding Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative"
                >
                    {/* Progress Bar */}
                    <div className="h-1 bg-slate-900">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600"
                        />
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 p-2 hover:bg-slate-700 rounded-lg transition-colors z-10"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Content */}
                    <div className="p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Icon/Image */}
                                <div className="text-6xl mb-4 text-center">{step.image}</div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-white mb-3 text-center">
                                    {step.title}
                                </h2>

                                {/* Description */}
                                <p className="text-slate-300 text-center mb-6">
                                    {step.description}
                                </p>

                                {/* Shortcut Badge */}
                                {step.shortcut && (
                                    <div className="flex justify-center mb-6">
                                        <div className="px-4 py-2 bg-primary-500/20 border border-primary-500/30 rounded-lg">
                                            <kbd className="text-primary-400 font-mono font-bold">
                                                {step.shortcut}
                                            </kbd>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-8">
                            {/* Step Indicators */}
                            <div className="flex gap-2">
                                {ONBOARDING_STEPS.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`h-2 rounded-full transition-all ${index === currentStep
                                                ? 'w-8 bg-primary-500'
                                                : index < currentStep
                                                    ? 'w-2 bg-primary-500/50'
                                                    : 'w-2 bg-slate-700'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-2">
                                {currentStep > 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep(currentStep - 1)}
                                        className="border-slate-700"
                                    >
                                        Voltar
                                    </Button>
                                )}
                                <Button
                                    onClick={handleNext}
                                    className="bg-primary-600 hover:bg-primary-700"
                                >
                                    {currentStep === ONBOARDING_STEPS.length - 1 ? (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            Começar
                                        </>
                                    ) : (
                                        <>
                                            Próximo
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default OnboardingFlow;
