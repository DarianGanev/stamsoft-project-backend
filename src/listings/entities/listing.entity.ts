import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { BrandEntity, VehicleModelEntity } from '../../brands/entities';
import { UserEntity } from '../../users/entities';
import { Currency, FuelType, ListingStatus, TransmissionType } from '../types';
import { ImageEntity } from './image.entity';
import { ListingFeatureSelectionEntity } from './listing-feature-selection.entity';

@Entity({ name: 'listings' })
@Index('idx_listings_user_id', ['userId'])
@Index('idx_listings_brand_id', ['brandId'])
@Index('idx_listings_model_id', ['modelId'])
@Index('idx_listings_status', ['status'])
@Index('idx_listings_price', ['price'])
@Index('idx_listings_year', ['year'])
@Index('idx_listings_fuel', ['fuel'])
@Index('idx_listings_transmission', ['transmission'])
@Index('idx_listings_location', ['location'])
@Index('idx_listings_mileage_km', ['mileageKm'])
@Index('idx_listings_created_at', ['createdAt'])
@Index('idx_listings_moderated_by_id', ['moderatedById'])
@Check('chk_listings_year', '"year" IS NULL OR "year" BETWEEN 1886 AND 2100')
@Check('chk_listings_mileage_km', '"mileage_km" IS NULL OR "mileage_km" >= 0')
@Check('chk_listings_power_hp', '"power_hp" IS NULL OR "power_hp" >= 0')
@Check(
  'chk_listings_engine_liters',
  '"engine_liters" IS NULL OR "engine_liters" >= 0',
)
@Check('chk_listings_price', '"price" >= 0')
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

  @Column({
    name: 'engine_liters',
    nullable: true,
    precision: 4,
    scale: 1,
    type: 'numeric',
  })
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

  @Column({ precision: 12, scale: 2, type: 'numeric' })
  price: string;

  @Column({ default: 'EUR', type: 'char', length: 3 })
  currency: Currency;

  @Column({
    enum: ['pending', 'published', 'rejected', 'draft', 'sold', 'archived'],
    enumName: 'listing_status',
    default: 'pending',
    type: 'enum',
  })
  status: ListingStatus;

  @Column({ name: 'moderated_at', nullable: true, type: 'timestamptz' })
  moderatedAt: Date | null;

  @Column({ name: 'moderated_by_id', nullable: true, type: 'uuid' })
  moderatedById: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.listings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'moderated_by_id' })
  moderatedBy: UserEntity | null;

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

  @OneToMany(
    () => ListingFeatureSelectionEntity,
    (selection) => selection.listing,
  )
  featureSelections: ListingFeatureSelectionEntity[];
}
