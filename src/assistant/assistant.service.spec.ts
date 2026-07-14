import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

import type { RecommendationCandidate } from '../listings/types';
import { AssistantService } from './assistant.service';
import { NO_MATCHING_LISTINGS_MESSAGE } from './constants';
import type { VehicleNeedsAnalysis } from './types';

describe('AssistantService', () => {
  const needs: VehicleNeedsAnalysis = {
    clarificationQuestion: null,
    criteria: { maxPrice: 20000, bodyTypes: ['suv'] },
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
      needsClarification: true,
      recommendations: [],
    });
    expect(listingsService.findRecommendationCandidates).not.toHaveBeenCalled();
    expect(recommendationModel.rankCandidates).not.toHaveBeenCalled();
  });

  it('returns a deterministic response when no listings match', async () => {
    const { listingsService, recommendationModel, service } = createService();
    recommendationModel.analyzeNeeds.mockResolvedValue(needs);
    listingsService.findRecommendationCandidates.mockResolvedValue([]);

    await expect(
      service.recommend({ message: 'Искам SUV до 20 000 EUR.' }),
    ).resolves.toEqual({
      message: NO_MATCHING_LISTINGS_MESSAGE,
      needsClarification: false,
      recommendations: [],
    });
    expect(recommendationModel.rankCandidates).not.toHaveBeenCalled();
  });

  it('returns only unique recommendations backed by database candidates', async () => {
    const { listingsService, recommendationModel, service } = createService();
    const firstCandidate = candidate('listing-1');
    const secondCandidate = candidate('listing-2', {
      title: 'Skoda Kodiaq',
      brandName: 'Skoda',
      modelName: 'Kodiaq',
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
          listingId: 'listing-2',
          reason: 'Просторен и практичен.',
          tradeOffs: ['По-висок разход.'],
        },
        {
          listingId: 'listing-2',
          reason: 'Дублиран избор.',
          tradeOffs: [],
        },
        {
          listingId: 'invented-listing',
          reason: 'Невалиден избор.',
          tradeOffs: [],
        },
        {
          listingId: 'listing-1',
          reason: 'Икономичен хибрид.',
          tradeOffs: ['По-малък багажник.'],
        },
      ],
    });

    const result = await service.recommend({
      history: [{ role: 'assistant', content: '  За какво ще се използва?  ' }],
      message: '  За семейство с две деца.  ',
    });

    expect(result).toEqual({
      message: 'Тези две обяви са най-добрият баланс.',
      needsClarification: false,
      recommendations: [
        {
          listing: secondCandidate,
          reason: 'Просторен и практичен.',
          tradeOffs: ['По-висок разход.'],
        },
        {
          listing: firstCandidate,
          reason: 'Икономичен хибрид.',
          tradeOffs: ['По-малък багажник.'],
        },
      ],
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

  it('rejects a ranking that contains no real candidate IDs', async () => {
    const { listingsService, recommendationModel, service } = createService();
    recommendationModel.analyzeNeeds.mockResolvedValue(needs);
    listingsService.findRecommendationCandidates.mockResolvedValue([
      candidate('listing-1'),
    ]);
    recommendationModel.rankCandidates.mockResolvedValue({
      summary: 'Препоръка.',
      recommendations: [
        {
          listingId: 'invented-listing',
          reason: 'Измислена обява.',
          tradeOffs: [],
        },
      ],
    });

    await expect(
      service.recommend({ message: 'Искам семеен SUV.' }),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
