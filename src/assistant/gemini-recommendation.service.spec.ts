import { GoogleGenAI } from '@google/genai';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  CANDIDATE_RANKING_RESPONSE_SCHEMA,
  DEFAULT_GEMINI_REQUEST_TIMEOUT_MS,
  VEHICLE_NEEDS_RESPONSE_SCHEMA,
} from './constants';
import { GeminiRecommendationService } from './gemini-recommendation.service';

jest.mock('@google/genai');

describe('GeminiRecommendationService', () => {
  const createInteraction = jest.fn<
    Promise<{ output_text?: string }>,
    [Record<string, unknown>, Record<string, unknown>]
  >();
  const GoogleGenAIMock = jest.mocked(GoogleGenAI);

  function createService(config: Record<string, string | undefined> = {}) {
    const values = {
      GEMINI_API_KEY: 'test-api-key',
      GEMINI_MODEL: 'gemini-test-model',
      ...config,
    };
    const configService = {
      get: jest.fn((key: string) => values[key as keyof typeof values]),
    };

    GoogleGenAIMock.mockImplementation(
      () =>
        ({
          interactions: { create: createInteraction },
        }) as never,
    );

    return {
      configService,
      service: new GeminiRecommendationService(
        configService as unknown as ConfigService,
      ),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('extracts validated search criteria with structured output', async () => {
    const { service } = createService();
    createInteraction.mockResolvedValue({
      output_text: JSON.stringify({
        clarificationQuestion: null,
        criteria: {
          bodyTypes: ['suv'],
          budgetCurrency: 'EUR',
          fuels: ['hybrid'],
          maxPrice: 20000,
          minYear: 2018,
          transmissions: ['automatic'],
        },
        needsClarification: false,
        preferences: ['family use', 'winter driving'],
      }),
    });

    await expect(
      service.analyzeNeeds([
        { role: 'user', content: 'Семеен SUV до 20 000 EUR.' },
      ]),
    ).resolves.toEqual({
      clarificationQuestion: null,
      criteria: {
        bodyTypes: ['suv'],
        budgetCurrency: 'EUR',
        fuels: ['hybrid'],
        maxPrice: 20000,
        minYear: 2018,
        transmissions: ['automatic'],
      },
      needsClarification: false,
      preferences: ['family use', 'winter driving'],
    });
    expect(GoogleGenAIMock).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
    expect(createInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-test-model',
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: VEHICLE_NEEDS_RESPONSE_SCHEMA,
        },
        store: false,
      }),
      { timeout_ms: DEFAULT_GEMINI_REQUEST_TIMEOUT_MS },
    );
  });

  it('parses a structured candidate ranking', async () => {
    const { service } = createService();
    createInteraction.mockResolvedValue({
      output_text: JSON.stringify({
        recommendations: [
          {
            highlights: ['Система ISOFIX'],
            listingId: 'listing-1',
            reason: 'Подходящ за семейство.',
            tradeoffs: ['По-висок разход.'],
          },
        ],
        summary: 'Най-добрият баланс за нуждите ви.',
      }),
    });

    await expect(
      service.rankCandidates({
        candidates: [],
        conversation: [{ role: 'user', content: 'Семеен автомобил.' }],
        needs: {
          clarificationQuestion: null,
          criteria: {},
          needsClarification: false,
          preferences: ['family use'],
        },
      }),
    ).resolves.toEqual({
      recommendations: [
        {
          highlights: ['Система ISOFIX'],
          listingId: 'listing-1',
          reason: 'Подходящ за семейство.',
          tradeoffs: ['По-висок разход.'],
        },
      ],
      summary: 'Най-добрият баланс за нуждите ви.',
    });
    expect(createInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: CANDIDATE_RANKING_RESPONSE_SCHEMA,
        },
      }),
      expect.any(Object),
    );
  });

  it('does not initialize the SDK without an API key', async () => {
    const { service } = createService({ GEMINI_API_KEY: undefined });

    await expect(service.analyzeNeeds([])).rejects.toThrow(
      new ServiceUnavailableException(
        'AI recommendation service is not configured.',
      ),
    );
    expect(GoogleGenAIMock).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON returned by Gemini', async () => {
    const { service } = createService();
    createInteraction.mockResolvedValue({ output_text: 'not-json' });

    await expect(service.analyzeNeeds([])).rejects.toThrow(
      new ServiceUnavailableException(
        'AI recommendation service is temporarily unavailable.',
      ),
    );
  });

  it('rejects invalid enum values and inconsistent clarification output', async () => {
    const { service } = createService();
    createInteraction
      .mockResolvedValueOnce({
        output_text: JSON.stringify({
          clarificationQuestion: null,
          criteria: { bodyTypes: ['spaceship'] },
          needsClarification: false,
          preferences: [],
        }),
      })
      .mockResolvedValueOnce({
        output_text: JSON.stringify({
          clarificationQuestion: null,
          criteria: {},
          needsClarification: true,
          preferences: [],
        }),
      });

    await expect(service.analyzeNeeds([])).rejects.toThrow(
      ServiceUnavailableException,
    );
    await expect(service.analyzeNeeds([])).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('uses a valid configured request timeout', async () => {
    const { service } = createService({ GEMINI_TIMEOUT_MS: '5000' });
    createInteraction.mockResolvedValue({
      output_text: JSON.stringify({
        clarificationQuestion: null,
        criteria: {},
        needsClarification: false,
        preferences: [],
      }),
    });

    await service.analyzeNeeds([]);

    expect(createInteraction).toHaveBeenCalledWith(expect.any(Object), {
      timeout_ms: 5000,
    });
  });

  it('translates SDK failures into a stable service error', async () => {
    const { service } = createService();
    createInteraction.mockRejectedValue(new Error('quota exceeded'));

    await expect(service.analyzeNeeds([])).rejects.toThrow(
      new ServiceUnavailableException(
        'AI recommendation service is temporarily unavailable.',
      ),
    );
  });
});
