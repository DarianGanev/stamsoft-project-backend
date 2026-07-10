import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { EntityManager } from 'typeorm';

import {
  LISTING_FEATURE_CATEGORIES,
  LISTING_FEATURE_CATEGORY_LABELS,
} from './constants';
import {
  ListingFeatureEntity,
  ListingFeatureSelectionEntity,
} from './entities';
import { GroupedListingFeatures } from './types';

@Injectable()
export class ListingFeaturesService {
  constructor(
    @InjectRepository(ListingFeatureEntity)
    private readonly featuresRepository: Repository<ListingFeatureEntity>,
  ) {}

  async listGrouped(): Promise<GroupedListingFeatures[]> {
    const features = await this.featuresRepository.find({
      order: { sortOrder: 'ASC' },
    });

    return LISTING_FEATURE_CATEGORIES.map((category) => ({
      category,
      label: LISTING_FEATURE_CATEGORY_LABELS[category],
      features: features
        .filter((feature) => feature.category === category)
        .map((feature) => ({
          id: feature.id,
          key: feature.key,
          category: feature.category,
          label: feature.label,
          sortOrder: feature.sortOrder,
        })),
    }));
  }

  async syncListingFeatures(
    listingId: string,
    featureKeys: string[],
    entityManager: EntityManager,
  ): Promise<void> {
    const featuresRepository =
      entityManager.getRepository(ListingFeatureEntity);
    const selectionsRepository = entityManager.getRepository(
      ListingFeatureSelectionEntity,
    );
    const uniqueFeatureKeys = [...new Set(featureKeys)];
    const features =
      uniqueFeatureKeys.length === 0
        ? []
        : await featuresRepository.find({
            where: { key: In(uniqueFeatureKeys) },
          });

    if (features.length !== uniqueFeatureKeys.length) {
      const validKeys = new Set(features.map((feature) => feature.key));
      const unknownKeys = uniqueFeatureKeys.filter(
        (key) => !validKeys.has(key),
      );

      throw new BadRequestException(
        `Unknown listing feature keys: ${unknownKeys.join(', ')}.`,
      );
    }

    await selectionsRepository.delete({ listingId });

    if (features.length === 0) {
      return;
    }

    await selectionsRepository.save(
      features.map((feature) =>
        selectionsRepository.create({
          listingId,
          featureId: feature.id,
        }),
      ),
    );
  }
}
