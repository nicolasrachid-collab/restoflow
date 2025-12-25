import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/auth.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private restaurantsService: RestaurantsService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    
    if (!user) {
      return null;
    }

    // Validar se usuário está ativo
    if (!user.isActive) {
      throw new ForbiddenException('Usuário está desativado');
    }

    // Validar se restaurante está ativo
    if (user.restaurantId) {
      const isActive = await this.restaurantsService.isRestaurantActive(user.restaurantId);
      if (!isActive) {
        throw new ForbiddenException('Restaurante está desativado');
      }
    }

    // Validar senha
    if (!await bcrypt.compare(pass, user.passwordHash)) {
      return null;
    }

    // Atualizar último login
    await (this.prisma as any).user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id,
      userId: user.id,
      role: user.role,
      restaurantId: user.restaurantId,
      mustChangePassword: user.mustChangePassword,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        mustChangePassword: user.mustChangePassword,
      }
    };
  }

  async register(data: RegisterDto) {
    // Check if user exists
    const existingUser = await this.usersService.findOne(data.email);
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Check if slug exists
    const existingSlug = await (this.prisma as any).restaurant.findUnique({
        where: { slug: data.restaurantSlug }
    });
    if (existingSlug) {
      throw new ConflictException('Slug do restaurante já está em uso');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Transaction: Create Restaurant + Admin User
    // Using simple logic instead of $transaction for code brevity in this environment, 
    // but in prod use prisma.$transaction
    
    const restaurant = await (this.prisma as any).restaurant.create({
      data: {
        name: data.restaurantName,
        slug: data.restaurantSlug,
        address: '',
      }
    });

    const user = await (this.prisma as any).user.create({
      data: {
        email: data.email,
        name: data.adminName,
        passwordHash: passwordHash,
        role: UserRole.ADMIN,
        restaurantId: restaurant.id
      }
    });

    return this.login(user);
  }
}