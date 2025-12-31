import React, { useState } from 'react';
import { Widget } from '../../../design-system/components/Widget';
import { Sparkles, Send, Lock, Loader2 } from 'lucide-react';
import { usePremium } from '../../contexts/PremiumContext';
import { Button } from '../ui/button';

export const AICopilotWidget = () => {
    const { hasFeature } = usePremium();
    const isPremium = hasFeature('aiCopilot');
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Olá! Sou seu assistente de IA. Como posso ajudar você hoje?',
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages([...messages, userMessage]);
        setInput('');
        setIsLoading(true);

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = {
                role: 'assistant',
                content: 'Esta é uma resposta simulada. Na versão final, isso será conectado a uma API de IA real.',
            };
            setMessages(prev => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1500);
    };

    if (!isPremium) {
        return (
            <Widget
                title="AI Copilot"
                icon={<Sparkles className="w-4 h-4" />}
                color="purple"
                className="col-span-full lg:col-span-2"
            >
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="p-4 bg-purple-500/10 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Feature Premium</h3>
                    <p className="text-sm text-slate-400 mb-4 max-w-xs">
                        Tenha um assistente de IA para ajudar com ideias, títulos, descrições e estratégias
                    </p>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                        Fazer Upgrade para Pro
                    </Button>
                </div>
            </Widget>
        );
    }

    return (
        <Widget
            title="AI Copilot"
            icon={<Sparkles className="w-4 h-4" />}
            color="purple"
            className="col-span-full lg:col-span-2"
            actions={
                <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">
                    Premium
                </span>
            }
        >
            {/* Chat Messages */}
            <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user'
                                ? 'bg-purple-500/20 border border-purple-500/30 text-white'
                                : 'bg-slate-900/50 border border-slate-700 text-slate-300'
                                }`}
                        >
                            <p className="text-sm">{message.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-900/50 border border-slate-700 p-3 rounded-lg">
                            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Pergunte algo..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isLoading}
                />
                <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>

            {/* Quick Actions */}
            <div className="mt-3 flex flex-wrap gap-2">
                <button
                    onClick={() => setInput('Me dê 5 ideias de vídeos sobre IA')}
                    className="px-3 py-1 text-xs bg-slate-900/50 border border-slate-700 rounded-full hover:bg-slate-800 transition-colors text-slate-300"
                >
                    💡 Ideias de vídeo
                </button>
                <button
                    onClick={() => setInput('Crie um título chamativo para um vídeo sobre produtividade')}
                    className="px-3 py-1 text-xs bg-slate-900/50 border border-slate-700 rounded-full hover:bg-slate-800 transition-colors text-slate-300"
                >
                    ✍️ Gerar título
                </button>
                <button
                    onClick={() => setInput('Qual o melhor horário para postar?')}
                    className="px-3 py-1 text-xs bg-slate-900/50 border border-slate-700 rounded-full hover:bg-slate-800 transition-colors text-slate-300"
                >
                    ⏰ Melhor horário
                </button>
            </div>
        </Widget>
    );
};

export default AICopilotWidget;
