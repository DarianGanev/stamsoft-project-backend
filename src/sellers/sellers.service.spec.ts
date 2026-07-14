import { NotFoundException } from '@nestjs/common';

import { ListingEntity } from '../listings/entities';
import { ListingsService } from '../listings/listings.service';
import { UserEntity } from '../users/entities';
import { SellersService } from './sellers.service';

class MockSellerListingsQueryBuilder {
  andWhere = jest.fn(() => this);
  getManyAndCount = jest.fn();
  innerJoinAndSelect = jest.fn(() => this);
  leftJoinAndSelect = jest.fn(() => this);
  orderBy = jest.fn(() => this);
  skip = jest.fn(() => this);
  take = jest.fn(() => this);
  where = jest.fn(() => this);
}

describe('SellersService', () => {
  function createService(queryBuilder = new MockSellerListingsQueryBuilder()) {
    const usersRepository = {
      findOne: jest.fn(),
    };
    const listingsRepository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
      exists: jest.fn(),
      findOne: jest.fn(),
    };
    const listingsService = {
      toListingResponses: jest.fn((listings: ListingEntity[]) =>
        Promise.resolve(
          listings.map((listing) => ({
            id: listing.id,
            status: listing.status,
          })),
        ),
      ),
    };

    return {
      listingsRepository,
      listingsService,
      queryBuilder,
      service: new SellersService(
        usersRepository as never,
        listingsRepository as never,
        listingsService as unknown as ListingsService,
      ),
      usersRepository,
    };
  }

  function userEntity(overrides: Partial<UserEntity> = {}): UserEntity {
    return {
      id: 'seller-1',
      email: 'seller@example.com',
      name: 'Seller',
      phone: '+359888000000',
      passwordHash: 'hash',
      role: 'user',
      createdAt: new Date('2026-07-08T08:00:00.000Z'),
      updatedAt: new Date('2026-07-08T08:00:00.000Z'),
      listings: [],
      ...overrides,
    };
  }

  it('returns public seller data without exposing email', async () => {
    const { listingsRepository, service, usersRepository } = createService();

    usersRepository.findOne.mockResolvedValue(userEntity());
    listingsRepository.findOne.mockResolvedValue({
      id: 'listing-1',
      contactPhone: '+359888123456',
    });

    await expect(service.findPublicSeller('seller-1')).resolves.toEqual({
      id: 'seller-1',
      name: 'Seller',
      phone: '+359888123456',
      createdAt: '2026-07-08T08:00:00.000Z',
    });
    expect(usersRepository.findOne).toHaveBeenCalledWith({
      select: { createdAt: true, id: true, name: true },
      where: { id: 'seller-1' },
    });
    expect(listingsRepository.findOne).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
      select: { contactPhone: true, id: true },
      where: { status: 'published', userId: 'seller-1' },
    });
  });

  it('uses the newest non-null phone from published listings', async () => {
    const { listingsRepository, service, usersRepository } = createService();

    usersRepository.findOne.mockResolvedValue(userEntity());
    listingsRepository.findOne
      .mockResolvedValueOnce({ id: 'listing-1', contactPhone: null })
      .mockResolvedValueOnce({
        id: 'listing-2',
        contactPhone: '+359888999999',
      });

    await expect(service.findPublicSeller('seller-1')).resolves.toMatchObject({
      id: 'seller-1',
      phone: '+359888999999',
    });
    expect(listingsRepository.findOne).toHaveBeenCalledTimes(2);
  });

  it('returns null when no published listing has a phone', async () => {
    const { listingsRepository, service, usersRepository } = createService();

    usersRepository.findOne.mockResolvedValue(userEntity());
    listingsRepository.findOne
      .mockResolvedValueOnce({ id: 'listing-1', contactPhone: null })
      .mockResolvedValueOnce(null);

    await expect(service.findPublicSeller('seller-1')).resolves.toMatchObject({
      id: 'seller-1',
      phone: null,
    });
  });

  it('rejects users without published listings', async () => {
    const { listingsRepository, service, usersRepository } = createService();

    usersRepository.findOne.mockResolvedValue(userEntity());
    listingsRepository.findOne.mockResolvedValue(null);

    await expect(service.findPublicSeller('seller-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects missing sellers', async () => {
    const { service, usersRepository } = createService();

    usersRepository.findOne.mockResolvedValue(null);

    await expect(service.findPublicSeller('seller-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('lists only published listings for the seller', async () => {
    const { listingsRepository, queryBuilder, service } = createService();

    listingsRepository.exists.mockResolvedValue(true);
    queryBuilder.getManyAndCount.mockResolvedValue([
      [{ id: 'listing-1', status: 'published' }],
      1,
    ]);

    await expect(
      service.listPublishedListings('seller-1', { page: 2, limit: 6 }),
    ).resolves.toEqual({
      data: [{ id: 'listing-1', status: 'published' }],
      meta: { page: 2, limit: 6, total: 1 },
    });

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'listing.userId = :userId',
      { userId: 'seller-1' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'listing.status = :status',
      { status: 'published' },
    );
    expect(queryBuilder.innerJoinAndSelect).toHaveBeenCalledWith(
      'listing.user',
      'user',
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(6);
    expect(queryBuilder.take).toHaveBeenCalledWith(6);
  });

  it('rejects listing requests for missing sellers', async () => {
    const { listingsRepository, service } = createService();

    listingsRepository.exists.mockResolvedValue(false);

    await expect(
      service.listPublishedListings('seller-1', { page: 1, limit: 6 }),
    ).rejects.toThrow(NotFoundException);
  });
});
