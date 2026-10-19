import Link from "next/link";
import { ArrowUp, ArrowUpRight, Download, Mail } from "lucide-react";
import {
  portfolioAssets as assets,
  portfolioReference as ref,
  type PortfolioAssetKey,
} from "@/data/portfolio-reference";
import { SiteHeader } from "./site-shell";

function Asset({
  name,
  alt = "",
  className = "",
}: {
  name: PortfolioAssetKey;
  alt?: string;
  className?: string;
}) {
  return (
    <img
      src={assets[name]}
      alt={alt}
      width={ref.assetSources[name].pixelSize[0]}
      height={ref.assetSources[name].pixelSize[1]}
      decoding="async"
      className={className}
    />
  );
}
function SkillChips({ items }: { items: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded bg-ink/5 px-2.5 py-1 text-sm leading-[1.4]"
        >
          {item}
        </span>
      ))}
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
export function PortfolioProfile() {
  return (
    <section
      aria-label="Oliver Rowland profile"
      className="portfolio-profile mb-12 rounded-lg border border-ink/5 bg-ink/5 p-6 md:p-8 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:mt-12 lg:self-start lg:p-6"
    >
      <div className="mx-auto max-w-[640px]">
        <div className="flex flex-wrap items-start gap-5 border-b border-ink/10 pb-6 sm:flex-nowrap lg:flex-col">
          <Asset
            name={ref.intro.profile.avatar}
            alt={ref.intro.profile.name}
            className="size-20 shrink-0 rounded object-cover sm:size-[113px] lg:size-24"
          />
          <div className="min-w-0 flex-1 basis-40 lg:flex-auto">
            <h2 className="font-display text-2xl">{ref.intro.profile.name}</h2>
            <p className="mt-2 text-sm">{ref.intro.profile.role}</p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {ref.intro.profile.description}
            </p>
          </div>
          <Asset
            name={ref.intro.profile.signature}
            className="hidden h-auto w-20 sm:block lg:hidden"
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
        <div className="mt-6 flex gap-2">
          <a
            download
            href="/portfolio/oliver-rowland-cv.pdf"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded bg-ink px-4 text-sm text-paper transition-colors hover:bg-[#39271F]"
          >
            <Download size={14} />
            {ref.intro.profile.downloadCv.label}
          </a>
          <a
            href={`mailto:${ref.contact.channels[0].value}`}
            aria-label="Email Oliver Rowland"
            className="flex min-h-11 w-11 items-center justify-center rounded border border-ink/10 transition-colors hover:bg-surface"
          >
            <Mail size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
export function Portfolio() {
  return (
    <div id="top" lang="en" className="font-reference">
      <SiteHeader reference />
      <main
        id="main"
        className="mx-auto max-w-[1248px] px-6 md:px-8 lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-x-12 lg:px-16"
      >
        <section className="flex min-w-0 flex-col items-center gap-7 py-12 text-center md:py-16 lg:col-start-2 lg:row-start-1">
          <Asset
            name={ref.intro.illustration}
            className="h-24 w-30 md:h-32 md:w-40"
          />
          <div className="flex flex-col items-center">
            <h1 className="font-display text-[36px] leading-[1.2] md:text-[42px]">
              {ref.intro.title}
            </h1>
            <p className="mt-4 max-w-[480px] text-base leading-relaxed text-muted md:text-lg">
              {ref.intro.description}
            </p>
            <a
              href="#experience"
              className="mt-6 flex min-h-12 w-full max-w-80 items-center gap-3 rounded bg-ink/5 px-4 py-3.5 text-sm transition-colors hover:bg-ink/10"
            >
              <span className="flex -space-x-2">
                {ref.intro.experienceLink.imageKeys.map((key) => (
                  <Asset key={key} name={key} className="size-6" />
                ))}
              </span>
              <span>{ref.intro.experienceLink.label}</span>
              <Asset
                name={ref.intro.experienceLink.arrow}
                className="ml-auto size-4"
              />
            </a>
          </div>
        </section>
        <PortfolioProfile />
        <div className="min-w-0 lg:col-start-2">
          <Section id="about" title={ref.about.label}>
            <p className="text-base leading-relaxed">{ref.about.description}</p>
            <p className="mt-8 mb-4 text-base">{ref.about.keySkillsLabel}</p>
            <SkillChips items={ref.about.keySkills} />
          </Section>
          <Section id="experience" title={ref.experience.label}>
            <div className="space-y-8">
              {ref.experience.companies.map((company) => (
                <div
                  key={company.name}
                  className="relative grid grid-cols-[40px_minmax(0,1fr)] items-start gap-x-4"
                >
                  <Asset
                    name={company.logo}
                    alt={company.name}
                    className="size-10 rounded"
                  />
                  <div className="space-y-8">
                    {company.roles.map((role) => (
                      <article key={role.title} className="relative">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-display text-lg leading-[1.28]">
                              {role.title}
                            </h3>
                            <p className="mt-1 text-sm leading-[1.4]">
                              {company.name} · {role.employmentType}
                            </p>
                          </div>
                          <p className="text-xs text-muted sm:text-sm">
                            {role.period}
                          </p>
                        </div>
                        <p className="mt-4 max-w-[460px] text-sm leading-relaxed text-muted">
                          {role.description}
                        </p>
                        {role.highlights.length > 0 && (
                          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-relaxed">
                            {role.highlights.map((h) => (
                              <li key={h}>{h}</li>
                            ))}
                          </ul>
                        )}
                      </article>
                    ))}
                  </div>
                  {company.roles.length > 1 && (
                    <span
                      aria-hidden
                      className="absolute top-14 bottom-2 left-5 border-l border-ink/10"
                    />
                  )}
                </div>
              ))}
            </div>
          </Section>
          <Section id="education" title={ref.education.label}>
            <div className="space-y-8">
              {ref.education.items.map((item) => (
                <article key={item.degree}>
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg leading-[1.28]">
                        {item.degree}
                      </h3>
                      <p className="mt-1 text-sm">{item.institution}</p>
                    </div>
                    <p className="text-sm text-muted">{item.period}</p>
                  </div>
                  <p className="mt-4 max-w-[460px] text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </Section>
          <Section id="certifications" title={ref.certifications.label}>
            <div className="space-y-6">
              {ref.certifications.items.map((item) => (
                <article
                  key={item.title}
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
          <Section id="skills" title={ref.skills.label}>
            <SkillChips items={ref.skills.items} />
            <p className="mt-8 mb-4 text-base">
              {ref.skills.technologiesLabel}
            </p>
            <div className="flex flex-wrap gap-4">
              {ref.skills.technologies.map((tech) => (
                <Asset
                  key={tech.name}
                  name={tech.icon}
                  alt={tech.name}
                  className="size-8"
                />
              ))}
            </div>
          </Section>
          <Section id="languages" title={ref.languages.label}>
            <div className="space-y-6">
              {ref.languages.items.map((item) => (
                <div key={item.name} className="flex items-center gap-4">
                  <Asset name={item.flag} alt="" className="size-10" />
                  <div>
                    <h3 className="font-display text-lg">{item.name}</h3>
                    <p className="mt-1 text-sm">{item.proficiency}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
          <Section id="recommendations" title={ref.recommendations.label}>
            <div className="space-y-8">
              {ref.recommendations.items.map((person) => (
                <figure key={person.name}>
                  <blockquote className="text-base leading-relaxed">
                    {person.quote}
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <Asset
                      name={person.avatar}
                      alt={person.name}
                      className="size-10 rounded"
                    />
                    <div>
                      <p className="font-display text-base">{person.name}</p>
                      <p className="mt-1 text-xs text-muted">{person.role}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Section>
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
                {ref.contact.channels.map((channel) => (
                  <a
                    key={channel.kind}
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
            <Asset
              name={ref.contact.illustration}
              className="size-52 max-w-full md:size-64"
            />
          </section>
          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 py-4 text-xs">
            <span>{ref.footer.copyright}</span>
            <div className="flex items-center gap-5">
              <Link
                href="/blog"
                className="flex items-center gap-1 text-accent"
              >
                Blog <ArrowUpRight size={12} />
              </Link>
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
