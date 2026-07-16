import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

import { getFrontendOAuthErrorUrl, hasOAuthConfig } from '../config';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (!hasOAuthConfig(this.configService, 'google')) {
      context
        .switchToHttp()
        .getResponse<Response>()
        .redirect(getFrontendOAuthErrorUrl(this.configService));

      return false;
    }

    return super.canActivate(context);
  }
}
