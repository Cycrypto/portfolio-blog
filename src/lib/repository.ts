import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defaultHome } from "@/data/portfolio";
import {
  AppError,
  homeSchema,
  homeUpdateSchema,
  parseInput,
} from "./validation";
import type { HomeContent, HomeDocument } from "./types";

// Carry over content saved by the former home/intro editor into the Pencil layout.
function migrateHome(value: unknown, intro: unknown): HomeContent {
  const current = homeSchema.safeParse(value);
  if (current.success) return current.data;
  const home = structuredClone(defaultHome);
  if (value && typeof value === "object" && "intro" in value) {
    const old = value as {
      intro: {
        eyebrow: string;
        name: string;
        headline: string;
        description: string;
      };
      profile: { summary: string; facts: { label: string; value: string }[] };
      about: { description: string; keySkills: string[] };
      projects: {
        name: string;
        role: string;
        period: string;
        summary: string;
        paragraphs: string[];
        sections: { title: string; body: string }[];
      }[];
      skills: string[];
      contact: {
        heading: string;
        description: string;
        email: string;
        resumeHref: string;
      };
    };
    home.intro.title = old.intro.headline;
    home.intro.description = old.intro.description;
    Object.assign(home.intro.profile, {
      name: old.intro.name,
      role: old.intro.eyebrow,
      description: old.profile.summary,
      avatar: "",
      signature: "",
      facts: old.profile.facts.map((f) => ({
        text: [f.label, f.value].filter(Boolean).join(" · "),
        icon: "iconBriefcase",
      })),
    });
    home.intro.profile.downloadCv.href =
      old.contact.resumeHref === "/resume" ? "" : old.contact.resumeHref;
    home.about.description = old.about.description;
    home.about.keySkills = old.about.keySkills;
    home.experience.companies = old.projects.map((p) => ({
      name: p.name,
      logo: "",
      roles: [
        {
          title: p.role || p.name,
          employmentType: "",
          period: p.period,
          description: [p.summary, ...p.paragraphs].join("\n\n"),
          highlights: p.sections.map((s) =>
            [s.title, s.body].filter(Boolean).join(" — "),
          ),
        },
      ],
    }));
    home.skills.items = old.skills;
    home.skills.technologies = [];
    home.education.items = [];
    home.certifications.items = [];
    home.languages.items = [];
    home.recommendations.items = [];
    home.contact.label = old.contact.heading;
    home.contact.description = old.contact.description;
    home.contact.channels = [
      {
        kind: "email",
        label: "Email Me",
        value: old.contact.email,
        icon: "iconEnvelope",
      },
    ];
    home.contact.networks = [];
    home.footer.copyright = `© ${new Date().getUTCFullYear()} ${old.intro.name}`;
  } else if (intro && typeof intro === "object" && "headline" in intro) {
    const old = intro as {
      name: string;
      eyebrow: string;
      headline: string;
      description: string;
    };
    home.intro.title = old.headline;
    home.intro.description = old.description;
    Object.assign(home.intro.profile, {
      name: old.name,
      role: old.eyebrow,
      avatar: "",
      signature: "",
    });
  }
  return parseInput(homeSchema, home);
}
export class Repository {
  readonly db: DatabaseSync;
  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
    );
    try {
      this.transaction(() => {
        this.db.exec(`CREATE TABLE IF NOT EXISTS home_content (
          id INTEGER PRIMARY KEY CHECK(id=1), content TEXT NOT NULL,
          revision INTEGER NOT NULL CHECK(revision>0), updated_at TEXT NOT NULL,
          updated_by TEXT NOT NULL
        )`);
        if (!this.db.prepare("SELECT id FROM home_content WHERE id=1").get()) {
          const hasSettings = this.db
            .prepare(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='settings'",
            )
            .get();
          const setting = (key: string): unknown => {
            if (!hasSettings) return undefined;
            const row = this.db
              .prepare("SELECT value FROM settings WHERE key=?")
              .get(key);
            return row ? JSON.parse(String(row.value)) : undefined;
          };
          const content = migrateHome(setting("home"), setting("intro"));
          this.db
            .prepare("INSERT INTO home_content VALUES (1,?,1,?,?)")
            .run(
              JSON.stringify(content),
              new Date().toISOString(),
              "migration",
            );
        }
        // Retired features and password sessions are removed, not hidden.
        this.db.exec(`DROP TABLE IF EXISTS posts; DROP TABLE IF EXISTS series;
          DROP TABLE IF EXISTS media; DROP TABLE IF EXISTS sessions;
          DROP TABLE IF EXISTS login_attempts; DROP TABLE IF EXISTS settings;`);
      });
    } catch (error) {
      this.db.close();
      throw error;
    }
  }
  private transaction<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const value = fn();
      this.db.exec("COMMIT");
      return value;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  getHomeDocument(): HomeDocument {
    const row = this.db
      .prepare(
        "SELECT content,revision,updated_at FROM home_content WHERE id=1",
      )
      .get()!;
    return {
      content: parseInput(homeSchema, JSON.parse(String(row.content))),
      revision: Number(row.revision),
      updatedAt: String(row.updated_at),
    };
  }
  getHome(): HomeContent {
    return this.getHomeDocument().content;
  }
  saveHome(raw: unknown, actor: string): HomeDocument {
    const { content, revision } = parseInput(homeUpdateSchema, raw);
    return this.transaction(() => {
      const result = this.db
        .prepare(
          "UPDATE home_content SET content=?, revision=revision+1, updated_at=?, updated_by=? WHERE id=1 AND revision=?",
        )
        .run(
          JSON.stringify(content),
          new Date().toISOString(),
          actor,
          revision,
        );
      if (!result.changes)
        throw new AppError(
          "다른 곳에서 홈을 수정했습니다. 수정 내용을 복사한 뒤 새로고침해 주세요.",
          409,
        );
      return this.getHomeDocument();
    });
  }
  close() {
    this.db.close();
  }
}
export const dataDirectory = () =>
  resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || "./data");
const globalDb = globalThis as unknown as { portfolioRepository?: Repository };
export function repository() {
  return (globalDb.portfolioRepository ??= new Repository(
    resolve(dataDirectory(), "portfolio.sqlite"),
  ));
}
