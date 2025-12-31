import React, { useState } from 'react';
import {
    CheckSquare, Trash2, Calendar, Edit3, Download,
    Upload, X, ChevronDown, Loader2
} from 'lucide-react';
import { Button } from '../ui/button';

export const BulkOperationsPanel = ({ videos = [], onClose }) => {
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [bulkAction, setBulkAction] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Mock videos if none provided
    const videoList = videos.length > 0 ? videos : [
        { id: 1, title: 'Tutorial IA Generativa', status: 'draft', views: 0 },
        { id: 2, title: 'Review Produto X', status: 'scheduled', views: 1250 },
        { id: 3, title: 'Top 10 Dicas', status: 'published', views: 5420 },
        { id: 4, title: 'Vlog Diário #45', status: 'draft', views: 0 },
        { id: 5, title: 'Como usar ChatGPT', status: 'published', views: 8930 },
    ];

    const toggleVideo = (videoId) => {
        setSelectedVideos(prev =>
            prev.includes(videoId)
                ? prev.filter(id => id !== videoId)
                : [...prev, videoId]
        );
    };

    const toggleAll = () => {
        if (selectedVideos.length === videoList.length) {
            setSelectedVideos([]);
        } else {
            setSelectedVideos(videoList.map(v => v.id));
        }
    };

    const handleBulkAction = async () => {
        if (!bulkAction || selectedVideos.length === 0) return;

        setIsProcessing(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log(`Executing ${bulkAction} on videos:`, selectedVideos);

        setIsProcessing(false);
        setSelectedVideos([]);
        setBulkAction('');
    };

    const bulkActions = [
        { value: 'delete', label: 'Deletar', icon: Trash2, color: 'text-red-400' },
        { value: 'schedule', label: 'Agendar', icon: Calendar, color: 'text-blue-400' },
        { value: 'edit', label: 'Editar Metadados', icon: Edit3, color: 'text-purple-400' },
        { value: 'download', label: 'Baixar', icon: Download, color: 'text-green-400' },
        { value: 'upload', label: 'Fazer Upload', icon: Upload, color: 'text-orange-400' },
    ];

    return (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-500/20 rounded-lg">
                            <CheckSquare className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Operações em Massa</h2>
                            <p className="text-sm text-slate-400">
                                {selectedVideos.length} vídeo{selectedVideos.length !== 1 ? 's' : ''} selecionado{selectedVideos.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Actions Bar */}
                <div className="p-4 border-b border-slate-700 flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleAll}
                        className="border-slate-700"
                    >
                        {selectedVideos.length === videoList.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </Button>

                    <div className="flex-1 flex items-center gap-2">
                        <select
                            value={bulkAction}
                            onChange={(e) => setBulkAction(e.target.value)}
                            disabled={selectedVideos.length === 0}
                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                            <option value="">Selecione uma ação...</option>
                            {bulkActions.map((action) => (
                                <option key={action.value} value={action.value}>
                                    {action.label}
                                </option>
                            ))}
                        </select>

                        <Button
                            onClick={handleBulkAction}
                            disabled={!bulkAction || selectedVideos.length === 0 || isProcessing}
                            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                'Executar'
                            )}
                        </Button>
                    </div>
                </div>

                {/* Video List */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-250px)]">
                    <div className="space-y-2">
                        {videoList.map((video) => {
                            const isSelected = selectedVideos.includes(video.id);
                            const statusColors = {
                                draft: 'bg-slate-700 text-slate-300',
                                scheduled: 'bg-blue-500/20 text-blue-400',
                                published: 'bg-green-500/20 text-green-400',
                            };

                            return (
                                <div
                                    key={video.id}
                                    onClick={() => toggleVideo(video.id)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${isSelected
                                            ? 'bg-primary-500/10 border-primary-500/50'
                                            : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Checkbox */}
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                                                ? 'bg-primary-500 border-primary-500'
                                                : 'border-slate-600'
                                            }`}>
                                            {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                                        </div>

                                        {/* Video Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-white truncate">{video.title}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[video.status]}`}>
                                                    {video.status === 'draft' ? 'Rascunho' :
                                                        video.status === 'scheduled' ? 'Agendado' : 'Publicado'}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {video.views.toLocaleString()} visualizações
                                                </span>
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log('Edit video:', video.id);
                                                }}
                                                className="p-2 hover:bg-slate-700 rounded transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4 text-slate-400" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log('Delete video:', video.id);
                                                }}
                                                className="p-2 hover:bg-red-900/50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 flex items-center justify-between bg-slate-900/50">
                    <p className="text-sm text-slate-400">
                        Total: {videoList.length} vídeos
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="border-slate-700"
                        >
                            Fechar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkOperationsPanel;
