import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { LISTING_FEATURE_CATEGORIES } from '../constants';
import type { ListingFeatureCategory } from '../types';
import { ListingFeatureSelectionEntity } from './listing-feature-selection.entity';

@Entity({ name: 'listing_features' })
@Index('idx_listing_features_category', ['category'])
@Index('idx_listing_features_sort_order', ['sortOrder'])
export class ListingFeatureEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  key: string;

  @Column({
    enum: [...LISTING_FEATURE_CATEGORIES],
    enumName: 'listing_feature_category',
    type: 'enum',
  })
  category: ListingFeatureCategory;

  @Column({ type: 'text' })
  label: string;

  @Column({ name: 'sort_order', type: 'integer' })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(
    () => ListingFeatureSelectionEntity,
    (selection) => selection.feature,
  )
  selections: ListingFeatureSelectionEntity[];
}
