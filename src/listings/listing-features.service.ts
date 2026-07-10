import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { EntityManager } from 'typeorm';

import {
  LISTING_FEATURE_CATEGORIES,
  LISTING_FEATURE_CATEGORY_LABELS,
} from './constants';
import {
  ListingEntity,
  ListingFeatureEntity,
  ListingFeatureSelectionEntity,
} from './entities';
import { GroupedListingFeatures } from './types';

@Injectable()
export class ListingFeaturesService {
  private groupedFeaturesCache: GroupedListingFeatures[] | null = null;

  constructor(
    @InjectRepository(ListingFeatureEntity)
    private readonly featuresRepository: Repository<ListingFeatureEntity>,
    @InjectRepository(ListingFeatureSelectionEntity)
    private readonly selectionsRepository: Repository<ListingFeatureSelectionEntity>,
  ) {}

  async listGrouped(): Promise<GroupedListingFeatures[]> {
    if (this.groupedFeaturesCache) {
      return this.groupedFeaturesCache;
    }

    const features = await this.featuresRepository.find({
      order: { sortOrder: 'ASC' },
    });

    this.groupedFeaturesCache = LISTING_FEATURE_CATEGORIES.map((category) => ({
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

    return this.groupedFeaturesCache;
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

    // An empty array clears all extras; an omitted featureKeys field skips this method.
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

  async populateListingFeatures(listings: ListingEntity[]): Promise<void> {
    const listingIds = [...new Set(listings.map((listing) => listing.id))];

    if (listingIds.length === 0) {
      return;
    }

    const selections = await this.selectionsRepository.find({
      where: { listingId: In(listingIds) },
      relations: { feature: true },
    });
    const selectionsByListingId = new Map<
      string,
      ListingFeatureSelectionEntity[]
    >();

    for (const selection of selections) {
      const listingSelections =
        selectionsByListingId.get(selection.listingId) ?? [];
      listingSelections.push(selection);
      selectionsByListingId.set(selection.listingId, listingSelections);
    }

    for (const listing of listings) {
      listing.featureSelections = selectionsByListingId.get(listing.id) ?? [];
    }
  }
}
