import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TimeBlocksService } from './time-blocks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('time-blocks')
export class TimeBlocksController {
  constructor(private readonly timeBlocksService: TimeBlocksService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timeBlocksService.findAll(
      req.user.restaurantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Body() body: any) {
    return this.timeBlocksService.create(req.user.restaurantId, {
      date: new Date(body.date),
      startTime: body.startTime,
      endTime: body.endTime,
      reason: body.reason,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.timeBlocksService.update(req.user.restaurantId, id, {
      date: body.date ? new Date(body.date) : undefined,
      startTime: body.startTime,
      endTime: body.endTime,
      reason: body.reason,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.timeBlocksService.remove(req.user.restaurantId, id);
  }
}
