import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1783410838319 implements MigrationInterface {
    name = 'InitialSchema1783410838319'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."user_role" AS ENUM('user', 'admin')
        `);
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" text NOT NULL,
                "name" text NOT NULL,
                "password_hash" text NOT NULL,
                "role" "public"."user_role" NOT NULL DEFAULT 'user',
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."fuel_type" AS ENUM(
                'gasoline',
                'diesel',
                'hybrid',
                'electric',
                'lpg',
                'cng',
                'other'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."transmission_type" AS ENUM('manual', 'automatic', 'semi_automatic')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."listing_status" AS ENUM('draft', 'published', 'sold', 'archived')
        `);
        await queryRunner.query(`
            CREATE TABLE "listings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "brand_id" uuid NOT NULL,
                "model_id" uuid NOT NULL,
                "title" text NOT NULL,
                "description" text,
                "year" smallint,
                "mileage_km" integer,
                "power_hp" integer,
                "engine_liters" numeric(4, 1),
                "fuel" "public"."fuel_type",
                "transmission" "public"."transmission_type",
                "location" text,
                "contact_name" text,
                "contact_phone" text,
                "contact_email" text,
                "price" numeric(12, 2) NOT NULL,
                "currency" character(3) NOT NULL DEFAULT 'EUR',
                "status" "public"."listing_status" NOT NULL DEFAULT 'draft',
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "chk_listings_price" CHECK ("price" >= 0),
                CONSTRAINT "chk_listings_engine_liters" CHECK (
                    "engine_liters" IS NULL
                    OR "engine_liters" >= 0
                ),
                CONSTRAINT "chk_listings_power_hp" CHECK (
                    "power_hp" IS NULL
                    OR "power_hp" >= 0
                ),
                CONSTRAINT "chk_listings_mileage_km" CHECK (
                    "mileage_km" IS NULL
                    OR "mileage_km" >= 0
                ),
                CONSTRAINT "chk_listings_year" CHECK (
                    "year" IS NULL
                    OR "year" BETWEEN 1886 AND 2100
                ),
                CONSTRAINT "PK_520ecac6c99ec90bcf5a603cdcb" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listings_created_at" ON "listings" ("created_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listings_mileage_km" ON "listings" ("mileage_km")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listings_location" ON "listings" ("location")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listings_transmission" ON "listings" ("transmission")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listings_fuel" ON "listings" ("fuel")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listings_year" ON "listings" ("year")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listings_price" ON "listings" ("price")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listings_status" ON "listings" ("status")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listings_model_id" ON "listings" ("model_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listings_brand_id" ON "listings" ("brand_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_listings_user_id" ON "listings" ("user_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "images" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "listing_id" uuid NOT NULL,
                "image_url" text NOT NULL,
                "alt_text" text,
                "sort_order" integer NOT NULL DEFAULT '0',
                "is_primary" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "chk_images_sort_order" CHECK ("sort_order" >= 0),
                CONSTRAINT "PK_1fe148074c6a1a91b63cb9ee3c9" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_images_one_primary_per_listing" ON "images" ("listing_id")
            WHERE is_primary = true
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_images_listing_id" ON "images" ("listing_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "models" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "brand_id" uuid NOT NULL,
                "name" text NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ef9ed7160ea69013636466bf2d5" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_models_id_brand_id" ON "models" ("id", "brand_id")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_models_brand_id_name" ON "models" ("brand_id", "name")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_models_brand_id" ON "models" ("brand_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "brands" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" text NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_96db6bbbaa6f23cad26871339b6" UNIQUE ("name"),
                CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD CONSTRAINT "FK_3f1539dda02eba4738ac5859ded" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD CONSTRAINT "FK_a67c8500fbe904a7e812232bc1f" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "listings"
            ADD CONSTRAINT "FK_da58ca4acc902c2e7c8dd175a11" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "images"
            ADD CONSTRAINT "FK_b8e2bb12f787b377d9f7e31cd9e" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "models"
            ADD CONSTRAINT "FK_f2b1673c6665816ff753e81d1a0" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "models" DROP CONSTRAINT "FK_f2b1673c6665816ff753e81d1a0"
        `);
        await queryRunner.query(`
            ALTER TABLE "images" DROP CONSTRAINT "FK_b8e2bb12f787b377d9f7e31cd9e"
        `);
        await queryRunner.query(`
            ALTER TABLE "listings" DROP CONSTRAINT "FK_da58ca4acc902c2e7c8dd175a11"
        `);
        await queryRunner.query(`
            ALTER TABLE "listings" DROP CONSTRAINT "FK_a67c8500fbe904a7e812232bc1f"
        `);
        await queryRunner.query(`
            ALTER TABLE "listings" DROP CONSTRAINT "FK_3f1539dda02eba4738ac5859ded"
        `);
        await queryRunner.query(`
            DROP TABLE "brands"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_models_brand_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_models_brand_id_name"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_models_id_brand_id"
        `);
        await queryRunner.query(`
            DROP TABLE "models"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_images_listing_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_images_one_primary_per_listing"
        `);
        await queryRunner.query(`
            DROP TABLE "images"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listings_user_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listings_brand_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listings_model_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listings_status"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listings_price"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listings_year"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listings_fuel"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listings_transmission"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listings_location"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listings_mileage_km"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_listings_created_at"
        `);
        await queryRunner.query(`
            DROP TABLE "listings"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."listing_status"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."transmission_type"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."fuel_type"
        `);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_role"
        `);
    }

}
