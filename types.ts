export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR'
}

export enum QueueStatus {
  WAITING = 'WAITING',
  NOTIFIED = 'NOTIFIED',
  CALLED = 'CALLED',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED',
  DONE = 'DONE'
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  COMPLETED = 'COMPLETED'
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string; // for public links
  address: string;
  isActive: boolean;
  queueActive: boolean;
  maxPartySize: number;
  averageTableTimeMinutes: number;
  calledTimeoutMinutes: number;
  themeColor?: string;
  logoUrl?: string; // URL/base64 da logo
  description?: string; // Descrição do restaurante
  phone?: string; // Telefone de contato
  email?: string; // Email de contato
  customDomain?: string; // Domínio customizado (opcional)
  socialMedia?: {
    instagram?: string;
    facebook?: string;
  }; // Redes sociais
}

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  isActive: boolean;
  displayOrder: number;
}

export interface MenuItemVariant {
  id: string;
  menuItemId: string;
  name: string;
  isRequired: boolean;
  priceModifier: number;
  displayOrder: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string; // Mantido para compatibilidade
  categoryId?: string;
  imageUrl?: string;
  isActive: boolean;
  available: boolean;
  variants?: MenuItemVariant[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicLink {
  id: string;
  restaurantId: string;
  code: string;
  name?: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueItem {
  id: string;
  customerName: string;
  partySize: number;
  phone: string;
  email?: string;
  status: QueueStatus;
  joinedAt: Date;
  notifiedAt?: Date;
  calledAt?: Date;
  noShowAt?: Date;
  position: number;
  manualOrder: boolean;
  estimatedWaitMinutes?: number;
  customerId?: string;
  customer?: Customer;
}

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  date: Date;
  partySize: number;
  status: ReservationStatus;
  notes?: string;
  email?: string;
  checkedInAt?: Date;
  noShowAt?: Date;
  originalReservationId?: string;
  customerId?: string;
  customer?: Customer;
}

export interface TimeBlock {
  id: string;
  restaurantId: string;
  date: Date;
  startTime?: string; // Formato "HH:mm"
  endTime?: string; // Formato "HH:mm"
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Waitlist {
  id: string;
  restaurantId: string;
  customerName: string;
  phone: string;
  email?: string;
  partySize: number;
  preferredDate?: Date;
  preferredTime?: string;
  notified: boolean;
  notifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatingHours {
  id: string;
  restaurantId: string;
  dayOfWeek: number; // 0=domingo, 6=sábado
  isOpen: boolean;
  openTime: string; // Formato "HH:mm"
  closeTime: string; // Formato "HH:mm"
}

export interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: { uri: string; title: string; placeAnswerSources?: { reviewSnippets?: any[] } };
}

export interface GeminiResponse {
  text: string;
  groundingMetadata?: {
    groundingChunks: GroundingChunk[];
  };
}

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K'
}