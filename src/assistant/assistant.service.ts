import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { ListingsService } from '../listings/listings.service';
import {
  ASSISTANT_EMAIL_PATTERN,
  ASSISTANT_PHONE_PATTERN,
  ASSISTANT_RESPONSE_MESSAGES,
  BULGARIAN_TEXT_PATTERN,
  MAX_ASSISTANT_CLARIFICATION_QUESTIONS,
  MAX_ASSISTANT_HIGHLIGHTS,
  MAX_ASSISTANT_HISTORY_MESSAGES,
  MAX_ASSISTANT_MESSAGE_LENGTH,
  MAX_ASSISTANT_RECOMMENDATIONS,
  REDACTED_EMAIL_PLACEHOLDER,
  REDACTED_PHONE_PLACEHOLDER,
  RECOMMENDATION_MODEL,
} from './constants';
import type {
  AssistantMessage,
  CandidateRankingResult,
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
    const clarificationCount = conversation.filter(
      (message) => message.role === 'assistant',
    ).length;

    if (
      needs.needsClarification &&
      clarificationCount < MAX_ASSISTANT_CLARIFICATION_QUESTIONS
    ) {
      if (!needs.clarificationQuestion) {
        throw new ServiceUnavailableException(
          'AI recommendation service returned no clarification question.',
        );
      }

      return {
        message: needs.clarificationQuestion,
        recommendations: [],
        status: 'clarifying',
      };
    }

    const resolvedNeeds = needs.needsClarification
      ? {
          ...needs,
          clarificationQuestion: null,
          needsClarification: false,
        }
      : needs;

    const candidates = await this.listingsService.findRecommendationCandidates(
      resolvedNeeds.criteria,
    );

    if (!candidates.length) {
      return {
        message: this.getResponseMessages(conversation).noMatchingListings,
        recommendations: [],
        status: 'completed',
      };
    }

    let ranking: CandidateRankingResult;

    try {
      ranking = await this.recommendationModel.rankCandidates({
        candidates: candidates.map((candidate) => ({
          ...candidate,
          location:
            candidate.location === null
              ? null
              : this.redactSensitiveContent(candidate.location),
          title: this.redactSensitiveContent(candidate.title),
        })),
        conversation,
        needs: resolvedNeeds,
      });
    } catch {
      return this.createDegradedResult(candidates, conversation);
    }

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

      const featureLabels = new Set(
        listing.features.map((feature) => feature.label),
      );
      seenIds.add(listing.id);
      recommendations.push({
        highlights: recommendation.highlights
          .filter((highlight) => featureLabels.has(highlight))
          .slice(0, MAX_ASSISTANT_HIGHLIGHTS),
        listing,
        reason: recommendation.reason,
        tradeoffs: recommendation.tradeoffs,
      });

      if (recommendations.length === MAX_ASSISTANT_RECOMMENDATIONS) {
        break;
      }
    }

    if (!recommendations.length) {
      return this.createDegradedResult(candidates, conversation);
    }

    return {
      message: ranking.summary,
      recommendations,
      status: 'completed',
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
        content: this.redactSensitiveContent(
          item.content.trim().slice(0, MAX_ASSISTANT_MESSAGE_LENGTH),
        ),
      }))
      .filter((item) => item.content.length > 0);

    return [
      ...history,
      { role: 'user', content: this.redactSensitiveContent(message) },
    ];
  }

  private createDegradedResult(
    candidates: readonly VehicleRecommendation['listing'][],
    conversation: readonly AssistantMessage[],
  ): VehicleRecommendationResult {
    return {
      message: this.getResponseMessages(conversation).degraded,
      recommendations: candidates
        .slice(0, MAX_ASSISTANT_RECOMMENDATIONS)
        .map((listing) => ({
          highlights: [],
          listing,
          reason: null,
          tradeoffs: [],
        })),
      status: 'degraded',
    };
  }

  private getResponseMessages(conversation: readonly AssistantMessage[]) {
    const latestMessage = conversation[conversation.length - 1]?.content ?? '';

    return ASSISTANT_RESPONSE_MESSAGES[
      BULGARIAN_TEXT_PATTERN.test(latestMessage) ? 'bg' : 'en'
    ];
  }

  private redactSensitiveContent(content: string): string {
    return content
      .replace(ASSISTANT_EMAIL_PATTERN, REDACTED_EMAIL_PLACEHOLDER)
      .replace(ASSISTANT_PHONE_PATTERN, REDACTED_PHONE_PLACEHOLDER);
  }
}
