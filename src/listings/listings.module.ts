import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { BrandEntity, VehicleModelEntity } from '../brands/entities';
import {
  ImageEntity,
  ListingEntity,
  ListingFeatureEntity,
  ListingFeatureSelectionEntity,
} from './entities';
import { ListingFeaturesController } from './listing-features.controller';
import { ListingFeaturesService } from './listing-features.service';
import { LocalImageStorageService } from './local-image-storage.service';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BrandEntity,
      VehicleModelEntity,
      ListingEntity,
      ImageEntity,
      ListingFeatureEntity,
      ListingFeatureSelectionEntity,
    ]),
    AuthModule,
  ],
  controllers: [ListingsController, ListingFeaturesController],
  providers: [
    ListingsService,
    LocalImageStorageService,
    ListingFeaturesService,
  ],
  exports: [ListingsService, ListingFeaturesService],
})
export class ListingsModule {}
