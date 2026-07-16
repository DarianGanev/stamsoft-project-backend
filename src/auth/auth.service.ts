import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { UsersService } from '../users/users.service';
import {
  FORGOT_PASSWORD_MESSAGE,
  PASSWORD_SALT_ROUNDS,
  RESET_PASSWORD_MESSAGE,
} from './constants';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto';
import { PasswordResetMailer } from './password-reset-mailer.service';
import { JwtPayload, PasswordResetJwtPayload, SocialProfile } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly passwordResetMailer: PasswordResetMailer,
  ) {}

  async register(registerDto: RegisterDto) {
    const passwordHash = await bcrypt.hash(
      registerDto.password,
      PASSWORD_SALT_ROUNDS,
    );

    const user = await this.usersService.create({
      email: registerDto.email,
      name: registerDto.name,
      passwordHash,
    });

    return {
      accessToken: await this.signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
      user,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const safeUser = this.usersService.toSafeUser(user);

    return {
      accessToken: await this.signAccessToken({
        sub: safeUser.id,
        email: safeUser.email,
        role: safeUser.role,
      }),
      user: safeUser,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      return {
        message: FORGOT_PASSWORD_MESSAGE,
      };
    }

    const resetToken = await this.signPasswordResetToken({
      sub: user.id,
      email: user.email,
      type: 'password-reset',
    });

    const resetLink = this.buildPasswordResetLink(resetToken);

    await this.passwordResetMailer.sendPasswordReset({
      email: user.email,
      resetLink,
    });

    return {
      message: FORGOT_PASSWORD_MESSAGE,
      resetLink,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const payload = await this.verifyPasswordResetToken(resetPasswordDto.token);
    const passwordHash = await bcrypt.hash(
      resetPasswordDto.password,
      PASSWORD_SALT_ROUNDS,
    );

    await this.usersService.updatePassword(payload.sub, passwordHash);

    return {
      message: RESET_PASSWORD_MESSAGE,
    };
  }

  async loginWithSocialProfile(profile: SocialProfile) {
    if (!profile.email) {
      throw new UnauthorizedException('Social account email is required.');
    }

    const existingUser = await this.usersService.findByEmail(profile.email);
    const user =
      existingUser === null
        ? await this.createSocialUser({
            email: profile.email,
            name: profile.name,
          })
        : this.usersService.toSafeUser(existingUser);

    return {
      accessToken: await this.signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
      user,
    };
  }

  private signAccessToken(payload: JwtPayload): Promise<string> {
    const expiresIn = (this.configService.get<string>('JWT_EXPIRES_IN') ??
      '30m') as JwtSignOptions['expiresIn'];

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn,
    });
  }

  private signPasswordResetToken(
    payload: PasswordResetJwtPayload,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: '15m',
    });
  }

  private buildPasswordResetLink(token: string): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const resetUrl = new URL('/reset-password', frontendUrl);

    resetUrl.searchParams.set('token', token);

    return resetUrl.toString();
  }

  private async verifyPasswordResetToken(
    token: string,
  ): Promise<PasswordResetJwtPayload> {
    try {
      const payload =
        await this.jwtService.verifyAsync<PasswordResetJwtPayload>(token, {
          secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        });

      if (payload.type !== 'password-reset') {
        throw new UnauthorizedException('Invalid password reset token.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid password reset token.');
    }
  }

  private async createSocialUser(profile: SocialProfile & { email: string }) {
    const passwordHash = await bcrypt.hash(randomUUID(), PASSWORD_SALT_ROUNDS);

    return this.usersService.create({
      email: profile.email,
      name: profile.name ?? profile.email,
      passwordHash,
    });
  }
}
