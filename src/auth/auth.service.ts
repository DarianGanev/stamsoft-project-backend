import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordResetMailer } from './password-reset-mailer.service';

const PASSWORD_SALT_ROUNDS = 12;

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

type PasswordResetJwtPayload = {
  sub: string;
  email: string;
  type: 'password-reset';
};

const FORGOT_PASSWORD_MESSAGE =
  'If an account exists, a password reset link has been sent.';

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
}
