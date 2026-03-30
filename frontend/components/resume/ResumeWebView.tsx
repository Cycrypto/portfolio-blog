import { Download, ExternalLink, Github, Linkedin, Mail, MapPin } from "lucide-react"

import { formatExperiencePeriod, getExperienceTypeLabel } from "@/lib/experience/utils"
import { buildResumeSnapshot } from "@/lib/portfolio/build-resume-snapshot"
import { cn } from "@/lib/utils"

interface ResumeWebViewProps {
  preview?: boolean
}

interface ContactItem {
  href?: string
  icon: typeof Mail
  label: string
}

function pickProjectSummary(project: Awaited<ReturnType<typeof buildResumeSnapshot>>["selectedProjects"][number]) {
  return project.resumeSummary?.trim() || project.description?.trim() || project.longDescription?.trim() || ""
}

export async function ResumeWebView({ preview = false }: ResumeWebViewProps) {
  const snapshot = await buildResumeSnapshot()
  const { settings, profile, summaryBullets, featuredSkills, selectedExperiences, selectedProjects } = snapshot
  const displayName = settings.name || profile.name
  const displayTitle = settings.title || profile.title
  const displayHeadline = settings.headline || profile.subtitle || profile.description

  const contactItems = [
    settings.email
      ? {
          href: `mailto:${settings.email}`,
          icon: Mail,
          label: settings.email,
        }
      : null,
    settings.location
      ? {
          icon: MapPin,
          label: settings.location,
        }
      : null,
    settings.github
      ? {
          href: settings.github,
          icon: Github,
          label: "GitHub",
        }
      : null,
    settings.linkedin
      ? {
          href: settings.linkedin,
          icon: Linkedin,
          label: "LinkedIn",
        }
      : null,
  ].filter((item): item is ContactItem => Boolean(item))

  return (
    <main className={cn("min-h-screen", preview ? "bg-[#edf1f3] p-4" : "bg-[#f5f1e8] px-4 py-8 md:py-10")}>
      {!preview ? (
        <section className="mx-auto mb-4 flex max-w-5xl flex-col gap-3 rounded-2xl border border-black/5 bg-white/90 px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-slate-800">이력서 웹 보기</p>
            <p className="text-sm text-neutral-slate-500">
              화면에서 먼저 검토하고, 제출용 파일은 PDF 다운로드를 사용하세요.
            </p>
          </div>
          <a
            href="/api/resume"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-brand-blue-200 bg-brand-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-blue-700"
          >
            <Download className="h-4 w-4" />
            PDF 다운로드
          </a>
        </section>
      ) : null}

      <article className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.08)]">
        <div className="grid gap-8 px-6 py-7 md:grid-cols-[280px_minmax(0,1fr)] md:px-10 md:py-10">
          <aside className="space-y-6">
            <div className="space-y-4">
              {settings.showPhoto && settings.photoUrl ? (
                <div className="overflow-hidden rounded-[24px] border border-brand-blue-100 bg-brand-blue-50">
                  <img
                    src={settings.photoUrl}
                    alt={`${displayName} 프로필 사진`}
                    className="aspect-[4/5] h-auto w-full object-cover"
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue-600">Resume</p>
                <h1 className="text-3xl font-semibold tracking-tight text-neutral-slate-900">{displayName}</h1>
                <p className="text-base font-medium text-neutral-slate-700">{displayTitle}</p>
                {displayHeadline ? (
                  <p className="text-sm leading-6 text-neutral-slate-600">{displayHeadline}</p>
                ) : null}
              </div>
            </div>

            {contactItems.length > 0 ? (
              <section className="space-y-3 rounded-2xl border border-brand-blue-100 bg-brand-blue-50/40 p-4">
                <h2 className="text-sm font-semibold text-neutral-slate-800">기본 정보</h2>
                <div className="space-y-2.5">
                  {contactItems.map((item) => {
                    const Icon = item.icon

                    if (item.href) {
                      return (
                        <a
                          key={`${item.label}-${item.href}`}
                          href={item.href}
                          target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                          rel={item.href.startsWith("mailto:") ? undefined : "noreferrer"}
                          className="flex items-center gap-2 text-sm text-neutral-slate-700 transition hover:text-brand-blue-700"
                        >
                          <Icon className="h-4 w-4 text-brand-blue-600" />
                          <span>{item.label}</span>
                          {!item.href.startsWith("mailto:") ? <ExternalLink className="ml-auto h-3.5 w-3.5" /> : null}
                        </a>
                      )
                    }

                    return (
                      <div key={item.label} className="flex items-center gap-2 text-sm text-neutral-slate-700">
                        <Icon className="h-4 w-4 text-brand-blue-600" />
                        <span>{item.label}</span>
                      </div>
                    )
                  })}
                </div>
              </section>
            ) : null}

            {summaryBullets.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-neutral-slate-800">핵심 요약</h2>
                <ul className="space-y-2">
                  {summaryBullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="rounded-2xl border border-neutral-slate-200 bg-neutral-slate-50 px-4 py-3 text-sm leading-6 text-neutral-slate-700"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {featuredSkills.length > 0 ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-neutral-slate-800">핵심 기술</h2>
                <div className="flex flex-wrap gap-2">
                  {featuredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-brand-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-blue-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>

          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-slate-900">경험</h2>
                  <p className="text-sm text-neutral-slate-500">이력서에 노출되는 경험과 하이라이트입니다.</p>
                </div>
                <span className="rounded-full bg-neutral-slate-100 px-3 py-1 text-xs font-medium text-neutral-slate-600">
                  {selectedExperiences.length}개
                </span>
              </div>

              <div className="space-y-3">
                {selectedExperiences.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-slate-300 px-5 py-8 text-center text-sm text-neutral-slate-500">
                    노출 중인 경험이 없습니다.
                  </div>
                ) : (
                  selectedExperiences.map((experience) => (
                    <article
                      key={experience.id}
                      className="rounded-[24px] border border-neutral-slate-200 bg-white px-5 py-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-flex rounded-full border border-brand-blue-200 bg-brand-blue-50 px-2.5 py-1 text-[11px] font-semibold text-brand-blue-700">
                            {getExperienceTypeLabel(experience.type)}
                          </span>
                          <h3 className="text-lg font-semibold text-neutral-slate-900">{experience.title}</h3>
                          <p className="text-sm text-neutral-slate-600">{experience.organization}</p>
                        </div>
                        <p className="text-sm font-medium text-neutral-slate-500">
                          {formatExperiencePeriod(experience.startDate, experience.endDate) || "기간 정보 없음"}
                        </p>
                      </div>

                      {experience.description ? (
                        <p className="mt-3 text-sm leading-6 text-neutral-slate-700">{experience.description}</p>
                      ) : null}

                      {(experience.resumeHighlights || []).length > 0 ? (
                        <ul className="mt-3 space-y-2">
                          {experience.resumeHighlights.map((highlight) => (
                            <li key={highlight} className="flex gap-2 text-sm leading-6 text-neutral-slate-700">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-blue-500" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-slate-900">선택 프로젝트</h2>
                  <p className="text-sm text-neutral-slate-500">resume 설정에서 선택한 프로젝트만 표시합니다.</p>
                </div>
                <span className="rounded-full bg-neutral-slate-100 px-3 py-1 text-xs font-medium text-neutral-slate-600">
                  {selectedProjects.length}개
                </span>
              </div>

              <div className="space-y-3">
                {selectedProjects.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-slate-300 px-5 py-8 text-center text-sm text-neutral-slate-500">
                    선택된 프로젝트가 없습니다.
                  </div>
                ) : (
                  selectedProjects.map((project) => {
                    const summary = pickProjectSummary(project)
                    const metaParts = [
                      project.category,
                      formatExperiencePeriod(project.startDate, project.endDate),
                      project.experience?.title,
                    ].filter(Boolean)

                    return (
                      <article
                        key={project.id}
                        className="rounded-[24px] border border-neutral-slate-200 bg-neutral-slate-50/70 px-5 py-4"
                      >
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-neutral-slate-900">
                            {project.resumeTitle?.trim() || project.title}
                          </h3>
                          {metaParts.length > 0 ? (
                            <p className="text-sm text-neutral-slate-500">{metaParts.join(" · ")}</p>
                          ) : null}
                        </div>

                        {summary ? (
                          <p className="mt-3 text-sm leading-6 text-neutral-slate-700">{summary}</p>
                        ) : null}

                        {(project.resumeHighlights || []).length > 0 ? (
                          <ul className="mt-3 space-y-2">
                            {project.resumeHighlights.map((highlight) => (
                              <li key={highlight} className="flex gap-2 text-sm leading-6 text-neutral-slate-700">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-neutral-slate-500" />
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </article>
                    )
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </article>
    </main>
  )
}
