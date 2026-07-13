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

import { JwtAuthGuard } from '../auth/guards';
import { AuthenticatedRequest } from '../auth/types';
import { ListListingsQueryDto } from '../listings/dto';
import { ListingsService } from '../listings/listings.service';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from './dto';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly usersService: UsersService,
    private readonly listingsService: ListingsService,
  ) {}

  @Get()
  getMe(@Req() request: AuthenticatedRequest) {
    return this.usersService.getProfile(request.user.id);
  }

  @Patch()
  updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(request.user.id, updateProfileDto);
  }

  @Get('listings')
  listMyListings(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListListingsQueryDto,
  ) {
    return this.listingsService.listMine(request.user.id, query);
  }

  @Get('listings/:id')
  findMyListing(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.listingsService.findMine(id, request.user.id);
  }
}
