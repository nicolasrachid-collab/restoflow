import React, { useState } from 'react';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  presetColors?: string[];
}

const DEFAULT_PRESET_COLORS = [
  '#f97316', // Orange
  '#ef4444', // Red
  '#10b981', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value = '#f97316',
  onChange,
  label = 'Cor do Tema',
  presetColors = DEFAULT_PRESET_COLORS,
}) => {
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="flex items-center gap-3">
        {/* Input de cor nativo */}
        <div className="relative">
          <input
            type="color"
            value={value || '#f97316'}
            onChange={(e) => onChange(e.target.value)}
            className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
            style={{ appearance: 'none', WebkitAppearance: 'none' }}
          />
          <div
            className="absolute inset-0 rounded-lg border-2 border-white shadow-sm pointer-events-none"
            style={{ backgroundColor: value || '#f97316' }}
          />
        </div>

        {/* Preview e código hexadecimal */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-lg border-2 border-gray-200 shadow-sm"
              style={{ backgroundColor: value || '#f97316' }}
            />
            <div className="flex-1">
              <input
                type="text"
                value={value || '#f97316'}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
                    onChange(newValue);
                  }
                }}
                placeholder="#f97316"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Botão para mostrar presets */}
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title="Cores pré-definidas"
        >
          <Palette size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Paleta de cores pré-definidas */}
      {showPresets && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Cores pré-definidas:</p>
          <div className="flex flex-wrap gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setShowPresets(false);
                }}
                className={`
                  w-10 h-10 rounded-lg border-2 transition-all
                  ${value === color ? 'border-gray-900 scale-110' : 'border-gray-300 hover:border-gray-400'}
                `}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

