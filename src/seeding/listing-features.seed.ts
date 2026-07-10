import { ListingFeatureEntity } from '../listings/entities';
import { LISTING_FEATURE_OPTIONS } from '../listings/constants';
import { AppDataSource } from '../database/data-source';

export async function seedListingFeatures() {
  const dataSource = await AppDataSource.initialize();

  try {
    const featuresRepository = dataSource.getRepository(ListingFeatureEntity);

    await featuresRepository.upsert([...LISTING_FEATURE_OPTIONS], ['key']);
  } finally {
    await dataSource.destroy();
  }
}
