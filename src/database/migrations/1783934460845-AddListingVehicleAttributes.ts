import { MigrationInterface, QueryRunner } from "typeorm";

export class AddListingVehicleAttributes1783934460845 implements MigrationInterface {
    name = 'AddListingVehicleAttributes1783934460845'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."listing_body_type" AS ENUM('sedan', 'suv', 'hatchback')
        `);
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD "body_type" "public"."listing_body_type"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."vehicle_condition" AS ENUM('new', 'used')
        `);
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD "condition" "public"."vehicle_condition"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "listings" DROP COLUMN "condition"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."vehicle_condition"
        `);
        await queryRunner.query(`
            ALTER TABLE "listings" DROP COLUMN "body_type"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."listing_body_type"
        `);
    }

}
