import { BadRequestException } from '@nestjs/common';

import type { RecommendationCandidate } from '../listings/types';
import { AssistantService } from './assistant.service';
import { ASSISTANT_RESPONSE_MESSAGES } from './constants';
import type { VehicleNeedsAnalysis } from './types';

describe('AssistantService', () => {
  const needs: VehicleNeedsAnalysis = {
    clarificationQuestion: null,
    criteria: {
      bodyTypes: ['suv'],
      budgetCurrency: 'EUR',
      maxPrice: 20000,
    },
    needsClarification: false,
    preferences: ['family use', 'winter driving'],
  };

  function candidate(
    id: string,
    overrides: Partial<RecommendationCandidate> = {},
  ): RecommendationCandidate {
    return {
      id,
      title: 'Toyota RAV4',
      brandName: 'Toyota',
      modelName: 'RAV4',
      bodyType: 'suv',
      condition: 'used',
      year: 2020,
      mileageKm: 85000,
      powerHp: 178,
      engineLiters: 2.5,
      emissionStandard: 'euro_6d',
      fuel: 'hybrid',
      transmission: 'automatic',
      location: 'Sofia',
      price: 19500,
      currency: 'EUR',
      features: [
        {
          category: 'safety',
          key: 'isofix',
          label: 'Система ISOFIX',
        },
      ],
      ...overrides,
    };
  }

  function createService() {
    const listingsService = {
      findRecommendationCandidates: jest.fn(),
    };
    const recommendationModel = {
      analyzeNeeds: jest.fn(),
      rankCandidates: jest.fn(),
    };

    return {
      listingsService,
      recommendationModel,
      service: new AssistantService(
        listingsService as never,
        recommendationModel,
      ),
    };
  }

  it('asks for clarification before querying listings', async () => {
    const { listingsService, recommendationModel, service } = createService();
    recommendationModel.analyzeNeeds.mockResolvedValue({
      clarificationQuestion: 'Какъв е максималният ви бюджет?',
      criteria: {},
      needsClarification: true,
      preferences: ['family use'],
    });

    await expect(
      service.recommend({ message: 'Търся семеен автомобил.' }),
    ).resolves.toEqual({
      message: 'Какъв е максималният ви бюджет?',
      recommendations: [],
      status: 'clarifying',
    });
    expect(listingsService.findRecommendationCandidates).not.toHaveBeenCalled();
    expect(recommendationModel.rankCandidates).not.toHaveBeenCalled();
  });

  it('returns a completed response when no listings match', async () => {
    const { listingsService, recommendationModel, service } = createService();
    recommendationModel.analyzeNeeds.mockResolvedValue(needs);
    listingsService.findRecommendationCandidates.mockResolvedValue([]);

    await expect(
      service.recommend({ message: 'Искам SUV до 20 000 EUR.' }),
    ).resolves.toEqual({
      message: ASSISTANT_RESPONSE_MESSAGES.bg.noMatchingListings,
      recommendations: [],
      status: 'completed',
    });
    expect(recommendationModel.rankCandidates).not.toHaveBeenCalled();
  });

  it('uses English for deterministic responses to English messages', async () => {
    const { listingsService, recommendationModel, service } = createService();
    recommendationModel.analyzeNeeds.mockResolvedValue(needs);
    listingsService.findRecommendationCandidates.mockResolvedValue([]);

    await expect(
      service.recommend({ message: 'I need a family SUV under 20,000 EUR.' }),
    ).resolves.toEqual({
      message: ASSISTANT_RESPONSE_MESSAGES.en.noMatchingListings,
      recommendations: [],
      status: 'completed',
    });
  });

  it('returns unique database-backed recommendations and valid highlights', async () => {
    const { listingsService, recommendationModel, service } = createService();
    const firstCandidate = candidate('listing-1');
    const secondCandidate = candidate('listing-2', {
      brandName: 'Skoda',
      modelName: 'Kodiaq',
      title: 'Skoda Kodiaq',
    });
    recommendationModel.analyzeNeeds.mockResolvedValue(needs);
    listingsService.findRecommendationCandidates.mockResolvedValue([
      firstCandidate,
      secondCandidate,
    ]);
    recommendationModel.rankCandidates.mockResolvedValue({
      summary: 'Тези две обяви са най-добрият баланс.',
      recommendations: [
        {
          highlights: ['Система ISOFIX'],
          listingId: 'listing-2',
          reason: 'Просторен и практичен.',
          tradeoffs: ['По-висок разход.'],
        },
        {
          highlights: [],
          listingId: 'listing-2',
          reason: 'Дублиран избор.',
          tradeoffs: [],
        },
        {
          highlights: [],
          listingId: 'invented-listing',
          reason: 'Невалиден избор.',
          tradeoffs: [],
        },
        {
          highlights: ['Измислена екстра'],
          listingId: 'listing-1',
          reason: 'Икономичен хибрид.',
          tradeoffs: ['По-малък багажник.'],
        },
      ],
    });

    await expect(
      service.recommend({
        history: [
          { role: 'assistant', content: '  За какво ще се използва?  ' },
        ],
        message: '  За семейство с две деца.  ',
      }),
    ).resolves.toEqual({
      message: 'Тези две обяви са най-добрият баланс.',
      recommendations: [
        {
          highlights: ['Система ISOFIX'],
          listing: secondCandidate,
          reason: 'Просторен и практичен.',
          tradeoffs: ['По-висок разход.'],
        },
        {
          highlights: [],
          listing: firstCandidate,
          reason: 'Икономичен хибрид.',
          tradeoffs: ['По-малък багажник.'],
        },
      ],
      status: 'completed',
    });
    expect(recommendationModel.analyzeNeeds).toHaveBeenCalledWith([
      { role: 'assistant', content: 'За какво ще се използва?' },
      { role: 'user', content: 'За семейство с две деца.' },
    ]);
    expect(listingsService.findRecommendationCandidates).toHaveBeenCalledWith(
      needs.criteria,
    );
  });

  it('rejects blank and oversized messages before calling Gemini', async () => {
    const { recommendationModel, service } = createService();

    await expect(service.recommend({ message: '   ' })).rejects.toThrow(
      BadRequestException,
    );
    await expect(
      service.recommend({ message: 'a'.repeat(1_001) }),
    ).rejects.toThrow(BadRequestException);
    expect(recommendationModel.analyzeNeeds).not.toHaveBeenCalled();
  });

  it('falls back when Gemini returns no real candidate IDs', async () => {
    const { listingsService, recommendationModel, service } = createService();
    const firstCandidate = candidate('listing-1');
    recommendationModel.analyzeNeeds.mockResolvedValue(needs);
    listingsService.findRecommendationCandidates.mockResolvedValue([
      firstCandidate,
    ]);
    recommendationModel.rankCandidates.mockResolvedValue({
      summary: 'Препоръка.',
      recommendations: [
        {
          highlights: [],
          listingId: 'invented-listing',
          reason: 'Измислена обява.',
          tradeoffs: [],
        },
      ],
    });

    await expect(
      service.recommend({ message: 'Искам семеен SUV.' }),
    ).resolves.toEqual({
      message: ASSISTANT_RESPONSE_MESSAGES.bg.degraded,
      recommendations: [
        {
          highlights: [],
          listing: firstCandidate,
          reason: null,
          tradeoffs: [],
        },
      ],
      status: 'degraded',
    });
  });

  it('falls back when final ranking fails', async () => {
    const { listingsService, recommendationModel, service } = createService();
    const firstCandidate = candidate('listing-1');
    recommendationModel.analyzeNeeds.mockResolvedValue(needs);
    listingsService.findRecommendationCandidates.mockResolvedValue([
      firstCandidate,
    ]);
    recommendationModel.rankCandidates.mockRejectedValue(
      new Error('Gemini timeout'),
    );

    await expect(
      service.recommend({ message: 'Искам семеен SUV.' }),
    ).resolves.toMatchObject({
      recommendations: [{ listing: firstCandidate, reason: null }],
      status: 'degraded',
    });
  });

  it('searches after three clarification questions', async () => {
    const { listingsService, recommendationModel, service } = createService();
    recommendationModel.analyzeNeeds.mockResolvedValue({
      ...needs,
      clarificationQuestion: 'Имате ли предпочитание за гориво?',
      needsClarification: true,
    });
    listingsService.findRecommendationCandidates.mockResolvedValue([]);

    await expect(
      service.recommend({
        history: [
          { role: 'assistant', content: 'Какъв е бюджетът?' },
          { role: 'user', content: '20 000 EUR.' },
          { role: 'assistant', content: 'За какво ще се използва?' },
          { role: 'user', content: 'За семейство.' },
          { role: 'assistant', content: 'Каква скоростна кутия?' },
          { role: 'user', content: 'Без значение.' },
        ],
        message: 'Нямам други изисквания.',
      }),
    ).resolves.toMatchObject({ status: 'completed' });
    expect(listingsService.findRecommendationCandidates).toHaveBeenCalledWith(
      needs.criteria,
    );
  });

  it('redacts obvious personal data before sending it to Gemini', async () => {
    const { recommendationModel, service } = createService();
    recommendationModel.analyzeNeeds.mockResolvedValue({
      clarificationQuestion: 'Какъв е бюджетът ви?',
      criteria: {},
      needsClarification: true,
      preferences: [],
    });

    await service.recommend({
      history: [
        {
          role: 'assistant',
          content: 'Пишете на seller@example.com.',
        },
      ],
      message: 'Телефонът ми е +359 888 123 456.',
    });

    expect(recommendationModel.analyzeNeeds).toHaveBeenCalledWith([
      { role: 'assistant', content: 'Пишете на [email removed].' },
      { role: 'user', content: 'Телефонът ми е [phone removed].' },
    ]);
  });
});
