import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DEFAULT_USER_ROLE } from './constants';
import { UserEntity } from './entities';
import {
  CreateUserInput,
  SafeUser,
  UpdateUserProfileInput,
  UserRecord,
} from './types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(input: CreateUserInput): Promise<SafeUser> {
    try {
      const user = await this.usersRepository.save(
        this.usersRepository.create({
          email: input.email.toLowerCase(),
          name: input.name,
          passwordHash: input.passwordHash,
          role: input.role ?? DEFAULT_USER_ROLE,
        }),
      );

      return this.toSafeUser(this.toUserRecord(user));
    } catch (error) {
      if (this.isUniqueEmailError(error)) {
        throw new ConflictException('A user with this email already exists.');
      }

      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    return user ? this.toUserRecord(user) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.usersRepository.findOne({ where: { id } });

    return user ? this.toUserRecord(user) : null;
  }

  async countUsers(): Promise<number> {
    return this.usersRepository.count();
  }

  async findRecentUsers(limit = 5): Promise<SafeUser[]> {
    const users = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return users.map((user) => this.toSafeUser(this.toUserRecord(user)));
  }

  async getProfile(id: string): Promise<SafeUser> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.toSafeUser(user);
  }

  async updateProfile(
    id: string,
    input: UpdateUserProfileInput,
  ): Promise<SafeUser> {
    const updates: Partial<UserEntity> = {};

    if (input.name !== undefined) {
      updates.name = input.name.trim();
    }

    if (input.phone !== undefined) {
      const phone = input.phone.trim();

      updates.phone = phone === '' ? null : phone;
    }

    if (Object.keys(updates).length > 0) {
      await this.usersRepository.update(id, updates);
    }

    return this.getProfile(id);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.usersRepository.update(id, { passwordHash });
  }

  toSafeUser(user: UserRecord): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
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

  private toUserRecord(user: UserEntity): UserRecord {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      password_hash: user.passwordHash,
      role: user.role,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }
}
