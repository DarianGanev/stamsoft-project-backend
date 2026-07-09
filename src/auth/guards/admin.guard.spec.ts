import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { SafeUser } from '../../users/types';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  function createContext(user: SafeUser) {
    return {
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({ user })),
      })),
    } as unknown as ExecutionContext;
  }

  it('allows admin users', () => {
    const guard = new AdminGuard();
    const context = createContext({
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin',
      phone: null,
      role: 'admin',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('blocks non-admin users', () => {
    const guard = new AdminGuard();
    const context = createContext({
      id: 'user-1',
      email: 'driver@example.com',
      name: 'Driver',
      phone: null,
      role: 'user',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
