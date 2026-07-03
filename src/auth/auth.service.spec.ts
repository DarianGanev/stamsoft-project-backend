import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { PasswordResetMailer } from './password-reset-mailer.service';

describe('AuthService login and register', () => {
  function createService(usersServiceOverrides: Partial<UsersService> = {}) {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return '30m';
        return undefined;
      }),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'secret';
        throw new Error(`Missing ${key}`);
      }),
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    } as Pick<JwtService, 'signAsync'>;
    const usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      toSafeUser: jest.fn((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })),
      ...usersServiceOverrides,
    } as Partial<UsersService>;
    const passwordResetMailer = {
      sendPasswordReset: jest.fn(),
    } as Pick<PasswordResetMailer, 'sendPasswordReset'>;

    return {
      configService,
      jwtService,
      service: new AuthService(
        configService as never,
        jwtService as JwtService,
        usersService as UsersService,
        passwordResetMailer as PasswordResetMailer,
      ),
      usersService,
    };
  }

  it('registers a user, hashes password, and signs an access token', async () => {
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('password-hash' as never);

    const { jwtService, service, usersService } = createService();

    jest.mocked(usersService.create!).mockResolvedValue({
      id: 'user-1',
      email: 'driver@example.com',
      name: 'Driver',
      role: 'user',
    });

    await expect(
      service.register({
        email: 'driver@example.com',
        name: 'Driver',
        password: 'password123',
      }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      user: {
        id: 'user-1',
        email: 'driver@example.com',
        name: 'Driver',
        role: 'user',
      },
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
    expect(usersService.create).toHaveBeenCalledWith({
      email: 'driver@example.com',
      name: 'Driver',
      passwordHash: 'password-hash',
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: 'user-1', email: 'driver@example.com', role: 'user' },
      { secret: 'secret', expiresIn: '30m' },
    );
  });

  it('logs in with valid credentials and returns a safe user', async () => {
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    const { service, usersService } = createService();

    jest.mocked(usersService.findByEmail!).mockResolvedValue({
      id: 'user-1',
      email: 'driver@example.com',
      name: 'Driver',
      password_hash: 'password-hash',
      role: 'user',
      created_at: new Date('2026-07-03T08:00:00.000Z'),
      updated_at: new Date('2026-07-03T08:00:00.000Z'),
    });

    await expect(
      service.login({
        email: 'driver@example.com',
        password: 'password123',
      }),
    ).resolves.toMatchObject({
      accessToken: 'access-token',
      user: {
        id: 'user-1',
        email: 'driver@example.com',
        name: 'Driver',
      },
    });

    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'password-hash');
  });

  it('rejects login when user is missing or password is wrong', async () => {
    const { service, usersService } = createService();

    jest.mocked(usersService.findByEmail!).mockResolvedValueOnce(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(UnauthorizedException);

    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
    jest.mocked(usersService.findByEmail!).mockResolvedValueOnce({
      id: 'user-1',
      email: 'driver@example.com',
      name: 'Driver',
      password_hash: 'password-hash',
      role: 'user',
      created_at: new Date('2026-07-03T08:00:00.000Z'),
      updated_at: new Date('2026-07-03T08:00:00.000Z'),
    });

    await expect(
      service.login({
        email: 'driver@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

describe('AuthService forgot password', () => {
  it('returns a password reset link for local delivery', async () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'FRONTEND_URL') return 'http://localhost:3000';
        return undefined;
      }),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'secret';
        throw new Error(`Missing ${key}`);
      }),
    };
    const signAsync = jest.fn().mockResolvedValue('reset-token');
    const findByEmail = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'driver@example.com',
    });
    const jwtService = {
      signAsync,
    } as Pick<JwtService, 'signAsync'>;
    const usersService = {
      findByEmail,
    } as Pick<UsersService, 'findByEmail'>;
    const sendPasswordReset = jest.fn().mockResolvedValue(undefined);
    const passwordResetMailer = {
      sendPasswordReset,
    } as Pick<PasswordResetMailer, 'sendPasswordReset'>;
    const service = new AuthService(
      configService as never,
      jwtService as JwtService,
      usersService as UsersService,
      passwordResetMailer as PasswordResetMailer,
    );

    await expect(
      service.forgotPassword({ email: 'DRIVER@example.com' }),
    ).resolves.toEqual({
      message: 'If an account exists, a password reset link has been sent.',
      resetLink: 'http://localhost:3000/reset-password?token=reset-token',
    });

    expect(findByEmail).toHaveBeenCalledWith('DRIVER@example.com');
    expect(signAsync).toHaveBeenCalledWith(
      { sub: 'user-1', email: 'driver@example.com', type: 'password-reset' },
      { secret: 'secret', expiresIn: '15m' },
    );
    expect(sendPasswordReset).toHaveBeenCalledWith({
      email: 'driver@example.com',
      resetLink: 'http://localhost:3000/reset-password?token=reset-token',
    });
  });

  it('updates the password when the reset token is valid', async () => {
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('new-password-hash' as never);

    const configService = {
      get: jest.fn(),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'secret';
        throw new Error(`Missing ${key}`);
      }),
    };
    const verifyAsync = jest.fn().mockResolvedValue({
      sub: 'user-1',
      email: 'driver@example.com',
      type: 'password-reset',
    });
    const jwtService = {
      verifyAsync,
    } as Pick<JwtService, 'verifyAsync'>;
    const updatePassword = jest.fn().mockResolvedValue(undefined);
    const usersService = {
      updatePassword,
    } as Pick<UsersService, 'updatePassword'>;
    const passwordResetMailer = {
      sendPasswordReset: jest.fn(),
    } as Pick<PasswordResetMailer, 'sendPasswordReset'>;
    const service = new AuthService(
      configService as never,
      jwtService as JwtService,
      usersService as UsersService,
      passwordResetMailer as PasswordResetMailer,
    );

    await expect(
      service.resetPassword({
        token: 'reset-token',
        password: 'newpassword123',
      }),
    ).resolves.toEqual({
      message: 'Password has been reset successfully.',
    });

    expect(verifyAsync).toHaveBeenCalledWith('reset-token', {
      secret: 'secret',
    });
    expect(updatePassword).toHaveBeenCalledWith('user-1', 'new-password-hash');
  });

  it('creates a local account for a new social login', async () => {
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('social-password-hash' as never);

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return '30m';
        return undefined;
      }),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'secret';
        throw new Error(`Missing ${key}`);
      }),
    };
    const signAsync = jest.fn().mockResolvedValue('access-token');
    const jwtService = {
      signAsync,
    } as Pick<JwtService, 'signAsync'>;
    const findByEmail = jest.fn().mockResolvedValue(null);
    const create = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'driver@example.com',
      name: 'Driver',
      role: 'user',
    });
    const usersService = {
      findByEmail,
      create,
    } as Partial<UsersService>;
    const passwordResetMailer = {
      sendPasswordReset: jest.fn(),
    } as Pick<PasswordResetMailer, 'sendPasswordReset'>;
    const service = new AuthService(
      configService as never,
      jwtService as JwtService,
      usersService as UsersService,
      passwordResetMailer as PasswordResetMailer,
    );

    await expect(
      service.loginWithSocialProfile({
        email: 'driver@example.com',
        name: 'Driver',
      }),
    ).resolves.toMatchObject({
      accessToken: 'access-token',
      user: {
        email: 'driver@example.com',
        name: 'Driver',
      },
    });

    expect(create).toHaveBeenCalledWith({
      email: 'driver@example.com',
      name: 'Driver',
      passwordHash: 'social-password-hash',
    });
  });
});
