import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotifications1783948754379 implements MigrationInterface {
    name = 'AddNotifications1783948754379'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."notification_type" AS ENUM(
                'listing_changed',
                'listing_photos_changed',
                'listing_unavailable',
                'listing_deleted'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "listing_id" uuid,
                "type" "public"."notification_type" NOT NULL,
                "listing_title" text NOT NULL,
                "listing_image_url" text,
                "changes" jsonb NOT NULL,
                "read_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_notifications_listing_id" ON "notifications" ("listing_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_notifications_user_read_at" ON "notifications" ("user_id", "read_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "idx_notifications_user_created_at" ON "notifications" ("user_id", "created_at")
        `);
        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_notifications_user_created_at"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_notifications_user_read_at"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."idx_notifications_listing_id"
        `);
        await queryRunner.query(`
            DROP TABLE "notifications"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."notification_type"
        `);
    }

}
