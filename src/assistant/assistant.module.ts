import { Module } from '@nestjs/common';

import { ListingsModule } from '../listings/listings.module';
import { AssistantService } from './assistant.service';
import { RECOMMENDATION_MODEL } from './constants';
import { GeminiRecommendationService } from './gemini-recommendation.service';

@Module({
  imports: [ListingsModule],
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
