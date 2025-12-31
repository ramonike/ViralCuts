import React, { useState, useEffect } from 'react';
import { X, Trophy, Star } from 'lucide-react';

export function AchievementNotification({ achievement, isVisible, onClose }) {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setIsAnimating(true);
            // Auto close after 5 seconds
            const timer = setTimeout(() => {
                handleClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    if (!isVisible) return null;

    const getRarityStyles = (rarity) => {
        switch (rarity) {
            case 'legendary':
                return {
                    bg: 'bg-gradient-to-r from-purple-600 to-pink-600',
                    border: 'border-purple-400',
                    glow: 'shadow-purple-500/50'
                };
            case 'epic':
                return {
                    bg: 'bg-gradient-to-r from-orange-600 to-red-600',
                    border: 'border-orange-400',
                    glow: 'shadow-orange-500/50'
                };
            case 'rare':
                return {
                    bg: 'bg-gradient-to-r from-blue-600 to-cyan-600',
                    border: 'border-blue-400',
                    glow: 'shadow-blue-500/50'
                };
            default:
                return {
                    bg: 'bg-gradient-to-r from-slate-600 to-slate-700',
                    border: 'border-slate-400',
                    glow: 'shadow-slate-500/50'
                };
        }
    };

    const styles = getRarityStyles(achievement?.rarity);

    return (
        <div className="fixed top-4 right-4 z-50">
            <div className={`
                ${styles.bg} ${styles.border} ${styles.glow}
                border rounded-xl p-4 shadow-2xl max-w-sm
                transform transition-all duration-300 ease-out
                ${isAnimating ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
            `}>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-300" />
                        <span className="text-sm font-bold text-white">
                            Conquista Desbloqueada!
                        </span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white/70 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Achievement Content */}
                <div className="flex items-center gap-3">
                    <div className="text-3xl">{achievement?.icon}</div>
                    <div className="flex-1">
                        <h3 className="text-white font-bold text-sm mb-1">
                            {achievement?.title}
                        </h3>
                        <p className="text-white/80 text-xs mb-2">
                            {achievement?.description}
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-300" />
                                <span className="text-xs text-yellow-300 font-semibold">
                                    +{achievement?.points} pontos
                                </span>
                            </div>
                            <div className="text-xs text-white/60 capitalize">
                                {achievement?.rarity === 'legendary' ? 'Lendário' :
                                 achievement?.rarity === 'epic' ? 'Épico' :
                                 achievement?.rarity === 'rare' ? 'Raro' : 'Comum'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sparkle Animation */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-ping"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: '2s'
                            }}
                        >
                            <Star className="w-2 h-2 text-yellow-300 fill-current" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}