import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ListingEntity } from '../../listings/entities';
import { VehicleModelEntity } from './vehicle-model.entity';

@Entity({ name: 'brands' })
export class BrandEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  name: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => VehicleModelEntity, (model) => model.brand)
  models: VehicleModelEntity[];

  @OneToMany(() => ListingEntity, (listing) => listing.brand)
  listings: ListingEntity[];
}
