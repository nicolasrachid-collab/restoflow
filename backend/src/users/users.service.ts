import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findOne(email: string): Promise<User | null> {
    // Cast to any to bypass TS check if generated client types are missing
    return (this.prisma as any).user.findUnique({
      where: { email },
    });
  }

  async create(data: Prisma.UserCreateInput, createdByUserId: string, createdByRole: UserRole): Promise<User> {
    // Validar permissões: apenas ADMIN pode criar usuários
    if (createdByRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem criar usuários');
    }

    // Validar se email já existe
    const existing = await (this.prisma as any).user.findUnique({
      where: { email: (data as any).email },
    });

    if (existing) {
      throw new BadRequestException('Email já cadastrado');
    }

    const user = await (this.prisma as any).user.create({
      data: {
        ...data,
        isActive: (data as any).isActive !== undefined ? (data as any).isActive : true,
        mustChangePassword: (data as any).mustChangePassword !== undefined ? (data as any).mustChangePassword : true,
      },
    });

    // Registrar em audit log
    await this.auditService.logAction(
      (data as any).restaurantId || user.restaurantId,
      createdByUserId,
      'User',
      user.id,
      'CREATE',
      null,
      user,
    );

    return user;
  }

  async update(id: string, data: Partial<User>, updatedByUserId: string, updatedByRole: UserRole): Promise<User> {
    const user = await (this.prisma as any).user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    // Validar permissões: apenas ADMIN pode alterar usuários
    if (updatedByRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem alterar usuários');
    }

    const oldUser = { ...user };
    const updated = await (this.prisma as any).user.update({
      where: { id },
      data,
    });

    // Registrar em audit log
    await this.auditService.logAction(
      user.restaurantId || '',
      updatedByUserId,
      'User',
      id,
      'UPDATE',
      oldUser,
      updated,
    );

    return updated;
  }

  async deactivate(id: string, deactivatedByUserId: string, deactivatedByRole: UserRole): Promise<User> {
    if (deactivatedByRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem desativar usuários');
    }

    const user = await (this.prisma as any).user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const updated = await (this.prisma as any).user.update({
      where: { id },
      data: { isActive: false },
    });

    // Registrar em audit log
    await this.auditService.logAction(
      user.restaurantId || '',
      deactivatedByUserId,
      'User',
      id,
      'UPDATE',
      { isActive: user.isActive },
      { isActive: false },
    );

    return updated;
  }
}