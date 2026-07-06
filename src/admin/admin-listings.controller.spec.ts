import { AuthenticatedRequest } from '../auth/types';
import { ListingsService } from '../listings/listings.service';
import { AdminListingsController } from './admin-listings.controller';

describe('AdminListingsController', () => {
  function createController() {
    const listingsService = {
      listForModeration: jest.fn(),
      moderate: jest.fn(),
    };
    const request = {
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        name: 'Admin',
        phone: null,
        role: 'admin',
      },
    } as AuthenticatedRequest;

    return {
      controller: new AdminListingsController(
        listingsService as unknown as ListingsService,
      ),
      listingsService,
      request,
    };
  }

  it('lists listings for moderation', async () => {
    const { controller, listingsService } = createController();
    const query = { page: 1, limit: 20, status: 'pending' as const };

    listingsService.listForModeration.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0 },
    });

    await expect(controller.list(query)).resolves.toEqual({
      data: [],
      meta: { page: 1, limit: 20, total: 0 },
    });
    expect(listingsService.listForModeration).toHaveBeenCalledWith(query);
  });

  it('moderates a listing as the current admin', async () => {
    const { controller, listingsService, request } = createController();
    const input = { status: 'rejected' as const };

    listingsService.moderate.mockResolvedValue({
      id: 'listing-1',
      moderatedById: 'admin-1',
      status: 'rejected',
    });

    await expect(
      controller.moderate('listing-1', request, input),
    ).resolves.toMatchObject({
      id: 'listing-1',
      moderatedById: 'admin-1',
      status: 'rejected',
    });
    expect(listingsService.moderate).toHaveBeenCalledWith(
      'listing-1',
      'admin-1',
      'rejected',
    );
  });
});
