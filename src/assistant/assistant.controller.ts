import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';

import { AssistantService } from './assistant.service';
import { SendAssistantMessageDto } from './dto';
import type { VehicleRecommendationResult } from './types';

@ApiTags('assistant')
@Controller('assistant')
@UseGuards(ThrottlerGuard)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recommend vehicles from a buyer conversation' })
  @ApiOkResponse({ description: 'Clarification or vehicle recommendations.' })
  @ApiBadRequestResponse({ description: 'Invalid message or history.' })
  @ApiTooManyRequestsResponse({ description: 'Assistant rate limit exceeded.' })
  @ApiServiceUnavailableResponse({
    description: 'The AI recommendation service is unavailable.',
  })
  send(
    @Body() input: SendAssistantMessageDto,
  ): Promise<VehicleRecommendationResult> {
    return this.assistantService.recommend(input);
  }
}
