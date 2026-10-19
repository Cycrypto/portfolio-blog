import Link from "next/link";
import { ArrowUp, Download, Mail } from "lucide-react";
import {
  portfolioAssets as assets,
  type PortfolioAssetKey,
} from "@/data/portfolio-assets";
import type { HomeContent } from "@/lib/types";
import type { SectionId, Timeline } from "@/lib/validation";
import { SiteHeader } from "./site-shell";

function Asset({
  name,
  alt = "",
  className = "",
}: {
  name: string;
  alt?: string;
  className?: string;
}) {
  if (!name) return null;
  const asset = assets[name as PortfolioAssetKey];
  return (
    <img
      src={asset?.[0] ?? name}
      alt={alt}
      width={asset?.[1] ?? 120}
      height={asset?.[2] ?? 120}
      decoding="async"
      className={className}
    />
  );
}
export const skillLevels: Record<string, string> = {
  advanced: "Advanced",
  intermediate: "Intermediate",
  beginner: "Beginner",
};
function SkillChips({
  items,
}: {
  items: readonly (string | { name: string; level: string })[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => {
        const { name, level } =
          typeof item === "string" ? { name: item, level: "" } : item;
        return (
          <span
            key={`${name}-${index}`}
            className="inline-flex items-baseline gap-1.5 rounded bg-ink/5 px-2.5 py-1 text-sm leading-[1.4]"
          >
            {name}
            {skillLevels[level] && (
              <span className="text-xs text-muted">{skillLevels[level]}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
function Section({
  id,
  title,
  children,
  className = "",
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`border-t border-ink/10 py-12 md:py-16 ${className}`}
    >
      <h2 className="mb-8 font-display text-[28px] leading-[1.3] md:text-[32px]">
        {title}
      </h2>
      {children}
    </section>
  );
}
export function PortfolioProfile({ content: ref }: { content: HomeContent }) {
  return (
    <section
      aria-label={`${ref.intro.profile.name} 프로필`}
      className="bg-ink/5 px-6 pt-16 pb-12 md:px-16 md:pt-[60px] md:pb-16"
    >
      <div className="mx-auto max-w-[640px]">
        <div className="flex flex-wrap items-start gap-5 border-b border-ink/10 pb-6 sm:flex-nowrap">
          <Asset
            name={ref.intro.profile.avatar}
            alt={ref.intro.profile.name}
            className="size-20 shrink-0 rounded object-cover sm:size-[113px]"
          />
          <div className="min-w-0 flex-1 basis-40">
            <h2 className="font-display text-2xl">{ref.intro.profile.name}</h2>
            <p className="mt-2 text-sm">{ref.intro.profile.role}</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {ref.intro.profile.description}
            </p>
          </div>
          <Asset
            name={ref.intro.profile.signature}
            className="hidden h-auto w-20 sm:block"
          />
        </div>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs leading-relaxed">
          {ref.intro.profile.facts.map((f) => (
            <li key={f.text} className="flex items-center gap-2">
              <Asset name={f.icon} className="size-3" />
              {f.text}
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          {ref.contact.networks.map((network, index) => (
            <a
              key={index}
              href={network.href || undefined}
              role="link"
              aria-label={network.name}
              aria-disabled={!network.href}
              className="flex size-8 items-center justify-center"
            >
              <Asset name={network.icon} className="size-5" />
            </a>
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <a
            href={ref.intro.profile.downloadCv.href || undefined}
            aria-disabled={!ref.intro.profile.downloadCv.href}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded bg-ink px-4 text-sm text-paper transition-colors hover:bg-[#39271F]"
          >
            <Download size={14} />
            {ref.intro.profile.downloadCv.label}
          </a>
          <a
            href={
              ref.contact.channels.find((c) => c.kind === "email")
                ? `mailto:${ref.contact.channels.find((c) => c.kind === "email")!.value}`
                : undefined
            }
            aria-label={`${ref.intro.profile.name}에게 이메일 보내기`}
            className="flex min-h-11 w-11 items-center justify-center rounded border border-ink/10 transition-colors hover:bg-surface"
          >
            <Mail size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
// Organisations with their roles, drawn as a logo-led timeline (Experience, Activities).
function Timeline({ data }: { data: Timeline }) {
  // Keep one logo column for the whole list so rows without a logo still line up.
  const withLogos = data.companies.some((company) => company.logo);
  return (
    <div className="space-y-8">
      {data.companies.map((company, companyIndex) => (
        <div
          key={companyIndex}
          className={`relative ${withLogos ? "grid grid-cols-[40px_minmax(0,1fr)] items-start gap-x-4" : "min-w-0"}`}
        >
          {withLogos &&
            (company.logo ? (
              <Asset
                name={company.logo}
                alt={company.name}
                className="size-10 rounded"
              />
            ) : (
              <span aria-hidden className="size-10 rounded bg-ink/5" />
            ))}
          <div className="min-w-0 space-y-8">
            {company.roles.map((role, roleIndex) => (
              <article key={roleIndex} className="relative">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-bold leading-[1.28]">
                      {role.title}
                    </h3>
                    <p className="mt-1 text-sm leading-[1.4]">
                      {[company.name, role.employmentType]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <p className="text-xs text-muted sm:text-sm">{role.period}</p>
                </div>
                {role.description && (
                  <p className="mt-4 max-w-[460px] text-sm leading-relaxed text-muted">
                    {role.description}
                  </p>
                )}
                {role.highlights.length > 0 && (
                  <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed">
                    {role.highlights.map((h, index) => (
                      <li key={index}>{h}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
          {company.logo && company.roles.length > 1 && (
            <span
              aria-hidden
              className="absolute top-14 bottom-2 left-5 border-l border-ink/10"
            />
          )}
        </div>
      ))}
    </div>
  );
}
// Sections that only list items disappear from the page and the menu when empty.
export function hiddenSections(content: HomeContent): SectionId[] {
  const hidden: SectionId[] = [];
  if (!content.experience.companies.length) hidden.push("experience");
  if (!content.activities.companies.length) hidden.push("activities");
  if (!content.certifications.items.length) hidden.push("certifications");
  if (!content.skills.items.length && !content.skills.technologies.length)
    hidden.push("skills");
  if (!content.languages.items.length) hidden.push("languages");
  return hidden;
}
export function Portfolio({ content: ref }: { content: HomeContent }) {
  const hidden = hiddenSections(ref);
  const shows = (id: SectionId) => !hidden.includes(id);
  return (
    <div id="top" className="font-reference">
      <SiteHeader navigation={ref.navigation} hidden={hidden} />
      <PortfolioProfile content={ref} />
      <main id="main" className="mx-auto max-w-[768px] px-6 md:px-16">
        <section
          id="intro"
          className="flex min-w-0 flex-col items-center gap-10 pt-20 pb-16 text-center md:pt-40 md:pb-[104px]"
        >
          <Asset
            name={ref.intro.illustration}
            className="h-24 w-30 md:h-32 md:w-40"
          />
          <div className="flex flex-col items-center">
            <h1 className="font-display text-[32px] leading-[1.2] md:text-[40px]">
              {ref.intro.title}
            </h1>
            <p className="mt-4 max-w-[480px] text-base leading-relaxed text-muted md:text-lg">
              {ref.intro.description}
            </p>
            {ref.intro.cta.label && (
              <a
                href={`#${ref.intro.cta.section}`}
                className="mt-6 flex min-h-12 w-full max-w-80 items-center gap-3 rounded bg-ink/5 px-4 py-3.5 text-sm transition-colors hover:bg-ink/10"
              >
                <span className="flex -space-x-2">
                  {ref.intro.cta.imageKeys.map((key, index) => (
                    <Asset key={index} name={key} className="size-6" />
                  ))}
                </span>
                <span>{ref.intro.cta.label}</span>
                <Asset name={ref.intro.cta.arrow} className="ml-auto size-4" />
              </a>
            )}
          </div>
        </section>
        <div className="min-w-0">
          <Section id="about" title={ref.about.label}>
            <p className="text-base leading-relaxed">{ref.about.description}</p>
            {ref.about.keySkills.length > 0 && (
              <>
                <p className="mt-8 mb-4 text-base">
                  {ref.about.keySkillsLabel}
                </p>
                <SkillChips items={ref.about.keySkills} />
              </>
            )}
          </Section>
          {shows("experience") && (
            <Section id="experience" title={ref.experience.label}>
              <Timeline data={ref.experience} />
            </Section>
          )}
          {shows("activities") && (
            <Section id="activities" title={ref.activities.label}>
              <Timeline data={ref.activities} />
            </Section>
          )}
          {shows("certifications") && (
            <Section id="certifications" title={ref.certifications.label}>
              <div className="space-y-6">
                {ref.certifications.items.map((item, index) => (
                  <article
                    key={index}
                    className="flex flex-wrap items-start gap-4"
                  >
                    <Asset
                      name={item.logo}
                      alt={item.issuer}
                      className="size-10 rounded"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg leading-[1.28]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm">{item.issuer}</p>
                    </div>
                    <p className="ml-14 text-sm text-muted sm:ml-0">
                      {item.issued}
                    </p>
                  </article>
                ))}
              </div>
            </Section>
          )}
          {shows("skills") && (
            <Section id="skills" title={ref.skills.label}>
              <SkillChips items={ref.skills.items} />
              {ref.skills.technologies.length > 0 && (
                <>
                  <p className="mt-8 mb-4 text-base">
                    {ref.skills.technologiesLabel}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {ref.skills.technologies.map((tech, index) => (
                      <Asset
                        key={index}
                        name={tech.icon}
                        alt={tech.name}
                        className="size-8"
                      />
                    ))}
                  </div>
                </>
              )}
            </Section>
          )}
          {shows("languages") && (
            <Section id="languages" title={ref.languages.label}>
              <div className="space-y-6">
                {ref.languages.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Asset name={item.flag} alt="" className="size-10" />
                    <div>
                      <h3 className="font-display text-lg">{item.name}</h3>
                      <p className="mt-1 text-sm">{item.proficiency}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
          <section
            id="contact"
            className="flex flex-col items-center gap-12 border-t border-ink/10 py-16 text-center"
          >
            <div className="w-full">
              <h2 className="font-display text-[32px] leading-[1.2]">
                {ref.contact.label}
              </h2>
              <p className="mx-auto mt-2.5 max-w-80 text-base leading-[1.4]">
                {ref.contact.description}
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {ref.contact.channels.map((channel, index) => (
                  <a
                    key={index}
                    href={
                      channel.kind === "email"
                        ? `mailto:${channel.value}`
                        : `tel:${channel.value.replace(/[^+0-9]/g, "")}`
                    }
                    className="flex min-w-0 items-center gap-3 rounded bg-ink/5 p-3 text-left transition-colors hover:bg-ink/10"
                  >
                    <span className="bg-coral p-2">
                      <Asset name={channel.icon} className="size-6" />
                    </span>
                    <span className="min-w-0 break-words">
                      <span className="block font-display text-base">
                        {channel.label}
                      </span>
                      <span className="mt-1 block text-xs">
                        {channel.value}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
            {ref.contact.networks.length > 0 && (
              <div>
                <p className="mb-4 text-sm">{ref.contact.networkLabel}</p>
                <div className="flex justify-center gap-4">
                  {ref.contact.networks.map((network, index) => (
                    <a
                      key={index}
                      href={network.href || undefined}
                      role="link"
                      aria-label={network.name}
                      aria-disabled={!network.href}
                      className="flex size-10 items-center justify-center"
                    >
                      <Asset name={network.icon} className="size-8" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            <Asset
              name={ref.contact.illustration}
              className="size-52 max-w-full md:size-64"
            />
          </section>
          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 py-4 text-xs">
            <span>{ref.footer.copyright}</span>
            <div className="flex items-center gap-5">
              <Link href="/admin" className="text-muted">
                관리
              </Link>
              <a href="#top" className="flex items-center gap-1">
                {ref.footer.backToTop.label}
                <ArrowUp size={12} />
              </a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
