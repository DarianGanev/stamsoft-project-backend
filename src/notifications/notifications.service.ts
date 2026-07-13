import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';

import { FavoriteEntity } from '../favorites/entities';
import { ListNotificationsQueryDto } from './dto';
import { NotificationEntity } from './entities';
import {
  CreateListingNotificationInput,
  Notification,
} from './types';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
    @InjectRepository(FavoriteEntity)
    private readonly favoritesRepository: Repository<FavoriteEntity>,
  ) {}

  async list(userId: string, query: ListNotificationsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [notifications, total] =
      await this.notificationsRepository.findAndCount({
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
        where: { userId },
      });
    const unreadCount = await this.notificationsRepository.count({
      where: { readAt: IsNull(), userId },
    });

    return {
      data: notifications.map((notification) =>
        this.toNotification(notification),
      ),
      meta: { page, limit, total },
      unreadCount,
    };
  }

  async createForListingChange(
    input: CreateListingNotificationInput,
    manager?: EntityManager,
  ): Promise<void> {
    const favoritesRepository = manager
      ? manager.getRepository(FavoriteEntity)
      : this.favoritesRepository;
    const notificationsRepository = manager
      ? manager.getRepository(NotificationEntity)
      : this.notificationsRepository;
    const favorites = await favoritesRepository.find({
      select: { userId: true },
      where: { listingId: input.listingId },
    });
    const recipientIds = [
      ...new Set(
        favorites
          .map((favorite) => favorite.userId)
          .filter((userId) => userId !== input.listingOwnerId),
      ),
    ];

    if (recipientIds.length === 0) {
      return;
    }

    const notifications = recipientIds.map((userId) =>
      notificationsRepository.create({
        userId,
        listingId: input.listingId,
        type: input.type,
        listingTitle: input.listingTitle,
        listingImageUrl: input.listingImageUrl,
        changes: input.changes,
      }),
    );

    await notificationsRepository.save(notifications);
  }

  async markRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationsRepository.save(notification);
    }

    return this.toNotification(notification);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationsRepository.update(
      { readAt: IsNull(), userId },
      { readAt: new Date() },
    );

    return { updated: result.affected ?? 0 };
  }

  private toNotification(notification: NotificationEntity): Notification {
    return {
      id: notification.id,
      userId: notification.userId,
      listingId: notification.listingId,
      type: notification.type,
      listingTitle: notification.listingTitle,
      listingImageUrl: notification.listingImageUrl,
      changes: notification.changes,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
