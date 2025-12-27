/**
 * Funções de validação reutilizáveis
 */

export const validateEmail = (email: string): boolean => {
  if (!email || !email.trim()) {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const validatePhone = (phone: string): boolean => {
  if (!phone || !phone.trim()) {
    return false;
  }
  // Aceita números, espaços, parênteses, hífens e +
  const phoneRegex = /^[\d\s\(\)\-\+]+$/;
  return phoneRegex.test(phone.trim()) && phone.replace(/\D/g, '').length >= 10;
};

export const validateRequired = (value: string | number | null | undefined): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return true;
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

export const validateNumber = (value: string | number, min?: number, max?: number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    return false;
  }
  if (min !== undefined && num < min) {
    return false;
  }
  if (max !== undefined && num > max) {
    return false;
  }
  return true;
};

export const validateDate = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return !isNaN(d.getTime());
};

export const validateDateNotPast = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return d >= now;
};

export const validateDateRange = (date: Date | string, minHours?: number, maxDays?: number): { valid: boolean; error?: string } => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  if (d < now) {
    return { valid: false, error: 'Não é possível fazer reserva para datas/horários passados' };
  }

  if (minHours !== undefined) {
    const minDate = new Date(now);
    minDate.setHours(minDate.getHours() + minHours);
    if (d < minDate) {
      return { valid: false, error: `A reserva deve ser feita com pelo menos ${minHours} horas de antecedência` };
    }
  }

  if (maxDays !== undefined) {
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + maxDays);
    maxDate.setHours(23, 59, 59, 999);
    if (d > maxDate) {
      return { valid: false, error: `A reserva não pode ser feita com mais de ${maxDays} dias de antecedência` };
    }
  }

  return { valid: true };
};

