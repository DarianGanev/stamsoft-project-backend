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

import { BrandEntity } from '../brands/brand.entity';
import { VehicleModelEntity } from '../brands/vehicle-model.entity';
import { UserEntity } from '../users/user.entity';
import { FuelType, ListingStatus, TransmissionType } from './listing.types';
import { ImageEntity } from './image.entity';

@Entity({ name: 'listings' })
export class ListingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'brand_id', type: 'uuid' })
  brandId: string;

  @Column({ name: 'model_id', type: 'uuid' })
  modelId: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ nullable: true, type: 'smallint' })
  year: number | null;

  @Column({ name: 'mileage_km', nullable: true, type: 'integer' })
  mileageKm: number | null;

  @Column({ name: 'power_hp', nullable: true, type: 'integer' })
  powerHp: number | null;

  @Column({ name: 'engine_liters', nullable: true, type: 'numeric' })
  engineLiters: string | null;

  @Column({
    enum: ['gasoline', 'diesel', 'hybrid', 'electric', 'lpg', 'cng', 'other'],
    enumName: 'fuel_type',
    nullable: true,
    type: 'enum',
  })
  fuel: FuelType | null;

  @Column({
    enum: ['manual', 'automatic', 'semi_automatic'],
    enumName: 'transmission_type',
    nullable: true,
    type: 'enum',
  })
  transmission: TransmissionType | null;

  @Column({ nullable: true, type: 'text' })
  location: string | null;

  @Column({ name: 'contact_name', nullable: true, type: 'text' })
  contactName: string | null;

  @Column({ name: 'contact_phone', nullable: true, type: 'text' })
  contactPhone: string | null;

  @Column({ name: 'contact_email', nullable: true, type: 'text' })
  contactEmail: string | null;

  @Column({ type: 'numeric' })
  price: string;

  @Column({ default: 'EUR', type: 'char', length: 3 })
  currency: string;

  @Column({
    enum: ['draft', 'published', 'sold', 'archived'],
    enumName: 'listing_status',
    type: 'enum',
  })
  status: ListingStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.listings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => BrandEntity, (brand) => brand.listings, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'brand_id' })
  brand: BrandEntity;

  @ManyToOne(() => VehicleModelEntity, (model) => model.listings, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'model_id' })
  model: VehicleModelEntity;

  @OneToMany(() => ImageEntity, (image) => image.listing)
  images: ImageEntity[];
}
