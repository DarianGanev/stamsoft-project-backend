import { ListingEntity } from '../listings/entities';
import { detectListingChanges } from './listing-change-detector';

describe('detectListingChanges', () => {
  function listing(overrides: Partial<ListingEntity> = {}): ListingEntity {
    return {
      brandId: 'brand-1',
      modelId: 'model-1',
      title: 'Volkswagen Golf',
      bodyType: 'hatchback',
      condition: 'used',
      description: 'Clean car',
      year: 2020,
      mileageKm: 50000,
      powerHp: 150,
      engineLiters: '2.0',
      emissionStandard: 'euro6',
      fuel: 'gasoline',
      transmission: 'manual',
      location: 'Sofia',
      contactName: 'Seller',
      contactPhone: '0888123456',
      contactEmail: 'seller@example.com',
      price: '12000.00',
      currency: 'EUR',
      ...overrides,
    } as ListingEntity;
  }

  it('returns no changes for omitted and equivalent values', () => {
    expect(
      detectListingChanges(
        listing(),
        { price: 12000, engineLiters: 2 },
        ['abs', 'air_conditioning'],
      ),
    ).toEqual([]);
  });

  it('returns structured primitive values for several submitted changes', () => {
    expect(
      detectListingChanges(
        listing(),
        {
          title: 'Volkswagen Golf GTI',
          price: 11000,
          transmission: 'automatic',
        },
        [],
      ),
    ).toEqual([
      {
        field: 'title',
        oldValue: 'Volkswagen Golf',
        newValue: 'Volkswagen Golf GTI',
      },
      {
        field: 'transmission',
        oldValue: 'manual',
        newValue: 'automatic',
      },
      { field: 'price', oldValue: 12000, newValue: 11000 },
    ]);
  });

  it('records clearing a nullable vehicle field', () => {
    expect(
      detectListingChanges(listing(), { bodyType: null }, []),
    ).toEqual([
      { field: 'bodyType', oldValue: 'hatchback', newValue: null },
    ]);
  });

  it('compares feature keys without depending on order', () => {
    expect(
      detectListingChanges(
        listing(),
        { featureKeys: ['air_conditioning', 'abs'] },
        ['abs', 'air_conditioning'],
      ),
    ).toEqual([]);
    expect(
      detectListingChanges(
        listing(),
        { featureKeys: ['abs', 'heated_seats'] },
        ['abs'],
      ),
    ).toEqual([
      {
        field: 'features',
        oldValue: 'abs',
        newValue: 'abs,heated_seats',
      },
    ]);
  });
});
