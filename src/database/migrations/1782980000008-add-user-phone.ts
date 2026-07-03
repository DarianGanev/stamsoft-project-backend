import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPhone1782980000008 implements MigrationInterface {
  name = 'AddUserPhone1782980000008';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone TEXT;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS phone;
    `);
  }
}
