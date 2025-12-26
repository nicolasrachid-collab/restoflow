import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCategoryDto, UpdateCategoryDto, ReorderCategoriesDto } from './dto/categories.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(restaurantId: string) {
    return (this.prisma as any).category.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
    });
  }

  async findOne(restaurantId: string, id: string) {
    const category = await (this.prisma as any).category.findFirst({
      where: { id, restaurantId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return category;
  }

  async create(restaurantId: string, data: CreateCategoryDto, userId?: string) {
    // Verificar se displayOrder já existe
    if (data.displayOrder !== undefined) {
      const existing = await (this.prisma as any).category.findFirst({
        where: {
          restaurantId,
          displayOrder: data.displayOrder,
        },
      });

      if (existing) {
        throw new BadRequestException('Já existe uma categoria com esta ordem de exibição');
      }
    } else {
      // Se não especificado, usar o próximo número disponível
      const maxOrder = await (this.prisma as any).category.findFirst({
        where: { restaurantId },
        orderBy: { displayOrder: 'desc' },
      });
      data.displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 0;
    }

    const category = await (this.prisma as any).category.create({
      data: {
        ...data,
        restaurantId,
        isActive: data.isActive !== undefined ? data.isActive : true,
        displayOrder: data.displayOrder || 0,
      },
    });

    // Registrar em audit log
    if (userId) {
      await this.auditService.logAction(
        restaurantId,
        userId,
        'Category',
        category.id,
        'CREATE',
        null,
        category,
      );
    }

    return category;
  }

  async update(restaurantId: string, id: string, data: UpdateCategoryDto, userId?: string) {
    const category = await this.findOne(restaurantId, id);
    const oldValue = { ...category };

    // Se displayOrder está sendo atualizado, verificar conflito
    if (data.displayOrder !== undefined && data.displayOrder !== category.displayOrder) {
      const existing = await (this.prisma as any).category.findFirst({
        where: {
          restaurantId,
          displayOrder: data.displayOrder,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException('Já existe uma categoria com esta ordem de exibição');
      }
    }

    const updated = await (this.prisma as any).category.update({
      where: { id },
      data,
    });

    // Registrar em audit log
    if (userId) {
      await this.auditService.logAction(
        restaurantId,
        userId,
        'Category',
        id,
        'UPDATE',
        oldValue,
        updated,
      );
    }

    return updated;
  }

  async remove(restaurantId: string, id: string, userId?: string) {
    const category = await this.findOne(restaurantId, id);

    // Verificar se há itens associados
    const itemsCount = await (this.prisma as any).menuItem.count({
      where: {
        categoryId: id,
        restaurantId,
      },
    });

    if (itemsCount > 0) {
      throw new BadRequestException(
        `Não é possível excluir a categoria. Existem ${itemsCount} item(ns) associado(s).`,
      );
    }

    await (this.prisma as any).category.delete({
      where: { id },
    });

    // Registrar em audit log
    if (userId) {
      await this.auditService.logAction(
        restaurantId,
        userId,
        'Category',
        id,
        'DELETE',
        category,
        null,
      );
    }

    return { success: true };
  }

  async reorder(restaurantId: string, data: ReorderCategoriesDto, userId?: string) {
    // Validar que todas as categorias pertencem ao restaurante
    const categoryIds = data.items.map((item) => item.id);
    const categories = await (this.prisma as any).category.findMany({
      where: {
        id: { in: categoryIds },
        restaurantId,
      },
    });

    if (categories.length !== categoryIds.length) {
      throw new BadRequestException('Uma ou mais categorias não foram encontradas');
    }

    // Atualizar displayOrder de todas as categorias em uma transação
    const updates = data.items.map((item) =>
      (this.prisma as any).category.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder },
      }),
    );

    await Promise.all(updates);

    // Registrar em audit log
    if (userId) {
      await this.auditService.logAction(
        restaurantId,
        userId,
        'Category',
        'multiple',
        'REORDER',
        null,
        { items: data.items },
        { action: 'reorder_categories' },
      );
    }

    return { success: true };
  }
}

