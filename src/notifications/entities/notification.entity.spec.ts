import { getMetadataArgsStorage } from 'typeorm';

import { NOTIFICATION_TYPES } from '../constants';
import { NotificationEntity } from './notification.entity';

describe('NotificationEntity', () => {
  it('uses stable notification type codes', () => {
    expect(NOTIFICATION_TYPES).toEqual([
      'listing_changed',
      'listing_photos_changed',
      'listing_unavailable',
      'listing_deleted',
    ]);
  });

  it('stores listing snapshots without a listing foreign-key relation', () => {
    const metadata = getMetadataArgsStorage();
    const table = metadata.tables.find(
      ({ target }) => target === NotificationEntity,
    );
    const columns = metadata.columns.filter(
      ({ target }) => target === NotificationEntity,
    );
    const relations = metadata.relations.filter(
      ({ target }) => target === NotificationEntity,
    );

    expect(table?.name).toBe('notifications');
    expect(
      columns.find(({ propertyName }) => propertyName === 'listingId')?.options,
    ).toMatchObject({ name: 'listing_id', nullable: true, type: 'uuid' });
    expect(
      columns.find(({ propertyName }) => propertyName === 'changes')?.options,
    ).toMatchObject({ type: 'jsonb' });
    expect(
      columns.find(({ propertyName }) => propertyName === 'readAt')?.options,
    ).toMatchObject({ name: 'read_at', nullable: true, type: 'timestamptz' });
    expect(
      relations.some(({ propertyName }) => propertyName === 'listing'),
    ).toBe(false);
  });
});
