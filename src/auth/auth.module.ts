import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PasswordResetMailer } from './password-reset-mailer.service';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [UsersModule, JwtModule.register({}), PassportModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, PasswordResetMailer, GoogleStrategy],
})
export class AuthModule {}
