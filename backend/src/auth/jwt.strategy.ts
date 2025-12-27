import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import * as http from 'http';

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
    // #region agent log
    try {
      const logData = JSON.stringify({location:'jwt.strategy.ts:18',message:'JWT token validated',data:{hasUserId:!!(payload.userId||payload.sub),hasRestaurantId:!!payload.restaurantId,email:payload.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'});
      const options = {hostname:'127.0.0.1',port:7245,path:'/ingest/dbeba631-e9e7-4094-9f61-38418196391d',method:'POST',headers:{'Content-Type':'application/json'}};
      const reqLog = http.request(options,()=>{});reqLog.on('error',()=>{});reqLog.write(logData);reqLog.end();
    } catch (e) {}
    // #endregion
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