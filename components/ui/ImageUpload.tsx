import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { generateMenuImage } from '../../services/geminiService';
import { ImageSize } from '../../types';
import { useToast } from '../../context/ToastContext';

interface ImageUploadProps {
  value?: string | null; // base64 ou URL
  onChange: (value: string | null) => void;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  recommendedSize?: string;
  allowAIGeneration?: boolean;
  aiPrompt?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Imagem',
  accept = 'image/jpeg,image/png,image/webp',
  maxSizeMB = 5,
  recommendedSize = '512x512px',
  allowAIGeneration = false,
  aiPrompt,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageSize, setImageSize] = useState<ImageSize>(ImageSize.SIZE_1K);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = useCallback(async (file: File) => {
    // Validar tipo
    if (!accept.split(',').some(type => file.type === type.trim())) {
      toast.error(`Formato inválido. Use: ${accept}`);
      return;
    }

    // Validar tamanho
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      toast.error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
      return;
    }

    try {
      const base64 = await convertToBase64(file);
      onChange(base64);
      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      toast.error('Erro ao processar imagem');
    }
  }, [onChange, toast, accept, maxSizeMB]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Imagem removida');
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt) {
      toast.warning('Prompt não fornecido para geração de imagem');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Logo profissional para restaurante: ${aiPrompt}. Design moderno, minimalista, alta qualidade, 8k, fundo transparente ou sólido.`;
      const base64 = await generateMenuImage(prompt, imageSize);
      if (base64) {
        onChange(base64);
        toast.success('Logo gerada com sucesso!');
      } else {
        toast.error('Falha ao gerar logo.');
      }
    } catch (error) {
      console.error('Erro ao gerar logo:', error);
      toast.error('Erro ao gerar logo com IA');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}

      {value ? (
        // Preview da imagem
        <div className="relative group">
          <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              type="button"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Clique na imagem para alterar
          </p>
        </div>
      ) : (
        // Área de upload
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative w-full h-48 border-2 border-dashed rounded-xl
            flex flex-col items-center justify-center gap-3
            cursor-pointer transition-all
            ${
              isDragging
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50/30'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-white rounded-full">
              <Upload
                size={24}
                className={isDragging ? 'text-orange-500' : 'text-gray-400'}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {isDragging ? 'Solte a imagem aqui' : 'Clique ou arraste uma imagem'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {accept.split(',').join(', ')} • Máx. {maxSizeMB}MB
              </p>
              {recommendedSize && (
                <p className="text-xs text-gray-400 mt-1">
                  Recomendado: {recommendedSize}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex gap-2">
        {!value && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <ImageIcon size={16} className="mr-2" />
            Selecionar Arquivo
          </Button>
        )}

        {allowAIGeneration && aiPrompt && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleGenerateWithAI}
            isLoading={isGenerating}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles size={16} className="mr-2" />
                Gerar com IA
              </>
            )}
          </Button>
        )}

        {value && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <ImageIcon size={16} className="mr-2" />
            Alterar Imagem
          </Button>
        )}
      </div>

      {allowAIGeneration && aiPrompt && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Tamanho:</span>
          <select
            value={imageSize}
            onChange={(e) => setImageSize(e.target.value as ImageSize)}
            className="px-2 py-1 border border-gray-300 rounded text-xs"
            disabled={isGenerating}
          >
            <option value={ImageSize.SIZE_1K}>1K (512x512)</option>
            <option value={ImageSize.SIZE_2K}>2K (1024x1024)</option>
            <option value={ImageSize.SIZE_4K}>4K (2048x2048)</option>
          </select>
        </div>
      )}
    </div>
  );
};

