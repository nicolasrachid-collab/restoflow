import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCategoryDto, UpdateCategoryDto, ReorderCategoriesDto } from './dto/categories.dto';

@Controller('menu/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req) {
    return this.categoriesService.findAll(req.user.restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(
      req.user.restaurantId,
      createCategoryDto,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(
      req.user.restaurantId,
      id,
      updateCategoryDto,
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.categoriesService.remove(req.user.restaurantId, id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reorder')
  async reorder(@Request() req, @Body() reorderDto: ReorderCategoriesDto) {
    return this.categoriesService.reorder(req.user.restaurantId, reorderDto, req.user.userId);
  }
}

