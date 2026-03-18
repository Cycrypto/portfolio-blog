import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeCommentRelations20260318000200
  implements MigrationInterface
{
  name = 'NormalizeCommentRelations20260318000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('comments'))) {
      return;
    }

    const hasLegacyPostId = await queryRunner.hasColumn('comments', 'postId');
    const hasLegacyParentId = await queryRunner.hasColumn(
      'comments',
      'parentId',
    );
    const hasRelationPostId = await queryRunner.hasColumn(
      'comments',
      'post_id',
    );
    const hasRelationParentId = await queryRunner.hasColumn(
      'comments',
      'parent_id',
    );
    const legacyPostIdType = hasLegacyPostId
      ? await this.getColumnDataType(queryRunner, 'comments', 'postId')
      : null;
    const legacyParentIdType = hasLegacyParentId
      ? await this.getColumnDataType(queryRunner, 'comments', 'parentId')
      : null;

    if (hasRelationPostId) {
      if (hasLegacyPostId) {
        if (
          legacyPostIdType === 'character varying' ||
          legacyPostIdType === 'text'
        ) {
          await queryRunner.query(`
            DELETE FROM "comments"
            WHERE NULLIF("postId", '') IS NULL
              OR "postId" !~ '^[0-9]+$'
              OR NOT EXISTS (
                SELECT 1
                FROM "posts"
                WHERE "posts"."id" = CAST("comments"."postId" AS integer)
              )
          `);
          await queryRunner.query(`
            UPDATE "comments"
            SET "post_id" = CAST("postId" AS integer)
            WHERE "post_id" IS NULL
              AND NULLIF("postId", '') IS NOT NULL
              AND "postId" ~ '^[0-9]+$'
              AND EXISTS (
                SELECT 1
                FROM "posts"
                WHERE "posts"."id" = CAST("comments"."postId" AS integer)
              )
          `);
        } else {
          await queryRunner.query(`
            DELETE FROM "comments"
            WHERE NOT EXISTS (
              SELECT 1
              FROM "posts"
              WHERE "posts"."id" = "comments"."postId"
            )
          `);
          await queryRunner.query(`
            UPDATE "comments"
            SET "post_id" = "postId"
            WHERE "post_id" IS NULL
              AND EXISTS (
                SELECT 1
                FROM "posts"
                WHERE "posts"."id" = "comments"."postId"
              )
          `);
        }
      }

      await queryRunner.query(`
        DELETE FROM "comments"
        WHERE "post_id" IS NULL
          OR NOT EXISTS (
            SELECT 1
            FROM "posts"
            WHERE "posts"."id" = "comments"."post_id"
          )
      `);
    } else if (hasLegacyPostId) {
      if (
        legacyPostIdType === 'character varying' ||
        legacyPostIdType === 'text'
      ) {
        await queryRunner.query(`
          DELETE FROM "comments"
          WHERE NULLIF("postId", '') IS NULL
            OR "postId" !~ '^[0-9]+$'
            OR NOT EXISTS (
              SELECT 1
              FROM "posts"
              WHERE "posts"."id" = CAST("comments"."postId" AS integer)
            )
        `);
        await queryRunner.query(`
          ALTER TABLE "comments"
          ALTER COLUMN "postId" TYPE integer
          USING CAST(NULLIF("postId", '') AS integer)
        `);
      } else {
        await queryRunner.query(`
          DELETE FROM "comments"
          WHERE NOT EXISTS (
            SELECT 1
            FROM "posts"
            WHERE "posts"."id" = "comments"."postId"
          )
        `);
      }
    }

    if (hasLegacyParentId) {
      if (
        legacyParentIdType === 'character varying' ||
        legacyParentIdType === 'text'
      ) {
        await queryRunner.query(`
          DELETE FROM "comments"
          WHERE NULLIF("parentId", '') IS NOT NULL
            AND (
              "parentId" !~ '^[0-9a-fA-F-]{36}$'
              OR NOT EXISTS (
                SELECT 1
                FROM "comments" parent_comment
                WHERE parent_comment."id" = CAST("comments"."parentId" AS uuid)
              )
            )
        `);
      } else {
        await queryRunner.query(`
          DELETE FROM "comments"
          WHERE "parentId" IS NOT NULL
            AND NOT EXISTS (
              SELECT 1
              FROM "comments" parent_comment
              WHERE parent_comment."id" = "comments"."parentId"
            )
        `);
      }
    }

    if (hasRelationParentId) {
      if (hasLegacyParentId) {
        if (
          legacyParentIdType === 'character varying' ||
          legacyParentIdType === 'text'
        ) {
          await queryRunner.query(`
            UPDATE "comments"
            SET "parent_id" = CAST("parentId" AS uuid)
            WHERE "parent_id" IS NULL
              AND NULLIF("parentId", '') IS NOT NULL
              AND "parentId" ~ '^[0-9a-fA-F-]{36}$'
              AND EXISTS (
                SELECT 1
                FROM "comments" parent_comment
                WHERE parent_comment."id" = CAST("comments"."parentId" AS uuid)
              )
          `);
        } else {
          await queryRunner.query(`
            UPDATE "comments"
            SET "parent_id" = "parentId"
            WHERE "parent_id" IS NULL
              AND "parentId" IS NOT NULL
              AND EXISTS (
                SELECT 1
                FROM "comments" parent_comment
                WHERE parent_comment."id" = "comments"."parentId"
              )
          `);
        }
      }

      await queryRunner.query(`
        DELETE FROM "comments"
        WHERE "parent_id" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM "comments" parent_comment
            WHERE parent_comment."id" = "comments"."parent_id"
          )
      `);
    } else if (hasLegacyParentId) {
      if (
        legacyParentIdType === 'character varying' ||
        legacyParentIdType === 'text'
      ) {
        await queryRunner.query(`
          ALTER TABLE "comments"
          ALTER COLUMN "parentId" TYPE uuid
          USING CAST(NULLIF("parentId", '') AS uuid)
        `);
      }
    }

    if (hasRelationPostId && hasLegacyPostId) {
      await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "postId"`);
    }

    if (hasRelationParentId && hasLegacyParentId) {
      await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "parentId"`);
    }

    const hasCanonicalPostId = await queryRunner.hasColumn(
      'comments',
      'postId',
    );
    const hasCanonicalParentId = await queryRunner.hasColumn(
      'comments',
      'parentId',
    );

    if (!hasCanonicalPostId && hasRelationPostId) {
      await queryRunner.query(
        `ALTER TABLE "comments" RENAME COLUMN "post_id" TO "postId"`,
      );
    }

    if (!hasCanonicalParentId && hasRelationParentId) {
      await queryRunner.query(
        `ALTER TABLE "comments" RENAME COLUMN "parent_id" TO "parentId"`,
      );
    }

    await queryRunner.query(`
      ALTER TABLE "comments"
      ALTER COLUMN "postId" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_comments_postId"
      ON "comments" ("postId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_comments_parentId"
      ON "comments" ("parentId")
    `);

    await queryRunner.query(`
      UPDATE "posts"
      SET "comments" = 0
    `);
    await queryRunner.query(`
      UPDATE "posts" post
      SET "comments" = active_comments.count
      FROM (
        SELECT "postId", COUNT(*)::integer AS count
        FROM "comments"
        WHERE "isDeleted" = false
        GROUP BY "postId"
      ) active_comments
      WHERE post."id" = active_comments."postId"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('comments'))) {
      return;
    }

    const hasPostId = await queryRunner.hasColumn('comments', 'postId');
    const hasParentId = await queryRunner.hasColumn('comments', 'parentId');
    const hasRelationPostId = await queryRunner.hasColumn(
      'comments',
      'post_id',
    );
    const hasRelationParentId = await queryRunner.hasColumn(
      'comments',
      'parent_id',
    );

    if (hasPostId && !hasRelationPostId) {
      await queryRunner.query(`
        ALTER TABLE "comments"
        ADD COLUMN "post_id" integer
      `);
      await queryRunner.query(`
        UPDATE "comments"
        SET "post_id" = "postId"
      `);
    }

    if (hasParentId && !hasRelationParentId) {
      await queryRunner.query(`
        ALTER TABLE "comments"
        ADD COLUMN "parent_id" uuid
      `);
      await queryRunner.query(`
        UPDATE "comments"
        SET "parent_id" = "parentId"
      `);
    }

    if (hasPostId) {
      await queryRunner.query(`
        ALTER TABLE "comments"
        ALTER COLUMN "postId" TYPE character varying
        USING "postId"::text
      `);
    }

    if (hasParentId) {
      await queryRunner.query(`
        ALTER TABLE "comments"
        ALTER COLUMN "parentId" TYPE character varying
        USING "parentId"::text
      `);
    }
  }

  private async getColumnDataType(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<string | null> {
    const result = await queryRunner.query(
      `
        SELECT data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
      `,
      [tableName, columnName],
    );

    return result[0]?.data_type ?? null;
  }
}
