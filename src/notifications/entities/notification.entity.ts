import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { UserEntity } from '../../users/entities';
import { NOTIFICATION_TYPES } from '../constants';
import { NotificationChange, NotificationType } from '../types';

@Entity({ name: 'notifications' })
@Index('idx_notifications_user_created_at', ['userId', 'createdAt'])
@Index('idx_notifications_user_read_at', ['userId', 'readAt'])
@Index('idx_notifications_listing_id', ['listingId'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'listing_id', nullable: true, type: 'uuid' })
  listingId: string | null;

  @Column({
    enum: [...NOTIFICATION_TYPES],
    enumName: 'notification_type',
    type: 'enum',
  })
  type: NotificationType;

  @Column({ name: 'listing_title', type: 'text' })
  listingTitle: string;

  @Column({ name: 'listing_image_url', nullable: true, type: 'text' })
  listingImageUrl: string | null;

  @Column({ type: 'jsonb' })
  changes: NotificationChange[];

  @Column({ name: 'read_at', nullable: true, type: 'timestamptz' })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
