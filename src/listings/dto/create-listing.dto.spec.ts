import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { CreateListingDto } from './create-listing.dto';

const validListing = {
  brandId: '11111111-1111-4111-8111-111111111111',
  modelId: '22222222-2222-4222-8222-222222222222',
  price: 18000,
  title: 'BMW 320d',
};

describe('CreateListingDto', () => {
  it('accepts supported vehicle attributes', () => {
    const errors = validateSync(
      plainToInstance(CreateListingDto, {
        ...validListing,
        bodyType: 'sedan',
        condition: 'used',
      }),
    );

    expect(errors).toHaveLength(0);
  });

  it('rejects unsupported vehicle attributes', () => {
    const errors = validateSync(
      plainToInstance(CreateListingDto, {
        ...validListing,
        bodyType: 'spaceship',
        condition: 'unknown',
      }),
    );

    expect(errors).toHaveLength(2);
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['bodyType', 'condition']),
    );
  });

  it('accepts a supported emission standard', () => {
    const errors = validateSync(
      plainToInstance(CreateListingDto, {
        ...validListing,
        emissionStandard: 'euro_6d',
      }),
    );

    expect(errors).toHaveLength(0);
  });

  it('rejects an unsupported emission standard', () => {
    const errors = validateSync(
      plainToInstance(CreateListingDto, {
        ...validListing,
        emissionStandard: 'euro_7',
      }),
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toMatchObject({
      isIn: 'emissionStandard must be one of the following values: euro_1, euro_2, euro_3, euro_4, euro_5, euro_6, euro_6d',
    });
  });
});
