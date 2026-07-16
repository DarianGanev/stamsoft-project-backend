import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards';
import { AuthenticatedRequest } from '../auth/types';
import { ListFavoritesQueryDto } from './dto';
import { FavoritesService } from './favorites.service';

@Controller('me/favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListFavoritesQueryDto,
  ) {
    return this.favoritesService.list(request.user.id, query);
  }

  @Post(':listingId')
  @HttpCode(200)
  save(
    @Req() request: AuthenticatedRequest,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    return this.favoritesService.save(request.user.id, listingId);
  }

  @Delete(':listingId')
  @HttpCode(204)
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('listingId', ParseUUIDPipe) listingId: string,
  ) {
    return this.favoritesService.remove(request.user.id, listingId);
  }
}
