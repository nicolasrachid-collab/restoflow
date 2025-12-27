import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as http from 'http';

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
  
  // #region agent log - Middleware para logar todas as requisições
  app.use((req: any, res: any, next: any) => {
    // Logar todas as requisições para debug
    console.log(`[DEBUG] Request: ${req.method} ${req.url} ${req.path}`);
    try {
      const logData = JSON.stringify({location:'main.ts:middleware',message:'Request received at NestJS',data:{path:req.path,method:req.method,url:req.url,originalUrl:req.originalUrl,baseUrl:req.baseUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
      const options = {hostname:'127.0.0.1',port:7245,path:'/ingest/dbeba631-e9e7-4094-9f61-38418196391d',method:'POST',headers:{'Content-Type':'application/json'}};
      const reqLog = http.request(options,()=>{});reqLog.on('error',()=>{});reqLog.write(logData);reqLog.end();
    } catch (e) {
      console.error('[DEBUG] Error logging request:', e);
    }
    next();
  });
  // #endregion
  
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
  
  // #region agent log
  const logData = JSON.stringify({location:'main.ts:bootstrap',message:'NestJS server started',data:{port},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
  const options = {hostname:'127.0.0.1',port:7245,path:'/ingest/dbeba631-e9e7-4094-9f61-38418196391d',method:'POST',headers:{'Content-Type':'application/json'}};
  const reqLog = http.request(options,()=>{});reqLog.on('error',()=>{});reqLog.write(logData);reqLog.end();
  // #endregion
}
bootstrap();