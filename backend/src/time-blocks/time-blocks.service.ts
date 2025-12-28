import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimeBlocksService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verifica se um horário está bloqueado
   */
  async isTimeBlocked(restaurantId: string, date: Date, time?: string): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const blocks = await (this.prisma as any).timeBlock.findMany({
      where: {
        restaurantId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Se não há bloqueios, o horário está livre
    if (blocks.length === 0) return false;

    // Se não foi especificado horário, verificar se há bloqueio de dia inteiro
    if (!time) {
      return blocks.some((block: any) => !block.startTime && !block.endTime);
    }

    // Converter horário para minutos desde meia-noite
    const [hours, minutes] = time.split(':').map(Number);
    const timeMinutes = hours * 60 + minutes;

    // Verificar cada bloqueio
    for (const block of blocks) {
      // Bloqueio de dia inteiro
      if (!block.startTime && !block.endTime) {
        return true;
      }

      // Bloqueio com horário específico
      if (block.startTime && block.endTime) {
        const [startHours, startMinutes] = block.startTime.split(':').map(Number);
        const [endHours, endMinutes] = block.endTime.split(':').map(Number);
        const startMinutesTotal = startHours * 60 + startMinutes;
        const endMinutesTotal = endHours * 60 + endMinutes;

        if (timeMinutes >= startMinutesTotal && timeMinutes <= endMinutesTotal) {
          return true;
        }
      } else if (block.startTime && !block.endTime) {
        // Bloqueio a partir de um horário até o fim do dia
        const [startHours, startMinutes] = block.startTime.split(':').map(Number);
        const startMinutesTotal = startHours * 60 + startMinutes;
        if (timeMinutes >= startMinutesTotal) {
          return true;
        }
      } else if (!block.startTime && block.endTime) {
        // Bloqueio do início do dia até um horário
        const [endHours, endMinutes] = block.endTime.split(':').map(Number);
        const endMinutesTotal = endHours * 60 + endMinutes;
        if (timeMinutes <= endMinutesTotal) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Lista todos os bloqueios de um restaurante
   */
  async findAll(restaurantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { restaurantId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    return (this.prisma as any).timeBlock.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Cria um novo bloqueio
   */
  async create(restaurantId: string, data: {
    date: Date;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }) {
    // Validar formato de horário se fornecido
    if (data.startTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.startTime)) {
      throw new BadRequestException('Formato de horário inválido. Use HH:mm');
    }
    if (data.endTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.endTime)) {
      throw new BadRequestException('Formato de horário inválido. Use HH:mm');
    }

    // Validar que endTime é depois de startTime
    if (data.startTime && data.endTime) {
      const [startHours, startMinutes] = data.startTime.split(':').map(Number);
      const [endHours, endMinutes] = data.endTime.split(':').map(Number);
      const startTotal = startHours * 60 + startMinutes;
      const endTotal = endHours * 60 + endMinutes;
      
      if (endTotal <= startTotal) {
        throw new BadRequestException('Horário de término deve ser depois do horário de início');
      }
    }

    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    return (this.prisma as any).timeBlock.create({
      data: {
        restaurantId,
        date,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        reason: data.reason || null,
      },
    });
  }

  /**
   * Atualiza um bloqueio
   */
  async update(restaurantId: string, id: string, data: {
    date?: Date;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }) {
    // Verificar se o bloqueio pertence ao restaurante
    const block = await (this.prisma as any).timeBlock.findFirst({
      where: { id, restaurantId },
    });

    if (!block) {
      throw new NotFoundException('Bloqueio não encontrado');
    }

    // Validar formato de horário se fornecido
    if (data.startTime !== undefined && data.startTime !== null && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.startTime)) {
      throw new BadRequestException('Formato de horário inválido. Use HH:mm');
    }
    if (data.endTime !== undefined && data.endTime !== null && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.endTime)) {
      throw new BadRequestException('Formato de horário inválido. Use HH:mm');
    }

    // Validar que endTime é depois de startTime
    const startTime = data.startTime !== undefined ? data.startTime : block.startTime;
    const endTime = data.endTime !== undefined ? data.endTime : block.endTime;
    
    if (startTime && endTime) {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const startTotal = startHours * 60 + startMinutes;
      const endTotal = endHours * 60 + endMinutes;
      
      if (endTotal <= startTotal) {
        throw new BadRequestException('Horário de término deve ser depois do horário de início');
      }
    }

    const updateData: any = {};
    if (data.date !== undefined) {
      const date = new Date(data.date);
      date.setHours(0, 0, 0, 0);
      updateData.date = date;
    }
    if (data.startTime !== undefined) {
      updateData.startTime = data.startTime || null;
    }
    if (data.endTime !== undefined) {
      updateData.endTime = data.endTime || null;
    }
    if (data.reason !== undefined) {
      updateData.reason = data.reason || null;
    }

    return (this.prisma as any).timeBlock.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Remove um bloqueio
   */
  async remove(restaurantId: string, id: string) {
    const block = await (this.prisma as any).timeBlock.findFirst({
      where: { id, restaurantId },
    });

    if (!block) {
      throw new NotFoundException('Bloqueio não encontrado');
    }

    return (this.prisma as any).timeBlock.delete({
      where: { id },
    });
  }
}
