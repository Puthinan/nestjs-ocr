import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, query } = request;
    const now = Date.now();
    const userAgent = request.get('user-agent') || '';

    this.logger.log(`📥 ${method} ${url} - ${userAgent}`);

    if (Object.keys(params).length > 0) {
      this.logger.debug(`   Params: ${JSON.stringify(params)}`);
    }

    if (Object.keys(query).length > 0) {
      this.logger.debug(`   Query: ${JSON.stringify(query)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          this.logger.log(
            `📤 ${method} ${url} - ${responseTime}ms - ✅ Success`,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `📤 ${method} ${url} - ${responseTime}ms - ❌ Error: ${error.message}`,
          );
        },
      }),
    );
  }
}
