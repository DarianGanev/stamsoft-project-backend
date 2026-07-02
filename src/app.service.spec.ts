import { AppService } from './app.service';
import { UsersService } from './users/users.service';

describe('AppService', () => {
  it('returns health and safe account-check data', async () => {
    const usersService = {
      countUsers: jest.fn().mockResolvedValue(1),
      findRecentUsers: jest.fn().mockResolvedValue([
        {
          id: 'user-1',
          email: 'driver@example.com',
          name: 'Driver',
          role: 'user',
        },
      ]),
    } as unknown as UsersService;

    const service = new AppService(usersService);

    await expect(service.getHealth()).resolves.toEqual({
      status: 'ok',
      service: 'carauction-backend',
      accounts: {
        total: 1,
        recent: [
          {
            id: 'user-1',
            email: 'driver@example.com',
            name: 'Driver',
            role: 'user',
          },
        ],
      },
    });
  });
});
