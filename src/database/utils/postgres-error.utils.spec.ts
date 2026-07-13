import { isUniqueViolation } from './postgres-error.utils';

describe('isUniqueViolation', () => {
  it('recognizes PostgreSQL unique constraint violations', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
  });

  it.each([null, new Error('Database error'), { code: '23503' }])(
    'rejects non-unique database errors',
    (error) => {
      expect(isUniqueViolation(error)).toBe(false);
    },
  );
});
