import type {
  Currency,
  FuelType,
  ListingModerationStatus,
  ListingSort,
  ListingStatus,
  TransmissionType,
} from '../types';

export const FUEL_TYPES: readonly FuelType[] = [
  'gasoline',
  'diesel',
  'hybrid',
  'electric',
  'lpg',
  'cng',
  'other',
] as const;

export const TRANSMISSION_TYPES: readonly TransmissionType[] = [
  'manual',
  'automatic',
  'semi_automatic',
] as const;

export const LISTING_STATUSES: readonly ListingStatus[] = [
  'pending',
  'published',
  'rejected',
  'draft',
  'sold',
  'archived',
] as const;

export const LISTING_MODERATION_STATUSES: readonly ListingModerationStatus[] = [
  'published',
  'rejected',
] as const;

export const LISTING_SORTS: readonly ListingSort[] = [
  'newest',
  'price-low',
  'price-high',
  'price_asc',
  'price_desc',
] as const;

export const CURRENCIES: readonly Currency[] = ['EUR', 'BGN'] as const;
