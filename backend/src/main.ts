import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });

  // REMOVIDO: setGlobalPrefix('api')
  // Estratégia alterada: O Backend roda na raiz '/' e o Proxy do Vite remove o '/api'
  
  // Exception Filter Global
  app.useGlobalFilters(new HttpExceptionFilter());
  
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const port = process.env.PORT || 3001;
  // Escuta em 0.0.0.0 para aceitar conexões locais e Docker corretamente
  await app.listen(port, '0.0.0.0');
  
  console.log(`\n✅ SERVIDOR ONLINE`);
  console.log(`🚀 Backend rodando em: http://localhost:${port}`);
  console.log(`🏥 Health Check:      http://localhost:${port}/health\n`);
}
bootstrap();