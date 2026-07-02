import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  AuthenticatedRequest,
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListListingsQueryDto } from './dto/list-listings-query.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingsService } from './listings.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  list(@Query() query: ListListingsQueryDto) {
    return this.listingsService.list(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findPublished(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createListingDto: CreateListingDto,
  ) {
    return this.listingsService.create(request.user.id, createListingDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() updateListingDto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, request.user.id, updateListingDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.listingsService.remove(id, request.user.id);
  }
}
