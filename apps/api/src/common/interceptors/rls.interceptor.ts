import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { Pool } from 'pg';

// Applied on authenticated routes to propagate organization_id to PostgreSQL RLS.
// Modules that need RLS must run queries through a client obtained from pool
// inside a transaction where SET LOCAL app.current_organization_id has been called.
@Injectable()
export class RlsInterceptor implements NestInterceptor {
  constructor(private readonly pool: Pool) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const orgId: string | undefined = request.user?.org;
    if (orgId) {
      request.orgId = orgId;
    }
    return next.handle();
  }
}
