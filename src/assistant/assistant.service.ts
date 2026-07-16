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
  VehicleNeedsAnalysis,
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
    let needs: VehicleNeedsAnalysis;

    try {
      needs = await this.recommendationModel.analyzeNeeds(conversation);
    } catch (error) {
      if (!(error instanceof ServiceUnavailableException)) {
        throw error;
      }

      needs = this.analyzeNeedsLocally(conversation);
    }
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

  private analyzeNeedsLocally(
    conversation: readonly AssistantMessage[],
  ): VehicleNeedsAnalysis {
    const content = conversation
      .filter((message) => message.role === 'user')
      .map((message) => message.content)
      .join(' ')
      .toLowerCase();
    const criteria: VehicleNeedsAnalysis['criteria'] = {};
    const preferences: string[] = [];
    const explicitPriceMatch = content.match(
      /(?:under|up to|budget(?: of| is)?|до|бюджет(?:ът)?(?: ми)?(?: е)?)\s*(\d+(?:[.,]\d+)?)\s*(k|хил(?:\.|яди)?)?\s*(eur|euro|евро|bgn|лв|лева)?/i,
    );
    const latestUserMessage = [...conversation]
      .reverse()
      .find((message) => message.role === 'user')?.content;
    const followsBudgetQuestion = conversation.some(
      (message) =>
        message.role === 'assistant' &&
        /\b(budget|бюджет)\b/i.test(message.content),
    );
    const budgetAnswerMatch = followsBudgetQuestion
      ? latestUserMessage?.match(
          /(\d+(?:[.,]\d+)?)\s*(k|хил(?:\.|яди)?)?\s*(?:in\s+)?(eur|euro|евро|bgn|лв|лева)?/i,
        )
      : null;
    const priceMatch = explicitPriceMatch ?? budgetAnswerMatch;

    if (priceMatch) {
      const amount = Number(priceMatch[1]?.replace(',', '.'));
      const multiplier = priceMatch[2] ? 1_000 : 1;

      if (Number.isFinite(amount)) {
        criteria.maxPrice = amount * multiplier;
      }

      const currency = priceMatch[3]?.toLowerCase();
      if (currency) {
        criteria.budgetCurrency = ['bgn', 'лв', 'лева'].includes(currency)
          ? 'BGN'
          : 'EUR';
      }
    }

    if (/\b(suv|джип|кросоувър)\b/i.test(content)) {
      criteria.bodyTypes = ['suv'];
    } else if (/\b(sedan|седан)\b/i.test(content)) {
      criteria.bodyTypes = ['sedan'];
    } else if (/\b(hatchback|хечбек)\b/i.test(content)) {
      criteria.bodyTypes = ['hatchback'];
    }

    const fuels = [
      { pattern: /\b(diesel|дизел)\b/i, value: 'diesel' as const },
      { pattern: /\b(hybrid|хибрид)\b/i, value: 'hybrid' as const },
      { pattern: /\b(electric|електрическ[аио])\b/i, value: 'electric' as const },
      { pattern: /\b(petrol|gasoline|бензин)\b/i, value: 'gasoline' as const },
    ]
      .filter(({ pattern }) => pattern.test(content))
      .map(({ value }) => value);

    if (fuels.length) {
      criteria.fuels = fuels;
    }

    if (/\b(automatic|автоматик|автоматична)\b/i.test(content)) {
      criteria.transmissions = ['automatic'];
    } else if (/\b(manual|ръчн[аи])\b/i.test(content)) {
      criteria.transmissions = ['manual'];
    }

    if (/\b(family|семейств)/i.test(content)) {
      preferences.push('family use');
    }
    if (/\b(mountain|mountains|планин)/i.test(content)) {
      preferences.push('mountain driving');
    }
    if (/\b(city|градск)/i.test(content)) {
      preferences.push('city driving');
    }
    if (/\b(winter|snow|зим|сняг)/i.test(content)) {
      preferences.push('winter driving');
    }

    const needsClarification = criteria.maxPrice === undefined;
    const messages = this.getResponseMessages(conversation);

    return {
      clarificationQuestion: needsClarification
        ? messages.budgetQuestion
        : null,
      criteria,
      needsClarification,
      preferences,
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
