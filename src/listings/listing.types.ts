export type ListingStatus = 'draft' | 'published' | 'sold' | 'archived';
export type FuelType =
  | 'gasoline'
  | 'diesel'
  | 'hybrid'
  | 'electric'
  | 'lpg'
  | 'cng'
  | 'other';
export type TransmissionType = 'manual' | 'automatic' | 'semi_automatic';

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
  fuel: FuelType | null;
  transmission: TransmissionType | null;
  location: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  price: number;
  currency: string;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  images: ListingImage[];
  primaryImageUrl: string | null;
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
  fuel: FuelType | null;
  transmission: TransmissionType | null;
  location: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  price: string;
  currency: string;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  images: ListingImage[] | null;
  primary_image_url: string | null;
}
