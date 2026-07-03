import { ConflictException } from '@nestjs/common';

import { UserEntity } from './entities';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const now = new Date('2026-07-03T08:00:00.000Z');

  function createService() {
    const repository = {
      count: jest.fn(),
      create: jest.fn((input: Partial<UserEntity>) => input),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    return {
      repository,
      service: new UsersService(repository as never),
    };
  }

  function userEntity(overrides: Partial<UserEntity> = {}): UserEntity {
    return {
      id: 'user-1',
      email: 'driver@example.com',
      name: 'Driver',
      passwordHash: 'password-hash',
      role: 'user',
      createdAt: now,
      updatedAt: now,
      listings: [],
      ...overrides,
    };
  }

  it('creates a user with normalized email and returns a safe user', async () => {
    const { repository, service } = createService();

    repository.save.mockResolvedValue(
      userEntity({ email: 'driver@example.com' }),
    );

    await expect(
      service.create({
        email: 'DRIVER@example.com',
        name: 'Driver',
        passwordHash: 'password-hash',
      }),
    ).resolves.toEqual({
      id: 'user-1',
      email: 'driver@example.com',
      name: 'Driver',
      role: 'user',
    });

    expect(repository.create).toHaveBeenCalledWith({
      email: 'driver@example.com',
      name: 'Driver',
      passwordHash: 'password-hash',
      role: 'user',
    });
  });

  it('throws a conflict when email is already used', async () => {
    const { repository, service } = createService();

    repository.save.mockRejectedValue({ code: '23505' });

    await expect(
      service.create({
        email: 'driver@example.com',
        name: 'Driver',
        passwordHash: 'password-hash',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('finds users by normalized email and id', async () => {
    const { repository, service } = createService();
    const user = userEntity();

    repository.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(user);

    await expect(service.findByEmail('DRIVER@example.com')).resolves.toMatchObject({
      email: 'driver@example.com',
      password_hash: 'password-hash',
    });
    await expect(service.findById('user-1')).resolves.toMatchObject({
      id: 'user-1',
      email: 'driver@example.com',
    });

    expect(repository.findOne).toHaveBeenNthCalledWith(1, {
      where: { email: 'driver@example.com' },
    });
    expect(repository.findOne).toHaveBeenNthCalledWith(2, {
      where: { id: 'user-1' },
    });
  });

  it('returns recent users without password hashes', async () => {
    const { repository, service } = createService();

    repository.find.mockResolvedValue([userEntity()]);

    await expect(service.findRecentUsers(3)).resolves.toEqual([
      {
        id: 'user-1',
        email: 'driver@example.com',
        name: 'Driver',
        role: 'user',
      },
    ]);

    expect(repository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
      take: 3,
    });
  });

  it('updates password hash by user id', async () => {
    const { repository, service } = createService();

    await service.updatePassword('user-1', 'new-hash');

    expect(repository.update).toHaveBeenCalledWith('user-1', {
      passwordHash: 'new-hash',
    });
  });
});
