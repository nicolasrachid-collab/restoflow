import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { ToastType } from '../../context/ToastContext';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onClose: () => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-600',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: 'text-amber-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-600',
  },
};

export const Toast: React.FC<ToastProps> = ({ id, type, message, onClose }) => {
  const Icon = icons[type];
  const style = styles[type];

  return (
    <div
      className={`${style.bg} ${style.border} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[500px] animate-slide-in-right flex items-start gap-3`}
      role="alert"
      aria-live="assertive"
    >
      <Icon className={`${style.icon} shrink-0 mt-0.5`} size={20} />
      <div className={`flex-1 ${style.text} text-sm font-medium`}>
        {message}
      </div>
      <button
        onClick={onClose}
        className={`${style.text} hover:opacity-70 transition-opacity shrink-0`}
        aria-label="Fechar notificação"
      >
        <X size={16} />
      </button>
    </div>
  );
};

