import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  extractExperienceHighlights,
  extractSummaryBullets,
  normalizeResumeStringArray,
} from '../../common/utils/resume-content.util';

type ResumeSettingsRow = {
  id: number;
  headline: string;
  summaryBullets: string[] | null;
  featuredSkillNames: string[] | null;
};

type ProfileRow = {
  subtitle: string;
  about: string;
  description: string;
  skills: Array<{ name?: string; level?: number }>;
};

type ExperienceRow = {
  id: number;
  description: string | null;
  resumeHighlights: string[] | null;
};

export class AddResumePdfContentStructure20260319000100
  implements MigrationInterface
{
  name = 'AddResumePdfContentStructure20260319000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "resume_settings" ADD COLUMN IF NOT EXISTS "summaryBullets" text[] NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "resume_settings" ADD COLUMN IF NOT EXISTS "featuredSkillNames" text[] NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "resumeVisible" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "resumeOrder" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "experiences" ADD COLUMN IF NOT EXISTS "resumeHighlights" text[] NOT NULL DEFAULT '{}'`,
    );

    const [profile] = (await queryRunner.query(
      `SELECT "subtitle", "about", "description", "skills" FROM "profiles" ORDER BY "id" ASC LIMIT 1`,
    )) as ProfileRow[];

    const settingsRows = (await queryRunner.query(
      `SELECT "id", "headline", "summaryBullets", "featuredSkillNames" FROM "resume_settings" ORDER BY "id" ASC`,
    )) as ResumeSettingsRow[];

    const featuredSkillNames = normalizeResumeStringArray(
      [...(profile?.skills || [])]
        .sort((left, right) => (right?.level || 0) - (left?.level || 0))
        .map((skill) => skill?.name || ''),
      8,
    );

    for (const settings of settingsRows) {
      const summaryBullets =
        settings.summaryBullets && settings.summaryBullets.length > 0
          ? normalizeResumeStringArray(settings.summaryBullets, 3)
          : extractSummaryBullets(
              [
                settings.headline,
                profile?.subtitle || '',
                profile?.about || '',
                profile?.description || '',
              ],
              3,
            );

      const normalizedSkills =
        settings.featuredSkillNames && settings.featuredSkillNames.length > 0
          ? normalizeResumeStringArray(settings.featuredSkillNames, 8)
          : featuredSkillNames;

      await queryRunner.query(
        `
          UPDATE "resume_settings"
          SET "summaryBullets" = $2,
              "featuredSkillNames" = $3
          WHERE "id" = $1
        `,
        [settings.id, summaryBullets, normalizedSkills],
      );
    }

    const experiences = (await queryRunner.query(
      `
        SELECT "id", "description", "resumeHighlights"
        FROM "experiences"
        ORDER BY
          CASE WHEN COALESCE(NULLIF("endDate", ''), '') = '' THEN 0 ELSE 1 END ASC,
          COALESCE(NULLIF("endDate", ''), "startDate") DESC,
          "startDate" DESC,
          "id" DESC
      `,
    )) as ExperienceRow[];

    for (const [index, experience] of experiences.entries()) {
      const resumeHighlights =
        experience.resumeHighlights && experience.resumeHighlights.length > 0
          ? normalizeResumeStringArray(experience.resumeHighlights, 2)
          : extractExperienceHighlights([experience.description], 2);

      await queryRunner.query(
        `
          UPDATE "experiences"
          SET "resumeVisible" = true,
              "resumeOrder" = $2,
              "resumeHighlights" = $3
          WHERE "id" = $1
        `,
        [experience.id, index, resumeHighlights],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "experiences" DROP COLUMN IF EXISTS "resumeHighlights"`,
    );
    await queryRunner.query(
      `ALTER TABLE "experiences" DROP COLUMN IF EXISTS "resumeOrder"`,
    );
    await queryRunner.query(
      `ALTER TABLE "experiences" DROP COLUMN IF EXISTS "resumeVisible"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resume_settings" DROP COLUMN IF EXISTS "featuredSkillNames"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resume_settings" DROP COLUMN IF EXISTS "summaryBullets"`,
    );
  }
}
