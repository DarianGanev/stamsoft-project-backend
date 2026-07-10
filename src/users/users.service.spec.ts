import { ConflictException } from '@nestjs/common';

import { UserEntity } from './entities';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const now = new Date('2026-07-03T08:00:00.000Z');

  function createService() {
    const repository = {
      count: jest.fn(),
      create: jest.fn((input: Partial<UserEntity>) => input),
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    const queryBuilder = {
      addSelect: jest.fn(),
      getOne: jest.fn(),
      where: jest.fn(),
    };

    queryBuilder.addSelect.mockReturnValue(queryBuilder);
    queryBuilder.where.mockReturnValue(queryBuilder);
    repository.createQueryBuilder.mockReturnValue(queryBuilder);

    return {
      queryBuilder,
      repository,
      service: new UsersService(repository as never),
    };
  }

  function userEntity(overrides: Partial<UserEntity> = {}): UserEntity {
    return {
      id: 'user-1',
      email: 'driver@example.com',
      name: 'Driver',
      phone: null,
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
      phone: null,
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
    const { queryBuilder, repository, service } = createService();
    const user = userEntity();

    queryBuilder.getOne.mockResolvedValue(user);
    repository.findOne.mockResolvedValue(user);

    await expect(
      service.findByEmail('DRIVER@example.com'),
    ).resolves.toMatchObject({
      email: 'driver@example.com',
      password_hash: 'password-hash',
    });
    await expect(service.findById('user-1')).resolves.toMatchObject({
      id: 'user-1',
      email: 'driver@example.com',
    });

    expect(repository.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(queryBuilder.addSelect).toHaveBeenCalledWith('user.passwordHash');
    expect(queryBuilder.where).toHaveBeenCalledWith('user.email = :email', {
      email: 'driver@example.com',
    });
    expect(repository.findOne).toHaveBeenCalledWith({
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
        phone: null,
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

  it('updates profile name and phone without exposing password hash', async () => {
    const { repository, service } = createService();

    repository.findOne.mockResolvedValue(
      userEntity({
        name: 'Updated Driver',
        phone: '+359888123456',
      }),
    );

    await expect(
      service.updateProfile('user-1', {
        name: ' Updated Driver ',
        phone: ' +359888123456 ',
      }),
    ).resolves.toEqual({
      id: 'user-1',
      email: 'driver@example.com',
      name: 'Updated Driver',
      phone: '+359888123456',
      role: 'user',
    });

    expect(repository.update).toHaveBeenCalledWith('user-1', {
      name: 'Updated Driver',
      phone: '+359888123456',
    });
  });
});
