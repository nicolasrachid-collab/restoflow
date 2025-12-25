import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async isRestaurantActive(restaurantId: string): Promise<boolean> {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      select: { isActive: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    return restaurant.isActive;
  }

  async isQueueActive(restaurantId: string): Promise<boolean> {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      select: { queueActive: true, isActive: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    return restaurant.isActive && restaurant.queueActive;
  }

  async checkOperatingHours(restaurantId: string): Promise<boolean> {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        operatingHours: true,
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    // Se não tem horários configurados, permite acesso (compatibilidade)
    if (!restaurant.operatingHours || restaurant.operatingHours.length === 0) {
      return true;
    }

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=domingo, 6=sábado
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const todayHours = restaurant.operatingHours.find((oh: any) => oh.dayOfWeek === dayOfWeek);

    // Se não tem horário para hoje, está fechado
    if (!todayHours || !todayHours.isOpen) {
      return false;
    }

    // Comparar horários (formato "HH:mm")
    return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
  }

  async getRestaurantConfig(restaurantId: string) {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        queueActive: true,
        maxPartySize: true,
        averageTableTimeMinutes: true,
        calledTimeoutMinutes: true,
        operatingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    return restaurant;
  }

  async getRestaurantBySlug(slug: string) {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { slug },
      include: {
        operatingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    return restaurant;
  }
}

