import { useState, useRef, useCallback } from 'react';
import { 
    Image, 
    Upload, 
    Trash2, 
    AlertCircle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { Button } from '../ui/button';

// YouTube thumbnail requirements
const THUMBNAIL_REQUIREMENTS = {
    minWidth: 640,
    minHeight: 360,
    recommendedWidth: 1280,
    recommendedHeight: 720,
    maxFileSize: 2 * 1024 * 1024, // 2MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    acceptedExtensions: '.jpg,.jpeg,.png,.gif'
};

/**
 * ThumbnailUploader - Componente para upload e preview de thumbnail
 * Requirements: 3.1
 * 
 * @param {Object} props
 * @param {File|null} props.thumbnail - Arquivo de thumbnail atual
 * @param {Function} props.onChange - Callback quando thumbnail muda
 * @param {boolean} props.disabled - Se o uploader está desabilitado
 * @param {boolean} props.uploading - Se está fazendo upload
 * @param {string} props.error - Mensagem de erro externa
 */
export function ThumbnailUploader({
    thumbnail = null,
    onChange,
    disabled = false,
    uploading = false,
    error: externalError = null
}) {
    const [preview, setPreview] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [validationError, setValidationError] = useState(null);
    const [dimensions, setDimensions] = useState(null);
    const fileInputRef = useRef(null);

    const validateImage = useCallback((file) => {
        return new Promise((resolve, reject) => {
            // Check file type
            if (!THUMBNAIL_REQUIREMENTS.acceptedTypes.includes(file.type)) {
                reject(new Error('Formato inválido. Use JPG, PNG ou GIF.'));
                return;
            }

            // Check file size
            if (file.size > THUMBNAIL_REQUIREMENTS.maxFileSize) {
                reject(new Error(`Arquivo muito grande. Máximo ${THUMBNAIL_REQUIREMENTS.maxFileSize / (1024 * 1024)}MB.`));
                return;
            }

            // Check dimensions
            const img = new window.Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                
                const width = img.width;
                const height = img.height;

                if (width < THUMBNAIL_REQUIREMENTS.minWidth || height < THUMBNAIL_REQUIREMENTS.minHeight) {
                    reject(new Error(`Dimensões mínimas: ${THUMBNAIL_REQUIREMENTS.minWidth}x${THUMBNAIL_REQUIREMENTS.minHeight}px. Sua imagem: ${width}x${height}px.`));
                    return;
                }

                resolve({ width, height });
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Não foi possível carregar a imagem.'));
            };

            img.src = objectUrl;
        });
    }, []);

    const handleFileSelect = useCallback(async (file) => {
        if (!file) return;

        setValidationError(null);
        setDimensions(null);

        try {
            const dims = await validateImage(file);
            setDimensions(dims);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target.result);
            };
            reader.readAsDataURL(file);

            onChange?.(file);
        } catch (err) {
            setValidationError(err.message);
            setPreview(null);
            onChange?.(null);
        }
    }, [validateImage, onChange]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragActive(false);
        
        if (disabled) return;
        
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [disabled, handleFileSelect]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        if (!disabled) {
            setDragActive(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setDragActive(false);
    }, []);

    const handleRemove = useCallback(() => {
        setPreview(null);
        setDimensions(null);
        setValidationError(null);
        onChange?.(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [onChange]);

    const error = externalError || validationError;
    const isRecommendedSize = dimensions && 
        dimensions.width >= THUMBNAIL_REQUIREMENTS.recommendedWidth && 
        dimensions.height >= THUMBNAIL_REQUIREMENTS.recommendedHeight;

    return (
        <div className="space-y-3">
            <label className="block text-sm font-semibold text-white">
                <Image className="w-4 h-4 inline mr-2" />
                Thumbnail Personalizada
            </label>

            {/* Drop Zone / Preview */}
            <div
                className={`
                    relative border-2 border-dashed rounded-xl overflow-hidden transition-all
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${dragActive 
                        ? 'border-blue-400 bg-blue-500/10' 
                        : preview 
                            ? 'border-green-400 bg-green-500/5'
                            : error
                                ? 'border-red-400 bg-red-500/5'
                                : 'border-slate-600 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
                    }
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={THUMBNAIL_REQUIREMENTS.acceptedExtensions}
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    disabled={disabled}
                />

                {preview ? (
                    <div className="relative aspect-video">
                        <img
                            src={preview}
                            alt="Thumbnail preview"
                            className="w-full h-full object-cover"
                        />
                        
                        {/* Overlay with info */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isRecommendedSize ? (
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                                        )}
                                        <span className={`text-sm ${isRecommendedSize ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {dimensions?.width}x{dimensions?.height}px
                                            {!isRecommendedSize && ' (recomendado: 1280x720)'}
                                        </span>
                                    </div>
                                    
                                    <Button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemove();
                                        }}
                                        disabled={disabled || uploading}
                                        variant="destructive"
                                        size="sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Uploading overlay */}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="flex items-center gap-2 text-white">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Enviando...</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <Upload className="w-10 h-10 mx-auto mb-3 text-slate-500" />
                        <p className="text-white font-medium mb-1">
                            Arraste uma imagem ou clique para selecionar
                        </p>
                        <p className="text-sm text-slate-400">
                            JPG, PNG ou GIF • Máximo 2MB • Recomendado: 1280x720px
                        </p>
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Requirements info */}
            <div className="text-xs text-slate-500 space-y-1">
                <p>• Dimensões mínimas: 640x360px</p>
                <p>• Dimensões recomendadas: 1280x720px (16:9)</p>
                <p>• Formatos aceitos: JPG, PNG, GIF</p>
                <p>• Tamanho máximo: 2MB</p>
            </div>
        </div>
    );
}

export default ThumbnailUploader;
