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
              include: {
                variants: {
                  orderBy: { displayOrder: 'asc' },
                },
              },
            },
          },
        },
        menuItems: {
          where: { available: true, isActive: true },
          include: {
            categoryRef: true,
            variants: {
              orderBy: { displayOrder: 'asc' },
            },
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
    return await (this.prisma as any).menuItem.findMany({
      where: { restaurantId },
      include: {
        categoryRef: true,
        variants: {
          orderBy: { displayOrder: 'asc' },
        },
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

    // Separar variantes dos dados do item
    const { variants, ...itemData } = data;

    const menuItem = await (this.prisma as any).menuItem.create({
      data: {
        ...itemData,
        restaurantId,
      },
      include: {
        categoryRef: true,
      },
    });

    // Criar variantes se fornecidas
    if (variants && Array.isArray(variants) && variants.length > 0) {
      await (this.prisma as any).menuItemVariant.createMany({
        data: variants.map((variant: any, index: number) => ({
          menuItemId: menuItem.id,
          name: variant.name,
          isRequired: variant.isRequired || false,
          priceModifier: variant.priceModifier || 0,
          displayOrder: variant.displayOrder ?? index,
        })),
      });
    }

    // Retornar item com variantes
    return (this.prisma as any).menuItem.findUnique({
      where: { id: menuItem.id },
      include: {
        categoryRef: true,
        variants: {
          orderBy: { displayOrder: 'asc' },
        },
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

    // Separar variantes dos dados do item
    const { variants, ...itemData } = data;

    // Atualizar item
    await (this.prisma as any).menuItem.update({
      where: { id },
      data: itemData,
    });

    // Se variantes foram fornecidas, atualizar (deletar antigas e criar novas)
    if (variants !== undefined) {
      // Deletar variantes antigas
      await (this.prisma as any).menuItemVariant.deleteMany({
        where: { menuItemId: id },
      });

      // Criar novas variantes se houver
      if (Array.isArray(variants) && variants.length > 0) {
        await (this.prisma as any).menuItemVariant.createMany({
          data: variants.map((variant: any, index: number) => ({
            menuItemId: id,
            name: variant.name,
            isRequired: variant.isRequired || false,
            priceModifier: variant.priceModifier || 0,
            displayOrder: variant.displayOrder ?? index,
          })),
        });
      }
    }

    // Retornar item atualizado com variantes
    return (this.prisma as any).menuItem.findUnique({
      where: { id },
      include: {
        categoryRef: true,
        variants: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async remove(restaurantId: string, id: string) {
    // Ensure item belongs to tenant
    const item = await (this.prisma as any).menuItem.findFirst({
        where: { id, restaurantId }
    });
    if (!item) throw new NotFoundException('Item não encontrado');

    // Variantes são deletadas automaticamente por cascade
    return (this.prisma as any).menuItem.delete({
      where: { id }
    });
  }

  // Métodos para gerenciar variantes individualmente
  async createVariant(restaurantId: string, menuItemId: string, data: any) {
    // Verificar se o item pertence ao restaurante
    const item = await (this.prisma as any).menuItem.findFirst({
      where: { id: menuItemId, restaurantId },
    });
    if (!item) throw new NotFoundException('Item não encontrado');

    return (this.prisma as any).menuItemVariant.create({
      data: {
        menuItemId,
        name: data.name,
        isRequired: data.isRequired || false,
        priceModifier: data.priceModifier || 0,
        displayOrder: data.displayOrder ?? 0,
      },
    });
  }

  async updateVariant(restaurantId: string, variantId: string, data: any) {
    // Verificar se a variante pertence a um item do restaurante
    const variant = await (this.prisma as any).menuItemVariant.findUnique({
      where: { id: variantId },
      include: {
        menuItem: true,
      },
    });
    
    if (!variant || variant.menuItem.restaurantId !== restaurantId) {
      throw new NotFoundException('Variante não encontrada');
    }

    return (this.prisma as any).menuItemVariant.update({
      where: { id: variantId },
      data: {
        name: data.name,
        isRequired: data.isRequired,
        priceModifier: data.priceModifier,
        displayOrder: data.displayOrder,
      },
    });
  }

  async deleteVariant(restaurantId: string, variantId: string) {
    // Verificar se a variante pertence a um item do restaurante
    const variant = await (this.prisma as any).menuItemVariant.findUnique({
      where: { id: variantId },
      include: {
        menuItem: true,
      },
    });
    
    if (!variant || variant.menuItem.restaurantId !== restaurantId) {
      throw new NotFoundException('Variante não encontrada');
    }

    return (this.prisma as any).menuItemVariant.delete({
      where: { id: variantId },
    });
  }
}