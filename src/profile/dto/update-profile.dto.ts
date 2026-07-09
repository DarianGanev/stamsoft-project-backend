import { Transform, TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import {
  PROFILE_NAME_MAX_LENGTH,
  PROFILE_PHONE_MAX_LENGTH,
} from '../constants';
import type { UpdateUserProfileInput } from '../../users/types';

const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

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
