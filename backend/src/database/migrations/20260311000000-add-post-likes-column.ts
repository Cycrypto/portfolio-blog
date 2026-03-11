import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPostLikesColumn20260311000000 implements MigrationInterface {
    name = "AddPostLikesColumn20260311000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "posts"
            ADD COLUMN IF NOT EXISTS "likes" integer NOT NULL DEFAULT 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "posts"
            DROP COLUMN IF EXISTS "likes"
        `);
    }
}
