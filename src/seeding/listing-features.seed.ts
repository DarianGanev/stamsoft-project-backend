import { ListingFeatureEntity } from '../listings/entities';
import { LISTING_FEATURE_OPTIONS } from '../listings/constants';
import { AppDataSource } from '../database/data-source';

export async function seedListingFeatures() {
  const dataSource = await AppDataSource.initialize();

  try {
    const featuresRepository = dataSource.getRepository(ListingFeatureEntity);

    for (const feature of LISTING_FEATURE_OPTIONS) {
      const existingFeature = await featuresRepository.findOne({
        where: { key: feature.key },
      });

      await featuresRepository.save(
        featuresRepository.create({
          id: existingFeature?.id,
          key: feature.key,
          category: feature.category,
          label: feature.label,
          sortOrder: feature.sortOrder,
        }),
      );
    }
  } finally {
    await dataSource.destroy();
  }
}
