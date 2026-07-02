import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ListingEntity } from '../listings/listing.entity';
import { BrandEntity } from './brand.entity';

@Entity({ name: 'models' })
export class VehicleModelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'brand_id', type: 'uuid' })
  brandId: string;

  @Column({ type: 'text' })
  name: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => BrandEntity, (brand) => brand.models, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'brand_id' })
  brand: BrandEntity;

  @OneToMany(() => ListingEntity, (listing) => listing.model)
  listings: ListingEntity[];
}
