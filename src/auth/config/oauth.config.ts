import { ConfigService } from '@nestjs/config';

import type { SocialProvider } from '../types';

export function hasOAuthConfig(
  configService: ConfigService,
  provider: SocialProvider,
): boolean {
  const prefix = provider.toUpperCase();
  const clientId = configService.get<string>(`${prefix}_CLIENT_ID`);
  const clientSecret = configService.get<string>(`${prefix}_CLIENT_SECRET`);

  return Boolean(
    clientId &&
      clientSecret &&
      !clientId.startsWith('missing-') &&
      !clientSecret.startsWith('missing-'),
  );
}

export function getFrontendOAuthErrorUrl(configService: ConfigService): string {
  const frontendUrl =
    configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  const loginUrl = new URL('/login', frontendUrl);

  loginUrl.searchParams.set('authError', 'social-config');

  return loginUrl.toString();
}
