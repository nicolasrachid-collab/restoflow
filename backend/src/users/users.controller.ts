import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/users.dto';
import * as http from 'http';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Request() req) {
    console.log('[DEBUG] GET /users endpoint called');
    // #region agent log
    try {
      const logData = JSON.stringify({location:'users.controller.ts:19',message:'GET /users endpoint called',data:{hasUser:!!req.user,hasRestaurantId:!!req.user?.restaurantId,userId:req.user?.userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'});
      const options = {hostname:'127.0.0.1',port:7245,path:'/ingest/dbeba631-e9e7-4094-9f61-38418196391d',method:'POST',headers:{'Content-Type':'application/json'}};
      const reqLog = http.request(options,()=>{});reqLog.on('error',()=>{});reqLog.write(logData);reqLog.end();
    } catch (e) {
      console.error('[DEBUG] Error logging:', e);
    }
    // #endregion
    if (!req.user?.restaurantId) {
      // #region agent log
      try {
        const logData = JSON.stringify({location:'users.controller.ts:22',message:'RestaurantId missing in token',data:{user:req.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'});
        const options = {hostname:'127.0.0.1',port:7245,path:'/ingest/dbeba631-e9e7-4094-9f61-38418196391d',method:'POST',headers:{'Content-Type':'application/json'}};
        const reqLog = http.request(options,()=>{});reqLog.on('error',()=>{});reqLog.write(logData);reqLog.end();
      } catch (e) {}
      // #endregion
      throw new BadRequestException('RestaurantId não encontrado no token');
    }
    // #region agent log
    try {
      const logData = JSON.stringify({location:'users.controller.ts:28',message:'Calling findAll service',data:{restaurantId:req.user.restaurantId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'});
      const options = {hostname:'127.0.0.1',port:7245,path:'/ingest/dbeba631-e9e7-4094-9f61-38418196391d',method:'POST',headers:{'Content-Type':'application/json'}};
      const reqLog = http.request(options,()=>{});reqLog.on('error',()=>{});reqLog.write(logData);reqLog.end();
    } catch (e) {}
    // #endregion
    return this.usersService.findAll(req.user.restaurantId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Request() req, @Body() createUserDto: CreateUserDto) {
    // #region agent log
    try {
      const logData = JSON.stringify({location:'users.controller.ts:51',message:'POST /users - received DTO',data:{hasPassword:!!createUserDto.password,hasPasswordHash:false,email:createUserDto.email,role:createUserDto.role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
      const options = {hostname:'127.0.0.1',port:7245,path:'/ingest/dbeba631-e9e7-4094-9f61-38418196391d',method:'POST',headers:{'Content-Type':'application/json'}};
      const reqLog = http.request(options,()=>{});reqLog.on('error',()=>{});reqLog.write(logData);reqLog.end();
    } catch (e) {}
    // #endregion
    const userData = {
      ...createUserDto,
      restaurantId: req.user.restaurantId,
    };
    // #region agent log
    try {
      const logData = JSON.stringify({location:'users.controller.ts:59',message:'POST /users - userData before service call',data:{hasPassword:!!userData.password,hasPasswordHash:!!(userData as any).passwordHash,restaurantId:userData.restaurantId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
      const options = {hostname:'127.0.0.1',port:7245,path:'/ingest/dbeba631-e9e7-4094-9f61-38418196391d',method:'POST',headers:{'Content-Type':'application/json'}};
      const reqLog = http.request(options,()=>{});reqLog.on('error',()=>{});reqLog.write(logData);reqLog.end();
    } catch (e) {}
    // #endregion
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

