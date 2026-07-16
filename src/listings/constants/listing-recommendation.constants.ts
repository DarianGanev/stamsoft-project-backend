import type { Currency } from '../types';

export const BGN_PER_EUR = 1.95583;
export const DEFAULT_RECOMMENDATION_BUDGET_CURRENCY: Currency = 'EUR';
export const RECOMMENDATION_CANDIDATE_LIMIT = 25;
export const RECOMMENDATION_PRICE_EUR_EXPRESSION =
  `CASE WHEN listing.currency = 'BGN' THEN listing.price / ${BGN_PER_EUR} ELSE listing.price END`;
