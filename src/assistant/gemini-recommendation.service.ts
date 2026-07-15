import { GoogleGenAI } from '@google/genai';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  BODY_TYPES,
  CURRENCIES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
} from '../listings/constants';
import type { RecommendationCandidateInput } from '../listings/types';
import {
  CANDIDATE_RANKING_RESPONSE_SCHEMA,
  DEFAULT_GEMINI_REQUEST_TIMEOUT_MS,
  DEFAULT_GEMINI_MODEL,
  MAX_ASSISTANT_HIGHLIGHTS,
  MAX_ASSISTANT_PREFERENCES,
  MAX_ASSISTANT_RECOMMENDATIONS,
  MAX_ASSISTANT_TRADEOFFS,
  MAX_GEMINI_REQUEST_TIMEOUT_MS,
  MIN_GEMINI_REQUEST_TIMEOUT_MS,
  VEHICLE_NEEDS_RESPONSE_SCHEMA,
  VEHICLE_NEEDS_SYSTEM_INSTRUCTION,
  VEHICLE_RANKING_SYSTEM_INSTRUCTION,
} from './constants';
import type {
  AssistantMessage,
  CandidateRanking,
  CandidateRankingResult,
  RankCandidatesInput,
  RecommendationModel,
  VehicleNeedsAnalysis,
} from './types';

@Injectable()
export class GeminiRecommendationService implements RecommendationModel {
  private readonly logger = new Logger(GeminiRecommendationService.name);

  constructor(private readonly configService: ConfigService) {}

  async analyzeNeeds(
    conversation: readonly AssistantMessage[],
  ): Promise<VehicleNeedsAnalysis> {
    const response = await this.generateStructured(
      VEHICLE_NEEDS_SYSTEM_INSTRUCTION,
      JSON.stringify({ conversation }),
      VEHICLE_NEEDS_RESPONSE_SCHEMA,
    );

    return this.parseNeedsAnalysis(response);
  }

  async rankCandidates(
    input: RankCandidatesInput,
  ): Promise<CandidateRankingResult> {
    const response = await this.generateStructured(
      VEHICLE_RANKING_SYSTEM_INSTRUCTION,
      JSON.stringify(input),
      CANDIDATE_RANKING_RESPONSE_SCHEMA,
    );

    return this.parseCandidateRanking(response);
  }

