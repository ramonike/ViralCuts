import { useState, useEffect } from 'react';
import { 
    Tag, 
    FolderOpen, 
    Globe, 
    Lock, 
    EyeOff,
    ListVideo,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const PRIVACY_OPTIONS = [
    { value: 'public', label: 'Público', icon: Globe, description: 'Visível para todos' },
    { value: 'unlisted', label: 'Não listado', icon: EyeOff, description: 'Apenas com link' },
    { value: 'private', label: 'Privado', icon: Lock, description: 'Apenas você' }
];

/**
 * MetadataForm - Formulário completo de metadados para upload de vídeo
 * Requirements: 3.1-3.4
 * 
 * @param {Object} props
 * @param {Object} props.metadata - Metadados atuais do vídeo
 * @param {Function} props.onChange - Callback quando metadados mudam
 * @param {Array} props.categories - Lista de categorias do YouTube
 * @param {Array} props.playlists - Lista de playlists do usuário
 * @param {boolean} props.loadingCategories - Se está carregando categorias
 * @param {boolean} props.loadingPlaylists - Se está carregando playlists
 * @param {string} props.error - Mensagem de erro
 * @param {boolean} props.disabled - Se o formulário está desabilitado
 */
export function MetadataForm({
    metadata = {},
    onChange,
    categories = [],
    playlists = [],
    loadingCategories = false,
    loadingPlaylists = false,
    error = null,
    disabled = false
}) {
    const [localMetadata, setLocalMetadata] = useState({
        title: '',
        description: '',
        tags: [],
        tagInput: '',
        categoryId: '22', // Default: People & Blogs
        privacyStatus: 'private',
        playlistId: '',
        ...metadata
    });

    useEffect(() => {
        setLocalMetadata(prev => ({
            ...prev,
            ...metadata,
            tagInput: ''
        }));
    }, [metadata]);

    const handleChange = (field, value) => {
        const updated = { ...localMetadata, [field]: value };
        setLocalMetadata(updated);
        
        // Remove tagInput from the data sent to parent
        const { tagInput, ...dataToSend } = updated;
        onChange?.(dataToSend);
    };

    const handleTagAdd = () => {
        const newTag = localMetadata.tagInput.trim();
        if (newTag && !localMetadata.tags.includes(newTag)) {
            const newTags = [...localMetadata.tags, newTag];
            handleChange('tags', newTags);
            setLocalMetadata(prev => ({ ...prev, tagInput: '' }));
        }
    };

    const handleTagRemove = (tagToRemove) => {
        const newTags = localMetadata.tags.filter(tag => tag !== tagToRemove);
        handleChange('tags', newTags);
    };

    const handleTagInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTagAdd();
        } else if (e.key === ',' || e.key === ';') {
            e.preventDefault();
            handleTagAdd();
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Título */}
            <div>
                <label className="block text-sm font-semibold text-white mb-2">
                    Título do Vídeo *
                </label>
                <Input
                    value={localMetadata.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Ex: 5 Curiosidades Incríveis Sobre Gatos"
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                    disabled={disabled}
                    maxLength={100}
                />
                <p className="text-xs text-slate-500 mt-1">
                    {localMetadata.title.length}/100 caracteres
                </p>
            </div>

            {/* Descrição */}
            <div>
                <label className="block text-sm font-semibold text-white mb-2">
                    Descrição
                </label>
                <textarea
                    value={localMetadata.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Adicione uma descrição para o seu vídeo..."
                    rows={4}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                    disabled={disabled}
                    maxLength={5000}
                />
                <p className="text-xs text-slate-500 mt-1">
                    {localMetadata.description.length}/5000 caracteres
                </p>
            </div>

            {/* Tags */}
            <div>
                <label className="block text-sm font-semibold text-white mb-2">
                    <Tag className="w-4 h-4 inline mr-2" />
                    Tags
                </label>
                <div className="flex gap-2 mb-2">
                    <Input
                        value={localMetadata.tagInput}
                        onChange={(e) => setLocalMetadata(prev => ({ ...prev, tagInput: e.target.value }))}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder="Digite uma tag e pressione Enter"
                        className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 flex-1"
                        disabled={disabled}
                    />
                    <Button
                        type="button"
                        onClick={handleTagAdd}
                        disabled={disabled || !localMetadata.tagInput.trim()}
                        variant="secondary"
                        size="default"
                    >
                        Adicionar
                    </Button>
                </div>
                
                {localMetadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {localMetadata.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-300"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleTagRemove(tag)}
                                    className="ml-1 text-blue-400 hover:text-red-400 transition-colors"
                                    disabled={disabled}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                <p className="text-xs text-slate-500 mt-2">
                    Separe tags com Enter ou vírgula. Máximo 500 caracteres no total.
                </p>
            </div>

            {/* Categoria */}
            <div>
                <label className="block text-sm font-semibold text-white mb-2">
                    <FolderOpen className="w-4 h-4 inline mr-2" />
                    Categoria
                </label>
                <div className="relative">
                    <select
                        value={localMetadata.categoryId}
                        onChange={(e) => handleChange('categoryId', e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer disabled:opacity-50"
                        disabled={disabled || loadingCategories}
                    >
                        {loadingCategories ? (
                            <option>Carregando categorias...</option>
                        ) : categories.length > 0 ? (
                            categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.snippet?.title || cat.title}
                                </option>
                            ))
                        ) : (
                            <>
                                <option value="22">People & Blogs</option>
                                <option value="24">Entertainment</option>
                                <option value="23">Comedy</option>
                                <option value="10">Music</option>
                                <option value="20">Gaming</option>
                                <option value="28">Science & Technology</option>
                                <option value="27">Education</option>
                                <option value="17">Sports</option>
                            </>
                        )}
                    </select>
                    {loadingCategories && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                    )}
                </div>
            </div>

            {/* Privacidade */}
            <div>
                <label className="block text-sm font-semibold text-white mb-3">
                    Privacidade
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PRIVACY_OPTIONS.map(option => {
                        const Icon = option.icon;
                        const isSelected = localMetadata.privacyStatus === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleChange('privacyStatus', option.value)}
                                disabled={disabled}
                                className={`
                                    flex flex-col items-center gap-2 p-3 rounded-lg border transition-all
                                    ${isSelected
                                        ? 'border-blue-400 bg-blue-500/10 text-white'
                                        : 'border-slate-600 bg-slate-800/30 text-slate-400 hover:border-slate-500 hover:text-white'
                                    }
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                `}
                            >
                                <Icon className="w-5 h-5" />
                                <div className="text-center">
                                    <div className="font-medium text-sm">{option.label}</div>
                                    <div className="text-xs opacity-75">{option.description}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Playlist */}
            <div>
                <label className="block text-sm font-semibold text-white mb-2">
                    <ListVideo className="w-4 h-4 inline mr-2" />
                    Adicionar à Playlist (Opcional)
                </label>
                <div className="relative">
                    <select
                        value={localMetadata.playlistId}
                        onChange={(e) => handleChange('playlistId', e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer disabled:opacity-50"
                        disabled={disabled || loadingPlaylists}
                    >
                        <option value="">Nenhuma playlist</option>
                        {loadingPlaylists ? (
                            <option disabled>Carregando playlists...</option>
                        ) : (
                            playlists.map(playlist => (
                                <option key={playlist.id} value={playlist.id}>
                                    {playlist.snippet?.title || playlist.title} 
                                    {playlist.contentDetails?.itemCount !== undefined && 
                                        ` (${playlist.contentDetails.itemCount} vídeos)`
                                    }
                                </option>
                            ))
                        )}
                    </select>
                    {loadingPlaylists && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                    )}
                </div>
            </div>
        </div>
    );
}

export default MetadataForm;
