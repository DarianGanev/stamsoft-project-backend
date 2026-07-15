import type {
  BodyType,
  Currency,
  EmissionStandard,
  FuelType,
  ListingSelectedFeature,
  TransmissionType,
  VehicleCondition,
} from './listing.types';

export interface RecommendationCandidateInput {
  bodyTypes?: readonly BodyType[];
  fuels?: readonly FuelType[];
  location?: string;
  maxMileage?: number;
  maxPrice?: number;
  minPrice?: number;
  minYear?: number;
  transmissions?: readonly TransmissionType[];
}

export interface RecommendationCandidate {
  id: string;
  title: string;
  brandName: string;
  modelName: string;
  bodyType: BodyType | null;
  condition: VehicleCondition | null;
  year: number | null;
  mileageKm: number | null;
  powerHp: number | null;
  engineLiters: number | null;
  emissionStandard: EmissionStandard | null;
  fuel: FuelType | null;
  transmission: TransmissionType | null;
  location: string | null;
  price: number;
  currency: Currency;
  features: Pick<ListingSelectedFeature, 'category' | 'key' | 'label'>[];
}
