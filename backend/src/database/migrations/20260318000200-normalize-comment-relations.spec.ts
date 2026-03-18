import type { QueryRunner } from 'typeorm';

import { NormalizeCommentRelations20260318000200 } from './20260318000200-normalize-comment-relations';

type ColumnTypeMap = Partial<Record<'postId' | 'parentId', string | null>>;

function createMockQueryRunner(options: {
  hasColumns: Record<string, boolean>;
  columnTypes?: ColumnTypeMap;
}) {
  const issuedQueries: string[] = [];
  const columnTypes = options.columnTypes ?? {};

  const queryRunner = {
    hasTable: jest.fn().mockResolvedValue(true),
    hasColumn: jest
      .fn()
      .mockImplementation(
        async (_tableName: string, columnName: string) =>
          options.hasColumns[columnName] ?? false,
      ),
    query: jest.fn().mockImplementation(async (sql: string, params?: string[]) => {
      issuedQueries.push(sql);

      if (sql.includes('SELECT data_type')) {
        const columnName = params?.[1] as keyof ColumnTypeMap | undefined;
        const dataType = columnName ? columnTypes[columnName] : null;

        return dataType ? [{ data_type: dataType }] : [];
      }

      return [];
    }),
  };

  return {
    issuedQueries,
    queryRunner: queryRunner as unknown as QueryRunner,
  };
}

describe('NormalizeCommentRelations20260318000200', () => {
  it('guards legacy text postId backfills with a matching post lookup', async () => {
    const migration = new NormalizeCommentRelations20260318000200();
    const { issuedQueries, queryRunner } = createMockQueryRunner({
      hasColumns: {
        postId: true,
        parentId: false,
        post_id: true,
        parent_id: false,
      },
      columnTypes: {
        postId: 'text',
      },
    });

    await migration.up(queryRunner);

    const backfillQuery = issuedQueries.find((sql) =>
      sql.includes('SET "post_id" = CAST("postId" AS integer)'),
    );

    expect(backfillQuery).toContain('AND EXISTS (');
    expect(backfillQuery).toContain(
      'WHERE "posts"."id" = CAST("comments"."postId" AS integer)',
    );
  });

  it('guards legacy parentId backfills with a matching parent comment lookup', async () => {
    const migration = new NormalizeCommentRelations20260318000200();
    const { issuedQueries, queryRunner } = createMockQueryRunner({
      hasColumns: {
        postId: false,
        parentId: true,
        post_id: false,
        parent_id: true,
      },
      columnTypes: {
        parentId: 'uuid',
      },
    });

    await migration.up(queryRunner);

    const backfillQuery = issuedQueries.find((sql) =>
      sql.includes('SET "parent_id" = "parentId"'),
    );

    expect(backfillQuery).toContain('AND EXISTS (');
    expect(backfillQuery).toContain(
      'WHERE parent_comment."id" = "comments"."parentId"',
    );
  });
});
