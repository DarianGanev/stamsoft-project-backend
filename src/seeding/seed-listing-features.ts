import { seedListingFeatures } from './listing-features.seed';

void seedListingFeatures().catch((error) => {
  console.error(error);
  process.exit(1);
});
