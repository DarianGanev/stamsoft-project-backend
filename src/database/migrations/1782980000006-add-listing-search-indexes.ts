import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddListingSearchIndexes1782980000006
  implements MigrationInterface
{
  name = 'AddListingSearchIndexes1782980000006';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_listings_mileage_km ON listings (mileage_km);
      CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings (created_at);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_listings_created_at;
      DROP INDEX IF EXISTS idx_listings_mileage_km;
    `);
  }
}
