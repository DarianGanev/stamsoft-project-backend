import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { ListNotificationsQueryDto } from './list-notifications-query.dto';

describe('ListNotificationsQueryDto', () => {
  it('coerces valid pagination query values', () => {
    const query = plainToInstance(ListNotificationsQueryDto, {
      page: '2',
      limit: '20',
    });

    expect(validateSync(query)).toHaveLength(0);
    expect(query).toMatchObject({ page: 2, limit: 20 });
  });

  it('uses notification pagination defaults', () => {
    const query = plainToInstance(ListNotificationsQueryDto, {});

    expect(validateSync(query)).toHaveLength(0);
    expect(query).toMatchObject({ page: 1, limit: 20 });
  });

  it('rejects pages below one and limits above one hundred', () => {
    const query = plainToInstance(ListNotificationsQueryDto, {
      page: '0',
      limit: '101',
    });

    expect(validateSync(query)).toHaveLength(2);
  });
});
