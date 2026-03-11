import "reflect-metadata";

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { DataSource } from "typeorm";

function loadLocalEnvFile() {
    const envPath = join(process.cwd(), ".env");
    if (!existsSync(envPath)) {
        return;
    }

    const envLines = readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of envLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith("#")) {
            continue;
        }

        const separatorIndex = trimmedLine.indexOf("=");
        if (separatorIndex < 0) {
            continue;
        }

        const key = trimmedLine.slice(0, separatorIndex).trim();
        const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

loadLocalEnvFile();

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) {
        return defaultValue;
    }

    return value.toLowerCase() === "true";
}

const isProduction = process.env.NODE_ENV === "production";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [join(__dirname, "../**/*.entity{.ts,.js}")],
    migrations: [join(__dirname, "migrations/*{.ts,.js}")],
    synchronize: false,
    logging: parseBooleanEnv(process.env.DB_LOGGING, !isProduction),
});

export default AppDataSource;
