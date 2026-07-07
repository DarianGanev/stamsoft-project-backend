import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BrandEntity, VehicleModelEntity } from './entities';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';

@Module({
  imports: [TypeOrmModule.forFeature([BrandEntity, VehicleModelEntity])],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
