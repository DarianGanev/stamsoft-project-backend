import {
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { BrandEntity, VehicleModelEntity } from '../brands/entities';
import { NotificationsService } from '../notifications/notifications.service';
import { UserEntity } from '../users/entities';
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
  getMany = jest.fn();
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
      findOne: jest.fn(),
    };
    const modelsRepository = {
      exists: jest.fn(),
      findOne: jest.fn(),
    };
    const imageStorageService = {
      save: jest.fn(),
    };
    const populateListingFeatures = jest.fn();
    const listingFeaturesService = {
      populateListingFeatures,
      syncListingFeatures: jest.fn(),
    };
    const notificationsService = {
      createForListingChange: jest.fn(),
    };

    return {
      brandsRepository,
      dataSource,
      imagesRepository,
      imageStorageService,
      listingFeaturesService,
      populateListingFeatures,
      listingsRepository,
      modelsRepository,
      notificationsService,
      queryBuilder,
      service: new ListingsService(
        listingsRepository as never,
        imagesRepository as never,
        brandsRepository as never,
        modelsRepository as never,
        imageStorageService as never,
        listingFeaturesService as unknown as ListingFeaturesService,
        dataSource as never,
        notificationsService as unknown as NotificationsService,
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
      bodyType: 'sedan',
      condition: 'used',
      description: 'Clean car',
      year: 2020,
      mileageKm: 120000,
      powerHp: 190,
      engineLiters: '2.0',
      emissionStandard: 'euro_6d',
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
      user: {
        id: 'user-1',
        name: 'Driver Person',
        createdAt: new Date('2025-01-10T10:00:00.000Z'),
      } as UserEntity,
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
    const { populateListingFeatures, queryBuilder, service } = createService();
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
          bodyType: 'sedan',
          brandName: 'BMW',
          condition: 'used',
          engineLiters: 2,
          emissionStandard: 'euro_6d',
          powerHp: 190,
          primaryImageUrl: '/uploads/primary.webp',
          price: 18000,
          sellerCreatedAt: '2025-01-10T10:00:00.000Z',
          sellerName: 'Driver Person',
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
    expect(queryBuilder.innerJoinAndSelect).toHaveBeenCalledWith(
      'listing.user',
      'user',
    );
    expect(populateListingFeatures).toHaveBeenCalledWith([listing]);
  });

  it('returns compact published recommendation candidates with combined filters', async () => {
    const { populateListingFeatures, queryBuilder, service } = createService();
    const listing = listingEntity();

    queryBuilder.getMany.mockResolvedValue([listing]);

    const result = await service.findRecommendationCandidates({
      bodyTypes: ['sedan', 'sedan'],
      budgetCurrency: 'BGN',
      fuels: ['diesel', 'hybrid'],
      location: ' Sofia ',
      maxMileage: 150000,
      maxPrice: 39116.6,
      minPrice: 19558.3,
      minYear: 2018,
      transmissions: ['automatic'],
    });

    expect(result).toEqual([
      {
        id: 'listing-1',
        title: 'BMW 320d',
        brandName: 'BMW',
        modelName: '320d',
        bodyType: 'sedan',
        condition: 'used',
        year: 2020,
        mileageKm: 120000,
        powerHp: 190,
        engineLiters: 2,
        emissionStandard: 'euro_6d',
        fuel: 'diesel',
        transmission: 'automatic',
        location: 'Sofia',
        price: 18000,
        currency: 'EUR',
        features: [
          {
            category: 'safety',
            key: 'abs',
            label: 'Антиблокираща система',
          },
        ],
      },
    ]);
    expect(result[0]).not.toHaveProperty('contactEmail');
    expect(result[0]).not.toHaveProperty('contactPhone');
    expect(result[0]).not.toHaveProperty('sellerName');
    expect(result[0]).not.toHaveProperty('userId');
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'listing.status = :status',
      { status: 'published' },
    );
    expect(queryBuilder.innerJoinAndSelect).toHaveBeenCalledWith(
      'listing.brand',
      'brand',
    );
    expect(queryBuilder.innerJoinAndSelect).toHaveBeenCalledWith(
      'listing.model',
      'model',
    );
    expect(queryBuilder.innerJoinAndSelect).not.toHaveBeenCalledWith(
      'listing.user',
      'user',
    );
    expect(queryBuilder.leftJoinAndSelect).not.toHaveBeenCalled();
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "CASE WHEN listing.currency = 'BGN' THEN listing.price / 1.95583 ELSE listing.price END >= :minPriceEur",
      { minPriceEur: 10000 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "CASE WHEN listing.currency = 'BGN' THEN listing.price / 1.95583 ELSE listing.price END <= :maxPriceEur",
      { maxPriceEur: 20000 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'listing.year >= :minYear',
      { minYear: 2018 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'listing.mileageKm <= :maxMileage',
      { maxMileage: 150000 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'listing.location ILIKE :location',
      { location: '%Sofia%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'listing.fuel IN (:...fuels)',
      { fuels: ['diesel', 'hybrid'] },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'listing.transmission IN (:...transmissions)',
      { transmissions: ['automatic'] },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'listing.bodyType IN (:...bodyTypes)',
      { bodyTypes: ['sedan'] },
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'listing.createdAt',
      'DESC',
    );
    expect(queryBuilder.take).toHaveBeenCalledWith(25);
    expect(populateListingFeatures).toHaveBeenCalledWith([listing]);
  });

  it('ignores empty optional recommendation filters', async () => {
    const { populateListingFeatures, queryBuilder, service } = createService();

    queryBuilder.getMany.mockResolvedValue([]);

    await expect(
      service.findRecommendationCandidates({
        bodyTypes: [],
        fuels: [],
        location: '   ',
        transmissions: [],
      }),
    ).resolves.toEqual([]);

    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(populateListingFeatures).toHaveBeenCalledWith([]);
  });

  it.each([
    { minPrice: -1 },
    { maxPrice: -1 },
    { maxMileage: -1 },
    { minYear: 1885 },
    { minYear: 2101 },
    { minYear: 2020.5 },
    { minPrice: 20000, maxPrice: 10000 },
    { minPrice: Number.NaN },
    { budgetCurrency: 'USD' as never },
  ])('rejects invalid recommendation criteria: %p', async (input) => {
    const { listingsRepository, service } = createService();

    await expect(service.findRecommendationCandidates(input)).rejects.toThrow(
      new BadRequestException('Invalid recommendation criteria.'),
    );
    expect(listingsRepository.createQueryBuilder).not.toHaveBeenCalled();
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
        bodyType: 'sedan',
        condition: 'used',
        year: 2020,
        mileageKm: 120000,
        powerHp: 190,
        engineLiters: 2,
        emissionStandard: 'euro_6d',
        fuel: 'diesel',
        transmission: 'automatic',
        location: 'Sofia',
        price: 18000,
        featureKeys: ['abs', 'parking_sensors'],
      }),
    ).resolves.toMatchObject({
      id: 'listing-1',
      bodyType: 'sedan',
      condition: 'used',
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
        bodyType: 'sedan',
        condition: 'used',
        engineLiters: '2',
        emissionStandard: 'euro_6d',
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

  it('does not notify favorite users for an equivalent update', async () => {
    const { listingsRepository, notificationsService, queryBuilder, service } =
      createService();
    listingsRepository.findOne.mockResolvedValue(listingEntity());
    queryBuilder.getOne.mockResolvedValue(listingEntity());

    await service.update('listing-1', 'user-1', {
      price: 18000,
      engineLiters: 2,
      featureKeys: ['abs'],
    });

    expect(notificationsService.createForListingChange).not.toHaveBeenCalled();
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
      notificationsService,
      queryBuilder,
      service,
    } = createService();

    listingsRepository.findOne.mockResolvedValue(listingEntity());
    brandsRepository.exists.mockResolvedValue(true);
    modelsRepository.exists.mockResolvedValue(true);
    modelsRepository.findOne.mockResolvedValue({ name: 'M3' });
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
        bodyType: null,
        condition: 'new',
        engineLiters: 3,
        emissionStandard: 'euro_6',
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
      bodyType: null,
      condition: 'new',
      engineLiters: '3',
      emissionStandard: 'euro_6',
    });
    expect(listingFeaturesService.syncListingFeatures).toHaveBeenCalledWith(
      'listing-1',
      ['leather_interior'],
      expect.anything(),
    );
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(notificationsService.createForListingChange).toHaveBeenCalledWith(
      {
        changes: [
          { field: 'model', oldValue: '320d', newValue: 'M3' },
          {
            field: 'title',
            oldValue: 'BMW 320d',
            newValue: 'Updated title',
          },
          { field: 'bodyType', oldValue: 'sedan', newValue: null },
          { field: 'condition', oldValue: 'used', newValue: 'new' },
          { field: 'engineLiters', oldValue: 2, newValue: 3 },
          {
            field: 'emissionStandard',
            oldValue: 'euro_6d',
            newValue: 'euro_6',
          },
          {
            field: 'features',
            oldValue: 'abs',
            newValue: 'leather_interior',
          },
        ],
        listingId: 'listing-1',
        listingImageUrl: '/uploads/primary.webp',
        listingOwnerId: 'user-1',
        listingTitle: 'Updated title',
        type: 'listing_changed',
      },
      expect.anything(),
    );
  });

  it('returns a listing only when it belongs to the authenticated user', async () => {
    const { populateListingFeatures, queryBuilder, service } = createService();
    const listing = listingEntity({ status: 'draft' });

    queryBuilder.getOne.mockResolvedValue(listing);

    await expect(
      service.findMine('listing-1', 'user-1'),
    ).resolves.toMatchObject({
      bodyType: 'sedan',
      condition: 'used',
      features: [
        {
          category: 'safety',
          id: 'feature-1',
          key: 'abs',
          label: 'Антиблокираща система',
        },
      ],
      id: 'listing-1',
      images: [
        {
          id: 'image-1',
          isPrimary: true,
          url: '/uploads/primary.webp',
        },
        {
          id: 'image-2',
          isPrimary: false,
          url: '/uploads/second.webp',
        },
      ],
      sellerName: 'Driver Person',
      status: 'draft',
      userId: 'user-1',
    });
    expect(queryBuilder.where).toHaveBeenCalledWith('listing.id = :id', {
      id: 'listing-1',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'listing.userId = :userId',
      { userId: 'user-1' },
    );
    expect(populateListingFeatures).toHaveBeenCalledWith([listing]);
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
      notificationsService,
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
    expect(notificationsService.createForListingChange).toHaveBeenCalledWith({
      changes: [{ field: 'photos', oldValue: null, newValue: '1' }],
      listingId: 'listing-1',
      listingImageUrl: '/uploads/car.webp',
      listingOwnerId: 'user-1',
      listingTitle: 'BMW 320d',
      type: 'listing_photos_changed',
    });
  });

  it('returns the uploaded listing when notification delivery fails', async () => {
    const {
      imagesRepository,
      imageStorageService,
      listingsRepository,
      notificationsService,
      queryBuilder,
      service,
    } = createService();
    const file = {
      mimetype: 'image/webp',
      originalname: 'car.webp',
      size: 1024,
    } as Express.Multer.File;
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    listingsRepository.findOne.mockResolvedValue(listingEntity());
    imagesRepository.count.mockResolvedValue(0);
    imageStorageService.save.mockResolvedValue('/uploads/car.webp');
    notificationsService.createForListingChange.mockRejectedValue(
      new Error('Notification storage unavailable.'),
    );
    queryBuilder.getOne.mockResolvedValue(listingEntity());

    try {
      await expect(
        service.uploadImages('listing-1', 'user-1', [file], {}),
      ).resolves.toMatchObject({ id: 'listing-1' });
      expect(imagesRepository.save).toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalled();
    } finally {
      loggerSpy.mockRestore();
    }
  });

  it('notifies favorite users when moderation hides a published listing', async () => {
    const { listingsRepository, notificationsService, queryBuilder, service } =
      createService();
    listingsRepository.findOne.mockResolvedValue(listingEntity());
    queryBuilder.getOne.mockResolvedValue(
      listingEntity({ status: 'rejected' }),
    );

    await service.moderate('listing-1', 'admin-1', 'rejected');

    expect(notificationsService.createForListingChange).toHaveBeenCalledWith(
      {
        changes: [
          { field: 'status', oldValue: 'published', newValue: 'rejected' },
        ],
        includeListingOwner: true,
        listingId: 'listing-1',
        listingImageUrl: '/uploads/primary.webp',
        listingOwnerId: 'user-1',
        listingTitle: 'BMW 320d',
        type: 'listing_unavailable',
      },
      expect.anything(),
    );
  });

  it('creates a deletion snapshot before deleting the listing', async () => {
    const { listingsRepository, notificationsService, service } =
      createService();
    listingsRepository.findOne.mockResolvedValue(listingEntity());

    await service.remove('listing-1', 'user-1');

    expect(notificationsService.createForListingChange).toHaveBeenCalledWith(
      {
        changes: [],
        listingId: 'listing-1',
        listingImageUrl: '/uploads/primary.webp',
        listingOwnerId: 'user-1',
        listingTitle: 'BMW 320d',
        type: 'listing_deleted',
      },
      expect.anything(),
    );
    expect(listingsRepository.delete).toHaveBeenCalledWith('listing-1');
    expect(
      notificationsService.createForListingChange.mock.invocationCallOrder[0],
    ).toBeLessThan(listingsRepository.delete.mock.invocationCallOrder[0]);
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
