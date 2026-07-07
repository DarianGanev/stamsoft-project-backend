import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import {
  FUEL_TYPES,
  LISTING_SORTS,
  TRANSMISSION_TYPES,
} from '../constants';
import { FuelType, ListingSort, TransmissionType } from '../types';

export class ListListingsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsUUID()
  modelId?: string;

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
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1886)
  minYear?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(2100)
  maxYear?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxMileage?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(LISTING_SORTS)
  sort?: ListingSort = 'newest';
}
