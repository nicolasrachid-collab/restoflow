import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  console.log('\n🚀 Iniciando RestoFlow Backend...\n');

  // Verificar variáveis de ambiente críticas
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERRO: DATABASE_URL não está configurada!');
    console.error('   Crie um arquivo .env na pasta backend/ com DATABASE_URL');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  
  // Nota: A validação de conexão com banco é feita automaticamente pelo PrismaService.onModuleInit()
  // Se houver problemas, o PrismaService fará retry automático
  // Não bloqueamos a inicialização aqui para permitir que o sistema seja mais resiliente
  
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
  
  // Configurar graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('\n⚠️  SIGTERM recebido, encerrando graciosamente...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('\n⚠️  SIGINT recebido, encerrando graciosamente...');
    await app.close();
    process.exit(0);
  });

  // Escuta em 0.0.0.0 para aceitar conexões locais e Docker corretamente
  await app.listen(port, '0.0.0.0');
  
  console.log(`\n✅ SERVIDOR ONLINE`);
  console.log(`🚀 Backend rodando em: http://localhost:${port}`);
  console.log(`🏥 Health Check:      http://localhost:${port}/health`);
  console.log(`📊 Status:           http://localhost:${port}/\n`);
}

bootstrap().catch((error) => {
  console.error('\n❌ ERRO FATAL AO INICIAR SERVIDOR:');
  console.error(error);
  console.error('\n');
  process.exit(1);
});