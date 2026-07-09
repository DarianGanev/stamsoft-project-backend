import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { ListListingsQueryDto } from './list-listings-query.dto';

const validateQuery = (query: Record<string, unknown>) =>
  validateSync(plainToInstance(ListListingsQueryDto, query));

const getConstraintMessages = (query: Record<string, unknown>) =>
  validateQuery(query).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

describe('ListListingsQueryDto', () => {
  it('accepts valid price and year ranges', () => {
    const errors = validateQuery({
      minPrice: '10000',
      maxPrice: '20000',
      minYear: '2018',
      maxYear: '2024',
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects a minimum price greater than the maximum price', () => {
    expect(
      getConstraintMessages({ minPrice: '20000', maxPrice: '10000' }),
    ).toContain('maxPrice must be greater than or equal to minPrice');
  });

  it('rejects a minimum year greater than the maximum year', () => {
    expect(getConstraintMessages({ minYear: '2024', maxYear: '2018' }))
      .toContain('maxYear must be greater than or equal to minYear');
  });

  it('rejects years outside the supported vehicle range', () => {
    expect(getConstraintMessages({ minYear: '2101' })).toContain(
      'minYear must not be greater than 2100',
    );
    expect(getConstraintMessages({ maxYear: '1885' })).toContain(
      'maxYear must not be less than 1886',
    );
  });
});
