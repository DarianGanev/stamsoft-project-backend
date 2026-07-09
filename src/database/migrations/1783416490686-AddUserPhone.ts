import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserPhone1783416490686 implements MigrationInterface {
    name = 'AddUserPhone1783416490686'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD "phone" text
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "phone"
        `);
    }

}
