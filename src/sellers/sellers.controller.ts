import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';

import { ListSellerListingsQueryDto } from './dto';
import { SellersService } from './sellers.service';

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get(':userId')
  findPublicSeller(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.sellersService.findPublicSeller(userId);
  }

  @Get(':userId/listings')
  listPublishedListings(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: ListSellerListingsQueryDto,
  ) {
    return this.sellersService.listPublishedListings(userId, query);
  }
}
