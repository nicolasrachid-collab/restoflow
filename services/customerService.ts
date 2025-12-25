import { api } from './api';
import { Customer } from '../types';

export const customerService = {
  /**
   * Busca ou cria um cliente baseado no telefone
   */
  async findOrCreate(phone: string, name: string): Promise<Customer> {
    return api.post<Customer>('/customers/find-or-create', {
      phone,
      name,
    });
  },

  /**
   * Atualiza dados do cliente (principalmente email)
   */
  async update(id: string, data: { email?: string; name?: string }): Promise<Customer> {
    return api.patch<Customer>(`/customers/${id}`, data);
  },
};

