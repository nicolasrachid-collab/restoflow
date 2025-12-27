import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  // Acessível em GET /
  @Get()
  getApiRoot() {
    return { 
      status: 'online', 
      service: 'RestoFlow API',
      version: '1.0.1'
    };
  }

  // Acessível em GET /health
  @Get('health')
  async getHealth() {
    const timestamp = new Date().toISOString();
    const checks: Record<string, { status: string; message?: string; latency?: number }> = {};

    // Verificar conexão com banco de dados
    const dbStartTime = Date.now();
    try {
      // Usar query direta e segura - nunca deve lançar exceção não tratada
      await this.prisma.$queryRaw`SELECT 1 as health_check`;
      const dbLatency = Date.now() - dbStartTime;
      
      checks.database = {
        status: 'healthy',
        latency: dbLatency,
      };
    } catch (error: any) {
      const dbLatency = Date.now() - dbStartTime;
      // Capturar qualquer erro e retornar status unhealthy, mas nunca lançar exceção
      const errorMessage = error?.message || error?.meta?.message || 'Erro ao verificar banco de dados';
      checks.database = {
        status: 'unhealthy',
        message: errorMessage.substring(0, 200), // Limitar tamanho da mensagem
        latency: dbLatency,
      };
    }

    // Determinar status geral - sempre retorna 200, nunca 500
    const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
    const overallStatus = allHealthy ? 'ok' : 'degraded';

    return {
      status: overallStatus,
      service: 'RestoFlow API',
      timestamp,
      checks,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}