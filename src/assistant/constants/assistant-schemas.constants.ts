import {
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
} from '../../listings/constants';
import { MAX_ASSISTANT_RECOMMENDATIONS } from './assistant.constants';

export const VEHICLE_NEEDS_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    clarificationQuestion: { type: ['string', 'null'] },
    criteria: {
      type: 'object',
      additionalProperties: false,
      properties: {
        bodyTypes: {
          type: 'array',
          items: { type: 'string', enum: BODY_TYPES },
          uniqueItems: true,
        },
        fuels: {
          type: 'array',
          items: { type: 'string', enum: FUEL_TYPES },
          uniqueItems: true,
        },
        location: { type: 'string' },
        maxMileage: { type: 'number', minimum: 0 },
        maxPrice: { type: 'number', minimum: 0 },
        minPrice: { type: 'number', minimum: 0 },
        minYear: { type: 'integer', minimum: 1886, maximum: 2100 },
        transmissions: {
          type: 'array',
          items: { type: 'string', enum: TRANSMISSION_TYPES },
          uniqueItems: true,
        },
      },
    },
    needsClarification: { type: 'boolean' },
    preferences: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 10,
    },
  },
  required: [
    'clarificationQuestion',
    'criteria',
    'needsClarification',
    'preferences',
  ],
} as const;

export const CANDIDATE_RANKING_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    recommendations: {
      type: 'array',
      maxItems: MAX_ASSISTANT_RECOMMENDATIONS,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          listingId: { type: 'string' },
          reason: { type: 'string' },
          tradeOffs: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 3,
          },
        },
        required: ['listingId', 'reason', 'tradeOffs'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['recommendations', 'summary'],
} as const;
