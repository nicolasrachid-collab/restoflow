import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateRestaurantConfigDto } from './dto/restaurant-settings.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

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
        minReservationAdvanceHours: true,
        maxReservationAdvanceDays: true,
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

  async updateConfig(restaurantId: string, data: UpdateRestaurantConfigDto, userId?: string) {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    const oldValue = { ...restaurant };

    const updated = await (this.prisma as any).restaurant.update({
      where: { id: restaurantId },
      data,
    });

    // Registrar em audit log
    if (userId) {
      await this.auditService.logAction(
        restaurantId,
        userId,
        'Restaurant',
        restaurantId,
        'UPDATE',
        oldValue,
        updated,
      );
    }

    return updated;
  }

  async toggleQueueActive(restaurantId: string, userId?: string) {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    const oldValue = { queueActive: restaurant.queueActive };

    const updated = await (this.prisma as any).restaurant.update({
      where: { id: restaurantId },
      data: { queueActive: !restaurant.queueActive },
    });

    // Registrar em audit log
    if (userId) {
      await this.auditService.logAction(
        restaurantId,
        userId,
        'Restaurant',
        restaurantId,
        'STATUS_CHANGE',
        oldValue,
        { queueActive: updated.queueActive },
        { action: 'toggle_queue_active' },
      );
    }

    return updated;
  }

  async toggleActive(restaurantId: string, userId?: string) {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante não encontrado');
    }

    const oldValue = { isActive: restaurant.isActive };

    const updated = await (this.prisma as any).restaurant.update({
      where: { id: restaurantId },
      data: { isActive: !restaurant.isActive },
    });

    // Registrar em audit log
    if (userId) {
      await this.auditService.logAction(
        restaurantId,
        userId,
        'Restaurant',
        restaurantId,
        'STATUS_CHANGE',
        oldValue,
        { isActive: updated.isActive },
        { action: 'toggle_restaurant_active' },
      );
    }

    return updated;
  }
}

