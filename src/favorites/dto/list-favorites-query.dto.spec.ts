import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { ListFavoritesQueryDto } from './list-favorites-query.dto';

describe('ListFavoritesQueryDto', () => {
  it('accepts valid pagination values', () => {
    const errors = validateSync(
      plainToInstance(ListFavoritesQueryDto, { page: '2', limit: '6' }),
    );

    expect(errors).toHaveLength(0);
  });

  it('rejects invalid pagination values', () => {
    const errors = validateSync(
      plainToInstance(ListFavoritesQueryDto, { page: '0', limit: '101' }),
    );

    expect(errors).toHaveLength(2);
  });
});
