import { IsIn } from 'class-validator';

import { LISTING_MODERATION_STATUSES } from '../../listings/constants';
import type { ListingModerationStatus } from '../../listings/types';

export class ModerateListingDto {
  @IsIn(LISTING_MODERATION_STATUSES)
  status: ListingModerationStatus;
}
