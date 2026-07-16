import { MigrationInterface, QueryRunner } from "typeorm";

export class AddListingEmissionStandard1783689414417 implements MigrationInterface {
    name = 'AddListingEmissionStandard1783689414417'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."emission_standard" AS ENUM(
                'euro_1',
                'euro_2',
                'euro_3',
                'euro_4',
                'euro_5',
                'euro_6',
                'euro_6d'
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD "emission_standard" "public"."emission_standard"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "listings" DROP COLUMN "emission_standard"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."emission_standard"
        `);
    }

}
