import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import {
  Brand,
  BrandRecord,
  VehicleModel,
  VehicleModelRecord,
} from './brand.types';

@Injectable()
export class BrandsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async listBrands(): Promise<Brand[]> {
    const result = await this.databaseService.query<BrandRecord>(
      `
        SELECT id, name
        FROM brands
        ORDER BY name ASC
      `,
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
    }));
  }

  async listModels(brandId: string): Promise<VehicleModel[]> {
    const result = await this.databaseService.query<VehicleModelRecord>(
      `
        SELECT id, brand_id, name
        FROM models
        WHERE brand_id = $1
        ORDER BY name ASC
      `,
      [brandId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      brandId: row.brand_id,
      name: row.name,
    }));
  }
}
