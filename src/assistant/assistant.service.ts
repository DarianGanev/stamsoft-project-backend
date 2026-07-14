import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { ListingsService } from '../listings/listings.service';
import {
  MAX_ASSISTANT_HISTORY_MESSAGES,
  MAX_ASSISTANT_MESSAGE_LENGTH,
  MAX_ASSISTANT_RECOMMENDATIONS,
  NO_MATCHING_LISTINGS_MESSAGE,
  RECOMMENDATION_MODEL,
} from './constants';
import type {
  AssistantMessage,
  RecommendationModel,
  VehicleRecommendation,
  VehicleRecommendationInput,
  VehicleRecommendationResult,
} from './types';

@Injectable()
export class AssistantService {
  constructor(
    private readonly listingsService: ListingsService,
    @Inject(RECOMMENDATION_MODEL)
    private readonly recommendationModel: RecommendationModel,
  ) {}

  async recommend(
    input: VehicleRecommendationInput,
  ): Promise<VehicleRecommendationResult> {
    const conversation = this.normalizeConversation(input);
    const needs = await this.recommendationModel.analyzeNeeds(conversation);

    if (needs.needsClarification) {
      if (!needs.clarificationQuestion) {
        throw new ServiceUnavailableException(
          'AI recommendation service returned no clarification question.',
        );
      }

      return {
        message: needs.clarificationQuestion,
        needsClarification: true,
        recommendations: [],
      };
    }

    const candidates = await this.listingsService.findRecommendationCandidates(
      needs.criteria,
    );

    if (!candidates.length) {
      return {
        message: NO_MATCHING_LISTINGS_MESSAGE,
        needsClarification: false,
        recommendations: [],
      };
    }

    const ranking = await this.recommendationModel.rankCandidates({
      candidates,
      conversation,
      needs,
    });
    const candidatesById = new Map(
      candidates.map((candidate) => [candidate.id, candidate]),
    );
    const seenIds = new Set<string>();
    const recommendations: VehicleRecommendation[] = [];

    for (const recommendation of ranking.recommendations) {
      const listing = candidatesById.get(recommendation.listingId);

      if (!listing || seenIds.has(listing.id)) {
        continue;
      }

      seenIds.add(listing.id);
      recommendations.push({
        listing,
        reason: recommendation.reason,
        tradeOffs: recommendation.tradeOffs,
      });

      if (recommendations.length === MAX_ASSISTANT_RECOMMENDATIONS) {
        break;
      }
    }

    if (!recommendations.length) {
      throw new ServiceUnavailableException(
        'AI recommendation service returned no valid listings.',
      );
    }

    return {
      message: ranking.summary,
      needsClarification: false,
      recommendations,
    };
  }

  private normalizeConversation(
    input: VehicleRecommendationInput,
  ): AssistantMessage[] {
    const message = input.message?.trim();

    if (!message || message.length > MAX_ASSISTANT_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Message must contain between 1 and ${MAX_ASSISTANT_MESSAGE_LENGTH} characters.`,
      );
    }

    const history = (input.history ?? [])
      .slice(-MAX_ASSISTANT_HISTORY_MESSAGES)
      .map((item) => ({
        role: item.role,
        content: item.content.trim().slice(0, MAX_ASSISTANT_MESSAGE_LENGTH),
      }))
      .filter((item) => item.content.length > 0);

    return [...history, { role: 'user', content: message }];
  }
}
