import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  FileText,
  Mail,
} from "lucide-react";
import type { Intro } from "@/lib/types";
import { contact, projects, skills, type Project } from "@/data/portfolio";
import { buttonClass } from "./ui-styles";
import { IntroHero } from "./intro-hero";
import { SiteFooter, SiteHeader } from "./site-shell";

function Chips({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded border border-line bg-surface px-2.5 py-1 text-[13px] leading-[1.4]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function FlowVisual({
  visual,
}: {
  visual: Extract<Project["visual"], { kind: "flow" }>;
}) {
  return (
    <figure className="rounded-lg border border-line bg-surface p-5 md:p-7">
      <ol className="grid gap-5 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
        {visual.columns.map((column, index) => (
          <li key={column.label} className="contents">
            <div
              className={`flex min-w-0 flex-col rounded-md p-5 ${index === visual.columns.length - 1 ? "bg-accent-soft/60" : "bg-paper"}`}
            >
              <p className="mb-2 font-mono text-[10px] tracking-widest text-accent">
                {column.label}
              </p>
              <h4 className="mb-4 font-heading text-[17px]">{column.title}</h4>
              <ul className="space-y-2.5 text-sm leading-relaxed">
                {column.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span
                      aria-hidden
                      className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-coral"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {index < visual.columns.length - 1 && (
              <div
                aria-hidden
                className="flex items-center justify-center text-muted"
              >
                <ArrowDown size={18} className="lg:hidden" />
                <ArrowRight size={18} className="hidden lg:block" />
              </div>
            )}
          </li>
        ))}
      </ol>
      <figcaption className="mt-5 text-xs leading-relaxed text-muted">
        {visual.note}
      </figcaption>
    </figure>
  );
}

function PipelineVisual({
  visual,
}: {
  visual: Extract<Project["visual"], { kind: "pipeline" }>;
}) {
  return (
    <figure className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="rounded-lg border border-line bg-surface p-5 md:p-7">
        <p className="mb-5 font-mono text-[10px] tracking-widest text-accent">
          DEPLOY PIPELINE
        </p>
        <ol className="grid gap-3 sm:grid-cols-5 sm:gap-2">
          {visual.steps.map((step, index) => (
            <li
              key={step.label}
              className="relative rounded-md bg-paper p-4 sm:pr-5"
            >
              <span className="mb-2 block font-mono text-[10px] text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="block font-heading text-[15px]">
                {step.label}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">
                {step.detail}
              </span>
              {index < visual.steps.length - 1 && (
                <ArrowRight
                  aria-hidden
                  size={14}
                  className="absolute top-1/2 -right-2 hidden -translate-y-1/2 text-muted sm:block"
                />
              )}
            </li>
          ))}
        </ol>
        <ul className="mt-5 space-y-1.5 text-xs leading-relaxed text-muted">
          {visual.notes.map((note) => (
            <li key={note}>— {note}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col justify-between rounded-lg bg-ink p-6 text-paper md:p-7">
        <p className="font-mono text-[10px] tracking-widest text-coral">
          RESULT · {visual.metric.label.toUpperCase()}
        </p>
        <p className="my-6 flex items-end gap-3 font-heading">
          <span className="text-3xl text-paper/55 line-through decoration-coral/70 md:text-4xl">
            {visual.metric.before}
            <span className="ml-0.5 text-lg">{visual.metric.unit}</span>
          </span>
          <ArrowRight aria-hidden size={20} className="mb-3 text-coral" />
          <span className="text-[56px] leading-none font-bold tracking-tight md:text-[64px]">
            {visual.metric.after}
            <span className="ml-1 text-2xl font-semibold">
              {visual.metric.unit}
            </span>
          </span>
        </p>
        <p className="text-sm leading-relaxed text-paper/80">
          {visual.metric.label} 약 {visual.metric.before}
          {visual.metric.unit}에서 {visual.metric.after}
          {visual.metric.unit}으로. 배포 체계 전환과 자동화의 결과입니다.
        </p>
      </div>
    </figure>
  );
}

function ProjectCase({ project, index }: { project: Project; index: number }) {
  const flagship = index === 0;
  return (
    <article
      id={project.id}
      aria-labelledby={`${project.id}-title`}
      className={`border-t border-line ${flagship ? "py-14 md:py-20" : "py-12 md:py-16"}`}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
        <header>
          <p className="mb-4 font-mono text-[10px] tracking-widest text-accent md:text-xs">
            {String(index + 1).padStart(2, "0")} ·{" "}
            {flagship ? "FEATURED" : "PROJECT"}
          </p>
          <h3
            id={`${project.id}-title`}
            className={`font-heading font-bold tracking-tight break-keep ${flagship ? "text-[40px] leading-[1.15] md:text-[52px]" : "text-[32px] leading-[1.2] md:text-[40px]"}`}
          >
            {project.name}
          </h3>
          <dl className="mt-5 space-y-1 text-sm text-muted">
            <div>
              <dt className="sr-only">역할</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt className="sr-only">기간</dt>
              <dd>{project.period}</dd>
            </div>
          </dl>
          {project.stack.length > 0 && (
            <div className="mt-6">
              <Chips items={project.stack} />
            </div>
          )}
        </header>
        <div className="min-w-0 space-y-6">
          <p
            className={`leading-relaxed ${flagship ? "text-lg md:text-xl" : "text-base md:text-lg"}`}
          >
            {project.summary}
          </p>
          {project.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed text-muted">
              {paragraph}
            </p>
          ))}
          {project.sections.length > 0 && (
            <div className="grid gap-6 pt-2 sm:grid-cols-2">
              {project.sections.map((section) => (
                <section key={section.title}>
                  <h4 className="mb-2 font-heading text-[17px]">
                    {section.title}
                  </h4>
                  <p className="text-[15px] leading-relaxed text-muted">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-10 md:mt-12">
        {project.visual.kind === "flow" ? (
          <FlowVisual visual={project.visual} />
        ) : (
          <PipelineVisual visual={project.visual} />
        )}
      </div>
    </article>
  );
}

export function Portfolio({ intro }: { intro: Intro }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-[1248px] px-6 md:px-16">
        <IntroHero intro={intro} />
        <section id="projects" aria-labelledby="projects-heading">
          <header className="flex flex-wrap items-end justify-between gap-6 border-t border-line pt-14 pb-10 md:pt-20">
            <div>
              <p className="mb-4 font-mono text-[10px] tracking-widest text-accent md:text-xs">
                SELECTED WORK
              </p>
              <h2
                id="projects-heading"
                className="font-display text-5xl md:text-[64px]"
              >
                Work.
              </h2>
            </div>
            <p className="max-w-[420px] text-sm leading-relaxed text-muted md:text-base">
              제품의 방향을 정리한 사례와 직접 구현·운영한 사례를 중심으로
              소개합니다.
            </p>
          </header>
          {projects.map((project, index) => (
            <ProjectCase key={project.id} project={project} index={index} />
          ))}
        </section>
        <section
          id="skills"
          aria-labelledby="skills-heading"
          className="grid gap-6 border-t border-line py-10 md:grid-cols-[200px_minmax(0,1fr)] md:py-12"
        >
          <h2
            id="skills-heading"
            className="font-mono text-[10px] tracking-widest text-accent md:text-xs"
          >
            TOOLS &amp; SKILLS
          </h2>
          <Chips items={skills} />
        </section>
        <section
          id="contact"
          aria-labelledby="contact-heading"
          className="border-t border-line py-16 md:py-24"
        >
          <div className="mx-auto max-w-[640px] text-center">
            <h2
              id="contact-heading"
              className="font-heading text-[32px] leading-[1.2] font-bold tracking-tight md:text-[44px]"
            >
              {contact.heading}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">
              {contact.description}
            </p>
            <a
              href={`mailto:${contact.email}`}
              className="mt-8 inline-flex items-center gap-2 font-mono text-sm text-accent underline underline-offset-8"
            >
              {contact.email}
              <ArrowUpRight size={16} />
            </a>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <a href={`mailto:${contact.email}`} className={buttonClass()}>
                <Mail size={16} />
                이메일 보내기
              </a>
              <a href={contact.resumeHref} className={buttonClass("secondary")}>
                <FileText size={16} />
                이력서 보기
              </a>
            </div>
          </div>
        </section>
        <SiteFooter />
      </main>
    </>
  );
}
