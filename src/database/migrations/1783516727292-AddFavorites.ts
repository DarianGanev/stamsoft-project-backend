import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFavorites1783516727292 implements MigrationInterface {
    name = 'AddFavorites1783516727292'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "favorites" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "listing_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "uq_favorites_user_listing" UNIQUE ("user_id", "listing_id"),
                CONSTRAINT "PK_890818d27523748dd36a4d1bdc8" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_favorites_listing_id" ON "favorites" ("listing_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_favorites_user_id" ON "favorites" ("user_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "favorites"
            ADD CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "favorites"
            ADD CONSTRAINT "FK_74e0699c35d78e39b229d64f34f" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "favorites" DROP CONSTRAINT "FK_74e0699c35d78e39b229d64f34f"
        `);
        await queryRunner.query(`
            ALTER TABLE "favorites" DROP CONSTRAINT "FK_35a6b05ee3b624d0de01ee50593"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_favorites_user_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_favorites_listing_id"
        `);
        await queryRunner.query(`
            DROP TABLE "favorites"
        `);
    }

}
