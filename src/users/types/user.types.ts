export type UserRole = 'user' | 'admin';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
}

export interface CreateUserInput {
  email: string;
  name: string;
  passwordHash: string;
  role?: UserRole;
}

export interface UpdateUserProfileInput {
  name?: string;
  phone?: string;
}
