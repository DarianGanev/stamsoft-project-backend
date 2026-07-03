import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { BrandEntity, VehicleModelEntity } from '../brands/entities';
import { ImageEntity, ListingEntity } from './entities';
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
  exports: [ListingsService],
})
export class ListingsModule {}
