import type {
  BodyType,
  Currency,
  EmissionStandard,
  FuelType,
  ListingModerationStatus,
  ListingSort,
  ListingStatus,
  TransmissionType,
  VehicleCondition,
} from '../types';

export const BODY_TYPES = [
  'sedan',
  'suv',
  'hatchback',
] as const satisfies readonly BodyType[];

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

export const EMISSION_STANDARDS: readonly EmissionStandard[] = [
  'euro_1',
  'euro_2',
  'euro_3',
  'euro_4',
  'euro_5',
  'euro_6',
  'euro_6d',
] as const;

export const LISTING_STATUSES: readonly ListingStatus[] = [
  'pending',
  'published',
  'rejected',
  'draft',
  'sold',
  'archived',
] as const;

export const DEFAULT_LISTING_STATUS: ListingStatus = 'pending';
export const PUBLISHED_LISTING_STATUS: ListingStatus = 'published';

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

export const VEHICLE_CONDITIONS = [
  'new',
  'used',
] as const satisfies readonly VehicleCondition[];
