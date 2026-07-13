import { AuthenticatedRequest } from '../auth/types';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

describe('FavoritesController', () => {
  function createController() {
    const favoritesService = {
      list: jest.fn(),
      remove: jest.fn(),
      save: jest.fn(),
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
      controller: new FavoritesController(
        favoritesService as unknown as FavoritesService,
      ),
      favoritesService,
      request,
    };
  }

  it('lists favorites for the current user', async () => {
    const { controller, favoritesService, request } = createController();
    const query = { page: 1, limit: 6 };

    favoritesService.list.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 6, total: 0 },
    });

    await expect(controller.list(request, query)).resolves.toEqual({
      data: [],
      meta: { page: 1, limit: 6, total: 0 },
    });
    expect(favoritesService.list).toHaveBeenCalledWith('user-1', query);
  });

  it('saves a favorite for the current user', async () => {
    const { controller, favoritesService, request } = createController();

    favoritesService.save.mockResolvedValue({ id: 'listing-1' });

    await expect(controller.save(request, 'listing-1')).resolves.toEqual({
      id: 'listing-1',
    });
    expect(favoritesService.save).toHaveBeenCalledWith('user-1', 'listing-1');
  });

  it('removes a favorite for the current user', async () => {
    const { controller, favoritesService, request } = createController();

    favoritesService.remove.mockResolvedValue(undefined);

    await expect(controller.remove(request, 'listing-1')).resolves.toBeUndefined();
    expect(favoritesService.remove).toHaveBeenCalledWith('user-1', 'listing-1');
  });
});
