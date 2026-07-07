import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { ListingEntity } from './listing.entity';

@Entity({ name: 'images' })
@Index('idx_images_listing_id', ['listingId'])
@Index('idx_images_one_primary_per_listing', ['listingId'], {
  unique: true,
  where: 'is_primary = true',
})
@Check('chk_images_sort_order', '"sort_order" >= 0')
export class ImageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'listing_id', type: 'uuid' })
  listingId: string;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl: string;

  @Column({ name: 'alt_text', nullable: true, type: 'text' })
  altText: string | null;

  @Column({ default: 0, name: 'sort_order', type: 'integer' })
  sortOrder: number;

  @Column({ name: 'is_primary', default: false, type: 'boolean' })
  isPrimary: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => ListingEntity, (listing) => listing.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'listing_id' })
  listing: ListingEntity;
}
