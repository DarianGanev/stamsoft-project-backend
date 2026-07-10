export type ListingFeatureCategory =
  | 'safety'
  | 'comfort'
  | 'other'
  | 'exterior'
  | 'protection'
  | 'interior'
  | 'specialized';

export type ListingFeatureOption = Readonly<{
  key: string;
  category: ListingFeatureCategory;
  label: string;
  sortOrder: number;
}>;

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
