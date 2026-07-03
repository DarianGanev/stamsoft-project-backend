import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import {
  FuelType,
  ListingStatus,
  TransmissionType,
} from '../listing.types';

const fuelTypes: FuelType[] = [
  'gasoline',
  'diesel',
  'hybrid',
  'electric',
  'lpg',
  'cng',
  'other',
];
const transmissionTypes: TransmissionType[] = [
  'manual',
  'automatic',
  'semi_automatic',
];
const listingStatuses: ListingStatus[] = [
  'draft',
  'published',
  'sold',
  'archived',
];

export class CreateListingDto {
  @IsUUID()
  brandId: string;

  @IsUUID()
  modelId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1886)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  mileageKm?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  powerHp?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  engineLiters?: number;

  @IsOptional()
  @IsIn(fuelTypes)
  fuel?: FuelType;

  @IsOptional()
  @IsIn(transmissionTypes)
  transmission?: TransmissionType;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsIn(['EUR', 'BGN'])
  currency?: string;

  @IsOptional()
  @IsIn(listingStatuses)
  status?: ListingStatus;
}
