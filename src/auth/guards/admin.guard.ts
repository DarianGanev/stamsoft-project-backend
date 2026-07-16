import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { ADMIN_USER_ROLE } from '../../users/constants';
import { AuthenticatedRequest } from '../types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user.role !== ADMIN_USER_ROLE) {
      throw new ForbiddenException('Admin access is required.');
    }

    return true;
  }
}
