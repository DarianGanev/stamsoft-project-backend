import { SafeUser } from '../../users/types';

export type AuthResponse = {
  accessToken: string;
  user: SafeUser;
};
