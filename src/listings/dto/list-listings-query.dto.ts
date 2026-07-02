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

import { FuelType, TransmissionType } from '../listing.types';

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
  @IsIn(fuelTypes)
  fuel?: FuelType;

  @IsOptional()
  @IsIn(transmissionTypes)
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
}
