import { BrandEntity, VehicleModelEntity } from '../brands/entities';
import { AppDataSource } from '../database/data-source';

const vehicleData = [
  { brand: 'BMW', models: ['320d', '520d', 'X3', 'X5'] },
  { brand: 'Audi', models: ['A3', 'A4', 'A6', 'Q5'] },
  {
    brand: 'Mercedes-Benz',
    models: ['C-Class', 'E-Class', 'GLC', 'GLE'],
  },
  { brand: 'Volkswagen', models: ['Golf', 'Passat', 'Tiguan'] },
  { brand: 'Toyota', models: ['Corolla', 'Yaris', 'RAV4'] },
  { brand: 'Honda', models: ['Civic', 'CR-V'] },
  { brand: 'Ford', models: ['Focus', 'Mondeo'] },
  { brand: 'Opel', models: ['Astra', 'Insignia'] },
  { brand: 'Renault', models: ['Clio', 'Megane'] },
  { brand: 'Peugeot', models: ['308', '508'] },
  { brand: 'Skoda', models: ['Octavia', 'Superb'] },
  { brand: 'Hyundai', models: ['i30', 'Tucson'] },
];

export async function seedVehicleData() {
  const dataSource = await AppDataSource.initialize();

  try {
    const brandsRepository = dataSource.getRepository(BrandEntity);
    const modelsRepository = dataSource.getRepository(VehicleModelEntity);

    for (const vehicleBrand of vehicleData) {
      let brand = await brandsRepository.findOne({
        where: { name: vehicleBrand.brand },
      });

      if (!brand) {
        brand = await brandsRepository.save(
          brandsRepository.create({ name: vehicleBrand.brand }),
        );
      }

      for (const modelName of vehicleBrand.models) {
        const modelExists = await modelsRepository.exists({
          where: { brandId: brand.id, name: modelName },
        });

        if (!modelExists) {
          await modelsRepository.save(
            modelsRepository.create({ brandId: brand.id, name: modelName }),
          );
        }
      }
    }
  } finally {
    await dataSource.destroy();
  }
}
