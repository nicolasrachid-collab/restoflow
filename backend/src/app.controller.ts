import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
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
  getHealth() {
    return { 
      status: 'ok', 
      service: 'RestoFlow API', 
      timestamp: new Date().toISOString() 
    };
  }
}