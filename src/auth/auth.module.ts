import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminGuard, JwtAuthGuard } from './guards';
import { PasswordResetMailer } from './password-reset-mailer.service';
import { GoogleStrategy } from './strategies';

@Module({
  imports: [UsersModule, JwtModule.register({}), PassportModule],
  controllers: [AuthController],
  providers: [
    AdminGuard,
    AuthService,
    JwtAuthGuard,
    PasswordResetMailer,
    GoogleStrategy,
  ],
  exports: [AdminGuard, JwtAuthGuard, JwtModule, UsersModule],
})
export class AuthModule {}
