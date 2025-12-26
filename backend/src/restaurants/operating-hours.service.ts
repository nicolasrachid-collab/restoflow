import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateOperatingHoursDto } from './dto/operating-hours.dto';

@Injectable()
export class OperatingHoursService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(restaurantId: string) {
    // Garantir que existem 7 registros (um para cada dia)
    const existing = await (this.prisma as any).operatingHours.findMany({
      where: { restaurantId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Se não existem horários, criar padrão (todos abertos 09:00-22:00)
    if (existing.length === 0) {
      const defaultHours = [];
      for (let day = 0; day <= 6; day++) {
        defaultHours.push({
          restaurantId,
          dayOfWeek: day,
          isOpen: true,
          openTime: '09:00',
          closeTime: '22:00',
        });
      }
      await (this.prisma as any).operatingHours.createMany({
        data: defaultHours,
      });
      return await (this.prisma as any).operatingHours.findMany({
        where: { restaurantId },
        orderBy: { dayOfWeek: 'asc' },
      });
    }

    // Garantir que todos os 7 dias existem
    const days = [0, 1, 2, 3, 4, 5, 6];
    const missingDays = days.filter(
      (day) => !existing.find((oh: any) => oh.dayOfWeek === day),
    );

    if (missingDays.length > 0) {
      const newHours = missingDays.map((day) => ({
        restaurantId,
        dayOfWeek: day,
        isOpen: true,
        openTime: '09:00',
        closeTime: '22:00',
      }));
      await (this.prisma as any).operatingHours.createMany({
        data: newHours,
      });
    }

    return await (this.prisma as any).operatingHours.findMany({
      where: { restaurantId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async updateAll(restaurantId: string, data: UpdateOperatingHoursDto, userId?: string) {
    // Validar que todos os dias estão presentes
    const days = [0, 1, 2, 3, 4, 5, 6];
    const providedDays = data.hours.map((h) => h.dayOfWeek);
    const missingDays = days.filter((day) => !providedDays.includes(day));

    if (missingDays.length > 0) {
      throw new BadRequestException(
        `Faltam horários para os dias: ${missingDays.join(', ')}`,
      );
    }

    // Validar horários
    for (const hour of data.hours) {
      if (hour.isOpen) {
        if (!hour.openTime || !hour.closeTime) {
          throw new BadRequestException(
            `Dia ${hour.dayOfWeek}: horários de abertura e fechamento são obrigatórios quando o restaurante está aberto`,
          );
        }

        if (hour.openTime >= hour.closeTime) {
          throw new BadRequestException(
            `Dia ${hour.dayOfWeek}: horário de abertura deve ser anterior ao horário de fechamento`,
          );
        }
      }
    }

    // Buscar horários antigos para audit log
    const oldHours = await (this.prisma as any).operatingHours.findMany({
      where: { restaurantId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Atualizar ou criar cada horário
    const updates = data.hours.map((hour) =>
      (this.prisma as any).operatingHours.upsert({
        where: {
          restaurantId_dayOfWeek: {
            restaurantId,
            dayOfWeek: hour.dayOfWeek,
          },
        },
        update: {
          isOpen: hour.isOpen,
          openTime: hour.isOpen ? hour.openTime : '09:00',
          closeTime: hour.isOpen ? hour.closeTime : '22:00',
        },
        create: {
          restaurantId,
          dayOfWeek: hour.dayOfWeek,
          isOpen: hour.isOpen,
          openTime: hour.isOpen ? hour.openTime : '09:00',
          closeTime: hour.isOpen ? hour.closeTime : '22:00',
        },
      }),
    );

    await Promise.all(updates);

    // Registrar em audit log
    if (userId) {
      await this.auditService.logAction(
        restaurantId,
        userId,
        'OperatingHours',
        'all',
        'UPDATE',
        oldHours,
        data.hours,
        { action: 'update_all_operating_hours' },
      );
    }

    return await this.findAll(restaurantId);
  }

  async updateDay(
    restaurantId: string,
    dayOfWeek: number,
    data: { isOpen: boolean; openTime?: string; closeTime?: string },
    userId?: string,
  ) {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new BadRequestException('dayOfWeek deve estar entre 0 (domingo) e 6 (sábado)');
    }

    if (data.isOpen) {
      if (!data.openTime || !data.closeTime) {
        throw new BadRequestException(
          'Horários de abertura e fechamento são obrigatórios quando o restaurante está aberto',
        );
      }

      if (data.openTime >= data.closeTime) {
        throw new BadRequestException(
          'Horário de abertura deve ser anterior ao horário de fechamento',
        );
      }
    }

    const oldHour = await (this.prisma as any).operatingHours.findUnique({
      where: {
        restaurantId_dayOfWeek: {
          restaurantId,
          dayOfWeek,
        },
      },
    });

    const updated = await (this.prisma as any).operatingHours.upsert({
      where: {
        restaurantId_dayOfWeek: {
          restaurantId,
          dayOfWeek,
        },
      },
      update: {
        isOpen: data.isOpen,
        openTime: data.isOpen ? data.openTime : oldHour?.openTime || '09:00',
        closeTime: data.isOpen ? data.closeTime : oldHour?.closeTime || '22:00',
      },
      create: {
        restaurantId,
        dayOfWeek,
        isOpen: data.isOpen,
        openTime: data.isOpen ? data.openTime! : '09:00',
        closeTime: data.isOpen ? data.closeTime! : '22:00',
      },
    });

    // Registrar em audit log
    if (userId) {
      await this.auditService.logAction(
        restaurantId,
        userId,
        'OperatingHours',
        updated.id,
        'UPDATE',
        oldHour,
        updated,
      );
    }

    return updated;
  }
}

