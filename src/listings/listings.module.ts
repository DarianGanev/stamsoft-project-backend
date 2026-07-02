import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { LocalImageStorageService } from './local-image-storage.service';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ListingsController],
  providers: [ListingsService, LocalImageStorageService],
})
export class ListingsModule {}
