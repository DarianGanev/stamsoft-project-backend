import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { ListingsModule } from '../listings/listings.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { ASSISTANT_THROTTLER_OPTIONS, RECOMMENDATION_MODEL } from './constants';
import { GeminiRecommendationService } from './gemini-recommendation.service';

@Module({
  imports: [
    ListingsModule,
    ThrottlerModule.forRoot(
      ASSISTANT_THROTTLER_OPTIONS.map((option) => ({ ...option })),
    ),
  ],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    GeminiRecommendationService,
    {
      provide: RECOMMENDATION_MODEL,
      useExisting: GeminiRecommendationService,
    },
  ],
  exports: [AssistantService],
})
export class AssistantModule {}
