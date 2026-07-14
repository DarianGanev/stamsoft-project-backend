import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PUBLISHED_LISTING_STATUS } from '../listings/constants';
import { ListingEntity } from '../listings/entities';
import { ListingsService } from '../listings/listings.service';
import { UserEntity } from '../users/entities';
import { ListSellerListingsQueryDto } from './dto/list-seller-listings-query.dto';
import type {
  PublicSeller,
  SellerListingsResponse,
} from './types/seller.types';

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ListingEntity)
    private readonly listingsRepository: Repository<ListingEntity>,
    private readonly listingsService: ListingsService,
  ) {}

  async findPublicSeller(userId: string): Promise<PublicSeller> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Seller not found.');
    }

    const contactListing = await this.listingsRepository.findOne({
      order: { createdAt: 'DESC' },
      select: { contactPhone: true, id: true },
      where: {
        status: PUBLISHED_LISTING_STATUS,
        userId,
      },
    });

    if (!contactListing) {
      throw new NotFoundException('Seller not found.');
    }

    return {
      id: user.id,
      name: user.name,
      phone: contactListing.contactPhone,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async listPublishedListings(
    userId: string,
    query: ListSellerListingsQueryDto,
  ): Promise<SellerListingsResponse> {
    await this.ensureSellerExists(userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 6;
    const offset = (page - 1) * limit;
    const queryBuilder = this.listingsRepository
      .createQueryBuilder('listing')
      .innerJoinAndSelect('listing.brand', 'brand')
      .innerJoinAndSelect('listing.model', 'model')
      .innerJoinAndSelect('listing.user', 'user')
      .leftJoinAndSelect('listing.images', 'image')
      .where('listing.userId = :userId', { userId })
      .andWhere('listing.status = :status', {
        status: PUBLISHED_LISTING_STATUS,
      })
      .orderBy('listing.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [listings, total] = await queryBuilder.getManyAndCount();

    return {
      data: await this.listingsService.toListingResponses(listings),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  private async ensureSellerExists(userId: string): Promise<void> {
    const exists = await this.listingsRepository.exists({
      where: { status: PUBLISHED_LISTING_STATUS, userId },
    });

    if (!exists) {
      throw new NotFoundException('Seller not found.');
    }
  }
}
