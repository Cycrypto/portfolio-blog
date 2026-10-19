import type { Metadata } from "next";
import { repository } from "@/lib/repository";
import { contact, projects, skills } from "@/data/portfolio";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "이력서" };
export default function Page() {
  const intro = repository().getIntro();
  return (
    <main
      id="main"
      className="mx-auto max-w-3xl bg-white px-8 py-12 text-black md:px-12 print:px-0 print:py-0"
    >
      <header className="border-b border-black/15 pb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {intro.name}
        </h1>
        <p className="mt-2 text-lg whitespace-pre-line">{intro.headline}</p>
        <p className="mt-3 text-sm leading-relaxed text-black/70">
          {intro.description}
        </p>
        <p className="mt-3 text-sm">
          <a href={`mailto:${contact.email}`} className="underline">
            {contact.email}
          </a>
        </p>
      </header>
      <h2 className="mt-8 border-b border-black/15 pb-2 text-xl font-semibold">
        프로젝트
      </h2>
      {projects.map((project) => (
        <article key={project.id} className="mt-6 break-inside-avoid">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-semibold">{project.name}</h3>
            <p className="text-xs text-black/60">{project.period}</p>
          </div>
          <p className="text-sm text-black/70">{project.role}</p>
          <p className="mt-3 text-sm leading-relaxed">{project.summary}</p>
          {project.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-2 text-sm leading-relaxed">
              {paragraph}
            </p>
          ))}
          {project.sections.map((section) => (
            <p key={section.title} className="mt-2 text-sm leading-relaxed">
              <strong className="font-semibold">{section.title}.</strong>{" "}
              {section.body}
            </p>
          ))}
          {project.stack.length > 0 && (
            <p className="mt-2 text-xs text-black/60">
              {project.stack.join(" · ")}
            </p>
          )}
        </article>
      ))}
      <h2 className="mt-8 border-b border-black/15 pb-2 text-xl font-semibold">
        기술
      </h2>
      <p className="mt-3 text-sm">{skills.join(" · ")}</p>
    </main>
  );
}
