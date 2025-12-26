import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async findPublicMenu(slug: string) {
    const restaurant = await (this.prisma as any).restaurant.findUnique({
      where: { slug },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            menuItems: {
              where: { available: true, isActive: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        menuItems: {
          where: { available: true, isActive: true },
          include: {
            categoryRef: true,
          },
        },
      },
    });

    if (!restaurant) throw new NotFoundException('Restaurante não encontrado');
    
    // Retornar agrupado por categoria
    return {
      categories: restaurant.categories,
      items: restaurant.menuItems,
    };
  }

  async findAll(restaurantId: string) {
    return (this.prisma as any).menuItem.findMany({
      where: { restaurantId },
      include: {
        categoryRef: true,
      },
      orderBy: [
        { categoryRef: { displayOrder: 'asc' } },
        { createdAt: 'asc' },
      ],
    });
  }

  async create(restaurantId: string, data: any) {
    // Validar categoryId se fornecido
    if (data.categoryId) {
      const category = await (this.prisma as any).category.findFirst({
        where: {
          id: data.categoryId,
          restaurantId,
        },
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }
    }

    return (this.prisma as any).menuItem.create({
      data: {
        ...data,
        restaurantId,
      },
      include: {
        categoryRef: true,
      },
    });
  }

  async update(restaurantId: string, id: string, data: any) {
    // Ensure item belongs to tenant
    const item = await (this.prisma as any).menuItem.findFirst({
      where: { id, restaurantId },
    });
    if (!item) throw new NotFoundException('Item não encontrado');

    // Validar categoryId se fornecido
    if (data.categoryId !== undefined) {
      if (data.categoryId) {
        const category = await (this.prisma as any).category.findFirst({
          where: {
            id: data.categoryId,
            restaurantId,
          },
        });

        if (!category) {
          throw new NotFoundException('Categoria não encontrada');
        }
      }
    }

    return (this.prisma as any).menuItem.update({
      where: { id },
      data,
      include: {
        categoryRef: true,
      },
    });
  }

  async remove(restaurantId: string, id: string) {
    // Ensure item belongs to tenant
    const item = await (this.prisma as any).menuItem.findFirst({
        where: { id, restaurantId }
    });
    if (!item) throw new NotFoundException('Item não encontrado');

    return (this.prisma as any).menuItem.delete({
      where: { id }
    });
  }
}