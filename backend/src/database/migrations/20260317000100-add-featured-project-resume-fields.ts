import { MigrationInterface, QueryRunner } from 'typeorm';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s가-힣-]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class AddFeaturedProjectResumeFields20260317000100
  implements MigrationInterface
{
  name = 'AddFeaturedProjectResumeFields20260317000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "slug" character varying DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "isFeatured" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "featuredOrder" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "problem" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "approach" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "outcomes" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "impactMetrics" text[] NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "isFeatured" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "featuredOrder" integer NOT NULL DEFAULT 0`,
    );

    const projects: Array<{ id: number; title: string; slug: string | null }> =
      await queryRunner.query(`SELECT "id", "title", "slug" FROM "projects"`);

    const seen = new Set<string>();
    for (const project of projects) {
      const baseSlug = project.slug?.trim() || generateSlug(project.title);
      let nextSlug = baseSlug || `project-${project.id}`;
      let attempt = 2;

      while (seen.has(nextSlug)) {
        nextSlug = `${baseSlug}-${attempt}`;
        attempt += 1;
      }

      seen.add(nextSlug);

      await queryRunner.query(
        `UPDATE "projects" SET "slug" = $1 WHERE "id" = $2`,
        [nextSlug, project.id],
      );
    }

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_projects_slug" ON "projects" ("slug")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_projects_slug"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP COLUMN IF EXISTS "featuredOrder"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP COLUMN IF EXISTS "isFeatured"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP COLUMN IF EXISTS "impactMetrics"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP COLUMN IF EXISTS "outcomes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP COLUMN IF EXISTS "approach"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP COLUMN IF EXISTS "problem"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP COLUMN IF EXISTS "role"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP COLUMN IF EXISTS "featuredOrder"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP COLUMN IF EXISTS "isFeatured"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP COLUMN IF EXISTS "slug"`,
    );
  }
}
