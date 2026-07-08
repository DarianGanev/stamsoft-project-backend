import { NotFoundException } from '@nestjs/common';

import { ListingEntity } from '../listings/entities';
import { ListingsService } from '../listings/listings.service';
import { FavoriteEntity } from './entities';
import { FavoritesService } from './favorites.service';

class MockFavoriteQueryBuilder {
  andWhere = jest.fn(() => this);
  getManyAndCount = jest.fn();
  getOne = jest.fn();
  innerJoinAndSelect = jest.fn(() => this);
  leftJoinAndSelect = jest.fn(() => this);
  orderBy = jest.fn(() => this);
  skip = jest.fn(() => this);
  take = jest.fn(() => this);
  where = jest.fn(() => this);
}

describe('FavoritesService', () => {
  function createService(queryBuilder = new MockFavoriteQueryBuilder()) {
    const favoritesRepository = {
      create: jest.fn((input: Partial<FavoriteEntity>) => input),
      createQueryBuilder: jest.fn(() => queryBuilder),
      delete: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    const listingsRepository = {
      findOne: jest.fn(),
    };
    const listingsService = {
      toListingResponse: jest.fn((listing: ListingEntity) => ({
        id: listing.id,
        status: listing.status,
      })),
    };

    return {
      favoritesRepository,
      listingsRepository,
      listingsService,
      queryBuilder,
      service: new FavoritesService(
        favoritesRepository as never,
        listingsRepository as never,
        listingsService as unknown as ListingsService,
      ),
    };
  }

  function favoriteEntity(
    overrides: Partial<FavoriteEntity> = {},
  ): FavoriteEntity {
    return {
      id: 'favorite-1',
      userId: 'user-1',
      listingId: 'listing-1',
      createdAt: new Date('2026-07-08T08:00:00.000Z'),
      listing: {
        id: 'listing-1',
        status: 'published',
      } as ListingEntity,
      user: null as never,
      ...overrides,
    };
  }

  it('lists published favorite listings for the current user', async () => {
    const { queryBuilder, service } = createService();

    queryBuilder.getManyAndCount.mockResolvedValue([[favoriteEntity()], 1]);

    await expect(service.list('user-1', { page: 2, limit: 6 })).resolves.toEqual({
      data: [{ id: 'listing-1', status: 'published' }],
      meta: { page: 2, limit: 6, total: 1 },
    });

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'favorite.userId = :userId',
      { userId: 'user-1' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'listing.status = :status',
      { status: 'published' },
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(6);
    expect(queryBuilder.take).toHaveBeenCalledWith(6);
  });

  it('saves a published listing as a favorite', async () => {
    const {
      favoritesRepository,
      listingsRepository,
      queryBuilder,
      service,
    } = createService();

    listingsRepository.findOne.mockResolvedValue({
      id: 'listing-1',
      status: 'published',
    });
    favoritesRepository.findOne.mockResolvedValue(null);
    queryBuilder.getOne.mockResolvedValue(favoriteEntity());

    await expect(service.save('user-1', 'listing-1')).resolves.toEqual({
      id: 'listing-1',
      status: 'published',
    });
    expect(favoritesRepository.create).toHaveBeenCalledWith({
      listingId: 'listing-1',
      userId: 'user-1',
    });
    expect(favoritesRepository.save).toHaveBeenCalledWith({
      listingId: 'listing-1',
      userId: 'user-1',
    });
  });

  it('treats saving an existing favorite as idempotent', async () => {
    const {
      favoritesRepository,
      listingsRepository,
      queryBuilder,
      service,
    } = createService();

    listingsRepository.findOne.mockResolvedValue({
      id: 'listing-1',
      status: 'published',
    });
    favoritesRepository.findOne.mockResolvedValue(favoriteEntity());
    queryBuilder.getOne.mockResolvedValue(favoriteEntity());

    await expect(service.save('user-1', 'listing-1')).resolves.toEqual({
      id: 'listing-1',
      status: 'published',
    });
    expect(favoritesRepository.save).not.toHaveBeenCalled();
  });

  it('rejects favoriting missing or unpublished listings', async () => {
    const { listingsRepository, service } = createService();

    listingsRepository.findOne.mockResolvedValue(null);

    await expect(service.save('user-1', 'listing-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('removes a favorite for the current user', async () => {
    const { favoritesRepository, service } = createService();

    await service.remove('user-1', 'listing-1');

    expect(favoritesRepository.delete).toHaveBeenCalledWith({
      listingId: 'listing-1',
      userId: 'user-1',
    });
  });
});
