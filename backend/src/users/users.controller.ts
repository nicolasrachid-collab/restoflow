import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/users.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Request() req) {
    return this.usersService.findAll(req.user.restaurantId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Request() req, @Body() createUserDto: CreateUserDto) {
    const userData = {
      ...createUserDto,
      restaurantId: req.user.restaurantId,
    };
    return this.usersService.create(userData, req.user.userId, req.user.role);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Request() req, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto, req.user.userId, req.user.role);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async activate(@Request() req, @Param('id') id: string) {
    return this.usersService.activate(id, req.user.restaurantId, req.user.userId, req.user.role);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deactivate(@Request() req, @Param('id') id: string) {
    return this.usersService.deactivate(id, req.user.userId, req.user.role);
  }

  @Patch(':id/password')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async changePassword(@Request() req, @Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(
      id,
      req.user.restaurantId,
      changePasswordDto.newPassword,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Request() req, @Param('id') id: string) {
    await this.usersService.delete(id, req.user.restaurantId, req.user.userId, req.user.role);
    return { success: true };
  }
}

