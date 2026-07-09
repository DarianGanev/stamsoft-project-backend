import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard, JwtAuthGuard } from '../auth/guards';
import { AuthenticatedRequest } from '../auth/types';
import { ListingsService } from '../listings/listings.service';
import { ListAdminListingsQueryDto, ModerateListingDto } from './dto';

@Controller('admin/listings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  list(@Query() query: ListAdminListingsQueryDto) {
    return this.listingsService.listForModeration(query);
  }

  @Patch(':id/moderation')
  moderate(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() moderateListingDto: ModerateListingDto,
  ) {
    return this.listingsService.moderate(
      id,
      request.user.id,
      moderateListingDto.status,
    );
  }
}
