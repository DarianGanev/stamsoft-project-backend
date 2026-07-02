import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedVehicleBrandsAndModels1782980000005
  implements MigrationInterface
{
  name = 'SeedVehicleBrandsAndModels1782980000005';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH seed_brands (name) AS (
        VALUES
          ('BMW'),
          ('Audi'),
          ('Mercedes-Benz'),
          ('Volkswagen'),
          ('Toyota'),
          ('Honda'),
          ('Ford'),
          ('Opel'),
          ('Renault'),
          ('Peugeot'),
          ('Skoda'),
          ('Hyundai')
      )
      INSERT INTO brands (name)
      SELECT name FROM seed_brands
      ON CONFLICT (name) DO NOTHING;

      WITH seed_models (brand_name, model_name) AS (
        VALUES
          ('BMW', '320d'),
          ('BMW', '520d'),
          ('BMW', 'X3'),
          ('BMW', 'X5'),
          ('Audi', 'A3'),
          ('Audi', 'A4'),
          ('Audi', 'A6'),
          ('Audi', 'Q5'),
          ('Mercedes-Benz', 'C-Class'),
          ('Mercedes-Benz', 'E-Class'),
          ('Mercedes-Benz', 'GLC'),
          ('Mercedes-Benz', 'GLE'),
          ('Volkswagen', 'Golf'),
          ('Volkswagen', 'Passat'),
          ('Volkswagen', 'Tiguan'),
          ('Toyota', 'Corolla'),
          ('Toyota', 'Yaris'),
          ('Toyota', 'RAV4'),
          ('Honda', 'Civic'),
          ('Honda', 'CR-V'),
          ('Ford', 'Focus'),
          ('Ford', 'Mondeo'),
          ('Opel', 'Astra'),
          ('Opel', 'Insignia'),
          ('Renault', 'Clio'),
          ('Renault', 'Megane'),
          ('Peugeot', '308'),
          ('Peugeot', '508'),
          ('Skoda', 'Octavia'),
          ('Skoda', 'Superb'),
          ('Hyundai', 'i30'),
          ('Hyundai', 'Tucson')
      )
      INSERT INTO models (brand_id, name)
      SELECT brands.id, seed_models.model_name
      FROM seed_models
      JOIN brands ON brands.name = seed_models.brand_name
      ON CONFLICT (brand_id, name) DO NOTHING;
    `);
  }

  async down(): Promise<void> {
    return Promise.resolve();
  }
}
