import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: any) {
    // Retorna o usuário que será injetado no Request (req.user)
    return { 
      userId: payload.userId || payload.sub, 
      email: payload.email, 
      role: payload.role, 
      restaurantId: payload.restaurantId,
      mustChangePassword: payload.mustChangePassword || false,
    };
  }
}