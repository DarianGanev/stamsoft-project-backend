import { Transform } from 'class-transformer';
import { IsIn, IsString, Length } from 'class-validator';

import { trimString } from '../../common/transforms/trim-string.transform';
import {
  ASSISTANT_MESSAGE_ROLES,
  MAX_ASSISTANT_MESSAGE_LENGTH,
} from '../constants';
import type { AssistantMessage, AssistantMessageRole } from '../types';

export class AssistantHistoryMessageDto implements AssistantMessage {
  @Transform(trimString)
  @IsString()
  @Length(1, MAX_ASSISTANT_MESSAGE_LENGTH)
  content: string;

  @IsIn(ASSISTANT_MESSAGE_ROLES)
  role: AssistantMessageRole;
}
