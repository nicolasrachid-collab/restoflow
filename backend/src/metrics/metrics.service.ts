import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueStatus, ReservationStatus } from '@prisma/client';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async getQueueMetrics(restaurantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { restaurantId };
    
    if (startDate || endDate) {
      where.joinedAt = {};
      if (startDate) where.joinedAt.gte = startDate;
      if (endDate) where.joinedAt.lte = endDate;
    }

    const queueItems = await (this.prisma as any).queueItem.findMany({
      where,
      orderBy: { joinedAt: 'desc' },
    });

    const total = queueItems.length;
    const completed = queueItems.filter((item: any) => item.status === QueueStatus.DONE).length;
    const noShows = queueItems.filter((item: any) => item.status === QueueStatus.NO_SHOW).length;
    const cancelled = queueItems.filter((item: any) => item.status === QueueStatus.CANCELLED).length;

    // Calcular tempo médio de espera (apenas para concluídos)
    const completedItems = queueItems.filter((item: any) => 
      item.status === QueueStatus.DONE && item.calledAt
    );

    let averageWaitMinutes = 0;
    if (completedItems.length > 0) {
      const totalWaitTime = completedItems.reduce((sum: number, item: any) => {
        const waitTime = (new Date(item.calledAt).getTime() - new Date(item.joinedAt).getTime()) / 60000;
        return sum + waitTime;
      }, 0);
      averageWaitMinutes = Math.round(totalWaitTime / completedItems.length);
    }

    // Taxa de no-show
    const noShowRate = total > 0 ? (noShows / total) * 100 : 0;

    return {
      total,
      completed,
      noShows,
      cancelled,
      averageWaitMinutes,
      noShowRate: Math.round(noShowRate * 100) / 100,
    };
  }

  async getReservationMetrics(restaurantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { restaurantId };
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const reservations = await (this.prisma as any).reservation.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const total = reservations.length;
    const confirmed = reservations.filter((r: any) => r.status === ReservationStatus.CONFIRMED).length;
    const checkedIn = reservations.filter((r: any) => r.status === ReservationStatus.CHECKED_IN).length;
    const completed = reservations.filter((r: any) => r.status === ReservationStatus.COMPLETED).length;
    const noShows = reservations.filter((r: any) => r.status === ReservationStatus.NO_SHOW).length;
    const cancelled = reservations.filter((r: any) => r.status === ReservationStatus.CANCELLED).length;

    // Taxa de no-show
    const noShowRate = total > 0 ? (noShows / total) * 100 : 0;

    // Taxa de comparecimento (checkedIn + completed / confirmed)
    const attendanceRate = confirmed > 0 
      ? ((checkedIn + completed) / confirmed) * 100 
      : 0;

    return {
      total,
      confirmed,
      checkedIn,
      completed,
      noShows,
      cancelled,
      noShowRate: Math.round(noShowRate * 100) / 100,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
    };
  }

  async getCapacityUtilization(restaurantId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const queueItems = await (this.prisma as any).queueItem.findMany({
      where: {
        restaurantId,
        joinedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: QueueStatus.DONE,
      },
    });

    const reservations = await (this.prisma as any).reservation.findMany({
      where: {
        restaurantId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: [ReservationStatus.CHECKED_IN, ReservationStatus.COMPLETED],
        },
      },
    });

    const totalPeopleServed = 
      queueItems.reduce((sum: number, item: any) => sum + item.partySize, 0) +
      reservations.reduce((sum: number, res: any) => sum + res.partySize, 0);

    return {
      date: date.toISOString().split('T')[0],
      queueItemsServed: queueItems.length,
      reservationsServed: reservations.length,
      totalPeopleServed,
    };
  }
}

