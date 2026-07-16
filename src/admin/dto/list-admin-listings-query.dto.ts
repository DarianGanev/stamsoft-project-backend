import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import { DEFAULT_ADMIN_LISTING_STATUS } from '../constants';
import { LISTING_STATUSES } from '../../listings/constants';
import type {
  AdminListListingsInput,
  ListingStatus,
} from '../../listings/types';

export class ListAdminListingsQueryDto implements AdminListListingsInput {
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
  @IsIn(LISTING_STATUSES)
  status?: ListingStatus = DEFAULT_ADMIN_LISTING_STATUS;
}
