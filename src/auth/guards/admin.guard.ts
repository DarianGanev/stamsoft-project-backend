import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { AuthenticatedRequest } from '../types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user.role !== 'admin') {
      throw new ForbiddenException('Admin access is required.');
    }

    return true;
  }
}
