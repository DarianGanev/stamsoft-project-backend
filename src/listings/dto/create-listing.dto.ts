import {
  ArrayMaxSize,
  IsArray,
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
  BODY_TYPES,
  CURRENCIES,
  EMISSION_STANDARDS,
  FUEL_TYPES,
  MAX_LISTING_FEATURES_PER_LISTING,
  TRANSMISSION_TYPES,
  VEHICLE_CONDITIONS,
} from '../constants';
import {
  BodyType,
  Currency,
  EmissionStandard,
  FuelType,
  TransmissionType,
  VehicleCondition,
} from '../types';

export class CreateListingDto {
  @IsUUID()
  brandId: string;

  @IsUUID()
  modelId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsIn(BODY_TYPES)
  bodyType?: BodyType | null;

  @IsOptional()
  @IsIn(VEHICLE_CONDITIONS)
  condition?: VehicleCondition | null;

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
  @IsIn(EMISSION_STANDARDS)
  emissionStandard?: EmissionStandard;

  @IsOptional()
  @IsIn(FUEL_TYPES)
  fuel?: FuelType;

  @IsOptional()
  @IsIn(TRANSMISSION_TYPES)
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
  @IsIn(CURRENCIES)
  currency?: Currency;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_LISTING_FEATURES_PER_LISTING)
  @IsString({ each: true })
  featureKeys?: string[];
}
