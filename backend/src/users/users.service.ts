import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';
import * as http from 'http';

// Tipo que aceita password (plain text) ou passwordHash
type CreateUserInput = Omit<Prisma.UserCreateInput, 'passwordHash'> & {
  password?: string;
  passwordHash?: string;
};

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

  async create(data: CreateUserInput, createdByUserId: string, createdByRole: UserRole): Promise<User> {
    // #region agent log
    try {
      const logData = JSON.stringify({location:'users.service.ts:21',message:'create() - received data',data:{hasPassword:!!(data as any).password,hasPasswordHash:!!(data as any).passwordHash,email:(data as any).email},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'});
      const options = {hostname:'127.0.0.1',port:7245,path:'/ingest/dbeba631-e9e7-4094-9f61-38418196391d',method:'POST',headers:{'Content-Type':'application/json'}};
      const reqLog = http.request(options,()=>{});reqLog.on('error',()=>{});reqLog.write(logData);reqLog.end();
    } catch (e) {}
    // #endregion
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

    // Se receber password (plain text), fazer hash antes de criar
    let passwordHash = (data as any).passwordHash;
    if ((data as any).password && !passwordHash) {
      // #region agent log
      try {
        const logData = JSON.stringify({location:'users.service.ts:40',message:'create() - hashing password',data:{hasPassword:true},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'});
        const options = {hostname:'127.0.0.1',port:7245,path:'/ingest/dbeba631-e9e7-4094-9f61-38418196391d',method:'POST',headers:{'Content-Type':'application/json'}};
        const reqLog = http.request(options,()=>{});reqLog.on('error',()=>{});reqLog.write(logData);reqLog.end();
      } catch (e) {}
      // #endregion
      passwordHash = await bcrypt.hash((data as any).password, 10);
    }

    if (!passwordHash) {
      throw new BadRequestException('Password ou passwordHash é obrigatório');
    }

    // Remover password do objeto antes de passar para Prisma
    const { password, ...prismaData } = data as any;
    
    // #region agent log
    try {
      const logData = JSON.stringify({location:'users.service.ts:52',message:'create() - before Prisma create',data:{hasPasswordHash:!!passwordHash},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'});
      const options = {hostname:'127.0.0.1',port:7245,path:'/ingest/dbeba631-e9e7-4094-9f61-38418196391d',method:'POST',headers:{'Content-Type':'application/json'}};
      const reqLog = http.request(options,()=>{});reqLog.on('error',()=>{});reqLog.write(logData);reqLog.end();
    } catch (e) {}
    // #endregion
    
    const user = await (this.prisma as any).user.create({
      data: {
        ...prismaData,
        passwordHash,
        isActive: prismaData.isActive !== undefined ? prismaData.isActive : true,
        mustChangePassword: prismaData.mustChangePassword !== undefined ? prismaData.mustChangePassword : true,
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

  async findAll(restaurantId: string) {
    if (!restaurantId) {
      throw new BadRequestException('RestaurantId é obrigatório');
    }
    
    try {
      return (this.prisma as any).user.findMany({
        where: { restaurantId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw new BadRequestException('Erro ao buscar usuários');
    }
  }

  async findById(id: string, restaurantId: string) {
    const user = await (this.prisma as any).user.findFirst({
      where: { id, restaurantId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async activate(id: string, restaurantId: string, activatedByUserId: string, activatedByRole: UserRole): Promise<User> {
    if (activatedByRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem ativar usuários');
    }

    const user = await this.findById(id, restaurantId);

    const updated = await (this.prisma as any).user.update({
      where: { id },
      data: { isActive: true },
    });

    // Registrar em audit log
    await this.auditService.logAction(
      restaurantId,
      activatedByUserId,
      'User',
      id,
      'UPDATE',
      { isActive: user.isActive },
      { isActive: true },
    );

    return updated;
  }

  async changePassword(id: string, restaurantId: string, newPassword: string, changedByUserId: string, changedByRole: UserRole): Promise<User> {
    if (changedByRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem alterar senhas');
    }

    const user = await this.findById(id, restaurantId);

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const updated = await (this.prisma as any).user.update({
      where: { id },
      data: { 
        passwordHash,
        mustChangePassword: true, // Forçar mudança na próxima vez que logar
      },
    });

    // Registrar em audit log
    await this.auditService.logAction(
      restaurantId,
      changedByUserId,
      'User',
      id,
      'UPDATE',
      null,
      { passwordChanged: true },
      { action: 'change_password' },
    );

    return updated;
  }

  async delete(id: string, restaurantId: string, deletedByUserId: string, deletedByRole: UserRole): Promise<void> {
    if (deletedByRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem excluir usuários');
    }

    const user = await this.findById(id, restaurantId);

    // Não permitir excluir o próprio usuário
    if (id === deletedByUserId) {
      throw new BadRequestException('Não é possível excluir seu próprio usuário');
    }

    await (this.prisma as any).user.delete({
      where: { id },
    });

    // Registrar em audit log
    await this.auditService.logAction(
      restaurantId,
      deletedByUserId,
      'User',
      id,
      'DELETE',
      user,
      null,
    );
  }
}