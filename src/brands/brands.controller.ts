import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { BrandsService } from './brands.service';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  listBrands() {
    return this.brandsService.listBrands();
  }

  @Get(':brandId/models')
  listModels(@Param('brandId', ParseUUIDPipe) brandId: string) {
    return this.brandsService.listModels(brandId);
  }
}
