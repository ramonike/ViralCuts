import React, { useState } from 'react';
import { Sparkles, Video, Wand2, Wand, Layout, Send, Play, Layers, Zap, Cpu } from 'lucide-react';
import { Card } from '../components/ui/card';
import WidgetWrapper from '../components/shared/WidgetWrapper';
import N8NWorkflowInterface from '../components/creation/N8NWorkflowInterface';

const CreationPage = () => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [predictionId, setPredictionId] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' or 'n8n'

    const pollStatus = async (id) => {
        try {
            const response = await fetch(`/api/ai/status/${id}`);
            const data = await response.json();

            if (data.error) {
                setError(data.error);
                setIsGenerating(false);
                return;
            }

            setStatus(data.status);

            if (data.status === 'succeeded' && data.output) {
                setVideoUrl(data.output);
                setIsGenerating(false);
            } else if (data.status === 'failed' || data.status === 'canceled') {
                setError(`A geração ${data.status}`);
                setIsGenerating(false);
            } else {
                // Continue polling
                setTimeout(() => pollStatus(id), 3000);
            }
        } catch (err) {
            console.error('Erro ao verificar status:', err);
            setError('Erro de conexão com o servidor.');
            setIsGenerating(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);
        setVideoUrl(null);
        setStatus('starting');

        try {
            const response = await fetch('/api/ai/generate-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setPredictionId(data.id);
            pollStatus(data.id);
        } catch (err) {
            setError(err.message || 'Erro ao iniciar geração');
            setIsGenerating(false);
        }
    };

    const aiTools = [
        {
            title: 'Gerador de Vídeo (Prompt)',
            description: 'Crie clipes cinematográficos a partir de texto.',
            icon: <Video className="w-6 h-6 text-blue-400" />,
            api: 'Replicate / Sora',
            color: 'blue'
        },
        {
            title: 'Edição Viral Automática',
            description: 'Legendas, b-roll e cortes dinâmicos.',
            icon: <Wand2 className="w-6 h-6 text-purple-400" />,
            api: 'Submagic / Shotstack',
            color: 'purple'
        },
        {
            title: 'Motion Design (Imagem)',
            description: 'Transforme fotos em vídeos vivos.',
            icon: <Layers className="w-6 h-6 text-emerald-400" />,
            api: 'Leonardo AI',
            color: 'emerald'
        }
    ];

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-blue-400" />
                        Criação de Conteúdo com IA
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Transforme suas ideias em vídeos virais usando as APIs mais avançadas do mercado.
                    </p>
                </div>

                <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800 self-end">
                    <button
                        onClick={() => setActiveTab('prompt')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'prompt'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Wand className="w-4 h-4" />
                        Estúdio de Prompt
                    </button>
                    <button
                        onClick={() => setActiveTab('n8n')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'n8n'
                            ? 'bg-orange-500 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Zap className="w-4 h-4" />
                        Fluxos Avançados
                    </button>
                </div>
            </div>

            {activeTab === 'prompt' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-left-4 duration-500">
                    {/* Main Prompt Tool */}
                    <div className="lg:col-span-2 space-y-6">
                        <WidgetWrapper
                            title="Estúdio de Prompt"
                            icon={<Wand className="w-5 h-5 text-blue-400" />}
                        >
                            <div className="space-y-4">
                                {error && (
                                    <div className="p-4 rounded-xl bg-red-900/30 border border-red-800 text-red-400 text-sm flex items-start gap-3">
                                        <div className="p-1 bg-red-800/50 rounded-lg mt-0.5">
                                            <Sparkles className="w-3 h-3" />
                                        </div>
                                        <div>
                                            <p className="font-bold">Erro na Geração</p>
                                            <p className="opacity-80">{error}</p>
                                            {error.includes('REPLICATE_API_TOKEN') && (
                                                <p className="mt-2 text-xs font-mono bg-black/30 p-2 rounded">
                                                    Dica: Adicione REPLICATE_API_TOKEN no seu arquivo .env
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Ex: Um astronauta andando a cavalo em Marte, estilo cinematográfico, luz de pôr do sol..."
                                    className="w-full h-40 p-4 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                                />
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setPrompt('')}
                                        className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all font-medium"
                                    >
                                        Limpar
                                    </button>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !prompt.trim()}
                                        className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg ${isGenerating || !prompt.trim()
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105 active:scale-95 shadow-blue-500/20'
                                            }`}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span className="text-xs uppercase tracking-widest ml-1">
                                                    {status === 'starting' ? 'Iniciando...' : 'Gerando...'}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Gerar Vídeo
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </WidgetWrapper>

                        {/* Preview Placeholder or Video Result */}
                        <div className="aspect-video rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-600 group hover:border-slate-700 transition-all overflow-hidden relative">
                            {videoUrl ? (
                                <video
                                    src={videoUrl}
                                    className="w-full h-full object-contain bg-black"
                                    controls
                                    autoPlay
                                />
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 transition-opacity group-hover:opacity-100 opacity-0" />
                                    <Play className="w-12 h-12 mb-4 text-slate-700 group-hover:text-blue-500/50 transition-colors" />
                                    <p className="text-sm font-medium">
                                        {isGenerating ? 'O vídeo está sendo processado...' : 'Pré-visualização do vídeo aparecerá aqui'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Tools */}
                    <div className="space-y-6">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
                            Mais Ferramentas
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            {aiTools.map((tool, idx) => (
                                <Card
                                    key={idx}
                                    className="p-5 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl bg-${tool.color}-950/30 group-hover:scale-110 transition-transform`}>
                                            {tool.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                                                {tool.title}
                                            </h3>
                                            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                                {tool.description}
                                            </p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded bg-slate-800 text-slate-500">
                                                    API: {tool.api}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20">
                            <h3 className="text-blue-300 font-bold mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Upgrade Automático
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Assine o plano Pro para remover marcas d'água e desbloquear renderização em 4K via Submagic.
                            </p>
                            <button className="w-full mt-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold rounded-lg transition-all shadow-lg active:scale-95">
                                Ver Planos
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <N8NWorkflowInterface />
            )}
        </div>
    );
};

export default CreationPage;
