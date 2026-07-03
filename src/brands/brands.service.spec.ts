import { BrandEntity, VehicleModelEntity } from './entities';
import { BrandsService } from './brands.service';

describe('BrandsService', () => {
  function createService() {
    const brandsRepository = {
      find: jest.fn(),
    };
    const modelsRepository = {
      find: jest.fn(),
    };

    return {
      brandsRepository,
      modelsRepository,
      service: new BrandsService(
        brandsRepository as never,
        modelsRepository as never,
      ),
    };
  }

  it('lists brands sorted by name', async () => {
    const { brandsRepository, service } = createService();

    brandsRepository.find.mockResolvedValue([
      { id: 'brand-1', name: 'BMW' },
      { id: 'brand-2', name: 'Audi' },
    ] as BrandEntity[]);

    await expect(service.listBrands()).resolves.toEqual([
      { id: 'brand-1', name: 'BMW' },
      { id: 'brand-2', name: 'Audi' },
    ]);

    expect(brandsRepository.find).toHaveBeenCalledWith({
      order: { name: 'ASC' },
    });
  });

  it('lists models for a brand sorted by name', async () => {
    const { modelsRepository, service } = createService();

    modelsRepository.find.mockResolvedValue([
      { id: 'model-1', brandId: 'brand-1', name: '320d' },
    ] as VehicleModelEntity[]);

    await expect(service.listModels('brand-1')).resolves.toEqual([
      { id: 'model-1', brandId: 'brand-1', name: '320d' },
    ]);

    expect(modelsRepository.find).toHaveBeenCalledWith({
      order: { name: 'ASC' },
      where: { brandId: 'brand-1' },
    });
  });
});
