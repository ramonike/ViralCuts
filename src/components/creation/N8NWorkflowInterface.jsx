import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, AlertTriangle, Loader2, Zap, Clock } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

const N8NWorkflowInterface = () => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="overflow-hidden border-slate-800 bg-slate-950 shadow-2xl relative group">
                {/* Ovelay "Em Breve" */}
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-amber-500/20 text-amber-500 p-4 rounded-full mb-4">
                        <Clock className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Workflows Avançados em Breve</h3>
                    <p className="text-slate-300 max-w-md text-center">
                        A integração nativa de fluxos complexos com n8n está sendo refinada e estará totalmente disponível após a fase de testes iniciais.
                    </p>
                </div>

                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 opacity-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Zap className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Editor de Workflow Nativo</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                Conectado a: ...
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-slate-400" disabled>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Abrir Externo
                        </Button>
                    </div>
                </div>

                <div className="aspect-[16/10] min-h-[600px] w-full bg-slate-900 opacity-20 flex items-center justify-center">
                    {/* Fake mockup interface in background */}
                    <div className="text-slate-700 font-mono text-sm">Carregando painel n8n...</div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50 pointer-events-none">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-600/10 to-amber-600/10 border border-orange-500/20">
                    <h4 className="font-bold text-orange-400 mb-1">Clonagem de Conteúdo</h4>
                    <p className="text-xs text-slate-500">Fluxo para baixar, legendar e postar automaticamente.</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20">
                    <h4 className="font-bold text-blue-400 mb-1">Lead Capture AI</h4>
                    <p className="text-xs text-slate-500">Integre comentários de vídeos com seu CRM via n8n.</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/20">
                    <h4 className="font-bold text-purple-400 mb-1">Reaproveitamento Multi-formato</h4>
                    <p className="text-xs text-slate-500">Transforme Shorts em posts para Thread/Twitter.</p>
                </div>
            </div>
        </div>
    );
};

export default N8NWorkflowInterface;
