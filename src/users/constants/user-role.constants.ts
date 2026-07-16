import type { UserRole } from '../types';

export const USER_ROLES = [
  'user',
  'admin',
] as const satisfies readonly UserRole[];

export const DEFAULT_USER_ROLE: UserRole = USER_ROLES[0];
export const ADMIN_USER_ROLE: UserRole = USER_ROLES[1];
