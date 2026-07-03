import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { databaseEntities } from './typeorm.options';
import { CreateUsers1782980000001 } from './migrations/1782980000001-create-users';
import { CreateMarketplaceTables1782980000002 } from './migrations/1782980000002-create-marketplace-tables';
import { AddListingMvpFields1782980000003 } from './migrations/1782980000003-add-listing-mvp-fields';
import { AddListingImagePrimary1782980000004 } from './migrations/1782980000004-add-listing-image-primary';
import { SeedVehicleBrandsAndModels1782980000005 } from './migrations/1782980000005-seed-vehicle-brands-and-models';
import { AddListingSearchIndexes1782980000006 } from './migrations/1782980000006-add-listing-search-indexes';
import { AddListingEngineFieldsAndEurDefault1782980000007 } from './migrations/1782980000007-add-listing-engine-fields-and-eur-default';

config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required.');
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: databaseEntities,
  migrations: [
    CreateUsers1782980000001,
    CreateMarketplaceTables1782980000002,
    AddListingMvpFields1782980000003,
    AddListingImagePrimary1782980000004,
    SeedVehicleBrandsAndModels1782980000005,
    AddListingSearchIndexes1782980000006,
    AddListingEngineFieldsAndEurDefault1782980000007,
  ],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
