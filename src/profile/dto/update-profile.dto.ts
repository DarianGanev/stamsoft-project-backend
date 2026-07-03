import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import {
  PROFILE_NAME_MAX_LENGTH,
  PROFILE_PHONE_MAX_LENGTH,
} from '../constants';
import type { UpdateUserProfileInput } from '../../users/types';

export class UpdateProfileDto implements UpdateUserProfileInput {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(PROFILE_NAME_MAX_LENGTH)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(PROFILE_PHONE_MAX_LENGTH)
  phone?: string;
}
