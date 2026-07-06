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
  CURRENCIES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
} from '../constants';
import { Currency, FuelType, TransmissionType } from '../types';

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
}
