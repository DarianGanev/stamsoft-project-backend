import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository, SelectQueryBuilder } from 'typeorm';

import { BrandEntity, VehicleModelEntity } from '../brands/entities';
import {
  CreateListingDto,
  ListListingsQueryDto,
  UpdateListingDto,
  UploadListingImagesDto,
} from './dto';
import { ImageEntity, ListingEntity } from './entities';
import {
  AdminListListingsInput,
  Listing,
  ListingImage,
  ListingModerationStatus,
  ListingSelectedFeature,
} from './types';
import { ListingFeaturesService } from './listing-features.service';
import { LocalImageStorageService } from './local-image-storage.service';
import {
  ALLOWED_IMAGE_TYPES,
  DEFAULT_LISTING_STATUS,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGES_PER_LISTING,
  MAX_IMAGES_PER_UPLOAD,
} from './constants';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(ListingEntity)
    private readonly listingsRepository: Repository<ListingEntity>,
    @InjectRepository(ImageEntity)
    private readonly imagesRepository: Repository<ImageEntity>,
    @InjectRepository(BrandEntity)
    private readonly brandsRepository: Repository<BrandEntity>,
    @InjectRepository(VehicleModelEntity)
    private readonly modelsRepository: Repository<VehicleModelEntity>,
    private readonly imageStorageService: LocalImageStorageService,
    private readonly listingFeaturesService: ListingFeaturesService,
    private readonly dataSource: DataSource,
  ) {}

  async list(query: ListListingsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const queryBuilder = this.createListingQuery()
      .where('listing.status = :status', { status: 'published' })
      .skip(offset)
      .take(limit);

    this.addFilter(
      queryBuilder,
      'listing.brandId = :brandId',
      'brandId',
      query.brandId,
    );
    this.addFilter(
      queryBuilder,
      'listing.modelId = :modelId',
      'modelId',
      query.modelId,
    );
    this.addFilter(queryBuilder, 'listing.fuel = :fuel', 'fuel', query.fuel);
    this.addFilter(
      queryBuilder,
      'listing.transmission = :transmission',
      'transmission',
      query.transmission,
    );
    this.addFilter(
      queryBuilder,
      'listing.location ILIKE :location',
      'location',
      query.location ? `%${query.location}%` : undefined,
    );
    this.addFilter(
      queryBuilder,
      'listing.price >= :minPrice',
      'minPrice',
      query.minPrice,
    );
    this.addFilter(
      queryBuilder,
      'listing.price <= :maxPrice',
      'maxPrice',
      query.maxPrice,
    );
    this.addFilter(
      queryBuilder,
      'listing.year >= :minYear',
      'minYear',
      query.minYear,
    );
    this.addFilter(
      queryBuilder,
      'listing.year <= :maxYear',
      'maxYear',
      query.maxYear,
    );
    this.addFilter(
      queryBuilder,
      'listing.mileageKm <= :maxMileage',
      'maxMileage',
      query.maxMileage,
    );
    this.addSearch(queryBuilder, query.search);
    this.applySort(queryBuilder, query.sort);

    const [listings, total] = await queryBuilder.getManyAndCount();

    return {
      data: listings.map((listing) => this.toListing(listing)),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async listMine(userId: string, query: ListListingsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const queryBuilder = this.createListingQuery()
      .where('listing.userId = :userId', { userId })
      .skip(offset)
      .take(limit);

    this.addFilter(
      queryBuilder,
      'listing.brandId = :brandId',
      'brandId',
      query.brandId,
    );
    this.addFilter(
      queryBuilder,
      'listing.modelId = :modelId',
      'modelId',
      query.modelId,
    );
    this.addFilter(queryBuilder, 'listing.fuel = :fuel', 'fuel', query.fuel);
    this.addFilter(
      queryBuilder,
      'listing.transmission = :transmission',
      'transmission',
      query.transmission,
    );
    this.addFilter(
      queryBuilder,
      'listing.location ILIKE :location',
      'location',
      query.location ? `%${query.location}%` : undefined,
    );
    this.addFilter(
      queryBuilder,
      'listing.price >= :minPrice',
      'minPrice',
      query.minPrice,
    );
    this.addFilter(
      queryBuilder,
      'listing.price <= :maxPrice',
      'maxPrice',
      query.maxPrice,
    );
    this.addFilter(
      queryBuilder,
      'listing.year >= :minYear',
      'minYear',
      query.minYear,
    );
    this.addFilter(
      queryBuilder,
      'listing.year <= :maxYear',
      'maxYear',
      query.maxYear,
    );
    this.addFilter(
      queryBuilder,
      'listing.mileageKm <= :maxMileage',
      'maxMileage',
      query.maxMileage,
    );
    this.addSearch(queryBuilder, query.search);
    this.applySort(queryBuilder, query.sort);

    const [listings, total] = await queryBuilder.getManyAndCount();

    return {
      data: listings.map((listing) => this.toListing(listing)),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async listForModeration(query: AdminListListingsInput) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const queryBuilder = this.createListingQuery()
      .where('listing.status = :status', { status: query.status ?? 'pending' })
      .skip(offset)
      .take(limit);

    this.applySort(queryBuilder, 'newest');

    const [listings, total] = await queryBuilder.getManyAndCount();

    return {
      data: listings.map((listing) => this.toListing(listing)),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async moderate(
    id: string,
    adminId: string,
    status: ListingModerationStatus,
  ): Promise<Listing> {
    const listing = await this.listingsRepository.findOne({ where: { id } });

    if (!listing) {
      throw new NotFoundException('Listing not found.');
    }

    await this.listingsRepository.update(id, {
      moderatedAt: new Date(),
      moderatedById: adminId,
      status,
    });

    return this.findAny(id);
  }

  async findPublished(id: string): Promise<Listing> {
    const listing = await this.createListingQuery()
      .where('listing.id = :id', { id })
      .andWhere('listing.status = :status', { status: 'published' })
      .getOne();

    if (!listing) {
      throw new NotFoundException('Listing not found.');
    }

    return this.toListing(listing);
  }

  async create(userId: string, input: CreateListingDto): Promise<Listing> {
    await this.validateBrandModelPair(input.brandId, input.modelId);

    const listingId = await this.dataSource.transaction(async (manager) => {
      const listingsRepository = manager.getRepository(ListingEntity);
      const listing = await listingsRepository.save(
        listingsRepository.create({
          userId,
          brandId: input.brandId,
          modelId: input.modelId,
          title: input.title,
          description: input.description ?? null,
          year: input.year ?? null,
          mileageKm: input.mileageKm ?? null,
          powerHp: input.powerHp ?? null,
          engineLiters:
            input.engineLiters === undefined
              ? null
              : String(input.engineLiters),
          fuel: input.fuel ?? null,
          transmission: input.transmission ?? null,
          location: input.location ?? null,
          contactName: input.contactName ?? null,
          contactPhone: input.contactPhone ?? null,
          contactEmail: input.contactEmail ?? null,
          price: String(input.price),
          currency: input.currency ?? 'EUR',
          status: DEFAULT_LISTING_STATUS,
        }),
      );

      if (input.featureKeys !== undefined) {
        await this.listingFeaturesService.syncListingFeatures(
          listing.id,
          input.featureKeys,
          manager,
        );
      }

      return listing.id;
    });

    return this.findOwned(listingId, userId);
  }

  async update(
    id: string,
    userId: string,
    input: UpdateListingDto,
  ): Promise<Listing> {
    const listing = await this.ensureOwner(id, userId);
    const brandId = input.brandId ?? listing.brandId;
    const modelId = input.modelId ?? listing.modelId;
    const updates = this.buildListingUpdates(input);

    if (input.brandId !== undefined || input.modelId !== undefined) {
      await this.validateBrandModelPair(brandId, modelId);
    }

    await this.dataSource.transaction(async (manager) => {
      const listingsRepository = manager.getRepository(ListingEntity);

      if (Object.keys(updates).length > 0) {
        await listingsRepository.update(id, updates);
      }

      if (input.featureKeys !== undefined) {
        await this.listingFeaturesService.syncListingFeatures(
          id,
          input.featureKeys,
          manager,
        );
      }
    });

    return this.findOwned(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.ensureOwner(id, userId);
    await this.listingsRepository.delete(id);
  }

  async uploadImages(
    listingId: string,
    userId: string,
    files: Express.Multer.File[],
    options: UploadListingImagesDto,
  ): Promise<Listing> {
    await this.ensureOwner(listingId, userId);
    this.validateFiles(files);

    const existingCount = await this.imagesRepository.count({
      where: { listingId },
    });

    if (existingCount + files.length > MAX_IMAGES_PER_LISTING) {
      throw new BadRequestException(
        `A listing can have up to ${MAX_IMAGES_PER_LISTING} images.`,
      );
    }

    const shouldSetPrimary =
      options.firstImageIsPrimary === true || existingCount === 0;

    if (shouldSetPrimary) {
      await this.imagesRepository.update({ listingId }, { isPrimary: false });
    }

    for (const [index, file] of files.entries()) {
      const imageUrl = await this.imageStorageService.save(file);

      await this.imagesRepository.save(
        this.imagesRepository.create({
          listingId,
          imageUrl,
          altText: file.originalname,
          sortOrder: existingCount + index,
          isPrimary: shouldSetPrimary && index === 0,
        }),
      );
    }

    return this.findOwned(listingId, userId);
  }

  private async findOwned(id: string, userId: string): Promise<Listing> {
    const listing = await this.createListingQuery()
      .where('listing.id = :id', { id })
      .andWhere('listing.userId = :userId', { userId })
      .getOne();

    if (!listing) {
      throw new NotFoundException('Listing not found.');
    }

    return this.toListing(listing);
  }

  private async findAny(id: string): Promise<Listing> {
    const listing = await this.createListingQuery()
      .where('listing.id = :id', { id })
      .getOne();

    if (!listing) {
      throw new NotFoundException('Listing not found.');
    }

    return this.toListing(listing);
  }

  private async ensureOwner(
    id: string,
    userId: string,
  ): Promise<ListingEntity> {
    const listing = await this.listingsRepository.findOne({ where: { id } });

    if (!listing) {
      throw new NotFoundException('Listing not found.');
    }

    if (listing.userId !== userId) {
      throw new ForbiddenException('You can only modify your own listings.');
    }

    return listing;
  }

  private async validateBrandModelPair(brandId: string, modelId: string) {
    const brandExists = await this.brandsRepository.exists({
      where: { id: brandId },
    });

    if (!brandExists) {
      throw new BadRequestException('Selected brand does not exist.');
    }

    const modelExists = await this.modelsRepository.exists({
      where: { brandId, id: modelId },
    });

    if (!modelExists) {
      throw new BadRequestException(
        'Selected model does not exist for the selected brand.',
      );
    }
  }

  private createListingQuery(): SelectQueryBuilder<ListingEntity> {
    return this.listingsRepository
      .createQueryBuilder('listing')
      .innerJoinAndSelect('listing.brand', 'brand')
      .innerJoinAndSelect('listing.model', 'model')
      .innerJoinAndSelect('listing.user', 'user')
      .leftJoinAndSelect('listing.images', 'image')
      .leftJoinAndSelect('listing.featureSelections', 'featureSelection')
      .leftJoinAndSelect('featureSelection.feature', 'feature');
  }

  private addFilter(
    queryBuilder: SelectQueryBuilder<ListingEntity>,
    expression: string,
    key: string,
    value: string | number | undefined | null,
  ) {
    if (value === undefined || value === null || value === '') {
      return;
    }

    queryBuilder.andWhere(expression, { [key]: value });
  }

  private addSearch(
    queryBuilder: SelectQueryBuilder<ListingEntity>,
    search: string | undefined,
  ) {
    const searchValue = search?.trim();

    if (!searchValue) {
      return;
    }

    queryBuilder.andWhere(
      new Brackets((builder) => {
        builder
          .where('listing.title ILIKE :search', {
            search: `%${searchValue}%`,
          })
          .orWhere('listing.description ILIKE :search')
          .orWhere('brand.name ILIKE :search')
          .orWhere('model.name ILIKE :search')
          .orWhere('listing.location ILIKE :search');
      }),
    );
  }

  private applySort(
    queryBuilder: SelectQueryBuilder<ListingEntity>,
    sort: ListListingsQueryDto['sort'],
  ) {
    if (sort === 'price-low' || sort === 'price_asc') {
      queryBuilder
        .orderBy('listing.price', 'ASC')
        .addOrderBy('listing.createdAt', 'DESC');
      return;
    }

    if (sort === 'price-high' || sort === 'price_desc') {
      queryBuilder
        .orderBy('listing.price', 'DESC')
        .addOrderBy('listing.createdAt', 'DESC');
      return;
    }

    queryBuilder.orderBy('listing.createdAt', 'DESC');
  }

  private buildListingUpdates(input: UpdateListingDto): Partial<ListingEntity> {
    const updates: Partial<ListingEntity> = {};

    this.addUpdate(updates, 'brandId', input.brandId);
    this.addUpdate(updates, 'modelId', input.modelId);
    this.addUpdate(updates, 'title', input.title);
    this.addUpdate(updates, 'description', input.description);
    this.addUpdate(updates, 'year', input.year);
    this.addUpdate(updates, 'mileageKm', input.mileageKm);
    this.addUpdate(updates, 'powerHp', input.powerHp);
    this.addUpdate(
      updates,
      'engineLiters',
      input.engineLiters === undefined ? undefined : String(input.engineLiters),
    );
    this.addUpdate(updates, 'fuel', input.fuel);
    this.addUpdate(updates, 'transmission', input.transmission);
    this.addUpdate(updates, 'location', input.location);
    this.addUpdate(updates, 'contactName', input.contactName);
    this.addUpdate(updates, 'contactPhone', input.contactPhone);
    this.addUpdate(updates, 'contactEmail', input.contactEmail);
    this.addUpdate(
      updates,
      'price',
      input.price === undefined ? undefined : String(input.price),
    );
    this.addUpdate(updates, 'currency', input.currency);
    return updates;
  }

  private addUpdate<K extends keyof ListingEntity>(
    updates: Partial<ListingEntity>,
    key: K,
    value: ListingEntity[K] | undefined,
  ) {
    if (value === undefined) {
      return;
    }

    updates[key] = value;
  }

  private toListing(listing: ListingEntity): Listing {
    const images = this.sortImages(listing.images ?? []);

    return {
      id: listing.id,
      userId: listing.userId,
      brandId: listing.brandId,
      brandName: listing.brand.name,
      modelId: listing.modelId,
      modelName: listing.model.name,
      title: listing.title,
      description: listing.description,
      year: listing.year,
      mileageKm: listing.mileageKm,
      powerHp: listing.powerHp,
      engineLiters:
        listing.engineLiters === null ? null : Number(listing.engineLiters),
      fuel: listing.fuel,
      transmission: listing.transmission,
      location: listing.location,
      contactName: listing.contactName,
      contactPhone: listing.contactPhone,
      contactEmail: listing.contactEmail,
      sellerCreatedAt: listing.user?.createdAt?.toISOString() ?? null,
      price: Number(listing.price),
      currency: listing.currency,
      status: listing.status,
      moderatedAt: listing.moderatedAt?.toISOString() ?? null,
      moderatedById: listing.moderatedById,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
      images: images.map((image) => this.toListingImage(image)),
      primaryImageUrl: images[0]?.imageUrl ?? null,
      features: this.toListingFeatures(listing),
    };
  }

  private toListingFeatures(listing: ListingEntity): ListingSelectedFeature[] {
    const selections = listing.featureSelections ?? [];

    return selections
      .filter((selection) => selection.feature)
      .sort(
        (first, second) => first.feature.sortOrder - second.feature.sortOrder,
      )
      .map((selection) => ({
        id: selection.feature.id,
        key: selection.feature.key,
        category: selection.feature.category,
        label: selection.feature.label,
      }));
  }

  private toListingImage(image: ImageEntity): ListingImage {
    return {
      id: image.id,
      url: image.imageUrl,
      altText: image.altText,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    };
  }

  private sortImages(images: ImageEntity[]): ImageEntity[] {
    return [...images].sort((first, second) => {
      if (first.isPrimary !== second.isPrimary) {
        return first.isPrimary ? -1 : 1;
      }

      if (first.sortOrder !== second.sortOrder) {
        return first.sortOrder - second.sortOrder;
      }

      return first.createdAt.getTime() - second.createdAt.getTime();
    });
  }

  private validateFiles(files: Express.Multer.File[]) {
    if (!files.length) {
      throw new BadRequestException('At least one image is required.');
    }

    if (files.length > MAX_IMAGES_PER_UPLOAD) {
      throw new BadRequestException(
        `Upload up to ${MAX_IMAGES_PER_UPLOAD} images at once.`,
      );
    }

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          'Only JPEG, PNG, and WEBP images are allowed.',
        );
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        throw new BadRequestException('Each image must be 5MB or smaller.');
      }
    }
  }
}
