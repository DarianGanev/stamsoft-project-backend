import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddListingMvpFields1782980000003 implements MigrationInterface {
  name = 'AddListingMvpFields1782980000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_type') THEN
          CREATE TYPE fuel_type AS ENUM (
            'gasoline',
            'diesel',
            'hybrid',
            'electric',
            'lpg',
            'cng',
            'other'
          );
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transmission_type') THEN
          CREATE TYPE transmission_type AS ENUM ('manual', 'automatic', 'semi_automatic');
        END IF;
      END $$;

      ALTER TABLE listings
        ADD COLUMN IF NOT EXISTS fuel fuel_type,
        ADD COLUMN IF NOT EXISTS transmission transmission_type,
        ADD COLUMN IF NOT EXISTS location TEXT,
        ADD COLUMN IF NOT EXISTS contact_name TEXT,
        ADD COLUMN IF NOT EXISTS contact_phone TEXT,
        ADD COLUMN IF NOT EXISTS contact_email TEXT;

      CREATE INDEX IF NOT EXISTS idx_listings_price ON listings (price);
      CREATE INDEX IF NOT EXISTS idx_listings_year ON listings (year);
      CREATE INDEX IF NOT EXISTS idx_listings_fuel ON listings (fuel);
      CREATE INDEX IF NOT EXISTS idx_listings_transmission ON listings (transmission);
      CREATE INDEX IF NOT EXISTS idx_listings_location ON listings (location);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_listings_location;
      DROP INDEX IF EXISTS idx_listings_transmission;
      DROP INDEX IF EXISTS idx_listings_fuel;
      DROP INDEX IF EXISTS idx_listings_year;
      DROP INDEX IF EXISTS idx_listings_price;
      ALTER TABLE listings
        DROP COLUMN IF EXISTS contact_email,
        DROP COLUMN IF EXISTS contact_phone,
        DROP COLUMN IF EXISTS contact_name,
        DROP COLUMN IF EXISTS location,
        DROP COLUMN IF EXISTS transmission,
        DROP COLUMN IF EXISTS fuel;
      DROP TYPE IF EXISTS transmission_type;
      DROP TYPE IF EXISTS fuel_type;
    `);
  }
}
