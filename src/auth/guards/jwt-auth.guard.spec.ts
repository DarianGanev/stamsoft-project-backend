import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { SafeUser, UserRecord } from '../../users/types';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  function createGuard() {
    const request: {
      headers: { authorization?: string };
      user?: SafeUser;
    } = {
      headers: {},
    };
    const context = {
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })),
    } as unknown as ExecutionContext;
    const configService = {
      getOrThrow: jest.fn(() => 'jwt-secret'),
    };
    const jwtService = {
      verifyAsync: jest.fn(),
    };
    const usersService = {
      findById: jest.fn(),
      toSafeUser: jest.fn((user: UserRecord): SafeUser => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })),
    };

    return {
      configService,
      context,
      guard: new JwtAuthGuard(
        configService as never,
        jwtService as never,
        usersService as never,
      ),
      jwtService,
      request,
      usersService,
    };
  }

  it('accepts a valid bearer token and attaches safe user to request', async () => {
    const { context, guard, jwtService, request, usersService } = createGuard();

    request.headers = { authorization: 'Bearer access-token' };
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'driver@example.com',
      role: 'user',
    });
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      email: 'driver@example.com',
      name: 'Driver',
      role: 'user',
      password_hash: 'password-hash',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({
      id: 'user-1',
      email: 'driver@example.com',
      name: 'Driver',
      role: 'user',
    });
  });

  it('rejects missing authorization token', async () => {
    const { guard, context } = createGuard();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects invalid tokens and unknown users', async () => {
    const { guard, context, jwtService, request, usersService } = createGuard();

    request.headers = { authorization: 'Bearer access-token' };
    jwtService.verifyAsync.mockResolvedValue({ sub: 'missing-user' });
    usersService.findById.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
