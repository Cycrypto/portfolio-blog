import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddProjectExperienceLinks20260318000100
  implements MigrationInterface
{
  name = 'AddProjectExperienceLinks20260318000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasProjectsTable = await queryRunner.hasTable('projects');
    const hasExperiencesTable = await queryRunner.hasTable('experiences');

    if (!hasProjectsTable || !hasExperiencesTable) {
      return;
    }

    const hasColumn = await queryRunner.hasColumn('projects', 'experienceId');
    if (!hasColumn) {
      await queryRunner.addColumn(
        'projects',
        new TableColumn({
          name: 'experienceId',
          type: 'integer',
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_projects_experienceId" ON "projects" ("experienceId")`,
    );

    const table = await queryRunner.getTable('projects');
    const hasForeignKey = table?.foreignKeys.some(
      (foreignKey) =>
        foreignKey.name === 'FK_projects_experienceId_experiences_id',
    );

    if (!hasForeignKey) {
      await queryRunner.createForeignKey(
        'projects',
        new TableForeignKey({
          name: 'FK_projects_experienceId_experiences_id',
          columnNames: ['experienceId'],
          referencedTableName: 'experiences',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasProjectsTable = await queryRunner.hasTable('projects');
    if (!hasProjectsTable) {
      return;
    }

    const table = await queryRunner.getTable('projects');
    const foreignKey = table?.foreignKeys.find(
      (item) => item.name === 'FK_projects_experienceId_experiences_id',
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('projects', foreignKey);
    }

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_projects_experienceId"`);

    if (await queryRunner.hasColumn('projects', 'experienceId')) {
      await queryRunner.dropColumn('projects', 'experienceId');
    }
  }
}
