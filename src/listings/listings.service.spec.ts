import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { BrandEntity, VehicleModelEntity } from '../brands/entities';
import {
  ImageEntity,
  ListingEntity,
  ListingFeatureEntity,
  ListingFeatureSelectionEntity,
} from './entities';
import { ListingFeaturesService } from './listing-features.service';
import { ListingsService } from './listings.service';

class MockListingQueryBuilder {
  andWhere = jest.fn(() => this);
  getManyAndCount = jest.fn();
  getOne = jest.fn();
  innerJoinAndSelect = jest.fn(() => this);
  leftJoinAndSelect = jest.fn(() => this);
  orderBy = jest.fn(() => this);
  addOrderBy = jest.fn(() => this);
  skip = jest.fn(() => this);
  take = jest.fn(() => this);
  where = jest.fn(() => this);
}

describe('ListingsService', () => {
  function createService(queryBuilder = new MockListingQueryBuilder()) {
    const listingsRepository = {
      create: jest.fn((input: Partial<ListingEntity>) => input),
      createQueryBuilder: jest.fn(() => queryBuilder),
      delete: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    const transactionManager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === ListingEntity) {
          return listingsRepository;
        }

        throw new Error('Unexpected transaction repository.');
      }),
    };
    const dataSource = {
      transaction: jest.fn(
        async (
          callback: (manager: typeof transactionManager) => Promise<unknown>,
        ) => callback(transactionManager),
      ),
    };
    const imagesRepository = {
      count: jest.fn(),
      create: jest.fn((input: Partial<ImageEntity>) => input),
      save: jest.fn(),
      update: jest.fn(),
    };
    const brandsRepository = {
      exists: jest.fn(),
    };
    const modelsRepository = {
      exists: jest.fn(),
    };
    const imageStorageService = {
      save: jest.fn(),
    };
    const listingFeaturesService = {
      syncListingFeatures: jest.fn(),
    };

    return {
      brandsRepository,
      dataSource,
      imagesRepository,
      imageStorageService,
      listingFeaturesService,
      listingsRepository,
      modelsRepository,
      queryBuilder,
      service: new ListingsService(
        listingsRepository as never,
        imagesRepository as never,
        brandsRepository as never,
        modelsRepository as never,
        imageStorageService as never,
        listingFeaturesService as unknown as ListingFeaturesService,
        dataSource as never,
      ),
    };
  }

  function listingEntity(
    overrides: Partial<ListingEntity> = {},
  ): ListingEntity {
    return {
      id: 'listing-1',
      userId: 'user-1',
      brandId: 'brand-1',
      modelId: 'model-1',
      title: 'BMW 320d',
      description: 'Clean car',
      year: 2020,
      mileageKm: 120000,
      powerHp: 190,
      engineLiters: '2.0',
      fuel: 'diesel',
      transmission: 'automatic',
      location: 'Sofia',
      contactName: 'Driver',
      contactPhone: '+359888123456',
      contactEmail: 'driver@example.com',
      price: '18000.00',
      currency: 'EUR',
      status: 'published',
      moderatedAt: null,
      moderatedById: null,
      createdAt: new Date('2026-07-01T10:00:00.000Z'),
      updatedAt: new Date('2026-07-02T10:00:00.000Z'),
      brand: { id: 'brand-1', name: 'BMW' } as BrandEntity,
      model: {
        id: 'model-1',
        brandId: 'brand-1',
        name: '320d',
      } as VehicleModelEntity,
      images: [
        {
          id: 'image-2',
          imageUrl: '/uploads/second.webp',
          altText: 'second',
          sortOrder: 0,
          isPrimary: false,
          createdAt: new Date('2026-07-01T10:01:00.000Z'),
        } as ImageEntity,
        {
          id: 'image-1',
          imageUrl: '/uploads/primary.webp',
          altText: 'primary',
          sortOrder: 1,
          isPrimary: true,
          createdAt: new Date('2026-07-01T10:02:00.000Z'),
        } as ImageEntity,
      ],
      featureSelections: [
        {
          id: 'selection-1',
          listingId: 'listing-1',
          featureId: 'feature-1',
          createdAt: new Date('2026-07-01T10:03:00.000Z'),
          feature: {
            id: 'feature-1',
            key: 'abs',
            category: 'safety',
            label: 'Антиблокираща система',
            sortOrder: 30,
          } as ListingFeatureEntity,
        } as ListingFeatureSelectionEntity,
      ],
      ...overrides,
    } as ListingEntity;
  }

  it('lists published listings with combined filters, search, pagination, and sort', async () => {
    const { queryBuilder, service } = createService();
    const listing = listingEntity();

    queryBuilder.getManyAndCount.mockResolvedValue([[listing], 1]);

    await expect(
      service.list({
        page: 2,
        limit: 10,
        brandId: 'brand-1',
        modelId: 'model-1',
        fuel: 'diesel',
        transmission: 'automatic',
        location: 'Sofia',
        minPrice: 10000,
        maxPrice: 20000,
        minYear: 2018,
        maxYear: 2024,
        maxMileage: 150000,
        search: 'BMW',
        sort: 'price-low',
      }),
    ).resolves.toEqual({
      data: [
        expect.objectContaining({
          brandName: 'BMW',
          engineLiters: 2,
          powerHp: 190,
          primaryImageUrl: '/uploads/primary.webp',
          price: 18000,
          features: [
            {
              id: 'feature-1',
              key: 'abs',
              category: 'safety',
              label: 'Антиблокираща система',
            },
          ],
        }),
      ],
      meta: { page: 2, limit: 10, total: 1 },
    });

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'listing.status = :status',
      { status: 'published' },
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(10);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'listing.brandId = :brandId',
      { brandId: 'brand-1' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'listing.mileageKm <= :maxMileage',
      { maxMileage: 150000 },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('listing.price', 'ASC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
      'listing.createdAt',
      'DESC',
    );
  });

  it('lists only listings owned by the authenticated user', async () => {
    const { queryBuilder, service } = createService();
    const listing = listingEntity({ status: 'draft' });

    queryBuilder.getManyAndCount.mockResolvedValue([[listing], 1]);

    await expect(
      service.listMine('user-1', {
        page: 1,
        limit: 5,
        sort: 'newest',
      }),
    ).resolves.toEqual({
      data: [
        expect.objectContaining({
          id: 'listing-1',
          status: 'draft',
          userId: 'user-1',
        }),
      ],
      meta: { page: 1, limit: 5, total: 1 },
    });

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'listing.userId = :userId',
      { userId: 'user-1' },
    );
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
  });

  it('creates a listing only when brand and model pair is valid', async () => {
    const {
      brandsRepository,
      dataSource,
      listingFeaturesService,
      listingsRepository,
      modelsRepository,
      queryBuilder,
      service,
    } = createService();
    const listing = listingEntity();

    brandsRepository.exists.mockResolvedValue(true);
    modelsRepository.exists.mockResolvedValue(true);
    listingsRepository.save.mockResolvedValue({ id: 'listing-1' });
    queryBuilder.getOne.mockResolvedValue(listing);

    await expect(
      service.create('user-1', {
        brandId: 'brand-1',
        modelId: 'model-1',
        title: 'BMW 320d',
        year: 2020,
        mileageKm: 120000,
        powerHp: 190,
        engineLiters: 2,
        fuel: 'diesel',
        transmission: 'automatic',
        location: 'Sofia',
        price: 18000,
        featureKeys: ['abs', 'parking_sensors'],
      }),
    ).resolves.toMatchObject({
      id: 'listing-1',
      engineLiters: 2,
      powerHp: 190,
    });

    expect(brandsRepository.exists).toHaveBeenCalledWith({
      where: { id: 'brand-1' },
    });
    expect(modelsRepository.exists).toHaveBeenCalledWith({
      where: { brandId: 'brand-1', id: 'model-1' },
    });
    expect(listingsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: 'EUR',
        engineLiters: '2',
        powerHp: 190,
        status: 'pending',
      }),
    );
    expect(listingFeaturesService.syncListingFeatures).toHaveBeenCalledWith(
      'listing-1',
      ['abs', 'parking_sensors'],
      expect.anything(),
    );
    expect(dataSource.transaction).toHaveBeenCalled();
  });

  it('lists pending listings for admin moderation by default', async () => {
    const { queryBuilder, service } = createService();
    const listing = listingEntity({ status: 'pending' });

    queryBuilder.getManyAndCount.mockResolvedValue([[listing], 1]);

    await expect(service.listForModeration({})).resolves.toEqual({
      data: [
        expect.objectContaining({
          id: 'listing-1',
          status: 'pending',
        }),
      ],
      meta: { page: 1, limit: 20, total: 1 },
    });

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'listing.status = :status',
      { status: 'pending' },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'listing.createdAt',
      'DESC',
    );
  });

  it('moderates a listing with admin id and timestamp', async () => {
    const { listingsRepository, queryBuilder, service } = createService();

    listingsRepository.findOne.mockResolvedValue(
      listingEntity({ status: 'pending' }),
    );
    queryBuilder.getOne.mockResolvedValue(
      listingEntity({
        moderatedAt: new Date('2026-07-06T10:00:00.000Z'),
        moderatedById: 'admin-1',
        status: 'rejected',
      }),
    );

    await expect(
      service.moderate('listing-1', 'admin-1', 'rejected'),
    ).resolves.toMatchObject({
      id: 'listing-1',
      moderatedAt: '2026-07-06T10:00:00.000Z',
      moderatedById: 'admin-1',
      status: 'rejected',
    });

    const updateCalls = listingsRepository.update.mock.calls as [
      string,
      Partial<ListingEntity>,
    ][];
    const [, updatePayload] = updateCalls[0];

    expect(updatePayload.moderatedAt).toBeInstanceOf(Date);
    expect(updatePayload).toMatchObject({
      moderatedById: 'admin-1',
      status: 'rejected',
    });
  });

  it('rejects create when selected model does not belong to selected brand', async () => {
    const { brandsRepository, modelsRepository, service } = createService();

    brandsRepository.exists.mockResolvedValue(true);
    modelsRepository.exists.mockResolvedValue(false);

    await expect(
      service.create('user-1', {
        brandId: 'brand-1',
        modelId: 'model-2',
        title: 'BMW 320d',
        price: 18000,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updates only provided fields and validates changed brand/model pair', async () => {
    const {
      brandsRepository,
      dataSource,
      listingFeaturesService,
      listingsRepository,
      modelsRepository,
      queryBuilder,
      service,
    } = createService();

    listingsRepository.findOne.mockResolvedValue(listingEntity());
    brandsRepository.exists.mockResolvedValue(true);
    modelsRepository.exists.mockResolvedValue(true);
    queryBuilder.getOne.mockResolvedValue(
      listingEntity({
        modelId: 'model-2',
        title: 'Updated title',
      }),
    );

    await expect(
      service.update('listing-1', 'user-1', {
        modelId: 'model-2',
        title: 'Updated title',
        engineLiters: 3,
        featureKeys: ['leather_interior'],
      }),
    ).resolves.toMatchObject({
      modelId: 'model-2',
      title: 'Updated title',
    });

    expect(modelsRepository.exists).toHaveBeenCalledWith({
      where: { brandId: 'brand-1', id: 'model-2' },
    });
    expect(listingsRepository.update).toHaveBeenCalledWith('listing-1', {
      modelId: 'model-2',
      title: 'Updated title',
      engineLiters: '3',
    });
    expect(listingFeaturesService.syncListingFeatures).toHaveBeenCalledWith(
      'listing-1',
      ['leather_interior'],
      expect.anything(),
    );
    expect(dataSource.transaction).toHaveBeenCalled();
  });

  it('blocks users from modifying listings they do not own', async () => {
    const { listingsRepository, service } = createService();

    listingsRepository.findOne.mockResolvedValue(
      listingEntity({ userId: 'owner-id' }),
    );

    await expect(service.remove('listing-1', 'other-user')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws not found for missing published listing', async () => {
    const { queryBuilder, service } = createService();

    queryBuilder.getOne.mockResolvedValue(null);

    await expect(service.findPublished('listing-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('uploads images and marks first image as primary when listing has no images', async () => {
    const {
      imagesRepository,
      imageStorageService,
      listingsRepository,
      queryBuilder,
      service,
    } = createService();
    const file = {
      mimetype: 'image/webp',
      originalname: 'car.webp',
      size: 1024,
    } as Express.Multer.File;

    listingsRepository.findOne.mockResolvedValue(listingEntity());
    imagesRepository.count.mockResolvedValue(0);
    imageStorageService.save.mockResolvedValue('/uploads/car.webp');
    queryBuilder.getOne.mockResolvedValue(listingEntity());

    await service.uploadImages('listing-1', 'user-1', [file], {});

    expect(imagesRepository.update).toHaveBeenCalledWith(
      { listingId: 'listing-1' },
      { isPrimary: false },
    );
    expect(imagesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        altText: 'car.webp',
        imageUrl: '/uploads/car.webp',
        isPrimary: true,
        listingId: 'listing-1',
      }),
    );
  });

  it('rejects unsupported image files', async () => {
    const { listingsRepository, service } = createService();

    listingsRepository.findOne.mockResolvedValue(listingEntity());

    await expect(
      service.uploadImages(
        'listing-1',
        'user-1',
        [
          {
            mimetype: 'image/gif',
            originalname: 'car.gif',
            size: 1024,
          } as Express.Multer.File,
        ],
        {},
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
