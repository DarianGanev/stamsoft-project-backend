import { ListingFeaturesController } from './listing-features.controller';
import { ListingFeaturesService } from './listing-features.service';

describe('ListingFeaturesController', () => {
  it('returns grouped listing features', async () => {
    const listingFeaturesService = {
      listGrouped: jest.fn().mockResolvedValue([
        {
          category: 'safety',
          label: 'Безопасност',
          features: [],
        },
      ]),
    };
    const controller = new ListingFeaturesController(
      listingFeaturesService as unknown as ListingFeaturesService,
    );

    await expect(controller.list()).resolves.toEqual([
      {
        category: 'safety',
        label: 'Безопасност',
        features: [],
      },
    ]);
    expect(listingFeaturesService.listGrouped).toHaveBeenCalled();
  });
});
