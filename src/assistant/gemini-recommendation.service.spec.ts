import { type GenerateContentParameters, GoogleGenAI } from '@google/genai';
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
  const generateContent = jest.fn<
    Promise<{ text?: string }>,
    [GenerateContentParameters]
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
          models: { generateContent },
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
    generateContent.mockResolvedValue({
      text: JSON.stringify({
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
    const request = generateContent.mock.calls[0]?.[0];
    expect(request?.model).toBe('gemini-test-model');
    expect(typeof request?.contents).toBe('string');
    expect(request?.config?.httpOptions?.timeout).toBe(
      DEFAULT_GEMINI_REQUEST_TIMEOUT_MS,
    );
    expect(request?.config?.responseJsonSchema).toBe(
      VEHICLE_NEEDS_RESPONSE_SCHEMA,
    );
    expect(request?.config?.responseMimeType).toBe('application/json');
  });

  it('parses a structured candidate ranking', async () => {
    const { service } = createService();
    generateContent.mockResolvedValue({
      text: JSON.stringify({
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
    const request = generateContent.mock.calls[0]?.[0];
    expect(request?.config?.responseJsonSchema).toBe(
      CANDIDATE_RANKING_RESPONSE_SCHEMA,
    );
    expect(request?.config?.responseMimeType).toBe('application/json');
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
    generateContent.mockResolvedValue({ text: 'not-json' });

    await expect(service.analyzeNeeds([])).rejects.toThrow(
      new ServiceUnavailableException(
        'AI recommendation service is temporarily unavailable.',
      ),
    );
  });

  it('rejects invalid enum values and inconsistent clarification output', async () => {
    const { service } = createService();
    generateContent
      .mockResolvedValueOnce({
        text: JSON.stringify({
          clarificationQuestion: null,
          criteria: { bodyTypes: ['spaceship'] },
          needsClarification: false,
          preferences: [],
        }),
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
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
    generateContent.mockResolvedValue({
      text: JSON.stringify({
        clarificationQuestion: null,
        criteria: {},
        needsClarification: false,
        preferences: [],
      }),
    });

    await service.analyzeNeeds([]);

    const request = generateContent.mock.calls[0]?.[0];
    expect(request?.config?.httpOptions?.timeout).toBe(5000);
  });

  it('translates SDK failures into a stable service error', async () => {
    const { service } = createService();
    generateContent.mockRejectedValue(new Error('quota exceeded'));

    await expect(service.analyzeNeeds([])).rejects.toThrow(
      new ServiceUnavailableException(
        'AI recommendation service is temporarily unavailable.',
      ),
    );
  });
});
