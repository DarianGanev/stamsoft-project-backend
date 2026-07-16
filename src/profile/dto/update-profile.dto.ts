import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { trimString } from '../../common/transforms/trim-string.transform';
import type { UpdateUserProfileInput } from '../../users/types';
import {
  PROFILE_NAME_MAX_LENGTH,
  PROFILE_PHONE_MAX_LENGTH,
} from '../constants';

export class UpdateProfileDto implements UpdateUserProfileInput {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(PROFILE_NAME_MAX_LENGTH)
  name?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(PROFILE_PHONE_MAX_LENGTH)
  phone?: string;
}
