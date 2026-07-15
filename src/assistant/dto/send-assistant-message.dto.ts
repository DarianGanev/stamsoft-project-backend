import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import { trimString } from '../../common/transforms/trim-string.transform';
import {
  MAX_ASSISTANT_HISTORY_MESSAGES,
  MAX_ASSISTANT_MESSAGE_LENGTH,
} from '../constants';
import type { VehicleRecommendationInput } from '../types';
import { AssistantHistoryMessageDto } from './assistant-history-message.dto';

export class SendAssistantMessageDto implements VehicleRecommendationInput {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ASSISTANT_HISTORY_MESSAGES)
  @Type(() => AssistantHistoryMessageDto)
  @ValidateNested({ each: true })
  history?: AssistantHistoryMessageDto[];

  @Transform(trimString)
  @IsString()
  @Length(1, MAX_ASSISTANT_MESSAGE_LENGTH)
  message: string;
}
