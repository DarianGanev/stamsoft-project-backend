import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddListingImagePrimary1782980000004
  implements MigrationInterface
{
  name = 'AddListingImagePrimary1782980000004';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE images
        ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_images_one_primary_per_listing
        ON images (listing_id)
        WHERE is_primary = TRUE;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_images_one_primary_per_listing;
      ALTER TABLE images DROP COLUMN IF EXISTS is_primary;
    `);
  }
}
