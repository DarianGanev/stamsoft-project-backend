import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const apiUrl = configService.get<string>('API_URL') ?? 'http://localhost:3001';

    super({
      clientID:
        configService.get<string>('GOOGLE_CLIENT_ID') ??
        'missing-google-client-id',
      clientSecret:
        configService.get<string>('GOOGLE_CLIENT_SECRET') ??
        'missing-google-client-secret',
      callbackURL: `${apiUrl}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    return this.authService.loginWithSocialProfile({
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
    });
  }
}
