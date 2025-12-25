import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction(
    restaurantId: string,
    userId: string | null,
    entityType: string,
    entityId: string,
    action: string,
    oldValue?: any,
    newValue?: any,
    metadata?: any,
  ) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          restaurantId,
          userId,
          entityType,
          entityId,
          action,
          oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
          newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        },
      });
    } catch (error) {
      // Não bloquear operação se log falhar
      console.error('Erro ao registrar log de auditoria:', error);
    }
  }
}

