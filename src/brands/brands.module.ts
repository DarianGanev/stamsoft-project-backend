import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BrandEntity } from './brand.entity';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { VehicleModelEntity } from './vehicle-model.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BrandEntity, VehicleModelEntity])],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
