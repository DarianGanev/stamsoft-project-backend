import { BrandEntity, VehicleModelEntity } from '../../brands/entities';
import { FavoriteEntity } from '../../favorites/entities';
import {
  ImageEntity,
  ListingEntity,
  ListingFeatureEntity,
  ListingFeatureSelectionEntity,
} from '../../listings/entities';
import { UserEntity } from '../../users/entities';

export const databaseEntities = [
  UserEntity,
  BrandEntity,
  VehicleModelEntity,
  ListingEntity,
  ImageEntity,
  ListingFeatureEntity,
  ListingFeatureSelectionEntity,
  FavoriteEntity,
];
