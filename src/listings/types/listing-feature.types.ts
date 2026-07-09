export type ListingFeatureCategory =
  | 'safety'
  | 'comfort'
  | 'other'
  | 'exterior'
  | 'protection'
  | 'interior'
  | 'specialized';

export interface ListingFeature {
  id: string;
  key: string;
  category: ListingFeatureCategory;
  label: string;
  sortOrder: number;
}

export interface GroupedListingFeatures {
  category: ListingFeatureCategory;
  label: string;
  features: ListingFeature[];
}
