import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defaultHome } from "@/data/portfolio";
import { portfolioAssets } from "@/data/portfolio-assets";
import {
  AppError,
  homeSchema,
  homeUpdateSchema,
  parseInput,
  sectionIds,
} from "./validation";
import type { HomeContent, HomeDocument } from "./types";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };
const retiredAssets = new Set(["avatarMaya", "avatarDaniel"]);
const isSection = (v: unknown): v is (typeof sectionIds)[number] =>
  typeof v === "string" && (sectionIds as readonly string[]).includes(v);
// Bring a previously saved home document up to the current schema: retired
// sections disappear, links that pointed at them move to a live section, image
// names that no longer ship with the site are cleared, and a section added
// later starts out empty (so the page hides it until it has entries).
export function upgradeHome(value: unknown): HomeContent | null {
  const current = homeSchema.safeParse(value);
  if (current.success) return current.data;
  if (!value || typeof value !== "object" || !("intro" in value)) return null;
  const clear = (node: Json): Json =>
    typeof node === "string"
      ? retiredAssets.has(node) && !Object.hasOwn(portfolioAssets, node)
        ? ""
        : node
      : Array.isArray(node)
        ? node.map(clear)
        : node && typeof node === "object"
          ? Object.fromEntries(
              Object.entries(node).map(([k, v]) => [k, clear(v)]),
            )
          : node;
  const home = clear(structuredClone(value) as Json) as Record<string, Json>;
  delete home.recommendations;
  delete home.education;
  if (!home.experience || typeof home.experience !== "object")
    home.experience = { label: "Experience", companies: [] };
  if (!home.activities || typeof home.activities !== "object")
    home.activities = { label: "Activities", companies: [] };
  const skills = home.skills as { items?: Json[] } | undefined;
  if (skills && Array.isArray(skills.items))
    skills.items = skills.items.map((item) =>
      typeof item === "string" ? { name: item, level: "" } : item,
    );
  const navigation = home.navigation as { items?: Json[] } | undefined;
  if (navigation && Array.isArray(navigation.items)) {
    navigation.items = navigation.items.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        isSection((item as never)["section"]),
    );
    const sectionOf = (item: Json) => (item as { section?: string }).section;
    const ensure = (sectionId: string, label: string, after: string) => {
      if (navigation.items!.some((item) => sectionOf(item) === sectionId))
        return;
      const anchor = navigation.items!.findIndex(
        (item) => sectionOf(item) === after,
      );
      navigation.items!.splice(anchor + 1, 0, { label, section: sectionId });
    };
    ensure("experience", "Experience", "about");
    ensure("activities", "Activities", "experience");
  }
  const intro = home.intro as Record<string, Json> | undefined;
  if (intro && typeof intro === "object") {
    const link = (intro.cta ?? intro.experienceLink) as
      Record<string, Json> | undefined;
    if (link && typeof link === "object") {
      intro.cta = {
        ...link,
        section: isSection(link.section) ? link.section : "about",
      };
      delete intro.experienceLink;
    }
  }
  const upgraded = homeSchema.safeParse(home);
  return upgraded.success ? upgraded.data : null;
}
// Carry over content saved by the former home/intro editor into the Pencil layout.
function migrateHome(value: unknown, intro: unknown): HomeContent {
  const current = upgradeHome(value);
  if (current) return current;
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
    home.skills.items = old.skills.map((name) => ({ name, level: "" }));
    home.skills.technologies = [];
    home.activities.companies = [];
    home.certifications.items = [];
    home.languages.items = [];
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
        } else {
          const row = this.db
            .prepare("SELECT content FROM home_content WHERE id=1")
            .get()!;
          const stored: unknown = JSON.parse(String(row.content));
          if (!homeSchema.safeParse(stored).success) {
            const upgraded =
              upgradeHome(stored) ?? structuredClone(defaultHome);
            this.db
              .prepare(
                "UPDATE home_content SET content=?, revision=revision+1, updated_at=?, updated_by='migration' WHERE id=1",
              )
              .run(JSON.stringify(upgraded), new Date().toISOString());
          }
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
