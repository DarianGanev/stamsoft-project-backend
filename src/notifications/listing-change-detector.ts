import { UpdateListingDto } from '../listings/dto';
import { ListingEntity } from '../listings/entities';
import {
  ListingNotificationField,
  NotificationChange,
  NotificationChangeValue,
} from './types';

const FIELD_MAPPINGS = [
  { input: 'brandId', entity: 'brandId', field: 'brand' },
  { input: 'modelId', entity: 'modelId', field: 'model' },
  { input: 'title', entity: 'title', field: 'title' },
  { input: 'bodyType', entity: 'bodyType', field: 'bodyType' },
  { input: 'condition', entity: 'condition', field: 'condition' },
  { input: 'description', entity: 'description', field: 'description' },
  { input: 'year', entity: 'year', field: 'year' },
  { input: 'mileageKm', entity: 'mileageKm', field: 'mileageKm' },
  { input: 'powerHp', entity: 'powerHp', field: 'powerHp' },
  { input: 'engineLiters', entity: 'engineLiters', field: 'engineLiters' },
  {
    input: 'emissionStandard',
    entity: 'emissionStandard',
    field: 'emissionStandard',
  },
  { input: 'fuel', entity: 'fuel', field: 'fuel' },
  { input: 'transmission', entity: 'transmission', field: 'transmission' },
  { input: 'location', entity: 'location', field: 'location' },
  { input: 'contactName', entity: 'contactName', field: 'contactName' },
  { input: 'contactPhone', entity: 'contactPhone', field: 'contactPhone' },
  { input: 'contactEmail', entity: 'contactEmail', field: 'contactEmail' },
  { input: 'price', entity: 'price', field: 'price' },
  { input: 'currency', entity: 'currency', field: 'currency' },
] as const satisfies readonly {
  input: keyof UpdateListingDto;
  entity: keyof ListingEntity;
  field: ListingNotificationField;
}[];

export function detectListingChanges(
  before: ListingEntity,
  input: UpdateListingDto,
  beforeFeatureKeys: readonly string[],
): NotificationChange[] {
  const changes: NotificationChange[] = [];

  for (const mapping of FIELD_MAPPINGS) {
    const submittedValue = input[mapping.input];

    if (submittedValue === undefined || Array.isArray(submittedValue)) {
      continue;
    }

    const oldValue = normalizeValue(mapping.field, before[mapping.entity]);
    const newValue = normalizeValue(mapping.field, submittedValue);

    if (oldValue !== newValue) {
      changes.push({ field: mapping.field, oldValue, newValue });
    }
  }

  if (input.featureKeys !== undefined) {
    const oldValue = normalizeFeatureKeys(beforeFeatureKeys);
    const newValue = normalizeFeatureKeys(input.featureKeys);

    if (oldValue !== newValue) {
      changes.push({ field: 'features', oldValue, newValue });
    }
  }

  return changes;
}

function normalizeValue(
  field: ListingNotificationField,
  value: unknown,
): NotificationChangeValue {
  if (value === null) {
    return null;
  }

  if (field === 'price' || field === 'engineLiters') {
    return Number(value);
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  throw new TypeError(`Unsupported notification value for field ${field}.`);
}

function normalizeFeatureKeys(keys: readonly string[]): string {
  return [...new Set(keys)].sort().join(',');
}
