import { ConflictException, Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { CreateUserInput, SafeUser, UserRecord } from './user.types';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateUserInput): Promise<SafeUser> {
    try {
      const result = await this.databaseService.query<UserRecord>(
        `
          INSERT INTO users (email, name, password_hash, role)
          VALUES ($1, $2, $3, $4)
          RETURNING id, email, name, password_hash, role, created_at, updated_at
        `,
        [
          input.email.toLowerCase(),
          input.name,
          input.passwordHash,
          input.role ?? 'user',
        ],
      );

      return this.toSafeUser(result.rows[0]);
    } catch (error) {
      if (this.isUniqueEmailError(error)) {
        throw new ConflictException('A user with this email already exists.');
      }

      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.databaseService.query<UserRecord>(
      `
        SELECT id, email, name, password_hash, role, created_at, updated_at
        FROM users
        WHERE email = $1
      `,
      [email.toLowerCase()],
    );

    return result.rows[0] ?? null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const result = await this.databaseService.query<UserRecord>(
      `
        SELECT id, email, name, password_hash, role, created_at, updated_at
        FROM users
        WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async countUsers(): Promise<number> {
    const result = await this.databaseService.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM users',
    );

    return Number(result.rows[0]?.count ?? 0);
  }

  async findRecentUsers(limit = 5): Promise<SafeUser[]> {
    const result = await this.databaseService.query<UserRecord>(
      `
        SELECT id, email, name, password_hash, role, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [limit],
    );

    return result.rows.map((user) => this.toSafeUser(user));
  }

  toSafeUser(user: UserRecord): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  private isUniqueEmailError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
