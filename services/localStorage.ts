// Serviço de persistência local usando localStorage
import { QueueItem, MenuItem, Reservation, Category, PublicLink } from '../types';

const STORAGE_KEYS = {
  QUEUE: 'restoflow_queue',
  MENU: 'restoflow_menu',
  RESERVATIONS: 'restoflow_reservations',
  RESTAURANT: 'restoflow_restaurant',
  USERS: 'restoflow_users',
  CATEGORIES: 'restoflow_categories',
  PUBLIC_LINKS: 'restoflow_public_links',
} as const;

// Função auxiliar para converter strings de data para Date objects
const parseDates = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(parseDates);
  }
  if (typeof obj === 'object') {
    const parsed: any = {};
    for (const key in obj) {
      if (key.includes('At') || key === 'date' || key === 'joinedAt' || key === 'notifiedAt' || key === 'calledAt' || key === 'checkedInAt' || key === 'createdAt' || key === 'updatedAt') {
        parsed[key] = obj[key] ? new Date(obj[key]) : undefined;
      } else {
        parsed[key] = parseDates(obj[key]);
      }
    }
    return parsed;
  }
  return obj;
};

// Função auxiliar para salvar dados
const save = <T>(key: string, data: T): void => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Erro ao salvar ${key} no localStorage:`, error);
    // Se exceder o limite, tenta limpar dados antigos
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('LocalStorage cheio. Limpando dados antigos...');
      clearAll();
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (retryError) {
        console.error('Erro ao salvar após limpeza:', retryError);
      }
    }
  }
};

// Função auxiliar para carregar dados
const load = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item);
    return parseDates(parsed) as T;
  } catch (error) {
    console.error(`Erro ao carregar ${key} do localStorage:`, error);
    return defaultValue;
  }
};

// Limpar todos os dados
export const clearAll = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Queue
export const queueStorage = {
  save: (queue: QueueItem[]): void => save(STORAGE_KEYS.QUEUE, queue),
  load: (defaultValue: QueueItem[] = []): QueueItem[] => load(STORAGE_KEYS.QUEUE, defaultValue),
  clear: (): void => localStorage.removeItem(STORAGE_KEYS.QUEUE),
};

// Menu
export const menuStorage = {
  save: (menu: MenuItem[]): void => save(STORAGE_KEYS.MENU, menu),
  load: (defaultValue: MenuItem[] = []): MenuItem[] => load(STORAGE_KEYS.MENU, defaultValue),
  clear: (): void => localStorage.removeItem(STORAGE_KEYS.MENU),
};

// Reservations
export const reservationsStorage = {
  save: (reservations: Reservation[]): void => save(STORAGE_KEYS.RESERVATIONS, reservations),
  load: (defaultValue: Reservation[] = []): Reservation[] => load(STORAGE_KEYS.RESERVATIONS, defaultValue),
  clear: (): void => localStorage.removeItem(STORAGE_KEYS.RESERVATIONS),
};

// Restaurant
export const restaurantStorage = {
  save: (restaurant: any): void => save(STORAGE_KEYS.RESTAURANT, restaurant),
  load: (defaultValue: any = null): any => load(STORAGE_KEYS.RESTAURANT, defaultValue),
  clear: (): void => localStorage.removeItem(STORAGE_KEYS.RESTAURANT),
};

// Users
export const usersStorage = {
  save: (users: any[]): void => save(STORAGE_KEYS.USERS, users),
  load: (defaultValue: any[] = []): any[] => load(STORAGE_KEYS.USERS, defaultValue),
  clear: (): void => localStorage.removeItem(STORAGE_KEYS.USERS),
};

// Categories
export const categoriesStorage = {
  save: (categories: Category[]): void => save(STORAGE_KEYS.CATEGORIES, categories),
  load: (defaultValue: Category[] = []): Category[] => load(STORAGE_KEYS.CATEGORIES, defaultValue),
  clear: (): void => localStorage.removeItem(STORAGE_KEYS.CATEGORIES),
};

// Public Links
export const publicLinksStorage = {
  save: (links: PublicLink[]): void => save(STORAGE_KEYS.PUBLIC_LINKS, links),
  load: (defaultValue: PublicLink[] = []): PublicLink[] => load(STORAGE_KEYS.PUBLIC_LINKS, defaultValue),
  clear: (): void => localStorage.removeItem(STORAGE_KEYS.PUBLIC_LINKS),
};

