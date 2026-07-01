import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';

import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponse } from './types/auth-response.type';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import {
  AuthenticatedRequest,
  JwtAuthGuard,
} from './guards/jwt-auth.guard';

type SocialAuthenticatedRequest = Request & {
  user: AuthResponse;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  google() {
    return;
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(
    @Req() request: SocialAuthenticatedRequest,
    @Res() response: Response,
  ) {
    return this.redirectSocialAuth(request.user, response);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return request.user;
  }

  private redirectSocialAuth(auth: AuthResponse, response: Response) {
    const callbackUrl = new URL('/auth/callback', process.env.FRONTEND_URL ?? 'http://localhost:3000');

    callbackUrl.searchParams.set('accessToken', auth.accessToken);
    callbackUrl.searchParams.set('user', JSON.stringify(auth.user));

    return response.redirect(callbackUrl.toString());
  }
}
