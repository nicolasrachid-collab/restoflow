import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PublicLinksService } from './public-links.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('public-links')
export class PublicLinksController {
  constructor(private readonly publicLinksService: PublicLinksService) {}

  // Public: Validar código do link
  @Get(':code/info')
  async getLinkInfo(@Param('code') code: string) {
    const link = await this.publicLinksService.getLinkByCode(code);
    if (!link) {
      return { valid: false };
    }
    return { valid: true, link };
  }

  // Admin: Listar links do restaurante
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllLinks(@Request() req) {
    const defaultLink = await this.publicLinksService.getDefaultLink(req.user.restaurantId);
    const customLinks = await this.publicLinksService.getAllLinks(req.user.restaurantId);
    return {
      default: defaultLink,
      custom: customLinks,
    };
  }

  // Admin: Gerar novo link
  @UseGuards(JwtAuthGuard)
  @Post()
  async generateLink(@Request() req, @Body() body: { name?: string }) {
    return this.publicLinksService.generateLink(req.user.restaurantId, body.name);
  }

  // Admin: Desativar link
  @UseGuards(JwtAuthGuard)
  @Patch(':id/deactivate')
  async deactivateLink(@Request() req, @Param('id') id: string) {
    return this.publicLinksService.deactivateLink(id, req.user.restaurantId);
  }

  // Admin: Ativar link
  @UseGuards(JwtAuthGuard)
  @Patch(':id/activate')
  async activateLink(@Request() req, @Param('id') id: string) {
    return this.publicLinksService.activateLink(id, req.user.restaurantId);
  }
}

