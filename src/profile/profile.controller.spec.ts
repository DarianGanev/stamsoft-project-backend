import { AuthenticatedRequest } from '../auth/types';
import { ListingsService } from '../listings/listings.service';
import { UsersService } from '../users/users.service';
import { ProfileController } from './profile.controller';

describe('ProfileController', () => {
  function createController() {
    const usersService = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    };
    const listingsService = {
      findMine: jest.fn(),
      listMine: jest.fn(),
    };
    const request = {
      user: {
        id: 'user-1',
        email: 'driver@example.com',
        name: 'Driver',
        phone: null,
        role: 'user',
      },
    } as AuthenticatedRequest;

    return {
      controller: new ProfileController(
        usersService as unknown as UsersService,
        listingsService as unknown as ListingsService,
      ),
      listingsService,
      request,
      usersService,
    };
  }

  it('returns current authenticated user profile', async () => {
    const { controller, request, usersService } = createController();

    usersService.getProfile.mockResolvedValue(request.user);

    await expect(controller.getMe(request)).resolves.toEqual(request.user);
    expect(usersService.getProfile).toHaveBeenCalledWith('user-1');
  });

  it('updates current authenticated user profile', async () => {
    const { controller, request, usersService } = createController();
    const input = { name: 'Updated Driver', phone: '+359888123456' };

    usersService.updateProfile.mockResolvedValue({
      ...request.user,
      ...input,
    });

    await expect(controller.updateMe(request, input)).resolves.toMatchObject(
      input,
    );
    expect(usersService.updateProfile).toHaveBeenCalledWith('user-1', input);
  });

  it('lists only current authenticated user listings', async () => {
    const { controller, listingsService, request } = createController();
    const query = { page: 1, limit: 10 };

    listingsService.listMine.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, total: 0 },
    });

    await expect(controller.listMyListings(request, query)).resolves.toEqual({
      data: [],
      meta: { page: 1, limit: 10, total: 0 },
    });
    expect(listingsService.listMine).toHaveBeenCalledWith('user-1', query);
  });

  it('returns one listing owned by the authenticated user', async () => {
    const { controller, listingsService, request } = createController();
    const listing = { id: 'listing-1', status: 'draft', userId: 'user-1' };

    listingsService.findMine.mockResolvedValue(listing);

    await expect(
      controller.findMyListing('listing-1', request),
    ).resolves.toEqual(listing);
    expect(listingsService.findMine).toHaveBeenCalledWith(
      'listing-1',
      'user-1',
    );
  });
});
