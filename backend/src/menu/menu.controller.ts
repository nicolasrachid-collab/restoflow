import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Request } from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // Public Route
  @Get('public/:slug')
  async getPublicMenu(@Param('slug') slug: string) {
    return this.menuService.findPublicMenu(slug);
  }

  // Protected Admin Routes
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAdminMenu(@Request() req) {
    return this.menuService.findAll(req.user.restaurantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createItem(@Request() req, @Body() createMenuDto: any) {
    return this.menuService.create(req.user.restaurantId, createMenuDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateItem(@Request() req, @Param('id') id: string, @Body() updateMenuDto: any) {
    return this.menuService.update(req.user.restaurantId, id, updateMenuDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteItem(@Request() req, @Param('id') id: string) {
    return this.menuService.remove(req.user.restaurantId, id);
  }
}