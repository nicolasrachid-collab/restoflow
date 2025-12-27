import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as http from 'http';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    // #region agent log
    try {
      const logData = JSON.stringify({location:'jwt-auth.guard.ts:10',message:'JWT Guard checking request',data:{path:request.url,method:request.method,hasAuthHeader:!!request.headers.authorization},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'});
      const options = {hostname:'127.0.0.1',port:7245,path:'/ingest/dbeba631-e9e7-4094-9f61-38418196391d',method:'POST',headers:{'Content-Type':'application/json'}};
      const reqLog = http.request(options,()=>{});reqLog.on('error',()=>{});reqLog.write(logData);reqLog.end();
    } catch (e) {}
    // #endregion
    return super.canActivate(context);
  }
}