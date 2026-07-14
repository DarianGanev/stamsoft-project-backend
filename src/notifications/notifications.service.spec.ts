import { NotFoundException } from '@nestjs/common';
import { IsNull } from 'typeorm';

import { FavoriteEntity } from '../favorites/entities';
import { NotificationEntity } from './entities';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  function notificationEntity(
    overrides: Partial<NotificationEntity> = {},
  ): NotificationEntity {
    return {
      id: 'notification-1',
      userId: 'user-1',
      listingId: 'listing-1',
      type: 'listing_changed',
      listingTitle: 'Volkswagen Golf',
      listingImageUrl: '/uploads/golf.jpg',
      changes: [{ field: 'price', oldValue: 12000, newValue: 11000 }],
      readAt: null,
      createdAt: new Date('2026-07-13T10:00:00.000Z'),
      user: null as never,
      ...overrides,
    };
  }

  function createService() {
    const notificationsRepository = {
      count: jest.fn(),
      create: jest.fn((input: Partial<NotificationEntity>) => input),
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    const favoritesRepository = {
      find: jest.fn(),
    };

    return {
      favoritesRepository,
      notificationsRepository,
      service: new NotificationsService(
        notificationsRepository as never,
        favoritesRepository as never,
      ),
    };
  }

  it('lists newest notifications and a separate unread count for one user', async () => {
    const { notificationsRepository, service } = createService();
    notificationsRepository.findAndCount.mockResolvedValue([
      [notificationEntity()],
      5,
    ]);
    notificationsRepository.count.mockResolvedValue(3);

    await expect(
      service.list('user-1', { page: 2, limit: 2 }),
    ).resolves.toEqual({
      data: [
        {
          id: 'notification-1',
          userId: 'user-1',
          listingId: 'listing-1',
          type: 'listing_changed',
          listingTitle: 'Volkswagen Golf',
          listingImageUrl: '/uploads/golf.jpg',
          changes: [{ field: 'price', oldValue: 12000, newValue: 11000 }],
          readAt: null,
          createdAt: '2026-07-13T10:00:00.000Z',
        },
      ],
      meta: { page: 2, limit: 2, total: 5 },
      unreadCount: 3,
    });
    expect(notificationsRepository.findAndCount).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
      skip: 2,
      take: 2,
      where: { userId: 'user-1' },
    });
    expect(notificationsRepository.count).toHaveBeenCalledWith({
      where: { readAt: IsNull(), userId: 'user-1' },
    });
  });

  it('creates one notification per unique favoriting user and excludes the owner', async () => {
    const { favoritesRepository, notificationsRepository, service } =
      createService();
    favoritesRepository.find.mockResolvedValue([
      { userId: 'user-1' } as FavoriteEntity,
      { userId: 'owner-1' } as FavoriteEntity,
      { userId: 'user-1' } as FavoriteEntity,
      { userId: 'user-2' } as FavoriteEntity,
    ]);
    notificationsRepository.save.mockResolvedValue([]);

    await service.createForListingChange({
      listingId: 'listing-1',
      listingOwnerId: 'owner-1',
      listingTitle: 'Volkswagen Golf',
      listingImageUrl: '/uploads/golf.jpg',
      type: 'listing_changed',
      changes: [{ field: 'price', oldValue: 12000, newValue: 11000 }],
    });

    expect(notificationsRepository.create).toHaveBeenCalledTimes(2);
    expect(notificationsRepository.create).toHaveBeenCalledWith({
      changes: [{ field: 'price', oldValue: 12000, newValue: 11000 }],
      listingId: 'listing-1',
      listingImageUrl: '/uploads/golf.jpg',
      listingTitle: 'Volkswagen Golf',
      type: 'listing_changed',
      userId: 'user-1',
    });
    expect(notificationsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-2' }),
    );
  });

  it('does not write when no eligible user favorited the listing', async () => {
    const { favoritesRepository, notificationsRepository, service } =
      createService();
    favoritesRepository.find.mockResolvedValue([
      { userId: 'owner-1' } as FavoriteEntity,
    ]);

    await service.createForListingChange({
      listingId: 'listing-1',
      listingOwnerId: 'owner-1',
      listingTitle: 'Volkswagen Golf',
      listingImageUrl: null,
      type: 'listing_deleted',
      changes: [],
    });

    expect(notificationsRepository.save).not.toHaveBeenCalled();
  });

  it('includes the listing owner when moderation requests it', async () => {
    const { favoritesRepository, notificationsRepository, service } =
      createService();
    favoritesRepository.find.mockResolvedValue([
      { userId: 'user-1' } as FavoriteEntity,
    ]);
    notificationsRepository.save.mockResolvedValue([]);

    await service.createForListingChange({
      listingId: 'listing-1',
      listingOwnerId: 'owner-1',
      includeListingOwner: true,
      listingTitle: 'Volkswagen Golf',
      listingImageUrl: null,
      type: 'listing_unavailable',
      changes: [
        { field: 'status', oldValue: 'published', newValue: 'rejected' },
      ],
    });

    expect(notificationsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'owner-1' }),
    );
    expect(notificationsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
    );
  });

  it('marks only an owned notification as read', async () => {
    const { notificationsRepository, service } = createService();
    notificationsRepository.findOne.mockResolvedValue(notificationEntity());
    notificationsRepository.save.mockResolvedValue(notificationEntity());

    const result = await service.markRead('user-1', 'notification-1');

    expect(notificationsRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'notification-1', userId: 'user-1' },
    });
    expect(result.readAt).not.toBeNull();
  });

  it('hides the existence of another users notification', async () => {
    const { notificationsRepository, service } = createService();
    notificationsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.markRead('user-1', 'notification-2'),
    ).rejects.toThrow(NotFoundException);
  });

  it('marks all unread notifications for one user', async () => {
    const { notificationsRepository, service } = createService();
    notificationsRepository.update.mockResolvedValue({ affected: 4 });

    await expect(service.markAllRead('user-1')).resolves.toEqual({ updated: 4 });
    expect(notificationsRepository.update).toHaveBeenCalledTimes(1);
    const [criteria, update] = notificationsRepository.update.mock
      .calls[0] as unknown as [
      { readAt: ReturnType<typeof IsNull>; userId: string },
      { readAt: Date },
    ];
    expect(criteria).toEqual({ readAt: IsNull(), userId: 'user-1' });
    expect(update.readAt).toBeInstanceOf(Date);
  });
});