  private async generateStructured(
    systemInstruction: string,
    input: string,
    schema: object,
  ): Promise<unknown> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY')?.trim();

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI recommendation service is not configured.',
      );
    }

    const model =
      this.configService.get<string>('GEMINI_MODEL')?.trim() ||
      DEFAULT_GEMINI_MODEL;
    const timeoutMs = this.getRequestTimeoutMs();

    try {
      const client = new GoogleGenAI({ apiKey });
      const interaction = await client.interactions.create(
        {
          model,
          input,
          system_instruction: systemInstruction,
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema,
          },
          generation_config: {
            max_output_tokens: 1_500,
            temperature: 0.2,
          },
          store: false,
        },
        { timeout_ms: timeoutMs },
      );

      if (!interaction.output_text) {
        throw new TypeError('Gemini returned an empty response.');
      }

      return JSON.parse(interaction.output_text) as unknown;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      this.logGeminiFailure(error);

      throw new ServiceUnavailableException(
        'AI recommendation service is temporarily unavailable.',
      );
    }
  }

  private parseNeedsAnalysis(value: unknown): VehicleNeedsAnalysis {
    const record = this.asRecord(value);
    const criteriaRecord = this.asRecord(record.criteria);
    const criteria: RecommendationCandidateInput = {};

    this.assignOptionalNumber(criteria, criteriaRecord, 'maxMileage');
    this.assignOptionalNumber(criteria, criteriaRecord, 'maxPrice');
    this.assignOptionalNumber(criteria, criteriaRecord, 'minPrice');
    this.assignOptionalNumber(criteria, criteriaRecord, 'minYear');

    if (criteriaRecord.budgetCurrency !== undefined) {
      criteria.budgetCurrency = this.asEnumValue(
        criteriaRecord.budgetCurrency,
        CURRENCIES,
      );
    }

    if (criteriaRecord.location !== undefined) {
      criteria.location = this.asNonEmptyString(criteriaRecord.location);
    }

    criteria.bodyTypes = this.asOptionalEnumArray(
      criteriaRecord.bodyTypes,
      BODY_TYPES,
    );
    criteria.fuels = this.asOptionalEnumArray(criteriaRecord.fuels, FUEL_TYPES);
    criteria.transmissions = this.asOptionalEnumArray(
      criteriaRecord.transmissions,
      TRANSMISSION_TYPES,
    );

    if (
      criteria.minYear !== undefined &&
      (!Number.isInteger(criteria.minYear) ||
        criteria.minYear < 1886 ||
        criteria.minYear > 2100)
    ) {
      throw new ServiceUnavailableException(
        'AI recommendation service returned an invalid response.',
      );
    }

    if (
      criteria.minPrice !== undefined &&
      criteria.maxPrice !== undefined &&
      criteria.minPrice > criteria.maxPrice
    ) {
      throw new ServiceUnavailableException(
        'AI recommendation service returned an invalid response.',
      );
    }

    const needsClarification = this.asBoolean(record.needsClarification);
    const clarificationQuestion =
      record.clarificationQuestion === null
        ? null
        : this.asNonEmptyString(record.clarificationQuestion);

    if (needsClarification !== (clarificationQuestion !== null)) {
      throw new ServiceUnavailableException(
        'AI recommendation service returned an invalid response.',
      );
    }

    return {
      clarificationQuestion,
      criteria,
      needsClarification,
      preferences: this.asStringArray(
        record.preferences,
        MAX_ASSISTANT_PREFERENCES,
      ),
    };
  }

  private parseCandidateRanking(value: unknown): CandidateRankingResult {
    const record = this.asRecord(value);
    const rawRecommendations = record.recommendations;

    if (!Array.isArray(rawRecommendations)) {
      throw new ServiceUnavailableException(
        'AI recommendation service returned an invalid response.',
      );
    }

    const recommendations = rawRecommendations
      .slice(0, MAX_ASSISTANT_RECOMMENDATIONS)
      .map((item): CandidateRanking => {
        const recommendation = this.asRecord(item);

        return {
          highlights: this.asStringArray(
            recommendation.highlights,
            MAX_ASSISTANT_HIGHLIGHTS,
          ),
          listingId: this.asNonEmptyString(recommendation.listingId),
          reason: this.asNonEmptyString(recommendation.reason),
          tradeoffs: this.asStringArray(
            recommendation.tradeoffs,
            MAX_ASSISTANT_TRADEOFFS,
          ),
        };
      });

    return {
      recommendations,
      summary: this.asNonEmptyString(record.summary),
    };
  }

  private assignOptionalNumber(
    target: RecommendationCandidateInput,
    source: Record<string, unknown>,
    key: 'maxMileage' | 'maxPrice' | 'minPrice' | 'minYear',
  ): void {
    const value = source[key];

    if (value === undefined) {
      return;
    }

    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new ServiceUnavailableException(
        'AI recommendation service returned an invalid response.',
      );
    }

    target[key] = value;
  }

  private asOptionalEnumArray<T extends string>(
    value: unknown,
    allowedValues: readonly T[],
  ): T[] | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (
      !Array.isArray(value) ||
      !value.every(
        (item): item is T =>
          typeof item === 'string' && allowedValues.includes(item as T),
      )
    ) {
      throw new ServiceUnavailableException(
        'AI recommendation service returned an invalid response.',
      );
    }

    return [...new Set(value)];
  }

  private asEnumValue<T extends string>(
    value: unknown,
    allowedValues: readonly T[],
  ): T {
    if (typeof value !== 'string' || !allowedValues.includes(value as T)) {
      throw new ServiceUnavailableException(
        'AI recommendation service returned an invalid response.',
      );
    }

    return value as T;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new ServiceUnavailableException(
        'AI recommendation service returned an invalid response.',
      );
    }

    return value as Record<string, unknown>;
  }

  private asBoolean(value: unknown): boolean {
    if (typeof value !== 'boolean') {
      throw new ServiceUnavailableException(
        'AI recommendation service returned an invalid response.',
      );
    }

    return value;
  }

  private asNonEmptyString(value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new ServiceUnavailableException(
        'AI recommendation service returned an invalid response.',
      );
    }

    return value.trim();
  }

  private asStringArray(value: unknown, maxItems: number): string[] {
    if (!Array.isArray(value) || value.length > maxItems) {
      throw new ServiceUnavailableException(
        'AI recommendation service returned an invalid response.',
      );
    }

    return [...new Set(value.map((item) => this.asNonEmptyString(item)))];
  }

  private getRequestTimeoutMs(): number {
    const configuredTimeout = Number(
      this.configService.get<string | number>('GEMINI_TIMEOUT_MS'),
    );

    if (
      Number.isInteger(configuredTimeout) &&
      configuredTimeout >= MIN_GEMINI_REQUEST_TIMEOUT_MS &&
      configuredTimeout <= MAX_GEMINI_REQUEST_TIMEOUT_MS
    ) {
      return configuredTimeout;
    }

    return DEFAULT_GEMINI_REQUEST_TIMEOUT_MS;
  }

  private logGeminiFailure(error: unknown): void {
    const status =
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (typeof error.status === 'number' || typeof error.status === 'string')
        ? ` (status ${error.status})`
        : '';

    this.logger.warn(`Gemini request failed${status}.`);
  }
}
