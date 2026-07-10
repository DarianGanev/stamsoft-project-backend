import { Controller, Get } from '@nestjs/common';

import { ListingFeaturesService } from './listing-features.service';

@Controller('listing-features')
export class ListingFeaturesController {
  constructor(
    private readonly listingFeaturesService: ListingFeaturesService,
  ) {}

  @Get()
  list() {
    return this.listingFeaturesService.listGrouped();
  }
}
