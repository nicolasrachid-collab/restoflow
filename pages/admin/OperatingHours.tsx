import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { Clock, Save } from 'lucide-react';

interface OperatingHoursItem {
  id: string;
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

export const OperatingHours: React.FC = () => {
  const [hours, setHours] = useState<OperatingHoursItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadHours();
  }, []);

  const loadHours = async () => {
    try {
      const data = await api.get<OperatingHoursItem[]>('/restaurants/operating-hours');
      setHours(data);
      setHasChanges(false);
    } catch (error) {
      console.error('Erro ao carregar horários', error);
      alert('Erro ao carregar horários');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (dayOfWeek: number) => {
    setHours((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, isOpen: !h.isOpen } : h,
      ),
    );
    setHasChanges(true);
  };

  const handleTimeChange = (dayOfWeek: number, field: 'openTime' | 'closeTime', value: string) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h)),
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Validar horários
    for (const hour of hours) {
      if (hour.isOpen) {
        if (!hour.openTime || !hour.closeTime) {
          alert(`Por favor, preencha os horários para ${DAYS_OF_WEEK[hour.dayOfWeek].label}`);
          return;
        }
        if (hour.openTime >= hour.closeTime) {
          alert(
            `O horário de abertura deve ser anterior ao de fechamento em ${DAYS_OF_WEEK[hour.dayOfWeek].label}`,
          );
          return;
        }
      }
    }

    setSaving(true);
    try {
      await api.put('/restaurants/operating-hours', {
        hours: hours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          isOpen: h.isOpen,
          openTime: h.isOpen ? h.openTime : '09:00',
          closeTime: h.isOpen ? h.closeTime : '22:00',
        })),
      });
      setHasChanges(false);
      alert('Horários salvos com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar horários', error);
      alert(error.message || 'Erro ao salvar horários');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando horários...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Horários de Funcionamento</h2>
          <p className="text-gray-500">Configure os horários de abertura e fechamento por dia da semana</p>
        </div>
        <Button onClick={handleSave} isLoading={saving} disabled={!hasChanges}>
          <Save size={18} className="mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {DAYS_OF_WEEK.map((day) => {
            const hour = hours.find((h) => h.dayOfWeek === day.value);
            if (!hour) return null;

            return (
              <div
                key={day.value}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={hour.isOpen}
                      onChange={() => handleToggleDay(day.value)}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label className="font-medium text-gray-900 min-w-[140px]">
                      {day.label}
                    </label>
                  </div>
                  {hour.isOpen ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-gray-400" />
                        <input
                          type="time"
                          value={hour.openTime}
                          onChange={(e) => handleTimeChange(day.value, 'openTime', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <span className="text-gray-500">até</span>
                        <input
                          type="time"
                          value={hour.closeTime}
                          onChange={(e) => handleTimeChange(day.value, 'closeTime', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Fechado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> Os horários de funcionamento são validados automaticamente quando
          clientes tentam entrar na fila ou fazer reservas. Certifique-se de configurar corretamente
          para evitar problemas.
        </p>
      </div>
    </div>
  );
};

