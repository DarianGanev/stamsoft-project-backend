import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  Column,
} from 'typeorm';

import { ListingEntity } from './listing.entity';
import { ListingFeatureEntity } from './listing-feature.entity';

@Entity({ name: 'listing_feature_selections' })
@Index('idx_listing_feature_selections_listing_id', ['listingId'])
@Index('idx_listing_feature_selections_feature_id', ['featureId'])
@Unique('uq_listing_feature_selections_listing_feature', [
  'listingId',
  'featureId',
])
export class ListingFeatureSelectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'listing_id', type: 'uuid' })
  listingId: string;

  @Column({ name: 'feature_id', type: 'uuid' })
  featureId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => ListingEntity, (listing) => listing.featureSelections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'listing_id' })
  listing: ListingEntity;

  @ManyToOne(() => ListingFeatureEntity, (feature) => feature.selections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'feature_id' })
  feature: ListingFeatureEntity;
}
