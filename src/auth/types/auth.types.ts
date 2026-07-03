import type { Request } from 'express';

import type { SafeUser } from '../../users/types';
import type { AuthResponse } from './auth-response.type';

export type PasswordResetJwtPayload = {
  sub: string;
  email: string;
  type: 'password-reset';
};

export type SocialProfile = {
  email?: string;
  name?: string;
};

export type SocialProvider = 'google';

export type PasswordResetEmail = {
  email: string;
  resetLink: string;
};

export type AuthenticatedRequest = Request & {
  user: SafeUser;
};

export type SocialAuthenticatedRequest = Request & {
  user: AuthResponse;
};
