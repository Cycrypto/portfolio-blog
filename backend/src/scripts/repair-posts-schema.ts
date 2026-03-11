import { Client } from 'pg';

type ColumnDefinition = {
    name: string;
    definition: string;
    postAddSql?: string[];
};

const POST_TABLE = 'posts';
const CONTENT_TYPE_ENUM = 'posts_contentType_enum';

const REQUIRED_COLUMNS: ColumnDefinition[] = [
    {
        name: 'contentType',
        definition: `"${CONTENT_TYPE_ENUM}" DEFAULT 'markdown'`,
        postAddSql: [
            `UPDATE "${POST_TABLE}" SET "contentType" = 'markdown' WHERE "contentType" IS NULL`,
        ],
    },
    {
        name: 'contentJson',
        definition: 'jsonb',
    },
    {
        name: 'contentHtml',
        definition: 'text',
    },
    {
        name: 'plainText',
        definition: 'text',
    },
    {
        name: 'headings',
        definition: 'jsonb',
    },
    {
        name: 'wordCount',
        definition: 'integer',
    },
];

function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} 환경변수가 필요합니다.`);
    }

    return value;
}

async function ensureEnumExists(client: Client): Promise<void> {
    await client.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_type
                WHERE typname = '${CONTENT_TYPE_ENUM}'
            ) THEN
                CREATE TYPE "${CONTENT_TYPE_ENUM}" AS ENUM ('markdown', 'tiptap');
            END IF;
        END
        $$;
    `);
}

async function getExistingColumns(client: Client): Promise<Set<string>> {
    const result = await client.query<{ column_name: string }>(
        `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = $1
        `,
        [POST_TABLE],
    );

    return new Set(result.rows.map((row) => row.column_name));
}

async function repairPostsSchema(): Promise<void> {
    const client = new Client({
        host: getRequiredEnv('DB_HOST'),
        port: Number.parseInt(process.env.DB_PORT || '5432', 10),
        user: getRequiredEnv('DB_USERNAME'),
        password: getRequiredEnv('DB_PASSWORD'),
        database: getRequiredEnv('DB_DATABASE'),
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });

    await client.connect();

    try {
        await client.query('BEGIN');

        await ensureEnumExists(client);

        const existingColumns = await getExistingColumns(client);
        const missingColumns = REQUIRED_COLUMNS.filter(
            (column) => !existingColumns.has(column.name),
        );

        if (missingColumns.length === 0) {
            console.log(`[repair-posts-schema] "${POST_TABLE}" already has the expected columns.`);
            await client.query('COMMIT');
            return;
        }

        console.log(
            `[repair-posts-schema] Adding missing columns: ${missingColumns
                .map((column) => column.name)
                .join(', ')}`,
        );

        for (const column of missingColumns) {
            await client.query(
                `ALTER TABLE "${POST_TABLE}" ADD COLUMN "${column.name}" ${column.definition}`,
            );

            for (const statement of column.postAddSql ?? []) {
                await client.query(statement);
            }
        }

        await client.query('COMMIT');
        console.log('[repair-posts-schema] Schema repair completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        await client.end();
    }
}

repairPostsSchema().catch((error) => {
    console.error('[repair-posts-schema] Failed:', error);
    process.exit(1);
});
