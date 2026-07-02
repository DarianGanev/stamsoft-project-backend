import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ListingsController],
  providers: [ListingsService],
})
export class ListingsModule {}
