import { api } from './api';

export interface AvailableSlotsResponse {
  availableSlots: string[];
}

/**
 * Busca horários disponíveis para uma data específica
 */
export async function getAvailableSlots(slug: string, date: string): Promise<string[]> {
  try {
    const response = await api.get<AvailableSlotsResponse>(
      `/reservations/public/${slug}/available-slots?date=${date}`
    );
    return response.availableSlots || [];
  } catch (error) {
    console.error('Erro ao buscar horários disponíveis', error);
    return [];
  }
}

/**
 * Valida formato de telefone brasileiro
 */
export function validatePhone(phone: string): boolean {
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  // Telefone brasileiro deve ter 10 ou 11 dígitos (com DDD)
  return cleaned.length >= 10 && cleaned.length <= 11;
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formata telefone para exibição (XX) XXXXX-XXXX
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
}

/**
 * Valida se uma data está dentro do período permitido
 */
export function validateDateRange(
  date: Date,
  minAdvanceHours: number = 2,
  maxAdvanceDays: number = 30
): { valid: boolean; error?: string } {
  const now = new Date();
  const minDate = new Date(now);
  minDate.setHours(minDate.getHours() + minAdvanceHours);
  
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
  
  if (date < now) {
    return { valid: false, error: 'Não é possível fazer reserva para datas passadas' };
  }
  
  if (date < minDate) {
    return { 
      valid: false, 
      error: `A reserva deve ser feita com pelo menos ${minAdvanceHours} horas de antecedência` 
    };
  }
  
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  const maxDateOnly = new Date(maxDate);
  maxDateOnly.setHours(0, 0, 0, 0);
  
  if (dateOnly > maxDateOnly) {
    return { 
      valid: false, 
      error: `A reserva não pode ser feita com mais de ${maxAdvanceDays} dias de antecedência` 
    };
  }
  
  return { valid: true };
}

