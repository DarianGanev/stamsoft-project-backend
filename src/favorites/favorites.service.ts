import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ListFavoritesQueryDto } from './dto';
import { ListingEntity } from '../listings/entities';
import { ListingsService } from '../listings/listings.service';
import { FavoriteEntity } from './entities';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly favoritesRepository: Repository<FavoriteEntity>,
    @InjectRepository(ListingEntity)
    private readonly listingsRepository: Repository<ListingEntity>,
    private readonly listingsService: ListingsService,
  ) {}

  async list(userId: string, query: ListFavoritesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 6;
    const offset = (page - 1) * limit;
    const queryBuilder = this.createFavoriteQuery(userId)
      .orderBy('favorite.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [favorites, total] = await queryBuilder.getManyAndCount();

    return {
      data: await this.listingsService.toListingResponses(
        favorites.map((favorite) => favorite.listing),
      ),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async save(userId: string, listingId: string) {
    await this.ensurePublishedListing(listingId);

    const existingFavorite = await this.favoritesRepository.findOne({
      where: { listingId, userId },
    });

    if (!existingFavorite) {
      try {
        await this.favoritesRepository.save(
          this.favoritesRepository.create({ listingId, userId }),
        );
      } catch (error) {
        if (!this.isUniqueFavoriteError(error)) {
          throw error;
        }
      }
    }

    return this.findFavoriteListing(userId, listingId);
  }

  async remove(userId: string, listingId: string): Promise<void> {
    await this.favoritesRepository.delete({ listingId, userId });
  }

  private createFavoriteQuery(userId: string) {
    return this.favoritesRepository
      .createQueryBuilder('favorite')
      .innerJoinAndSelect('favorite.listing', 'listing')
      .innerJoinAndSelect('listing.brand', 'brand')
      .innerJoinAndSelect('listing.model', 'model')
      .innerJoinAndSelect('listing.user', 'user')
      .leftJoinAndSelect('listing.images', 'image')
      .where('favorite.userId = :userId', { userId })
      .andWhere('listing.status = :status', { status: 'published' });
  }

  private async findFavoriteListing(userId: string, listingId: string) {
    const favorite = await this.createFavoriteQuery(userId)
      .andWhere('favorite.listingId = :listingId', { listingId })
      .getOne();

    if (!favorite) {
      throw new NotFoundException('Favorite listing not found.');
    }

    return this.listingsService.toListingResponse(favorite.listing);
  }

  private async ensurePublishedListing(listingId: string): Promise<void> {
    const listing = await this.listingsRepository.findOne({
      where: { id: listingId, status: 'published' },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found.');
    }
  }

  private isUniqueFavoriteError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
