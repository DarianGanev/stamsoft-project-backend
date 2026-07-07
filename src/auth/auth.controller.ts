import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';

import { AuthService } from './auth.service';
import { GoogleAuthGuard, JwtAuthGuard } from './guards';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto';
import {
  AuthenticatedRequest,
  AuthResponse,
  SocialAuthenticatedRequest,
} from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(200)
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
