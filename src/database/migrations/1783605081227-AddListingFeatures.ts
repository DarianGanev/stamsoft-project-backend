import { MigrationInterface, QueryRunner } from "typeorm";

export class AddListingFeatures1783605081227 implements MigrationInterface {
    name = 'AddListingFeatures1783605081227'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."listing_feature_category" AS ENUM(
                'safety',
                'comfort',
                'other',
                'exterior',
                'protection',
                'interior',
                'specialized'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "listing_features" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "key" text NOT NULL,
                "category" "public"."listing_feature_category" NOT NULL,
                "label" text NOT NULL,
                "sort_order" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_956cd53ff403ef440c97b013302" UNIQUE ("key"),
                CONSTRAINT "PK_88e4fe3e46d21d8b4fdadeb7599" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listing_features_sort_order" ON "listing_features" ("sort_order")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listing_features_category" ON "listing_features" ("category")
        `);
        await queryRunner.query(`
            CREATE TABLE "listing_feature_selections" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "listing_id" uuid NOT NULL,
                "feature_id" uuid NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "uq_listing_feature_selections_listing_feature" UNIQUE ("listing_id", "feature_id"),
                CONSTRAINT "PK_be4842f79611ac77eb275c84ab4" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listing_feature_selections_feature_id" ON "listing_feature_selections" ("feature_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listing_feature_selections_listing_id" ON "listing_feature_selections" ("listing_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "listing_feature_selections"
            ADD CONSTRAINT "FK_b8ea3c8713dc842367c9f3cd068" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "listing_feature_selections"
            ADD CONSTRAINT "FK_54fc0ed21e07993abe279152493" FOREIGN KEY ("feature_id") REFERENCES "listing_features"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "listing_feature_selections" DROP CONSTRAINT "FK_54fc0ed21e07993abe279152493"
        `);
        await queryRunner.query(`
            ALTER TABLE "listing_feature_selections" DROP CONSTRAINT "FK_b8ea3c8713dc842367c9f3cd068"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listing_feature_selections_listing_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listing_feature_selections_feature_id"
        `);
        await queryRunner.query(`
            DROP TABLE "listing_feature_selections"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listing_features_category"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listing_features_sort_order"
        `);
        await queryRunner.query(`
            DROP TABLE "listing_features"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."listing_feature_category"
        `);
    }

}
