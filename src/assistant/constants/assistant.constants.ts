export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';
export const DEFAULT_GEMINI_REQUEST_TIMEOUT_MS = 15_000;
export const MAX_GEMINI_REQUEST_TIMEOUT_MS = 30_000;
export const MIN_GEMINI_REQUEST_TIMEOUT_MS = 1_000;
export const MAX_ASSISTANT_CLARIFICATION_QUESTIONS = 3;
export const MAX_ASSISTANT_HIGHLIGHTS = 4;
export const MAX_ASSISTANT_HISTORY_MESSAGES = 8;
export const MAX_ASSISTANT_MESSAGE_LENGTH = 1_000;
export const MAX_ASSISTANT_PREFERENCES = 10;
export const MAX_ASSISTANT_RECOMMENDATIONS = 3;
export const MAX_ASSISTANT_TRADEOFFS = 3;
export const DEGRADED_RECOMMENDATIONS_MESSAGE =
  'Намерих подходящи обяви, но временно не мога да ги сравня подробно.';
export const NO_MATCHING_LISTINGS_MESSAGE =
  'В момента няма публикувани обяви, които отговарят на тези изисквания.';
export const REDACTED_EMAIL_PLACEHOLDER = '[email removed]';
export const REDACTED_PHONE_PLACEHOLDER = '[phone removed]';
export const ASSISTANT_EMAIL_PATTERN =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
export const ASSISTANT_PHONE_PATTERN = /\+?\d[\d\s().-]{6,}\d/g;
export const RECOMMENDATION_MODEL = Symbol('RECOMMENDATION_MODEL');
