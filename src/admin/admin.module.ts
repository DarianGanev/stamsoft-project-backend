import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ListingsModule } from '../listings/listings.module';
import { AdminListingsController } from './admin-listings.controller';

@Module({
  imports: [AuthModule, ListingsModule],
  controllers: [AdminListingsController],
})
export class AdminModule {}
