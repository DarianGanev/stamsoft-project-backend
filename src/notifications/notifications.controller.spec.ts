import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  function createController() {
    const notificationsService = {
      list: jest.fn(),
      markAllRead: jest.fn(),
      markRead: jest.fn(),
    };
    const request = { user: { id: 'user-1' } } as never;

    return {
      controller: new NotificationsController(
        notificationsService as unknown as NotificationsService,
      ),
      notificationsService,
      request,
    };
  }

  it('lists notifications for the authenticated user', async () => {
    const { controller, notificationsService, request } = createController();
    const query = { page: 2, limit: 20 };
    notificationsService.list.mockResolvedValue({ data: [] });

    await controller.list(request, query);

    expect(notificationsService.list).toHaveBeenCalledWith('user-1', query);
  });

  it('marks one owned notification as read', async () => {
    const { controller, notificationsService, request } = createController();
    notificationsService.markRead.mockResolvedValue({ id: 'notification-1' });

    await controller.markRead('notification-1', request);

    expect(notificationsService.markRead).toHaveBeenCalledWith(
      'user-1',
      'notification-1',
    );
  });

  it('marks all notifications for the authenticated user as read', async () => {
    const { controller, notificationsService, request } = createController();
    notificationsService.markAllRead.mockResolvedValue({ updated: 2 });

    await controller.markAllRead(request);

    expect(notificationsService.markAllRead).toHaveBeenCalledWith('user-1');
  });
});
