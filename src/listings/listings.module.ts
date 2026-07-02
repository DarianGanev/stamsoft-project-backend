import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { BrandEntity } from '../brands/brand.entity';
import { VehicleModelEntity } from '../brands/vehicle-model.entity';
import { ImageEntity } from './image.entity';
import { ListingEntity } from './listing.entity';
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
    ]),
    AuthModule,
  ],
  controllers: [ListingsController],
  providers: [ListingsService, LocalImageStorageService],
})
export class ListingsModule {}
