import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';

describe('SellersController', () => {
  function createController() {
    const sellersService = {
      findPublicSeller: jest.fn(),
      listPublishedListings: jest.fn(),
    };

    return {
      controller: new SellersController(
        sellersService as unknown as SellersService,
      ),
      sellersService,
    };
  }

  it('returns public seller information', async () => {
    const { controller, sellersService } = createController();
    const seller = {
      id: 'seller-1',
      name: 'Seller',
      phone: '+359888123456',
      createdAt: '2026-07-08T08:00:00.000Z',
    };

    sellersService.findPublicSeller.mockResolvedValue(seller);

    await expect(controller.findPublicSeller('seller-1')).resolves.toEqual(
      seller,
    );
    expect(sellersService.findPublicSeller).toHaveBeenCalledWith('seller-1');
  });

  it('lists published seller listings', async () => {
    const { controller, sellersService } = createController();
    const query = { page: 1, limit: 6 };
    const response = {
      data: [],
      meta: { page: 1, limit: 6, total: 0 },
    };

    sellersService.listPublishedListings.mockResolvedValue(response);

    await expect(
      controller.listPublishedListings('seller-1', query),
    ).resolves.toEqual(response);
    expect(sellersService.listPublishedListings).toHaveBeenCalledWith(
      'seller-1',
      query,
    );
  });
});
