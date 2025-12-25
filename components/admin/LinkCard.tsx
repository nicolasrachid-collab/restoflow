import React, { useState } from 'react';
import { PublicLink } from '../../types';
import { Button } from '../ui/Button';
import { Copy, Share2, Check, Link as LinkIcon, X } from 'lucide-react';

interface LinkCardProps {
  link: PublicLink & { queueUrl?: string; reservationUrl?: string; menuUrl?: string };
  baseUrl?: string;
  onCopy?: (url: string) => void;
  onShare?: (url: string) => void;
  onDeactivate?: (id: string) => void;
  onActivate?: (id: string) => void;
}

export const LinkCard: React.FC<LinkCardProps> = ({ 
  link, 
  baseUrl = window.location.origin,
  onCopy,
  onShare,
  onDeactivate,
  onActivate,
}) => {
  const [copied, setCopied] = useState(false);
  const fullUrl = `${baseUrl}${link.queueUrl || `/r/${link.code}/fila`}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.(fullUrl);
  };

  const handleShare = () => {
    const shareText = `Acesse nossa fila virtual: ${fullUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
    onShare?.(fullUrl);
  };

  return (
    <div className={`bg-white p-6 rounded-xl border-2 ${link.isActive ? 'border-indigo-200' : 'border-gray-200 opacity-60'} shadow-sm`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon size={18} className="text-indigo-600" />
            <h3 className="font-bold text-gray-900">
              {link.name || `Link ${link.code.substring(0, 4)}`}
            </h3>
            {!link.isActive && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                Inativo
              </span>
            )}
          </div>
          <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm text-gray-700 break-all">
            {fullUrl}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={handleCopy}
          className="flex-1"
        >
          {copied ? (
            <>
              <Check size={14} className="mr-1" /> Copiado!
            </>
          ) : (
            <>
              <Copy size={14} className="mr-1" /> Copiar
            </>
          )}
        </Button>
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={handleShare}
          className="flex-1"
        >
          <Share2 size={14} className="mr-1" /> Compartilhar
        </Button>
        {link.isActive ? (
          <Button 
            size="sm" 
            variant="danger" 
            onClick={() => onDeactivate?.(link.id)}
          >
            <X size={14} />
          </Button>
        ) : (
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => onActivate?.(link.id)}
          >
            Ativar
          </Button>
        )}
      </div>
    </div>
  );
};

