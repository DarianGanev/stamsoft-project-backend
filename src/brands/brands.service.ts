import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Brand, VehicleModel } from './brand.types';
import { BrandEntity } from './brand.entity';
import { VehicleModelEntity } from './vehicle-model.entity';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(BrandEntity)
    private readonly brandsRepository: Repository<BrandEntity>,
    @InjectRepository(VehicleModelEntity)
    private readonly modelsRepository: Repository<VehicleModelEntity>,
  ) {}

  async listBrands(): Promise<Brand[]> {
    const brands = await this.brandsRepository.find({
      order: { name: 'ASC' },
    });

    return brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
    }));
  }

  async listModels(brandId: string): Promise<VehicleModel[]> {
    const models = await this.modelsRepository.find({
      order: { name: 'ASC' },
      where: { brandId },
    });

    return models.map((model) => ({
      id: model.id,
      brandId: model.brandId,
      name: model.name,
    }));
  }
}
