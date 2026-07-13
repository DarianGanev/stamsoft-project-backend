import { NotFoundException } from '@nestjs/common';

import {
  ListingEntity,
  ListingFeatureEntity,
  ListingFeatureSelectionEntity,
} from '../listings/entities';
import { ListingsService } from '../listings/listings.service';
import { UserEntity } from '../users/entities';
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
    const toListing = (listing: ListingEntity) => ({
      id: listing.id,
      status: listing.status,
      sellerCreatedAt: listing.user?.createdAt?.toISOString() ?? null,
      features: (listing.featureSelections ?? []).map((selection) => ({
        id: selection.feature.id,
        key: selection.feature.key,
        category: selection.feature.category,
        label: selection.feature.label,
      })),
    });
    const listingsService = {
      toListingResponse: jest.fn((listing: ListingEntity) =>
        Promise.resolve(toListing(listing)),
      ),
      toListingResponses: jest.fn((listings: ListingEntity[]) =>
        Promise.resolve(listings.map((listing) => toListing(listing))),
      ),
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
        user: {
          id: 'user-1',
          createdAt: new Date('2025-01-10T10:00:00.000Z'),
        } as UserEntity,
        featureSelections: [
          {
            id: 'selection-1',
            listingId: 'listing-1',
            featureId: 'feature-1',
            feature: {
              id: 'feature-1',
              key: 'abs',
              category: 'safety',
              label: 'Антиблокираща система',
            } as ListingFeatureEntity,
          } as ListingFeatureSelectionEntity,
        ],
      } as ListingEntity,
      user: null as never,
      ...overrides,
    };
  }

  it('lists published favorite listings for the current user', async () => {
    const { queryBuilder, service } = createService();

    queryBuilder.getManyAndCount.mockResolvedValue([[favoriteEntity()], 1]);

    await expect(
      service.list('user-1', { page: 2, limit: 6 }),
    ).resolves.toEqual({
      data: [
        {
          id: 'listing-1',
          status: 'published',
          sellerCreatedAt: '2025-01-10T10:00:00.000Z',
          features: [
            {
              id: 'feature-1',
              key: 'abs',
              category: 'safety',
              label: 'Антиблокираща система',
            },
          ],
        },
      ],
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
    expect(queryBuilder.innerJoinAndSelect).toHaveBeenCalledWith(
      'listing.user',
      'user',
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(6);
    expect(queryBuilder.take).toHaveBeenCalledWith(6);
  });

  it('uses the favorites pagination defaults', async () => {
    const { queryBuilder, service } = createService();

    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await expect(service.list('user-1', {})).resolves.toEqual({
      data: [],
      meta: { page: 1, limit: 6, total: 0 },
    });
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(6);
  });

  it('saves a published listing as a favorite', async () => {
    const { favoritesRepository, listingsRepository, queryBuilder, service } =
      createService();

    listingsRepository.findOne.mockResolvedValue({
      id: 'listing-1',
      status: 'published',
    });
    favoritesRepository.findOne.mockResolvedValue(null);
    queryBuilder.getOne.mockResolvedValue(favoriteEntity());

    await expect(service.save('user-1', 'listing-1')).resolves.toMatchObject({
      id: 'listing-1',
      status: 'published',
      sellerCreatedAt: '2025-01-10T10:00:00.000Z',
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
    const { favoritesRepository, listingsRepository, queryBuilder, service } =
      createService();

    listingsRepository.findOne.mockResolvedValue({
      id: 'listing-1',
      status: 'published',
    });
    favoritesRepository.findOne.mockResolvedValue(favoriteEntity());
    queryBuilder.getOne.mockResolvedValue(favoriteEntity());

    await expect(service.save('user-1', 'listing-1')).resolves.toMatchObject({
      id: 'listing-1',
      status: 'published',
      sellerCreatedAt: '2025-01-10T10:00:00.000Z',
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
