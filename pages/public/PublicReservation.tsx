import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { CalendarDays, CheckCircle, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { customerService } from '../../services/customerService';
import { Customer } from '../../types';
import { getAvailableSlots, validatePhone, validateEmail, formatPhone, validateDateRange } from '../../services/reservationService';

export const PublicReservation: React.FC = () => {
  const { slug } = useParams();
  const toast = useToast();
  const [step, setStep] = useState<'FORM' | 'EMAIL' | 'SUCCESS'>('FORM');
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [email, setEmail] = useState('');

  // Customer State
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Available slots state
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{
    date?: string;
    time?: string;
    phone?: string;
    email?: string;
    name?: string;
  }>({});

  // Load available slots when date changes
  useEffect(() => {
    if (date && slug) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
      setTime('');
    }
  }, [date, slug]);

  const loadAvailableSlots = async () => {
    if (!date || !slug) return;
    
    setLoadingSlots(true);
    try {
      const slots = await getAvailableSlots(slug, date);
      setAvailableSlots(slots);
      
      // Se o horário atual não está disponível, limpar seleção
      if (time && !slots.includes(time)) {
        setTime('');
      }
    } catch (error) {
      console.error('Erro ao carregar horários disponíveis', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (selectedDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate < today) {
      setErrors({ ...errors, date: 'Não é possível fazer reserva para datas passadas' });
      return;
    }
    
    setDate(selectedDate);
    setErrors({ ...errors, date: undefined });
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (value && !validatePhone(value)) {
      setErrors({ ...errors, phone: 'Formato de telefone inválido' });
    } else {
      setErrors({ ...errors, phone: undefined });
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value && !validateEmail(value)) {
      setErrors({ ...errors, email: 'Formato de email inválido' });
    } else {
      setErrors({ ...errors, email: undefined });
    }
  };

  const handleBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    const newErrors: typeof errors = {};

    // Validar campos obrigatórios
    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!validatePhone(phone)) {
      newErrors.phone = 'Formato de telefone inválido';
    }

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (!date) {
      newErrors.date = 'Data é obrigatória';
    }

    if (!time) {
      newErrors.time = 'Horário é obrigatório';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Validar data e horário
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const reservationDate = new Date(year, month - 1, day, hour, minute);
    
    const dateValidation = validateDateRange(reservationDate);
    if (!dateValidation.valid) {
      setErrors({ ...newErrors, date: dateValidation.error });
      return;
    }

    // Validar limite de pessoas
    const partySizeNum = parseInt(partySize);
    if (partySizeNum < 1) {
      toast.error('Número de pessoas deve ser pelo menos 1');
      return;
    }

    setLoading(true);

    try {
      // Buscar ou criar cliente
      const customerData = await customerService.findOrCreate(phone, name);
      setCustomer(customerData);

      // Se cliente não tem email, mostrar etapa de email
      if (!customerData.email) {
        setStep('EMAIL');
      } else {
        // Se já tem email, fazer reserva direto
        await createReservation(customerData.id);
      }
    } catch (error: any) {
      console.error('Erro ao buscar/criar cliente', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Não foi possível processar seus dados. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !slug) return;

    // Validar email se fornecido
    if (email.trim() && !validateEmail(email.trim())) {
      setErrors({ ...errors, email: 'Formato de email inválido' });
      return;
    }

    setLoading(true);

    try {
      // Atualizar email do cliente se fornecido
      if (email.trim()) {
        const updatedCustomer = await customerService.update(customer.id, { email: email.trim() });
        setCustomer(updatedCustomer);
      }

      // Criar reserva
      await createReservation(customer.id);
    } catch (error: any) {
      console.error('Erro ao atualizar cliente', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao processar reserva';
      
      // Verificar se é erro de duplicação
      if (errorMessage.includes('já existe uma reserva')) {
        toast.warning('Você já possui uma reserva para este dia. Por favor, escolha outra data ou entre em contato conosco.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const createReservation = async (customerId: string) => {
    if (!slug || !date || !time) return;

    // Combine date and time
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const reservationDate = new Date(year, month - 1, day, hour, minute);

    try {
      await api.post(`/reservations/public/${slug}`, {
        customerName: name,
        phone,
        partySize: parseInt(partySize),
        date: reservationDate,
        notes,
        email: email || undefined,
        customerId: customerId,
      });
      setStep('SUCCESS');
    } catch (error: any) {
      console.error("Erro ao reservar", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Não foi possível realizar a reserva. Tente novamente.";
      
      // Verificar se é erro de duplicação
      if (errorMessage.includes('já existe uma reserva')) {
        toast.warning('Você já possui uma reserva pendente ou confirmada para este dia. Por favor, escolha outra data ou entre em contato conosco.');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleSkipEmail = async () => {
    if (!customer || !slug) return;
    await createReservation(customer.id);
  };

  if (step === 'EMAIL') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-xl font-bold text-gray-900">Quase lá!</h2>
          <p className="text-sm text-gray-500">Complete seu cadastro para facilitar futuras reservas.</p>
        </div>

        <form onSubmit={handleEmailSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-gray-400 text-xs">(Opcional)</span>
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="seu@email.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Seu email será usado apenas para confirmações e facilitar futuras reservas.
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              type="button"
              variant="ghost" 
              onClick={handleSkipEmail}
              className="flex-1"
            >
              Pular
            </Button>
            <Button type="submit" className="flex-1" isLoading={loading}>
              <Mail size={18} className="mr-2"/> Confirmar Reserva
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'SUCCESS') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto animate-bounce">
          <CheckCircle size={32} />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reserva Solicitada!</h2>
          <p className="text-gray-500">Recebemos seu pedido. Enviaremos a confirmação via WhatsApp em breve.</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl text-left text-sm space-y-2">
            <div className="flex justify-between">
                <span className="text-gray-500">Data:</span>
                <span className="font-medium text-gray-900">{new Date(date).toLocaleDateString('pt-BR')} às {time}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500">Pessoas:</span>
                <span className="font-medium text-gray-900">{partySize} pax</span>
            </div>
             <div className="flex justify-between">
                <span className="text-gray-500">Nome:</span>
                <span className="font-medium text-gray-900">{name}</span>
            </div>
        </div>

        <Button variant="secondary" onClick={() => window.location.reload()}>Fazer outra reserva</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-xl font-bold text-gray-900">Reservar Mesa</h2>
        <p className="text-sm text-gray-500">Garanta seu lugar especial conosco.</p>
      </div>

      <form onSubmit={handleBasicInfo} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        
        <div className="grid grid-cols-2 gap-3">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input 
                required
                type="date" 
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.date && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.date}
              </p>
            )}
        </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pessoas</label>
                <select 
                    value={partySize}
                    onChange={(e) => setPartySize(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                    {[1,2,3,4,5,6,7,8,9,10,12,15,20].map(n => (
                    <option key={n} value={n}>{n} pax</option>
                    ))}
                </select>
             </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horário Disponível
              {loadingSlots && (
                <span className="ml-2 text-xs text-gray-500 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" />
                  Carregando...
                </span>
              )}
            </label>
            {!date ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                Selecione uma data para ver os horários disponíveis
              </p>
            ) : availableSlots.length === 0 && !loadingSlots ? (
              <p className="text-sm text-amber-600 py-4 text-center bg-amber-50 rounded-lg border border-amber-200">
                Não há horários disponíveis para esta data
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map(t => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTime(t);
                          setErrors({ ...errors, time: undefined });
                        }}
                        className={`py-2 text-sm font-medium rounded-lg border transition-colors ${
                            time === t 
                            ? 'bg-orange-600 text-white border-orange-600' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                        }`}
                    >
                        {t}
                    </button>
                ))}
              </div>
            )}
            {errors.time && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.time}
              </p>
            )}
        </div>

        <div className="pt-2 border-t border-gray-100 mt-2">
            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
                <input 
                    required
                    type="text" 
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrors({ ...errors, name: undefined });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Ana Souza"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.name}
                  </p>
                )}
            </div>

            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input 
                    required
                    type="tel" 
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(11) 99999-9999"
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.phone}
                  </p>
                )}
            </div>

            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                    required
                    type="email" 
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="seu@email.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.email}
                  </p>
                )}
            </div>
            
             <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações (Opcional)</label>
                <textarea 
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Cadeira de bebê, aniversário..."
                />
            </div>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
          <CalendarDays size={18} className="mr-2"/> Continuar
        </Button>
      </form>
    </div>
  );
};