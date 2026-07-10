import { BadRequestException } from '@nestjs/common';

import {
  ListingFeatureEntity,
  ListingFeatureSelectionEntity,
} from './entities';
import { ListingFeaturesService } from './listing-features.service';

describe('ListingFeaturesService', () => {
  function createService() {
    const featuresRepository = {
      find: jest.fn(),
    };
    const selectionsRepository = {
      create: jest.fn((input: unknown) => input),
      delete: jest.fn(),
      save: jest.fn(),
    };
    const entityManager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === ListingFeatureEntity) {
          return featuresRepository;
        }

        if (entity === ListingFeatureSelectionEntity) {
          return selectionsRepository;
        }

        throw new Error('Unexpected transaction repository.');
      }),
    };

    return {
      entityManager,
      featuresRepository,
      selectionsRepository,
      service: new ListingFeaturesService(featuresRepository as never),
    };
  }

  it('groups listing features by category', async () => {
    const { featuresRepository, service } = createService();

    featuresRepository.find.mockResolvedValue([
      featureEntity({
        id: 'feature-1',
        key: 'abs',
        category: 'safety',
        label: 'Антиблокираща система',
        sortOrder: 30,
      }),
    ]);

    const result = await service.listGrouped();

    expect(result).toEqual(
      expect.arrayContaining([
        {
          category: 'safety',
          label: 'Безопасност',
          features: [
            {
              id: 'feature-1',
              key: 'abs',
              category: 'safety',
              label: 'Антиблокираща система',
              sortOrder: 30,
            },
          ],
        },
      ]),
    );
    expect(featuresRepository.find).toHaveBeenCalledWith({
      order: { sortOrder: 'ASC' },
    });
  });

  it('syncs selected listing features', async () => {
    const { entityManager, featuresRepository, selectionsRepository, service } =
      createService();

    featuresRepository.find.mockResolvedValue([
      featureEntity({ id: 'feature-1', key: 'abs' }),
      featureEntity({ id: 'feature-2', key: 'parking_sensors' }),
    ]);

    await service.syncListingFeatures(
      'listing-1',
      ['abs', 'parking_sensors', 'abs'],
      entityManager as never,
    );

    expect(selectionsRepository.delete).toHaveBeenCalledWith({
      listingId: 'listing-1',
    });
    expect(selectionsRepository.save).toHaveBeenCalledWith([
      { listingId: 'listing-1', featureId: 'feature-1' },
      { listingId: 'listing-1', featureId: 'feature-2' },
    ]);
  });

  it('rejects unknown feature keys', async () => {
    const { entityManager, featuresRepository, service } = createService();

    featuresRepository.find.mockResolvedValue([
      featureEntity({ id: 'feature-1', key: 'abs' }),
    ]);

    await expect(
      service.syncListingFeatures(
        'listing-1',
        ['abs', 'unknown_feature'],
        entityManager as never,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  function featureEntity(
    overrides: Partial<ListingFeatureEntity> = {},
  ): ListingFeatureEntity {
    return {
      id: 'feature-1',
      key: 'abs',
      category: 'safety',
      label: 'Антиблокираща система',
      sortOrder: 30,
      createdAt: new Date('2026-07-09T08:00:00.000Z'),
      updatedAt: new Date('2026-07-09T08:00:00.000Z'),
      selections: [],
      ...overrides,
    };
  }
});
