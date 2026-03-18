import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ExpandExperiencesToTypedEntries20260318000000
  implements MigrationInterface
{
  name = 'ExpandExperiencesToTypedEntries20260318000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTypeColumn = await queryRunner.hasColumn('experiences', 'type');
    if (!hasTypeColumn) {
      await queryRunner.addColumn(
        'experiences',
        new TableColumn({
          name: 'type',
          type: 'character varying',
          isNullable: false,
          default: `'career'`,
        }),
      );
    }

    const hasOrganizationColumn = await queryRunner.hasColumn(
      'experiences',
      'organization',
    );
    if (!hasOrganizationColumn) {
      await queryRunner.addColumn(
        'experiences',
        new TableColumn({
          name: 'organization',
          type: 'character varying',
          isNullable: true,
        }),
      );
    }

    const hasCompanyColumn = await queryRunner.hasColumn('experiences', 'company');
    if (hasCompanyColumn) {
      await queryRunner.query(`
        UPDATE "experiences"
        SET "organization" = COALESCE(NULLIF("organization", ''), "company")
        WHERE COALESCE(NULLIF("organization", ''), '') = ''
      `);
    }

    await queryRunner.query(`
      UPDATE "experiences"
      SET "type" = 'career'
      WHERE COALESCE(NULLIF("type", ''), '') = ''
    `);

    await queryRunner.query(`
      UPDATE "experiences"
      SET "organization" = ''
      WHERE "organization" IS NULL
    `);

    await queryRunner.query(
      `ALTER TABLE "experiences" ALTER COLUMN "organization" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "experiences" ALTER COLUMN "organization" SET DEFAULT ''`,
    );

    if (hasCompanyColumn) {
      await queryRunner.dropColumn('experiences', 'company');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasCompanyColumn = await queryRunner.hasColumn('experiences', 'company');
    if (!hasCompanyColumn) {
      await queryRunner.addColumn(
        'experiences',
        new TableColumn({
          name: 'company',
          type: 'character varying',
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(`
      UPDATE "experiences"
      SET "company" = COALESCE(NULLIF("company", ''), "organization")
      WHERE COALESCE(NULLIF("company", ''), '') = ''
    `);

    await queryRunner.query(`
      UPDATE "experiences"
      SET "company" = ''
      WHERE "company" IS NULL
    `);

    await queryRunner.query(
      `ALTER TABLE "experiences" ALTER COLUMN "company" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "experiences" ALTER COLUMN "company" SET DEFAULT ''`,
    );

    if (await queryRunner.hasColumn('experiences', 'organization')) {
      await queryRunner.dropColumn('experiences', 'organization');
    }

    if (await queryRunner.hasColumn('experiences', 'type')) {
      await queryRunner.dropColumn('experiences', 'type');
    }
  }
}
