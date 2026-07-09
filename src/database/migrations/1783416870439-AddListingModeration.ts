import { MigrationInterface, QueryRunner } from "typeorm";

export class AddListingModeration1783416870439 implements MigrationInterface {
    name = 'AddListingModeration1783416870439'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD "moderated_at" TIMESTAMP WITH TIME ZONE
        `);
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD "moderated_by_id" uuid
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."listing_status"
            ADD VALUE 'pending'
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."listing_status"
            ADD VALUE 'rejected'
        `);
        await queryRunner.query(`
            ALTER TABLE "listings"
            ALTER COLUMN "status"
            SET DEFAULT 'pending'
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listings_moderated_by_id" ON "listings" ("moderated_by_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD CONSTRAINT "FK_b84ec5dbd88b42c8f56d647eabb" FOREIGN KEY ("moderated_by_id") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "listings" DROP CONSTRAINT "FK_b84ec5dbd88b42c8f56d647eabb"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listings_moderated_by_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "listings"
            ALTER COLUMN "status"
            SET DEFAULT 'draft'
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."listing_status_old" AS ENUM('draft', 'published', 'sold', 'archived')
        `);
        await queryRunner.query(`
            ALTER TABLE "listings"
            ALTER COLUMN "status" TYPE "public"."listing_status_old" USING "status"::"text"::"public"."listing_status_old"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."listing_status"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."listing_status_old"
            RENAME TO "listing_status"
        `);
        await queryRunner.query(`
            ALTER TABLE "listings" DROP COLUMN "moderated_by_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "listings" DROP COLUMN "moderated_at"
        `);
    }

}
