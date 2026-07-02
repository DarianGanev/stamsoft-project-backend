import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { BrandEntity } from '../brands/brand.entity';
import { VehicleModelEntity } from '../brands/vehicle-model.entity';
import { ImageEntity } from '../listings/image.entity';
import { ListingEntity } from '../listings/listing.entity';
import { UserEntity } from '../users/user.entity';

export const databaseEntities = [
  UserEntity,
  BrandEntity,
  VehicleModelEntity,
  ListingEntity,
  ImageEntity,
];

export function createTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  return {
    type: 'postgres',
    url: databaseUrl,
    entities: databaseEntities,
    synchronize: false,
    ssl:
      configService.get<string>('DATABASE_SSL') === 'true'
        ? { rejectUnauthorized: false }
        : false,
  };
}
