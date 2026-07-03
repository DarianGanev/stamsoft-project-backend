import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddListingEngineFieldsAndEurDefault1782980000007
  implements MigrationInterface
{
  name = 'AddListingEngineFieldsAndEurDefault1782980000007';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE listings
        ADD COLUMN IF NOT EXISTS power_hp INTEGER CHECK (power_hp IS NULL OR power_hp >= 0),
        ADD COLUMN IF NOT EXISTS engine_liters NUMERIC(4, 1) CHECK (engine_liters IS NULL OR engine_liters >= 0);

      ALTER TABLE listings
        ALTER COLUMN currency SET DEFAULT 'EUR';

      UPDATE listings
      SET currency = 'EUR'
      WHERE currency = 'BGN';
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE listings
        ALTER COLUMN currency SET DEFAULT 'BGN';

      ALTER TABLE listings
        DROP COLUMN IF EXISTS engine_liters,
        DROP COLUMN IF EXISTS power_hp;
    `);
  }
}
