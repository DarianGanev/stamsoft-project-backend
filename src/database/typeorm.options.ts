import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { databaseEntities } from './constants';

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
