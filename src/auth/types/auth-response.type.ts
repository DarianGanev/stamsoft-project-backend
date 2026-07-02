import { SafeUser } from '../../users/user.types';

export type AuthResponse = {
  accessToken: string;
  user: SafeUser;
};
