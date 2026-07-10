import { ListingFeatureCategory } from './listing-feature.types';

export type ListingStatus =
  'pending' | 'published' | 'rejected' | 'draft' | 'sold' | 'archived';
export type ListingModerationStatus = 'published' | 'rejected';
export type FuelType =
  'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'lpg' | 'cng' | 'other';
export type TransmissionType = 'manual' | 'automatic' | 'semi_automatic';
export type ListingSort =
  'newest' | 'price-low' | 'price-high' | 'price_asc' | 'price_desc';
export type Currency = 'EUR' | 'BGN';

export interface ListingSelectedFeature {
  id: string;
  key: string;
  category: ListingFeatureCategory;
  label: string;
}

export interface ListingImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Listing {
  id: string;
  userId: string;
  brandId: string;
  brandName: string;
  modelId: string;
  modelName: string;
  title: string;
  description: string | null;
  year: number | null;
  mileageKm: number | null;
  powerHp: number | null;
  engineLiters: number | null;
  fuel: FuelType | null;
  transmission: TransmissionType | null;
  location: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  sellerCreatedAt: string | null;
  price: number;
  currency: Currency;
  status: ListingStatus;
  moderatedAt: string | null;
  moderatedById: string | null;
  createdAt: string;
  updatedAt: string;
  images: ListingImage[];
  primaryImageUrl: string | null;
  features: ListingSelectedFeature[];
}

export interface ListingRecord {
  id: string;
  user_id: string;
  brand_id: string;
  brand_name: string;
  model_id: string;
  model_name: string;
  title: string;
  description: string | null;
  year: number | null;
  mileage_km: number | null;
  power_hp: number | null;
  engine_liters: string | null;
  fuel: FuelType | null;
  transmission: TransmissionType | null;
  location: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  price: string;
  currency: Currency;
  status: ListingStatus;
  moderated_at: string | null;
  moderated_by_id: string | null;
  created_at: string;
  updated_at: string;
  images: ListingImage[] | null;
  primary_image_url: string | null;
}

export interface AdminListListingsInput {
  page?: number;
  limit?: number;
  status?: ListingStatus;
}
