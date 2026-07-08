import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ListingEntity } from '../listings/entities';
import { ListingsModule } from '../listings/listings.module';
import { UserEntity } from '../users/entities';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';

@Module({
  controllers: [SellersController],
  imports: [
    TypeOrmModule.forFeature([ListingEntity, UserEntity]),
    ListingsModule,
  ],
  providers: [SellersService],
})
export class SellersModule {}
