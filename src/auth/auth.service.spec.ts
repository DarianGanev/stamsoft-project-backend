import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { PasswordResetMailer } from './password-reset-mailer.service';

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
});
